import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertProductionConfig, isLocalDevelopment } from './env-guard';
import type { Env } from './types';

describe('isLocalDevelopment', () => {
  it('returns true when LOCAL_DEV=1', () => {
    assert.equal(isLocalDevelopment({ LOCAL_DEV: '1' } as Env), true);
  });

  it('returns false when unset', () => {
    assert.equal(isLocalDevelopment({} as Env), false);
  });
});

describe('assertProductionConfig', () => {
  it('allows admin path in local dev', () => {
    assert.doesNotThrow(() =>
      assertProductionConfig({ LOCAL_DEV: '1', ADMIN_PATH: 'admin' } as Env)
    );
  });

  it('throws when production uses default admin path', () => {
    assert.throws(
      () => assertProductionConfig({ ADMIN_PATH: 'admin' } as Env),
      /ADMIN_PATH/
    );
  });

  it('throws when ADMIN_PATH is unset in production', () => {
    assert.throws(() => assertProductionConfig({} as Env), /ADMIN_PATH/);
  });

  it('allows UUID admin path in production', () => {
    assert.doesNotThrow(() =>
      assertProductionConfig({
        ADMIN_PATH: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      } as Env)
    );
  });
});
