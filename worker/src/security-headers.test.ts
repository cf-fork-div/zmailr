import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applySecurityHeaders } from './security-headers';

describe('applySecurityHeaders', () => {
  it('sets baseline security response headers', () => {
    const headers = new Headers();
    applySecurityHeaders(headers);
    assert.equal(headers.get('X-Content-Type-Options'), 'nosniff');
    assert.equal(headers.get('X-Frame-Options'), 'DENY');
    assert.equal(headers.get('Referrer-Policy'), 'strict-origin-when-cross-origin');
    assert.ok(headers.get('Permissions-Policy')?.includes('camera=()'));
  });
});
