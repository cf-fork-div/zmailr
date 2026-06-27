/**
 * Verify public doc / app URLs and scan built VitePress HTML for bad outbound links.
 * Usage: node scripts/verify-doc-links.mjs [baseUrl]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_OUT = path.join(__dirname, '../frontend/public/docs');

const BASE = (process.argv[2] || process.env.ZMAILR_BASE_URL || 'https://zmailr.onlydev.ccwu.cc').replace(
  /\/$/,
  ''
);

const checks = [
  { path: '/', name: 'landing' },
  { path: '/login', name: 'login' },
  { path: '/register', name: 'register' },
  { path: '/forgot-password', name: 'forgot-password' },
  { path: '/docs/', name: 'docs home' },
  { path: '/docs/overview', name: 'docs overview' },
  { path: '/docs/quickstart-5min', name: 'docs quickstart' },
  { path: '/docs/mcp', name: 'docs mcp' },
  { path: '/docs/api-overview', name: 'docs api-overview' },
  { path: '/docs/api', name: 'docs api reference' },
  { path: '/openapi.json', name: 'openapi.json' },
  { path: '/api-docs', name: 'interactive api-docs' },
  { path: '/api-docs?embed=1', name: 'api-docs embed' },
  { path: '/api/health', name: 'health' },
  { path: '/api/public/status', name: 'public status' },
];

/** href values that should never appear in published doc content links */
const BAD_HREF_PATTERNS = [
  { re: /class="site-link"[^>]*href="\.\.\/\.\.\//, label: 'site-link still uses ../../ (use absolute path)' },
  { re: /href="\/docs\/login"/, label: '/docs/login (app route under docs base)' },
  { re: /<a href="\/docs\/dashboard\//, label: 'markdown link to /docs/dashboard/* (use SiteLink)' },
];

function scanBuiltDocsHtml() {
  if (!fs.existsSync(DOCS_OUT)) {
    console.warn('⚠ docs output missing — run docs build before HTML link scan');
    return [];
  }

  const issues = [];
  for (const name of fs.readdirSync(DOCS_OUT)) {
    if (!name.endsWith('.html')) continue;
    const file = path.join(DOCS_OUT, name);
    const html = fs.readFileSync(file, 'utf8');
    for (const { re, label } of BAD_HREF_PATTERNS) {
      if (re.test(html)) {
        issues.push({ file: name, label });
      }
    }
  }
  return issues;
}

async function checkOne({ path: routePath, name }) {
  const url = `${BASE}${routePath}`;
  try {
    const res = await fetch(url, { redirect: 'follow' });
    const finalUrl = res.url;
    const ok = res.status >= 200 && res.status < 400;
    let bodyHint = '';
    if (routePath.startsWith('/api-docs')) {
      const text = await res.text();
      const spaOk = text.includes('id="root"') && text.includes('/assets/');
      bodyHint = spaOk ? ' (SPA shell)' : ' (invalid SPA response)';
      if (!spaOk) {
        return { name, path: routePath, status: res.status, ok: false, finalUrl, bodyHint };
      }
    }
    return { name, path: routePath, status: res.status, ok, finalUrl, bodyHint };
  } catch (err) {
    return { name, path: routePath, status: 0, ok: false, error: err.message };
  }
}

const htmlIssues = scanBuiltDocsHtml();
if (htmlIssues.length) {
  console.error('Built docs HTML contains bad outbound links:');
  for (const { file, label } of htmlIssues) {
    console.error(`  ✗ ${file}: ${label}`);
  }
}

const results = await Promise.all(checks.map(checkOne));
const failed = results.filter((r) => !r.ok);

for (const r of results) {
  const mark = r.ok ? '✓' : '✗';
  const extra = r.finalUrl && r.finalUrl !== `${BASE}${r.path}` ? ` → ${r.finalUrl}` : '';
  const hint = r.bodyHint || (r.error ? ` (${r.error})` : '');
  console.log(`${mark} ${r.status} ${r.name} ${r.path}${extra}${hint}`);
}

const totalFailed = failed.length + htmlIssues.length;
if (totalFailed) {
  console.error(`\n${totalFailed} issue(s) failed`);
  process.exit(1);
}
console.log(`\nAll ${results.length} URLs OK and doc HTML links clean on ${BASE}`);
