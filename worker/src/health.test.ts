import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { aggregateHealthStatus, runHealthChecks } from './health';
import type { D1Database, R2Bucket } from '@cloudflare/workers-types';

function mockD1(ok: boolean): D1Database {
  return {
    prepare: () => ({
      first: async () => {
        if (!ok) throw new Error('db down');
        return { ok: 1 };
      },
    }),
  } as unknown as D1Database;
}

function mockR2(ok: boolean): R2Bucket {
  return {
    list: async () => {
      if (!ok) throw new Error('r2 down');
      return { objects: [] };
    },
  } as unknown as R2Bucket;
}

describe('runHealthChecks', () => {
  it('returns ok when required checks pass and Brevo is unconfigured', async () => {
    const result = await runHealthChecks({
      DB: mockD1(true),
      ATTACHMENTS: mockR2(true),
    });
    assert.equal(result.status, 'ok');
    assert.equal(result.checks.d1.ok, true);
    assert.equal(result.checks.r2.ok, true);
    assert.equal(result.checks.brevo.configured, false);
  });

  it('returns error when R2 binding is missing', async () => {
    const result = await runHealthChecks({
      DB: mockD1(true),
    });
    assert.equal(result.status, 'error');
    assert.equal(result.checks.r2.ok, false);
  });
});

describe('aggregateHealthStatus', () => {
  it('returns ok when required checks pass and Brevo is skipped', () => {
    assert.equal(
      aggregateHealthStatus({
        d1: { ok: true },
        r2: { ok: true, optional: false },
        brevo: { ok: true, configured: false, optional: true },
      }),
      'ok'
    );
  });

  it('returns degraded when Brevo is configured but unreachable', () => {
    assert.equal(
      aggregateHealthStatus({
        d1: { ok: true },
        r2: { ok: true, optional: false },
        brevo: { ok: false, configured: true, optional: true, message: 'Brevo API 401' },
      }),
      'degraded'
    );
  });

  it('returns error when D1 fails', () => {
    assert.equal(
      aggregateHealthStatus({
        d1: { ok: false, message: 'db down' },
        r2: { ok: true, optional: false },
        brevo: { ok: true, configured: false, optional: true },
      }),
      'error'
    );
  });

  it('returns error when R2 fails', () => {
    assert.equal(
      aggregateHealthStatus({
        d1: { ok: true },
        r2: { ok: false, optional: false, message: 'r2 down' },
        brevo: { ok: true, configured: true, optional: true },
      }),
      'error'
    );
  });
});
