import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { D1Database } from '@cloudflare/workers-types';
import { cleanupExpiredMailboxesForUser } from './database';

describe('cleanupExpiredMailboxesForUser', () => {
  it('deletes expired mailboxes scoped to user_id', async () => {
    let capturedSql = '';
    let capturedBindings: unknown[] = [];

    const db = {
      prepare: (sql: string) => ({
        bind: (...args: unknown[]) => {
          capturedSql = sql;
          capturedBindings = args;
          return {
            run: async () => ({ meta: { changes: 3 } }),
          };
        },
      }),
    } as unknown as D1Database;

    const deleted = await cleanupExpiredMailboxesForUser(db, 7);
    assert.equal(deleted, 3);
    assert.match(capturedSql, /DELETE FROM mailboxes WHERE user_id = \? AND expires_at <= \?/);
    assert.equal(capturedBindings[0], 7);
    assert.equal(typeof capturedBindings[1], 'number');
  });

  it('returns zero when nothing expired', async () => {
    const db = {
      prepare: () => ({
        bind: () => ({
          run: async () => ({ meta: { changes: 0 } }),
        }),
      }),
    } as unknown as D1Database;

    assert.equal(await cleanupExpiredMailboxesForUser(db, 1), 0);
  });
});
