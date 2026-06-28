import { D1Database } from '@cloudflare/workers-types';
import { Env, ApiAuthContext, TokenScope, User, Mailbox } from './types';
import {
  verifyUserToken,
  getUserById,
  getUserByUsername,
  updateUserLastLogin,
  getMailbox,
  getMailboxRaw,
  getLatestLeasedMailbox,
  isMailboxOwnedByUser,
  getAdminSessionVersion,
  hasAdminCredentials,
  verifyAdminPassword,
} from './database';
import { verifyPassword, secureCompareHex } from './crypto';
import { adminPathPrefix } from './admin-path';
import { validateSendFromAddress, extractEmailDomain, parseMailboxAddress, getCurrentTimestamp } from './utils';
import { resolveDefaultMailDomain, resolveMailboxEmailDomain } from './mail-domains';

const ADMIN_SESSION_COOKIE = 'zmail_admin_session';
const USER_SESSION_COOKIE = 'zmail_user_session';
const SESSION_MAX_AGE = 86400; // 24h

export const ALL_SCOPES: TokenScope[] = ['lease', 'mail', 'send'];

export function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7).trim();
}

export async function authenticateApiToken(
  db: D1Database,
  request: Request
): Promise<ApiAuthContext | null> {
  const token = extractBearerToken(request);
  if (!token) return null;

  const userAuth = await verifyUserToken(db, token);
  if (!userAuth) return null;

  const user = await getUserById(db, userAuth.userId);
  if (!user || !user.enabled) return null;

  return {
    userId: userAuth.userId,
    tokenId: userAuth.tokenId,
    scopes: userAuth.scopes,
    dailySendQuota: user.dailySendQuota,
    dailyLeaseQuota: user.dailyLeaseQuota,
  };
}

export function hasScope(auth: ApiAuthContext, scope: TokenScope): boolean {
  return auth.scopes.includes(scope);
}

export interface AccessContext {
  user?: User | null;
  auth?: ApiAuthContext | null;
}

/** Returns true when the caller may read/write the given mailbox. */
export function assertMailboxAccess(mailbox: Mailbox, ctx: AccessContext): boolean {
  if (mailbox.userId == null) return false;
  if (ctx.user?.id === mailbox.userId) return true;
  if (ctx.auth?.userId === mailbox.userId) return true;
  return false;
}

export { verifyAdminPassword, hasAdminCredentials };

/** Session HMAC secret. Must be set via SESSION_SECRET (independent of ADMIN_PASSWORD). */
export function resolveSessionSecret(env: Env): string | null {
  const secret = env.SESSION_SECRET?.trim();
  return secret || null;
}

function isSecureRequest(request?: Request): boolean {
  if (!request) return false;
  try {
    return new URL(request.url).protocol === 'https:';
  } catch {
    return false;
  }
}

function sessionCookieAttrs(path: string, maxAge: number, request?: Request): string {
  const secure = isSecureRequest(request) ? '; Secure' : '';
  return `Path=${path}; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

async function signSession(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const sigHex = Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
  return `${payload}.${sigHex}`;
}

async function verifySessionHmac(secret: string, payload: string, sigHex: string): Promise<boolean> {
  if (sigHex.length !== 64 || !/^[a-f0-9]+$/i.test(sigHex)) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const expected = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const expectedHex = Array.from(new Uint8Array(expected), (b) => b.toString(16).padStart(2, '0')).join('');
  return secureCompareHex(sigHex, expectedHex);
}

interface VerifiedUserSession {
  userId: number;
  sessionVersion: number;
}

async function verifyUserSessionToken(secret: string, session: string): Promise<VerifiedUserSession | null> {
  const lastDot = session.lastIndexOf('.');
  if (lastDot <= 0) return null;
  const payload = session.slice(0, lastDot);
  const sigHex = session.slice(lastDot + 1);

  if (!(await verifySessionHmac(secret, payload, sigHex))) return null;

  const parts = payload.split('.');
  if (parts.length !== 3) return null;
  const userId = parseInt(parts[0], 10);
  const sessionVersion = parseInt(parts[1], 10);
  const exp = parseInt(parts[2], 10);
  if (!userId || Number.isNaN(sessionVersion) || !exp || Date.now() > exp) return null;

  return { userId, sessionVersion };
}

interface VerifiedAdminSession {
  sessionVersion: number;
}

async function verifyAdminSessionToken(secret: string, session: string): Promise<VerifiedAdminSession | null> {
  const lastDot = session.lastIndexOf('.');
  if (lastDot <= 0) return null;
  const payload = session.slice(0, lastDot);
  const sigHex = session.slice(lastDot + 1);

  if (!(await verifySessionHmac(secret, payload, sigHex))) return null;

  const parts = payload.split('.');
  if (parts.length !== 2) return null;
  const sessionVersion = parseInt(parts[0], 10);
  const exp = parseInt(parts[1], 10);
  if (Number.isNaN(sessionVersion) || !exp || Date.now() > exp) return null;

  return { sessionVersion };
}

export async function createAdminSessionCookie(
  env: Env,
  db: D1Database,
  request?: Request
): Promise<string | null> {
  const secret = resolveSessionSecret(env);
  if (!secret) return null;
  const sessionVersion = await getAdminSessionVersion(db);
  const exp = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${sessionVersion}.${exp}`;
  const token = await signSession(secret, payload);
  const path = adminPathPrefix(env);
  return `${ADMIN_SESSION_COOKIE}=${token}; ${sessionCookieAttrs(path, SESSION_MAX_AGE, request)}`;
}

