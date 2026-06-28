import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { matchCorsOrigin, resolveAllowedCorsOrigins } from './cors';

describe('resolveAllowedCorsOrigins', () => {
  it('includes local dev origins', () => {
    const set = resolveAllowedCorsOrigins({});
    assert.ok(set.has('http://localhost:5173'));
    assert.ok(set.has('http://localhost:8787'));
  });

  it('does not include mail domains from VITE_EMAIL_DOMAIN', () => {
    const set = resolveAllowedCorsOrigins({
      VITE_EMAIL_DOMAIN: 'mail.example.com',
    } as Parameters<typeof resolveAllowedCorsOrigins>[0]);
    assert.equal(set.has('https://mail.example.com'), false);
  });

  it('merges CORS_ALLOWED_ORIGINS', () => {
    const set = resolveAllowedCorsOrigins({
      CORS_ALLOWED_ORIGINS: 'https://app.example.com,https://staging.example.com',
    });
    assert.ok(set.has('https://app.example.com'));
    assert.ok(set.has('https://staging.example.com'));
  });
});

describe('matchCorsOrigin', () => {
  it('allows configured app origin', () => {
    assert.equal(
      matchCorsOrigin('https://app.example.com', {
        CORS_ALLOWED_ORIGINS: 'https://app.example.com',
      }),
      'https://app.example.com'
    );
  });

  it('denies mail domain origin when not explicitly listed', () => {
    assert.equal(
      matchCorsOrigin('https://mail.example.com', {
        VITE_EMAIL_DOMAIN: 'mail.example.com',
      } as Parameters<typeof matchCorsOrigin>[1]),
      null
    );
  });

  it('returns null when Origin header is absent', () => {
    assert.equal(matchCorsOrigin(undefined, {}), null);
  });
});
