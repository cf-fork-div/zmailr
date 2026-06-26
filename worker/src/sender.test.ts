import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateSendAttachments, MAX_ATTACHMENT_TOTAL_BYTES } from './sender';

describe('validateSendAttachments', () => {
  it('accepts empty or missing attachments', () => {
    assert.deepEqual(validateSendAttachments(undefined), { ok: true, attachments: [] });
    assert.deepEqual(validateSendAttachments([]), { ok: true, attachments: [] });
  });

  it('accepts valid base64 attachment', () => {
    const content = Buffer.from('hello').toString('base64');
    const result = validateSendAttachments([{ name: 'test.txt', content }]);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.attachments.length, 1);
      assert.equal(result.attachments[0].name, 'test.txt');
      assert.equal(result.attachments[0].content, content);
    }
  });

  it('rejects missing name', () => {
    const result = validateSendAttachments([{ name: '', content: 'aGVsbG8=' }]);
    assert.equal(result.ok, false);
  });

  it('rejects total size over limit', () => {
    const big = Buffer.alloc(MAX_ATTACHMENT_TOTAL_BYTES + 1).toString('base64');
    const result = validateSendAttachments([{ name: 'big.bin', content: big }]);
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /5MB/);
  });

  it('rejects non-array attachments', () => {
    const result = validateSendAttachments({ name: 'x', content: 'a' });
    assert.equal(result.ok, false);
  });
});
