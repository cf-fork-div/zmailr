import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { D1Database } from '@cloudflare/workers-types';
import {
  consumeRateLimit,
  consumeIpRateLimit,
  consumeLoginAttempt,
  recordLoginFailure,
  checkLoginRateLimit,
  clearLoginFailures,
  retryAfterSeconds,
  getClientIp,
  resolveTokenRateLimit,
  rateLimitHeaders,
  rateLimitExceededBody,
  resetRateLimitMemoryForTests,
  DEFAULT_TOKEN_RATE_LIMIT,
  DEFAULT_IP_MAILBOX_CREATE_LIMIT,
  DEFAULT_IP_LOGIN_LIMIT,
  DEFAULT_LOGIN_FAIL_MAX,
  WINDOW_MS,
} from './rate-limit';

function createMockDb(initial: Record<string, number> = {}): D1Database {
  const store = new Map<string, number>(Object.entries(initial));

  return {
    prepare(sql: string) {
      return {
        bind(...args: unknown[]) {
          return {
            async first<T>(): Promise<T | null> {
              if (sql.includes('SELECT count')) {
                const key = args[0] as string;
                const count = store.get(key);
                return (count !== undefined ? { count } : null) as T | null;
              }
              return null;
            },
            async run() {
              if (sql.includes('INSERT INTO api_rate_limits')) {
                const [key, count] = args as [string, number];
                store.set(key, count);
              } else if (sql.includes('DELETE FROM api_rate_limits')) {
                store.delete(args[0] as string);
              }
            },
          };
        },
      };
    },
  } as unknown as D1Database;
}

describe('consumeRateLimit', () => {
  beforeEach(() => {
    resetRateLimitMemoryForTests();
  });

  it('allows requests under the limit and blocks at the limit', async () => {
    const db = createMockDb();
    const limit = 3;

    for (let i = 0; i < limit; i++) {
      const result = await consumeRateLimit(db, 'token:test', limit);
      assert.equal(result.ok, true);
      assert.equal(result.remaining, limit - i - 1);
    }

    const blocked = await consumeRateLimit(db, 'token:test', limit);
    assert.equal(blocked.ok, false);
    assert.equal(blocked.remaining, 0);
    assert.ok(blocked.retryAfter >= 1);
  });

  it('hydrates from D1 on cold start', async () => {
    resetRateLimitMemoryForTests();
    const bucket = Math.floor(Date.now() / WINDOW_MS);
    const key = `token:cold:${bucket}`;
    const db = createMockDb({ [key]: 2 });

    const result = await consumeRateLimit(db, 'token:cold', 3);
    assert.equal(result.ok, true);
    assert.equal(result.remaining, 0);
  });
});

describe('consumeIpRateLimit', () => {
  beforeEach(() => {
    resetRateLimitMemoryForTests();
  });

  it('uses category-specific limits', async () => {
    const db = createMockDb();
    const result = await consumeIpRateLimit(db, '1.2.3.4', 'mailbox_create');
    assert.equal(result.ok, true);
    assert.equal(result.limit, DEFAULT_IP_MAILBOX_CREATE_LIMIT);
  });
});

describe('login rate limiting', () => {
  beforeEach(() => {
    resetRateLimitMemoryForTests();
  });

  it('locks out after repeated failures', async () => {
    const db = createMockDb();
    const ip = '10.0.0.1';

    for (let i = 0; i < DEFAULT_LOGIN_FAIL_MAX; i++) {
      await recordLoginFailure(db, ip);
    }

    const locked = await checkLoginRateLimit(db, ip);
    assert.equal(locked.ok, false);
    assert.equal(locked.locked, true);
  });

  it('clears failures after successful login', async () => {
    const db = createMockDb();
    const ip = '10.0.0.2';

    await recordLoginFailure(db, ip);
    await clearLoginFailures(db, ip);

    const check = await checkLoginRateLimit(db, ip);
    assert.equal(check.locked, false);
  });

  it('consumes login attempt budget', async () => {
    const db = createMockDb();
    const ip = '10.0.0.3';

    for (let i = 0; i < DEFAULT_IP_LOGIN_LIMIT; i++) {
      const attempt = await consumeLoginAttempt(db, ip);
      assert.equal(attempt.ok, true, `attempt ${i + 1} should succeed`);
    }

    const blocked = await consumeLoginAttempt(db, ip);
    assert.equal(blocked.ok, false);
  });
});

describe('helpers', () => {
  it('computes retry-after for the current window', () => {
    const now = 90_000;
    const retryAfter = retryAfterSeconds(now, WINDOW_MS);
    assert.equal(retryAfter, 30);
  });

  it('reads client IP from CF-Connecting-IP', () => {
    const request = new Request('https://example.com', {
      headers: { 'CF-Connecting-IP': '203.0.113.1' },
    });
    assert.equal(getClientIp(request), '203.0.113.1');
  });

  it('resolves token limit from env', () => {
    assert.equal(resolveTokenRateLimit({ RATE_LIMIT_PER_MIN: '100' }), 100);
    assert.equal(resolveTokenRateLimit({}), DEFAULT_TOKEN_RATE_LIMIT);
  });

  it('builds standard rate limit headers and body', () => {
    const headers = rateLimitHeaders({ limit: 60, remaining: 59, retryAfter: 45 });
    assert.equal(headers['X-RateLimit-Limit'], '60');
    assert.equal(headers['X-RateLimit-Remaining'], '59');
    assert.equal(headers['Retry-After'], '45');

    const body = rateLimitExceededBody();
    assert.equal(body.error, 'rate_limit');
    assert.match(body.message, /频繁/);
  });
});