function getCookieValue(request: Request, name: string): string | null {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(new RegExp(`${name}=([^;]+)`));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

export async function isAdminAuthenticated(
  request: Request,
  env: Env,
  db: D1Database
): Promise<boolean> {
  if (!(await hasAdminCredentials(db))) return false;
  const secret = resolveSessionSecret(env);
  if (!secret) return false;
  const session = getCookieValue(request, ADMIN_SESSION_COOKIE);
  if (!session) return false;

  const verified = await verifyAdminSessionToken(secret, session);
  if (!verified) return false;

  const currentVersion = await getAdminSessionVersion(db);
  return verified.sessionVersion === currentVersion;
}

export function clearAdminSessionCookie(env: Env, request?: Request): string {
  const path = adminPathPrefix(env);
  return `${ADMIN_SESSION_COOKIE}=; ${sessionCookieAttrs(path, 0, request)}`;
}

export async function createUserSessionCookie(
  env: Env,
  userId: number,
  sessionVersion: number,
  request?: Request
): Promise<string | null> {
  const secret = resolveSessionSecret(env);
  if (!secret) return null;
  const exp = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${userId}.${sessionVersion}.${exp}`;
  const token = await signSession(secret, payload);
  return `${USER_SESSION_COOKIE}=${token}; ${sessionCookieAttrs('/', SESSION_MAX_AGE, request)}`;
}

export function clearUserSessionCookie(request?: Request): string {
  return `${USER_SESSION_COOKIE}=; ${sessionCookieAttrs('/', 0, request)}`;
}

/** Session cookie or user Bearer token (any scope). */
export async function resolveUserFromSessionOrBearer(
  db: D1Database,
  request: Request,
  env: Env
): Promise<User | null> {
  const sessionUser = await getAuthenticatedUser(db, request, env);
  if (sessionUser) return sessionUser;

  const auth = await authenticateApiToken(db, request);
  if (auth) {
    const user = await getUserById(db, auth.userId);
    if (user?.enabled) return user;
  }
  return null;
}

export async function getAuthenticatedUser(
  db: D1Database,
  request: Request,
  env: Env
): Promise<User | null> {
  const session = getCookieValue(request, USER_SESSION_COOKIE);
  if (!session) return null;

  const secret = resolveSessionSecret(env);
  if (!secret) return null;

  const verified = await verifyUserSessionToken(secret, session);
  if (!verified) return null;

  const user = await getUserById(db, verified.userId);
  if (!user || !user.enabled) return null;
  if (user.sessionVersion !== verified.sessionVersion) return null;
  return user;
}

/**
 * Resolve and authorize a custom from address for outbound mail.
 * Mailbox must belong to userId.
 */
export async function resolveSendFromAddress(
  db: D1Database,
  from: string | undefined,
  allowedDomains: string | string[],
  userId: number,
  defaultDomain?: string
): Promise<{ ok: true; fromEmail?: string } | { ok: false; error: string }> {
  if (from == null || from === '') {
    return { ok: true };
  }

  const validated = validateSendFromAddress(String(from), allowedDomains, { defaultDomain });
  if (!validated.ok) {
    return validated;
  }

  const mailbox = await getMailbox(db, validated.localPart);
  if (!mailbox) {
    return { ok: false, error: 'from 邮箱不存在或已过期' };
  }

  if (mailbox.userId == null || mailbox.userId !== userId) {
    return { ok: false, error: '无权使用该发件地址' };
  }
  const owned = await isMailboxOwnedByUser(db, validated.localPart, userId);
  if (!owned) {
    return { ok: false, error: '无权使用该发件地址' };
  }

  if (mailbox.mailDomain) {
    const fromDomain = extractEmailDomain(validated.fromEmail);
    if (fromDomain !== mailbox.mailDomain.toLowerCase()) {
      return { ok: false, error: '发件域名须与邮箱绑定的域名一致' };
    }
  }

  return { ok: true, fromEmail: validated.fromEmail };
}

export function canSendFromMailbox(
  mailbox: Mailbox,
  userId: number
): { ok: true } | { ok: false; error: string } {
  if (mailbox.userId == null || mailbox.userId !== userId) {
    return { ok: false, error: '无权使用该发件地址' };
  }
  return { ok: true };
}

function isFromDomainAllowed(fromEmail: string, allowedDomains: string | string[]): boolean {
  const domain = extractEmailDomain(fromEmail);
  const allowed = (Array.isArray(allowedDomains) ? allowedDomains : [allowedDomains]).map((d) =>
    d.toLowerCase()
  );
  return allowed.includes(domain);
}

/**
 * Resolve outbound from: explicit from, else no-reply@leased domain, else no-reply@default.
 */
export async function resolveOutboundFrom(
  db: D1Database,
  env: Pick<Env, 'MAIL_DOMAIN' | 'VITE_EMAIL_DOMAIN'>,
  params: {
    from?: string | null;
    mailboxHint?: string | null;
    allowedDomains: string | string[];
    userId: number;
  }
): Promise<{ ok: true; fromEmail: string } | { ok: false; error: string }> {
  const defaultDomain = await resolveDefaultMailDomain(db, env);

  if (params.from != null && String(params.from).trim() !== '') {
    const fromStr = String(params.from).trim();
    let domainHint = defaultDomain;
    if (!fromStr.includes('@')) {
      const mailbox = await getMailbox(db, parseMailboxAddress(fromStr));
      if (mailbox?.mailDomain) {
        domainHint = mailbox.mailDomain;
      }
    }
    const result = await resolveSendFromAddress(
      db,
      fromStr,
      params.allowedDomains,
      params.userId,
      domainHint
    );
    if (!result.ok) return result;
    return { ok: true, fromEmail: result.fromEmail ?? `no-reply@${defaultDomain}` };
  }

  let mailbox: Mailbox | null = null;
  const hint = params.mailboxHint?.trim();
  if (hint) {
    const localPart = parseMailboxAddress(hint);
    const found = await getMailboxRaw(db, localPart);
    if (found && found.expiresAt > getCurrentTimestamp()) {
      mailbox = found;
    }
  } else {
    mailbox = await getLatestLeasedMailbox(db, { userId: params.userId });
  }

  if (mailbox) {
    const access = canSendFromMailbox(mailbox, params.userId);
    if (!access.ok) return access;
    const owned = await isMailboxOwnedByUser(db, mailbox.address, params.userId);
    if (!owned) {
      return { ok: false, error: '无权使用该发件地址' };
    }
    const sendDomain = resolveMailboxEmailDomain(mailbox, defaultDomain);
    const fromEmail = `no-reply@${sendDomain}`;
    if (!isFromDomainAllowed(fromEmail, params.allowedDomains)) {
      return { ok: false, error: 'from 域名与系统允许的域名不匹配' };
    }
    return { ok: true, fromEmail };
  }

  return { ok: true, fromEmail: `no-reply@${defaultDomain}` };
}

export async function authenticateUserLogin(
  db: D1Database,
  username: string,
  password: string
): Promise<User | null> {
  const user = await getUserByUsername(db, username);
  if (!user || !user.enabled) return null;

  const row = await db.prepare(`SELECT password_hash FROM users WHERE id = ?`).bind(user.id).first<{ password_hash: string }>();
  if (!row) return null;

  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) return null;

  await updateUserLastLogin(db, user.id);
  return user;
}
