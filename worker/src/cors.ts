import type { Env } from './types';

/** Local Vite / Wrangler dev origins (always allowed). */
const LOCAL_DEV_ORIGINS = [
  'http://localhost:8787',
  'http://127.0.0.1:8787',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

function parseOriginList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Browser SPA origins allowed to call the API with credentials (not mail domains). */
export function resolveAllowedCorsOrigins(
  env: Pick<Env, 'CORS_ALLOWED_ORIGINS'>
): Set<string> {
  return new Set([...LOCAL_DEV_ORIGINS, ...parseOriginList(env.CORS_ALLOWED_ORIGINS)]);
}

/**
 * Returns the Origin value to echo in Access-Control-Allow-Origin, or null to deny.
 * Missing Origin (same-origin / non-browser) returns null — no CORS header is set.
 */
export function matchCorsOrigin(
  origin: string | undefined,
  env: Pick<Env, 'CORS_ALLOWED_ORIGINS'>
): string | null {
  if (!origin) return null;
  const allowed = resolveAllowedCorsOrigins(env);
  return allowed.has(origin) ? origin : null;
}
