import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateByStatusCode,
  aggregateTopPaths,
  categorizeStatusTotals,
  normalizeApiPath,
  statDateFromTimestamp,
} from './api-request-stats';

describe('statDateFromTimestamp', () => {
  it('returns UTC YYYY-MM-DD', () => {
    assert.equal(statDateFromTimestamp(1717200000), '2024-06-01');
  });
});

describe('normalizeApiPath', () => {
  it('returns null for non-api paths', () => {
    assert.equal(normalizeApiPath('/health'), null);
  });

  it('keeps static api routes', () => {
    assert.equal(normalizeApiPath('/api/mail'), '/api/mail');
    assert.equal(normalizeApiPath('/api/auth/login'), '/api/auth/login');
  });

  it('collapses mailbox addresses and ids', () => {
    assert.equal(normalizeApiPath('/api/mailboxes/abc123xyz'), '/api/mailboxes/:address');
    assert.equal(
      normalizeApiPath('/api/emails/550e8400-e29b-41d4-a716-446655440000'),
      '/api/emails/:id'
    );
    assert.equal(normalizeApiPath('/api/user/tokens/42'), '/api/user/tokens/:id');
  });
});

describe('aggregateByStatusCode', () => {
  it('merges duplicate status codes and sorts', () => {
    assert.deepEqual(
      aggregateByStatusCode([
        { statusCode: 429, count: 2 },
        { statusCode: 200, count: 5 },
        { statusCode: 429, count: 3 },
      ]),
      [
        { statusCode: 200, count: 5 },
        { statusCode: 429, count: 5 },
      ]
    );
  });
});

describe('aggregateTopPaths', () => {
  it('sums path counts and returns top N', () => {
    assert.deepEqual(
      aggregateTopPaths(
        [
          { pathGroup: '/api/mail', count: 10 },
          { pathGroup: '/api/mail', count: 5 },
          { pathGroup: '/api/send', count: 20 },
        ],
        2
      ),
      [
        { pathGroup: '/api/send', count: 20 },
        { pathGroup: '/api/mail', count: 15 },
      ]
    );
  });
});

describe('categorizeStatusTotals', () => {
  it('groups status families', () => {
    assert.deepEqual(
      categorizeStatusTotals([
        { statusCode: 200, count: 10 },
        { statusCode: 401, count: 2 },
        { statusCode: 429, count: 1 },
        { statusCode: 500, count: 3 },
        { statusCode: 302, count: 4 },
      ]),
      { success2xx: 10, client4xx: 3, server5xx: 3, other: 4 }
    );
  });
});
