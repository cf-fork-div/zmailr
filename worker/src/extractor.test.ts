import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getBuiltinExtractRules, matchGenericCode, matchWithRegex } from './extractor';

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

describe('getBuiltinExtractRules', () => {
  it('returns built-in fallback rules with metadata', () => {
    const rules = getBuiltinExtractRules();
    assert.equal(rules.length, 2);
    assert.ok(rules.every((r) => r.builtin && r.enabled && r.domain === '*'));
    assert.ok(rules[0].regex.includes('验证码'));
    assert.ok(rules[1].description.includes('6 位数字'));
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
