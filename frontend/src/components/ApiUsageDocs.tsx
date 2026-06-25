import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ApiDocCodeBlock from './ApiDocCodeBlock';
import {
  curlDeleteMailbox,
  curlLatestCode,
  curlLatestLink,
  curlLease,
  curlMail,
  curlMailboxes,
  curlSend,
  getApiBaseUrl,
} from '../utils/apiDocExamples';

type EndpointRow = {
  method: string;
  path: string;
  scopeKey: string;
  descKey: string;
};

const ENDPOINTS: EndpointRow[] = [
  { method: 'POST', path: '/api/lease', scopeKey: 'apiUsage.scopes.lease', descKey: 'apiDocs.lease.description' },
  {
    method: 'GET',
    path: '/api/mailboxes',
    scopeKey: 'apiUsage.scopes.mail',
    descKey: 'apiDocs.listMailboxes.description',
  },
  {
    method: 'GET',
    path: '/api/mailboxes/:address/latest-code',
    scopeKey: 'apiUsage.scopes.mail',
    descKey: 'apiDocs.latestCode.description',
  },
  {
    method: 'GET',
    path: '/api/mailboxes/:address/latest-link',
    scopeKey: 'apiUsage.scopes.mail',
    descKey: 'apiDocs.latestLink.description',
  },
  { method: 'GET', path: '/api/mail', scopeKey: 'apiUsage.scopes.mail', descKey: 'apiDocs.mail.description' },
  { method: 'POST', path: '/api/send', scopeKey: 'apiUsage.scopes.send', descKey: 'apiDocs.send.description' },
  {
    method: 'DELETE',
    path: '/api/mailboxes/:address',
    scopeKey: 'apiUsage.scopes.none',
    descKey: 'apiUsage.deleteDesc',
  },
];

const ApiUsageDocs: React.FC = () => {
  const { t } = useTranslation();
  const baseUrl = useMemo(getApiBaseUrl, []);

  return (
    <div className="border border-border rounded-lg bg-card p-4 space-y-6">
      <div>
        <h2 className="text-sm font-semibold">{t('apiUsage.title')}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{t('apiUsage.subtitle')}</p>
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">{t('apiUsage.baseUrlTitle')}</h3>
        <ApiDocCodeBlock>{baseUrl}</ApiDocCodeBlock>
        <p className="text-xs text-muted-foreground">{t('apiDocs.auth.headerNote')}</p>
        <ApiDocCodeBlock>{`Authorization: Bearer YOUR_TOKEN`}</ApiDocCodeBlock>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">{t('apiUsage.tokenNoteTitle')}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">{t('auth.tokenLimitOne')}</p>
        <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
          <li>
            <span className="font-medium text-foreground">{t('tokens.scopeLease')}</span>
            {' — '}
            {t('tokens.scopeLeaseDesc')}
          </li>
          <li>
            <span className="font-medium text-foreground">{t('tokens.scopeMail')}</span>
            {' — '}
            {t('tokens.scopeMailDesc')}
          </li>
          <li>
            <span className="font-medium text-foreground">{t('tokens.scopeSend')}</span>
            {' — '}
            {t('tokens.scopeSendDesc')}
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">{t('apiUsage.endpointsTitle')}</h3>
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-xs sm:text-sm border-collapse min-w-[520px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 font-medium">{t('apiUsage.colMethod')}</th>
                <th className="text-left py-2 pr-3 font-medium">{t('apiUsage.colPath')}</th>
                <th className="text-left py-2 pr-3 font-medium">{t('apiUsage.colScope')}</th>
                <th className="text-left py-2 font-medium">{t('apiDocs.description')}</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {ENDPOINTS.map((row) => (
                <tr key={`${row.method}-${row.path}`} className="border-b border-border/50 align-top">
                  <td className="py-2 pr-3 font-mono text-foreground whitespace-nowrap">{row.method}</td>
                  <td className="py-2 pr-3 font-mono text-foreground">{row.path}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{t(row.scopeKey)}</td>
                  <td className="py-2">{t(row.descKey)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">{t('apiUsage.rateLimitNote')}</p>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">{t('apiUsage.examplesTitle')}</h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium font-mono mb-1">POST /api/lease</p>
            <ApiDocCodeBlock>{curlLease(baseUrl)}</ApiDocCodeBlock>
          </div>
          <div>
            <p className="text-xs font-medium font-mono mb-1">GET /api/mail</p>
            <ApiDocCodeBlock>{curlMail(baseUrl)}</ApiDocCodeBlock>
          </div>
          <div>
            <p className="text-xs font-medium font-mono mb-1">POST /api/send</p>
            <ApiDocCodeBlock>{curlSend(baseUrl)}</ApiDocCodeBlock>
          </div>
          <div>
            <p className="text-xs font-medium font-mono mb-1">GET /api/mailboxes</p>
            <ApiDocCodeBlock>{curlMailboxes(baseUrl)}</ApiDocCodeBlock>
          </div>
          <div>
            <p className="text-xs font-medium font-mono mb-1">GET /api/mailboxes/:address/latest-code</p>
            <ApiDocCodeBlock>{curlLatestCode(baseUrl)}</ApiDocCodeBlock>
          </div>
          <div>
            <p className="text-xs font-medium font-mono mb-1">GET /api/mailboxes/:address/latest-link</p>
            <ApiDocCodeBlock>{curlLatestLink(baseUrl)}</ApiDocCodeBlock>
          </div>
          <div>
            <p className="text-xs font-medium font-mono mb-1">DELETE /api/mailboxes/:address</p>
            <ApiDocCodeBlock>{curlDeleteMailbox(baseUrl)}</ApiDocCodeBlock>
          </div>
        </div>
      </section>

      <section className="space-y-2 pt-2 border-t border-border/60">
        <h3 className="text-sm font-semibold">{t('apiDocs.auth.sessionVsBearerTitle')}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">{t('apiDocs.auth.sessionVsBearer')}</p>
      </section>

      <div className="pt-2 border-t border-border/60">
        <Link to="/api-docs" className="text-sm text-primary hover:underline">
          {t('apiUsage.viewFullDocs')} →
        </Link>
      </div>
    </div>
  );
};

export default ApiUsageDocs;
