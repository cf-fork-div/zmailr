import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { matchCorsOrigin, resolveAllowedCorsOrigins } from './cors';

describe('resolveAllowedCorsOrigins', () => {
  it('includes local dev and mail domains', () => {
    const set = resolveAllowedCorsOrigins({
      VITE_EMAIL_DOMAIN: 'mail.example.com',
    });
    assert.ok(set.has('http://localhost:5173'));
    assert.ok(set.has('https://mail.example.com'));
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
  it('allows configured origin', () => {
    assert.equal(
      matchCorsOrigin('https://mail.example.com', { VITE_EMAIL_DOMAIN: 'mail.example.com' }),
      'https://mail.example.com'
    );
  });

  it('denies unknown origin', () => {
    assert.equal(
      matchCorsOrigin('https://evil.example.com', { VITE_EMAIL_DOMAIN: 'mail.example.com' }),
      null
    );
  });

  it('returns null when Origin header is absent', () => {
    assert.equal(matchCorsOrigin(undefined, { VITE_EMAIL_DOMAIN: 'mail.example.com' }), null);
  });
});
