import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertMailboxAccess, canSendFromMailbox, resolveSessionSecret } from './auth';
import {
  DEFAULT_DAILY_LEASE_QUOTA,
  DEFAULT_LEGACY_SEND_DAILY_QUOTA,
  type ApiAuthContext,
  type Env,
  type Mailbox,
  type User,
} from './types';

const ownedMailbox: Mailbox = {
  id: 'mb-1',
  address: 'abc123',
  createdAt: 0,
  expiresAt: 9999999999,
  ipAddress: '127.0.0.1',
  lastAccessed: 0,
  userId: 42,
};

const legacyMailbox: Mailbox = {
  ...ownedMailbox,
  id: 'mb-legacy',
  userId: null,
  legacyTokenId: 7,
};

const owner: User = {
  id: 42,
  username: 'alice',
  role: 'user',
  dailySendQuota: 50,
  dailyLeaseQuota: DEFAULT_DAILY_LEASE_QUOTA,
  sessionVersion: 0,
  rateLimitPerMin: 60,
  rateLimitBurst: null,
  enabled: true,
  createdAt: 0,
  lastLoginAt: null,
};

const otherUser: User = {
  ...owner,
  id: 99,
  username: 'bob',
};

const adminUser: User = {
  ...owner,
  id: 1,
  username: 'admin',
  role: 'admin',
};

const userAuth: ApiAuthContext = {
  type: 'user',
  userId: 42,
  tokenId: 1,
  scopes: ['mail'],
  dailySendQuota: 50,
  dailyLeaseQuota: DEFAULT_DAILY_LEASE_QUOTA,
};

const legacyAuth: ApiAuthContext = {
  type: 'legacy',
  tokenId: 7,
  scopes: ['lease', 'mail', 'send'],
};

const otherLegacyAuth: ApiAuthContext = {
  type: 'legacy',
  tokenId: 99,
  scopes: ['lease', 'mail', 'send'],
};

describe('assertMailboxAccess', () => {
  it('allows owner session on user-owned mailbox', () => {
    assert.equal(assertMailboxAccess(ownedMailbox, { user: owner }), true);
  });

  it('denies other user session on user-owned mailbox', () => {
    assert.equal(assertMailboxAccess(ownedMailbox, { user: otherUser }), false);
  });

  it('allows matching bearer user on user-owned mailbox', () => {
    assert.equal(assertMailboxAccess(ownedMailbox, { auth: userAuth }), true);
  });

  it('denies bearer user with wrong user_id', () => {
    assert.equal(
      assertMailboxAccess(ownedMailbox, { auth: { ...userAuth, userId: 99 } }),
      false
    );
  });

  it('allows legacy bearer on mailbox leased by same token', () => {
    assert.equal(assertMailboxAccess(legacyMailbox, { auth: legacyAuth }), true);
  });

  it('denies legacy bearer on mailbox leased by another token', () => {
    assert.equal(assertMailboxAccess(legacyMailbox, { auth: otherLegacyAuth }), false);
  });

  it('denies admin session on legacy mailbox', () => {
    assert.equal(assertMailboxAccess(legacyMailbox, { user: adminUser }), false);
  });

  it('denies regular user session on legacy mailbox', () => {
    assert.equal(assertMailboxAccess(legacyMailbox, { user: owner }), false);
  });

  it('denies unauthenticated access', () => {
    assert.equal(assertMailboxAccess(ownedMailbox, {}), false);
  });
});

describe('canSendFromMailbox', () => {
  it('allows user token on owned mailbox', () => {
    assert.equal(canSendFromMailbox(ownedMailbox, 'user', 42).ok, true);
  });

  it('denies user token on legacy mailbox', () => {
    assert.equal(canSendFromMailbox(legacyMailbox, 'user', 42).ok, false);
  });

  it('allows legacy token on mailbox it leased', () => {
    assert.equal(canSendFromMailbox(legacyMailbox, 'legacy', null, 7).ok, true);
  });

  it('denies legacy token on mailbox leased by another token', () => {
    assert.equal(canSendFromMailbox(legacyMailbox, 'legacy', null, 99).ok, false);
  });
});

describe('DEFAULT_LEGACY_SEND_DAILY_QUOTA', () => {
  it('defaults to 50', () => {
    assert.equal(DEFAULT_LEGACY_SEND_DAILY_QUOTA, 50);
  });
});

describe('resolveSessionSecret', () => {
  it('returns SESSION_SECRET when configured', () => {
    const env = { SESSION_SECRET: 'session-key', ADMIN_PASSWORD: 'admin-key' } as Env;
    assert.equal(resolveSessionSecret(env), 'session-key');
  });

  it('does not fall back to ADMIN_PASSWORD', () => {
    const env = { ADMIN_PASSWORD: 'admin-key' } as Env;
    assert.equal(resolveSessionSecret(env), null);
  });

  it('returns null when SESSION_SECRET is unset', () => {
    assert.equal(resolveSessionSecret({} as Env), null);
  });
});
