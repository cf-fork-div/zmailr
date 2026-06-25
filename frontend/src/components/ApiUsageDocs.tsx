import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ApiDocCodeBlock from './ApiDocCodeBlock';
import {
  curlLatestCode,
  curlLease,
  curlMail,
  curlMailboxes,
  curlSend,
  getApiBaseUrl,
  pythonExample,
} from '../utils/apiDocExamples';

const EndpointSection: React.FC<{
  title: string;
  description: string;
  method: string;
  example: string;
}> = ({ title, description, method, example }) => (
  <div className="space-y-2">
    <h3 className="text-sm font-semibold">{title}</h3>
    <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
    <p className="text-xs sm:text-sm font-medium font-mono">{method}</p>
    <ApiDocCodeBlock>{example}</ApiDocCodeBlock>
  </div>
);

const ApiUsageDocs: React.FC = () => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const baseUrl = useMemo(getApiBaseUrl, []);

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
        aria-expanded={expanded}
      >
        <div>
          <h2 className="text-sm font-semibold">{t('apiUsage.title')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t('apiUsage.subtitle')}</p>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-6 border-t border-border/60 pt-4">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">{t('apiDocs.auth.title')}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">{t('apiDocs.auth.description')}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">{t('apiDocs.auth.headerNote')}</p>
            <ApiDocCodeBlock>{`Authorization: Bearer YOUR_TOKEN`}</ApiDocCodeBlock>
          </section>

          <EndpointSection
            title={t('apiDocs.lease.title')}
            description={t('apiDocs.lease.description')}
            method="POST /api/lease"
            example={curlLease(baseUrl)}
          />

          <EndpointSection
            title={t('apiDocs.listMailboxes.title')}
            description={t('apiDocs.listMailboxes.description')}
            method="GET /api/mailboxes"
            example={curlMailboxes(baseUrl)}
          />

          <EndpointSection
            title={t('apiDocs.latestCode.title')}
            description={t('apiDocs.latestCode.description')}
            method="GET /api/mailboxes/:address/latest-code"
            example={curlLatestCode(baseUrl)}
          />

          <EndpointSection
            title={t('apiDocs.mail.title')}
            description={t('apiDocs.mail.description')}
            method="GET /api/mail"
            example={curlMail(baseUrl)}
          />

          <EndpointSection
            title={t('apiDocs.send.title')}
            description={t('apiDocs.send.description')}
            method="POST /api/send"
            example={curlSend(baseUrl)}
          />

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">{t('apiDocs.python.title')}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">{t('apiDocs.python.description')}</p>
            <ApiDocCodeBlock>{pythonExample(baseUrl)}</ApiDocCodeBlock>
          </section>

          <div className="pt-2 border-t border-border/60">
            <Link to="/api-docs" className="text-sm text-primary hover:underline">
              {t('apiUsage.viewFullDocs')} →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiUsageDocs;
