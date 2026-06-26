import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SEED_GLOBAL_EXTRACT_RULES,
  NPM_OTP_REGEX,
  matchGenericCode,
  matchWithRegex,
  extractLink,
  evaluateExtractRules,
} from './extractor';
import { sortExtractRulesForDomain } from './database';
import { reconstructRawEmail } from './database';
import type { ExtractRule } from './types';

describe('extractLink', () => {
  it('extracts verification URLs from text', () => {
    const link = extractLink('Click https://example.com/verify?token=abc123 to confirm');
    assert.equal(link, 'https://example.com/verify?token=abc123');
  });

  it('extracts from href in html', () => {
    const link = extractLink(
      '',
      '<a href="https://service.com/confirm/email?id=1">Verify</a>'
    );
    assert.equal(link, 'https://service.com/confirm/email?id=1');
  });

  it('skips unsubscribe links', () => {
    const link = extractLink('https://example.com/unsubscribe?id=1');
    assert.equal(link, null);
  });
});

describe('reconstructRawEmail', () => {
  it('builds minimal RFC822 from fields', () => {
    const raw = reconstructRawEmail({
      fromAddress: 'noreply@test.com',
      fromName: 'Test',
      toAddress: 'user@temp.com',
      subject: 'Hello',
      textContent: 'Body text',
      receivedAt: 1710000000,
    });
    assert.ok(raw.includes('From: Test <noreply@test.com>'));
    assert.ok(raw.includes('Subject: Hello'));
    assert.ok(raw.includes('Body text'));
  });
});

describe('matchGenericCode', () => {
  it('extracts digits after English keywords', () => {
    assert.equal(matchGenericCode('Your verification code: 123456'), '123456');
    assert.equal(matchGenericCode('PIN: 9876'), '9876');
  });

  it('extracts digits after Chinese keyword', () => {
    assert.equal(matchGenericCode('验证码: 556677'), '556677');
  });

  it('extracts digits after Chinese 为/是 connectors', () => {
    assert.equal(matchGenericCode('验证码为：123456'), '123456');
    assert.equal(matchGenericCode('您的验证码是 654321'), '654321');
  });

  it('extracts standalone 6-digit code when subject hints verification', () => {
    assert.equal(
      matchGenericCode(
        'Hyperdown 验证码\n请使用以下验证码完成注册\n887766',
        '请使用以下验证码完成注册\n887766',
        'Hyperdown 验证码'
      ),
      '887766'
    );
  });

  it('returns null when no match', () => {
    assert.equal(matchGenericCode('Hello world'), null);
  });
});

describe('SEED_GLOBAL_EXTRACT_RULES', () => {
  it('defines default global rules for DB seeding', () => {
    assert.equal(SEED_GLOBAL_EXTRACT_RULES.length, 3);
    assert.ok(SEED_GLOBAL_EXTRACT_RULES.every((r) => r.seedKey));
    assert.ok(SEED_GLOBAL_EXTRACT_RULES[0].regex.includes('验证码'));
    assert.ok(SEED_GLOBAL_EXTRACT_RULES[1].remark.includes('6 位数字'));
    const npmRule = SEED_GLOBAL_EXTRACT_RULES.find((r) => r.seedKey === 'npm-otp');
    assert.ok(npmRule);
    assert.equal(npmRule!.domain, 'npmjs.com');
  });
});

describe('NPM_OTP_REGEX', () => {
  it('extracts npm signup OTP from body text', () => {
    assert.equal(
      matchWithRegex('The OTP code is: 17554235', NPM_OTP_REGEX.source),
      '17554235'
    );
    assert.equal(
      matchWithRegex('OTP code is: 123456', NPM_OTP_REGEX.source),
      '123456'
    );
  });

  it('does not match unrelated npm email content', () => {
    assert.equal(matchWithRegex('Your package was published', NPM_OTP_REGEX.source), null);
  });
});

describe('matchWithRegex', () => {
  it('returns first capture group when present', () => {
    assert.equal(matchWithRegex('code is ABC-1234', 'code is ([A-Z0-9-]+)'), 'ABC-1234');
  });

  it('falls back to digit run in full match', () => {
    assert.equal(matchWithRegex('token 888888', 'token \\d+'), '888888');
  });

  it('returns null for invalid regex', () => {
    assert.equal(matchWithRegex('test', '[invalid'), null);
  });
});

describe('sortExtractRulesForDomain', () => {
  const base = (overrides: Partial<ExtractRule>): ExtractRule => ({
    id: overrides.id ?? 1,
    domain: overrides.domain ?? '*',
    regex: overrides.regex ?? '(\\d{6})',
    priority: overrides.priority ?? 0,
    enabled: true,
    createdAt: 1,
    userId: overrides.userId ?? null,
    remark: null,
  });

  it('prefers user rules over global rules', () => {
    const sorted = sortExtractRulesForDomain(
      [
        base({ id: 1, userId: null, priority: 100 }),
        base({ id: 2, userId: 5, priority: 0 }),
      ],
      'example.com'
    );
    assert.equal(sorted[0].id, 2);
  });

  it('prefers exact domain over wildcard within same scope', () => {
    const sorted = sortExtractRulesForDomain(
      [
        base({ id: 1, domain: '*', priority: 100 }),
        base({ id: 2, domain: 'npmjs.com', priority: 0 }),
      ],
      'npmjs.com'
    );
    assert.equal(sorted[0].id, 2);
  });

  it('sorts by priority descending within same scope and domain specificity', () => {
    const sorted = sortExtractRulesForDomain(
      [
        base({ id: 1, domain: 'npmjs.com', priority: 1 }),
        base({ id: 2, domain: 'npmjs.com', priority: 10 }),
      ],
      'npmjs.com'
    );
    assert.equal(sorted[0].id, 2);
  });
});

describe('evaluateExtractRules', () => {
  const npmRule: ExtractRule = {
    id: 3,
    domain: 'npmjs.com',
    regex: NPM_OTP_REGEX.source,
    priority: 0,
    enabled: true,
    createdAt: 1,
    userId: null,
    remark: 'npm OTP',
  };

  it('returns matched rule id and domain from first matching rule', () => {
    const { result, rows } = evaluateExtractRules(
      [npmRule],
      'The OTP code is: 123456',
      'npm signup'
    );
    assert.deepEqual(result, { code: '123456', ruleId: 3, ruleDomain: 'npmjs.com' });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].matched, true);
    assert.equal(rows[0].order, 1);
  });

  it('uses generic fallback with null rule id when no rule matches', () => {
    const { result, rows } = evaluateExtractRules(
      [npmRule],
      'Your verification code: 654321',
      'Verify'
    );
    assert.deepEqual(result, { code: '654321', ruleId: null, ruleDomain: null });
    assert.equal(rows[0].matched, false);
  });

  it('stops at first matching rule in evaluation order', () => {
    const rules: ExtractRule[] = [
      {
        id: 10,
        domain: '*',
        regex: '(\\d{4})',
        priority: 5,
        enabled: true,
        createdAt: 1,
        userId: null,
        remark: null,
      },
      {
        id: 11,
        domain: '*',
        regex: '(\\d{6})',
        priority: 1,
        enabled: true,
        createdAt: 1,
        userId: null,
        remark: null,
      },
    ];
    const { result } = evaluateExtractRules(rules, 'code 123456', 'test');
    assert.equal(result?.ruleId, 10);
    assert.equal(result?.code, '1234');
  });
});
