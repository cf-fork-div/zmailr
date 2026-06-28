import type { Env } from './types';
import { normalizeAdminPath } from './admin-path';

const LEGACY_ADMIN = 'admin';

/** True when LOCAL_DEV is set (local wrangler dev only; never in production deploy). */
export function isLocalDevelopment(env: Pick<Env, 'LOCAL_DEV'>): boolean {
  const flag = env.LOCAL_DEV?.trim().toLowerCase();
  return flag === '1' || flag === 'true' || flag === 'yes';
}

/**
 * Refuse to serve when production is misconfigured (guessable admin path).
 * Local dev sets LOCAL_DEV=1 in `.dev.vars` to allow ADMIN_PATH=admin.
 */
export function assertProductionConfig(env: Env): void {
  if (isLocalDevelopment(env)) return;

  const path = normalizeAdminPath(env.ADMIN_PATH);
  if (!path || path === LEGACY_ADMIN || path.includes('${')) {
    throw new Error('生产环境必须配置 ADMIN_PATH（UUID，不可使用 admin 或占位符）');
  }
}
