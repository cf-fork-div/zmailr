import { D1Database } from '@cloudflare/workers-types';
import { getEnabledExtractRules } from './database';
import type { ExtractRule } from './types';

/** 通用兜底正则（支持「验证码为/是：123456」等常见中文格式） */
export const GENERIC_CODE_REGEX =
  /(?:code|验证码|verification|pin|otp)(?:[是为])?[：:\s]*(\d{4,8})/i;

/** 主题含验证码语义时，正文中独立的 6 位数字 */
export const SUBJECT_VERIFICATION_HINT =
  /(?:验证码|verification|verify|code|otp)/i;
export const STANDALONE_SIX_DIGIT = /\b(\d{6})\b/;

/** npm signup OTP: "The OTP code is: 17554235" */
export const NPM_OTP_REGEX =
  /(?:the\s+)?otp\s+code\s+is[：:\s]+(\d{6,8})/i;

/** 首次初始化时写入 extract_rules（user_id IS NULL）的默认全局规则 */
export const SEED_GLOBAL_EXTRACT_RULES = [
  {
    seedKey: 'generic-keyword',
    domain: '*',
    regex: GENERIC_CODE_REGEX.source,
    priority: -100,
    remark:
      '匹配 code、验证码、verification、pin、otp 等关键词后的 4–8 位数字，支持「为/是：」等中文格式',
  },
  {
    seedKey: 'subject-hint-six-digit',
    domain: '*',
    regex: STANDALONE_SIX_DIGIT.source,
    priority: -101,
    remark:
      '主题含验证码语义时，从正文提取独立的 6 位数字（适用于正文仅含数字、无关键词的场景）',
  },
  {
    seedKey: 'npm-otp',
    domain: 'npmjs.com',
    regex: NPM_OTP_REGEX.source,
    priority: 0,
    remark: 'npm 注册邮件：The OTP code is: 后的 6–8 位数字',
  },
] as const;

export interface ExtractResult {
  code: string;
  ruleId: number | null;
  ruleDomain: string | null;
}

export interface ExtractRuleTestRow {
  ruleId: number;
  domain: string;
  priority: number;
  regex: string;
  remark: string | null;
  matched: boolean;
  extractedCode?: string;
  order: number;
}

export interface ExtractRuleTestRunResult {
  extractedCode: string | null;
  matchedRuleId: number | null;
  matchedRuleDomain: string | null;
  rules: ExtractRuleTestRow[];
}

/**
 * 从邮件正文中提取验证码
 *
 * 优先级（高 → 低）：
 * 1. 用户自定义规则（mailbox.userId 对应 extract_rules.user_id）
 * 2. 全局自定义规则（admin，extract_rules.user_id IS NULL）
 *    同层内：发件人域名精确匹配 > 通配符 *，再按 priority 降序
 * 3. 代码兜底（matchGenericCode：关键词正则 + 主题语义下的 6 位数字）
 */
export async function extractCode(
  db: D1Database,
  text: string,
  subject: string,
  fromAddress: string,
  userId?: number | null
): Promise<ExtractResult | null> {
  const senderDomain = fromAddress.split('@')[1]?.toLowerCase() || '';
  const rules = await getEnabledExtractRules(db, senderDomain, userId);
  return evaluateExtractRules(rules, text, subject).result;
}

export function evaluateExtractRules(
  rules: ExtractRule[],
  text: string,
  subject: string
): { result: ExtractResult | null; rows: ExtractRuleTestRow[] } {
  const combined = `${subject}\n${text}`;
  const rows: ExtractRuleTestRow[] = rules.map((rule, index) => {
    const code = matchWithRegex(combined, rule.regex);
    return {
      ruleId: rule.id,
      domain: rule.domain,
      priority: rule.priority,
      regex: rule.regex,
      remark: rule.remark ?? null,
      matched: !!code,
      extractedCode: code ?? undefined,
      order: index + 1,
    };
  });

  const firstMatch = rows.find((row) => row.matched);
  if (firstMatch?.extractedCode) {
    return {
      result: {
        code: firstMatch.extractedCode,
        ruleId: firstMatch.ruleId,
        ruleDomain: firstMatch.domain,
      },
      rows,
    };
  }

  const generic = matchGenericCode(combined, text, subject);
  if (generic) {
    return {
      result: { code: generic, ruleId: null, ruleDomain: null },
      rows,
    };
  }

  return { result: null, rows };
}

export async function testRunExtractRules(
  db: D1Database,
  fromAddress: string,
  subject: string,
  text: string,
  userId?: number | null
): Promise<ExtractRuleTestRunResult> {
  const senderDomain = fromAddress.split('@')[1]?.toLowerCase() || '';
  const rules = await getEnabledExtractRules(db, senderDomain, userId);
  const { result, rows } = evaluateExtractRules(rules, text, subject);
  return {
    extractedCode: result?.code ?? null,
    matchedRuleId: result?.ruleId ?? null,
    matchedRuleDomain: result?.ruleDomain ?? null,
    rules: rows,
  };
}

export function matchGenericCode(
  combined: string,
  body?: string,
  subject?: string
): string | null {
  const genericMatch = combined.match(GENERIC_CODE_REGEX);
  if (genericMatch) return genericMatch[1];

  if (body && subject && SUBJECT_VERIFICATION_HINT.test(subject)) {
    const standalone = body.match(STANDALONE_SIX_DIGIT);
    if (standalone) return standalone[1];
  }

  return null;
}

/** Common verification-link patterns (verify, confirm, token, etc.) */
const VERIFICATION_URL_PATTERN =
  /https?:\/\/[^\s<>"']+(?:verify|confirm|activation|validate|token|code|auth|signin|login)[^\s<>"']*/gi;

const HREF_VERIFICATION_PATTERN =
  /href=["'](https?:\/\/[^"']+(?:verify|confirm|activation|validate|token|code|auth|signin|login)[^"']*)["']/gi;

const GENERIC_URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;

function normalizeUrl(url: string): string {
  return url.replace(/&amp;/g, '&').replace(/[.,;:!?)]+$/, '');
}

function isLikelyVerificationUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.includes('unsubscribe') || lower.includes('privacy') || lower.includes('logo')) {
    return false;
  }
  return true;
}

/**
 * Extract the most likely verification link from email body/html.
 */
export function extractLink(text: string, html?: string): string | null {
  const combined = [html, text].filter(Boolean).join('\n');
  if (!combined) return null;

  for (const pattern of [VERIFICATION_URL_PATTERN, HREF_VERIFICATION_PATTERN]) {
    const matches = combined.matchAll(pattern);
    for (const match of matches) {
      const url = normalizeUrl(match[1] || match[0]);
      if (isLikelyVerificationUrl(url)) return url;
    }
  }

  const generic = combined.matchAll(GENERIC_URL_PATTERN);
  for (const match of generic) {
    const url = normalizeUrl(match[0]);
    if (isLikelyVerificationUrl(url)) return url;
  }

  return null;
}

export function matchWithRegex(text: string, pattern: string): string | null {
  try {
    const regex = new RegExp(pattern, 'i');
    const match = text.match(regex);
    if (!match) return null;
    if (match[1]) return match[1];
    const digits = match[0].match(/\d{4,8}/);
    return digits ? digits[0] : null;
  } catch (error) {
    console.error('正则表达式无效:', pattern, error);
    return null;
  }
}
