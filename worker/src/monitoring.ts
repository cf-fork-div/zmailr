import type { D1Database } from '@cloudflare/workers-types';
import { recordApiRequestStat, recordRateLimitHit } from './database';
import { getClientIp } from './rate-limit';

export async function logRateLimitHit(
  db: D1Database,
  request: Request,
  userId?: number | null
): Promise<void> {
  try {
    const url = new URL(request.url);
    await recordRateLimitHit(db, {
      ip: getClientIp(request),
      userId: userId ?? null,
      path: url.pathname,
    });
  } catch (error) {
    console.error('记录限流事件失败:', error);
  }
}

export async function logApiRequestStat(
  db: D1Database,
  request: Request,
  statusCode: number
): Promise<void> {
  try {
    const url = new URL(request.url);
    await recordApiRequestStat(db, {
      statusCode,
      path: url.pathname,
    });
  } catch (error) {
    console.error('记录 API 请求统计失败:', error);
  }
}
