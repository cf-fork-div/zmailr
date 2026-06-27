import React, { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/SEO';
import ThemeSwitcher from '../components/ThemeSwitcher';
import ApiDocCodeBlock from '../components/ApiDocCodeBlock';
import {
  curlQuickstart,
  getApiBaseUrl,
  mailResponse,
  mcpConfigExample,
} from '../utils/apiDocExamples';
import { copyTextToClipboard } from '../utils/clipboard';

type QuickstartTab = 'curl' | 'mcp';

const WORKS_WITH = ['CI / 脚本', 'Playwright', 'Cursor', 'Claude', 'MCP', 'OpenAPI'] as const;

const PRIMITIVES = [
  { icon: 'fas fa-envelope', titleKey: 'landing.primitiveReceiveTitle', descKey: 'landing.primitiveReceiveDesc' },
  { icon: 'fas fa-clock', titleKey: 'landing.primitivePollTitle', descKey: 'landing.primitivePollDesc' },
  { icon: 'fas fa-robot', titleKey: 'landing.primitiveAgentTitle', descKey: 'landing.primitiveAgentDesc' },
] as const;

const CONSOLE_FEATURES = [
  { icon: 'fas fa-inbox', titleKey: 'landing.consoleInbox', descKey: 'landing.consoleInboxDesc' },
  { icon: 'fas fa-paper-plane', titleKey: 'landing.consoleOutbox', descKey: 'landing.consoleOutboxDesc' },
  { icon: 'fas fa-filter', titleKey: 'landing.consoleRules', descKey: 'landing.consoleRulesDesc' },
  { icon: 'fas fa-key', titleKey: 'landing.consoleApiKeys', descKey: 'landing.consoleApiKeysDesc' },
  { icon: 'fas fa-terminal', titleKey: 'landing.consoleDebug', descKey: 'landing.consoleDebugDesc' },
  { icon: 'fas fa-chart-bar', titleKey: 'landing.consoleUsage', descKey: 'landing.consoleUsageDesc' },
] as const;

const FAQ_KEYS = [
  { q: 'landing.faqQ1', a: 'landing.faqA1' },
  { q: 'landing.faqQ2', a: 'landing.faqA2' },
  { q: 'landing.faqQ3', a: 'landing.faqA3' },
  { q: 'landing.faqQ4', a: 'landing.faqA4' },
] as const;

const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const baseUrl = useMemo(getApiBaseUrl, []);
  const [quickstartTab, setQuickstartTab] = useState<QuickstartTab>('curl');
  const [copied, setCopied] = useState<string | null>(null);

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard/usage" replace />;
  }

  const copyCode = async (text: string, id: string) => {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const quickstartCode =
    quickstartTab === 'curl' ? curlQuickstart(baseUrl) : mcpConfigExample(baseUrl);

  return (
    <div className="login-shell relative min-h-screen flex flex-col">
      <SEO title={t('seo.landingTitle')} description={t('seo.landingDescription')} />

      <header className="relative z-10 border-b border-sky-200/50 dark:border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight shrink-0">
            <span className="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center">
              <i className="fas fa-envelope text-sm text-sky-600 dark:text-sky-400" />
            </span>
            zMailR
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <a
              href="/docs/"
              className="text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted/50"
            >
              {t('nav.docs')}
            </a>
            <a
              href="https://github.com/jia0327/zmailr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted/50 hidden sm:inline"
            >
              GitHub
            </a>
            <ThemeSwitcher />
            <Link
              to="/login"
              className="text-sm font-medium px-3 py-1.5 rounded-lg text-white bg-sky-600 hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400 transition-colors"
            >
              {t('landing.signIn')}
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative flex-1">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-4">
                {t('landing.badge')}
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                {t('landing.heroTitle')}
                <span className="text-sky-600 dark:text-sky-400"> {t('landing.heroTitleHighlight')}</span>
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                {t('landing.heroSubtitle')}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white bg-sky-600 hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400 shadow-md shadow-sky-600/20 transition-colors"
                >
                  {t('landing.tryDemo')}
                  <i className="fas fa-arrow-right text-sm" />
                </Link>
                <a
                  href="/docs/"
                  className="inline-flex items-center px-5 py-2.5 rounded-lg font-medium border border-border hover:bg-muted/50 transition-colors"
                >
                  {t('landing.readDocs')}
                </a>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{t('landing.tryDemoHint')}</p>
              <div className="mt-8 flex flex-wrap gap-2">
                {WORKS_WITH.map((label) => (
                  <span
                    key={label}
                    className="text-xs px-2.5 py-1 rounded-full border border-border bg-card/60 text-muted-foreground"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-sky-200/70 dark:border-border bg-card shadow-xl shadow-sky-500/10 dark:shadow-black/30 overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2 bg-muted/30">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-sm font-mono truncate">signup-8xef@your-domain.com</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{t('landing.mockTtl')}</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="rounded-lg border border-border p-3 bg-background/50">
                  <p className="text-xs text-muted-foreground">{t('landing.mockInbox')}</p>
                  <p className="text-sm font-medium mt-1">{t('landing.mockSubject')}</p>
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      {t('landing.mockOtpLabel')}
                    </p>
                    <p className="text-2xl font-mono font-bold tracking-widest mt-1">847291</p>
                  </div>
                  <i className="fas fa-check-circle text-emerald-600 dark:text-emerald-400 text-xl" />
                </div>
                <div className="rounded-md bg-muted/50 px-3 py-2 text-xs font-mono text-muted-foreground">
                  {t('landing.mockApi')}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quickstart */}
        <section className="border-y border-border bg-card/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('landing.quickstartTitle')}</h2>
              <p className="mt-2 text-muted-foreground">{t('landing.quickstartSubtitle')}</p>
            </div>

            <div className="mt-8 rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30">
                {(['curl', 'mcp'] as QuickstartTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setQuickstartTab(tab)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      quickstartTab === tab
                        ? 'bg-background shadow-sm font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab === 'curl' ? t('landing.quickstartTabCurl') : t('landing.quickstartTabMcp')}
                  </button>
                ))}
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => copyCode(quickstartCode, 'quickstart')}
                  className="text-xs px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                  <i className={`fas ${copied === 'quickstart' ? 'fa-check' : 'fa-copy'} mr-1`} />
                  {copied === 'quickstart' ? t('common.copied') : t('tokens.copyOneClick')}
                </button>
              </div>
              <div className="p-4 sm:p-6">
                {quickstartTab === 'mcp' && (
                  <p className="text-sm text-muted-foreground mb-4">{t('landing.quickstartMcpHint')}</p>
                )}
                <ApiDocCodeBlock>{quickstartCode}</ApiDocCodeBlock>
                {quickstartTab === 'curl' && (
                  <div className="mt-6">
                    <p className="text-sm font-medium mb-2">{t('landing.quickstartResponse')}</p>
                    <ApiDocCodeBlock>{mailResponse}</ApiDocCodeBlock>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <span className="text-sm text-muted-foreground">{t('landing.installMcp')}</span>
              <code className="text-sm font-mono px-3 py-1.5 rounded-lg bg-muted border border-border">
                {t('landing.mcpCommand')}
              </code>
              <button
                type="button"
                onClick={() => copyCode('npx -y @zmailr/mcp', 'mcp')}
                className="text-sm text-sky-600 dark:text-sky-400 hover:underline"
              >
                {copied === 'mcp' ? t('common.copied') : t('tokens.copyOneClick')}
              </button>
            </div>
          </div>
        </section>

        {/* Primitives */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('landing.primitivesTitle')}</h2>
            <p className="mt-2 text-muted-foreground">{t('landing.primitivesSubtitle')}</p>
          </div>
          <div className="mt-8 grid sm:grid-cols-3 gap-6">
            {PRIMITIVES.map(({ icon, titleKey, descKey }) => (
              <div
                key={titleKey}
                className="rounded-xl border border-border p-5 bg-card hover:border-sky-300/50 dark:hover:border-sky-500/30 transition-colors"
              >
                <span className="w-10 h-10 rounded-lg bg-sky-500/15 flex items-center justify-center">
                  <i className={`${icon} text-sky-600 dark:text-sky-400`} />
                </span>
                <h3 className="mt-4 font-semibold">{t(titleKey)}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Console */}
        <section className="border-y border-border bg-card/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('landing.consoleTitle')}</h2>
              <p className="mt-2 text-muted-foreground">{t('landing.consoleSubtitle')}</p>
            </div>
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CONSOLE_FEATURES.map(({ icon, titleKey, descKey }) => (
                <div key={titleKey} className="rounded-lg border border-border p-4 bg-card">
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-md bg-sky-500/10 flex items-center justify-center shrink-0">
                      <i className={`${icon} text-sm text-sky-600 dark:text-sky-400`} />
                    </span>
                    <div>
                      <h3 className="font-medium text-sm">{t(titleKey)}</h3>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{t(descKey)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Self-host */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-sky-500/5 via-card to-card p-6 sm:p-10">
            <h2 className="text-2xl font-bold tracking-tight">{t('landing.selfHostTitle')}</h2>
            <p className="mt-3 text-muted-foreground max-w-2xl leading-relaxed">{t('landing.selfHostDesc')}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/docs/deploy.html"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium border border-border hover:bg-muted/50 transition-colors"
              >
                <i className="fas fa-book text-sm" />
                {t('landing.selfHostDeploy')}
              </a>
              <a
                href="https://github.com/jia0327/zmailr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium border border-border hover:bg-muted/50 transition-colors"
              >
                <i className="fab fa-github text-sm" />
                {t('landing.selfHostGithub')}
              </a>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border bg-card/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('landing.faqTitle')}</h2>
            <dl className="mt-8 space-y-6 max-w-3xl">
              {FAQ_KEYS.map(({ q, a }) => (
                <div key={q}>
                  <dt className="font-medium">{t(q)}</dt>
                  <dd className="mt-2 text-sm text-muted-foreground leading-relaxed">{t(a)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('landing.ctaTitle')}</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">{t('landing.ctaSubtitle')}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white bg-sky-600 hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400 transition-colors"
            >
              {t('landing.tryDemo')}
            </Link>
            <a
              href="/docs/"
              className="inline-flex items-center px-5 py-2.5 rounded-lg font-medium border border-border hover:bg-muted/50 transition-colors"
            >
              {t('landing.readDocs')}
            </a>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-border py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} zMailR</span>
          <div className="flex items-center gap-4">
            <a href="/docs/" className="hover:text-foreground transition-colors">{t('landing.footerDocs')}</a>
            <a href="/docs/api.html" className="hover:text-foreground transition-colors">{t('landing.footerApi')}</a>
            <a
              href="https://github.com/jia0327/zmailr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              {t('landing.footerGithub')}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
