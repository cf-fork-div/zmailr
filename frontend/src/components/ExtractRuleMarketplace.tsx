import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  browseExtractRuleTemplates,
  ExtractRuleTemplateItem,
  getMyExtractRuleTemplateSubmissions,
  installExtractRuleTemplate,
  PopularTemplateDomain,
  publishExtractRuleTemplate,
} from '../utils/api';

type MarketTab = 'browse' | 'mine';

interface ExtractRuleMarketplaceProps {
  onInstalled?: () => void;
  prefillDomain?: string | null;
}

const statusClass: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  approved: 'bg-green-500/10 text-green-600 dark:text-green-400',
  rejected: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

const ExtractRuleMarketplace: React.FC<ExtractRuleMarketplaceProps> = ({ onInstalled, prefillDomain }) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<MarketTab>('browse');
  const [domainFilter, setDomainFilter] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [templates, setTemplates] = useState<ExtractRuleTemplateItem[]>([]);
  const [installedIds, setInstalledIds] = useState<number[]>([]);
  const [popularDomains, setPopularDomains] = useState<PopularTemplateDomain[]>([]);
  const [submissions, setSubmissions] = useState<ExtractRuleTemplateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [installingId, setInstallingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadBrowse = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await browseExtractRuleTemplates({
        domain: domainFilter.trim() || undefined,
        q: searchQ.trim() || undefined,
      });
      if (result.success) {
        setTemplates(result.templates);
        setInstalledIds(result.installedTemplateIds);
        setPopularDomains(result.popularDomains);
      } else {
        setError(result.error || t('ruleMarket.loadFailed'));
      }
    } finally {
      setLoading(false);
    }
  }, [domainFilter, searchQ, t]);

  const loadMine = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getMyExtractRuleTemplateSubmissions();
      if (result.success) {
        setSubmissions(result.submissions);
      } else {
        setError(result.error || t('ruleMarket.loadFailed'));
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (prefillDomain) setDomainFilter(prefillDomain);
  }, [prefillDomain]);

  useEffect(() => {
    if (tab === 'browse') loadBrowse();
    else loadMine();
  }, [tab, loadBrowse, loadMine]);

  const handleInstall = async (templateId: number) => {
    setInstallingId(templateId);
    setMessage('');
    setError('');
    try {
      const result = await installExtractRuleTemplate(templateId);
      if (result.success) {
        setMessage(
          result.alreadyInstalled ? t('ruleMarket.alreadyInstalled') : t('ruleMarket.installSuccess')
        );
        setInstalledIds((prev) => (prev.includes(templateId) ? prev : [...prev, templateId]));
        onInstalled?.();
      } else {
        setError(result.error || t('ruleMarket.installFailed'));
      }
    } finally {
      setInstallingId(null);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-card space-y-4">
      <div>
        <h2 className="font-semibold">{t('ruleMarket.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('ruleMarket.desc')}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('browse')}
          className={`text-sm px-3 py-1.5 rounded-md border ${
            tab === 'browse' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'
          }`}
        >
          {t('ruleMarket.tabBrowse')}
        </button>
        <button
          type="button"
          onClick={() => setTab('mine')}
          className={`text-sm px-3 py-1.5 rounded-md border ${
            tab === 'mine' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'
          }`}
        >
          {t('ruleMarket.tabMine')}
        </button>
      </div>

      {tab === 'browse' && (
        <>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder={t('ruleMarket.searchPlaceholder')}
              className="flex-1 px-3 py-2 border rounded-md bg-background text-sm"
            />
            <input
              type="text"
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              placeholder={t('ruleMarket.domainFilterPlaceholder')}
              className="sm:w-48 px-3 py-2 border rounded-md bg-background text-sm"
            />
            <button
              type="button"
              onClick={loadBrowse}
              className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-md shrink-0"
            >
              {t('ruleMarket.search')}
            </button>
          </div>

          {popularDomains.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground">{t('ruleMarket.popularDomains')}:</span>
              {popularDomains.map(({ domain, count }) => (
                <button
                  key={domain}
                  type="button"
                  onClick={() => {
                    setDomainFilter(domain);
                    setSearchQ('');
                  }}
                  className="text-xs px-2 py-1 rounded-full border bg-muted/50 hover:bg-muted"
                >
                  {domain} ({count})
                </button>
              ))}
            </div>
          )}

          {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {loading ? (
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('ruleMarket.noTemplates')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">{t('ruleMarket.colTitle')}</th>
                    <th className="py-2 pr-3 font-medium">{t('extractRules.colDomain')}</th>
                    <th className="py-2 pr-3 font-medium">{t('extractRules.colRegex')}</th>
                    <th className="hidden md:table-cell py-2 pr-3 font-medium">{t('ruleMarket.colAuthor')}</th>
                    <th className="py-2 pr-3 font-medium">{t('ruleMarket.colInstalls')}</th>
                    <th className="py-2 font-medium">{t('extractRules.colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((tpl) => {
                    const installed = installedIds.includes(tpl.id);
                    return (
                      <tr key={tpl.id} className="border-b last:border-b-0">
                        <td className="py-2 pr-3">
                          <div className="font-medium">{tpl.title}</div>
                          {tpl.remark && (
                            <div className="text-xs text-muted-foreground mt-0.5">{tpl.remark}</div>
                          )}
                        </td>
                        <td className="py-2 pr-3">{tpl.domain}</td>
                        <td className="py-2 pr-3">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded break-all">{tpl.regex}</code>
                        </td>
                        <td className="hidden md:table-cell py-2 pr-3 text-muted-foreground">
                          {tpl.authorUsername || `#${tpl.authorUserId}`}
                        </td>
                        <td className="py-2 pr-3">{tpl.installCount}</td>
                        <td className="py-2">
                          <button
                            type="button"
                            disabled={installed || installingId === tpl.id}
                            onClick={() => handleInstall(tpl.id)}
                            className="text-xs px-3 py-1.5 min-h-8 rounded-md bg-primary text-primary-foreground disabled:opacity-50"
                          >
                            {installed
                              ? t('ruleMarket.installed')
                              : installingId === tpl.id
                                ? t('common.loading')
                                : t('ruleMarket.install')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'mine' && (
        <>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {loading ? (
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('ruleMarket.noSubmissions')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">{t('ruleMarket.colTitle')}</th>
                    <th className="py-2 pr-3 font-medium">{t('extractRules.colDomain')}</th>
                    <th className="py-2 pr-3 font-medium">{t('ruleMarket.colStatus')}</th>
                    <th className="hidden md:table-cell py-2 pr-3 font-medium">{t('ruleMarket.colInstalls')}</th>
                    <th className="py-2 font-medium">{t('ruleMarket.colReview')}</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="border-b last:border-b-0">
                      <td className="py-2 pr-3">{sub.title}</td>
                      <td className="py-2 pr-3">{sub.domain}</td>
                      <td className="py-2 pr-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusClass[sub.status]}`}>
                          {t(`ruleMarket.status.${sub.status}`)}
                        </span>
                      </td>
                      <td className="hidden md:table-cell py-2 pr-3">{sub.installCount}</td>
                      <td className="py-2 pr-3 text-muted-foreground text-xs">
                        {sub.status === 'rejected' ? sub.rejectReason || '-' : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExtractRuleMarketplace;

export const PublishRuleModal: React.FC<{
  open: boolean;
  onClose: () => void;
  ruleId?: number;
  initial?: { domain: string; regex: string; priority: number; remark?: string | null };
  onPublished?: () => void;
}> = ({ open, onClose, ruleId, initial, onPublished }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(initial?.remark?.replace(/^\[marketplace:[^\]]+\]\s*/, '') || '');
      setError('');
    }
  }, [open, initial?.remark]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t('ruleMarket.titleRequired'));
      return;
    }
    setSubmitting(true);
    setError('');
    const result = await publishExtractRuleTemplate({
      title: title.trim(),
      ruleId,
      domain: initial?.domain,
      regex: initial?.regex,
      priority: initial?.priority,
      remark: initial?.remark,
    });
    setSubmitting(false);
    if (result.success) {
      onPublished?.();
      onClose();
    } else {
      setError(result.error || t('ruleMarket.publishFailed'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border rounded-lg p-4 w-full max-w-md shadow-lg">
        <h3 className="font-semibold mb-2">{t('ruleMarket.publishTitle')}</h3>
        <p className="text-sm text-muted-foreground mb-4">{t('ruleMarket.publishDesc')}</p>
        {initial && (
          <p className="text-xs text-muted-foreground mb-3 font-mono break-all">
            {initial.domain} · {initial.regex}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div>
            <label className="text-sm font-medium block mb-1">{t('ruleMarket.colTitle')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm"
              placeholder={t('ruleMarket.titlePlaceholder')}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="text-sm px-4 py-2 border rounded-md">
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
            >
              {submitting ? t('common.loading') : t('ruleMarket.submitPublish')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
