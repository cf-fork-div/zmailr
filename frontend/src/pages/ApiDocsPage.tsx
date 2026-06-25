import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Container from '../components/Container';
import ApiDocCodeBlock from '../components/ApiDocCodeBlock';
import {
  curlLatestCode,
  curlLease,
  curlMail,
  curlSend,
  getApiBaseUrl,
  leaseResponse,
  mailResponse,
  pythonExample,
  sendResponse,
} from '../utils/apiDocExamples';

const ApiDocsPage: React.FC = () => {
  const { t } = useTranslation();
  const baseUrl = useMemo(getApiBaseUrl, []);

  return (
    <Container>
      <div className="max-w-none space-y-10">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold">{t('apiDocs.title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('apiDocs.subtitle')}</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t('apiDocs.auth.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('apiDocs.auth.description')}</p>
          <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
            <li>{t('apiDocs.auth.step1')}</li>
            <li>
              {t('apiDocs.auth.step2')}{' '}
              <a href={`${baseUrl}/admin`} className="text-primary hover:underline">
                {baseUrl}/admin
              </a>
            </li>
            <li>{t('apiDocs.auth.step3')}</li>
          </ol>
          <p className="text-sm text-muted-foreground">{t('apiDocs.auth.headerNote')}</p>
          <ApiDocCodeBlock>{`Authorization: Bearer <your-api-token>`}</ApiDocCodeBlock>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t('apiDocs.lease.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('apiDocs.lease.description')}</p>
          <p className="text-sm font-medium">POST /api/lease</p>
          <ApiDocCodeBlock>{curlLease(baseUrl)}</ApiDocCodeBlock>
          <p className="text-sm text-muted-foreground">{t('apiDocs.responseExample')}</p>
          <ApiDocCodeBlock>{leaseResponse}</ApiDocCodeBlock>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t('apiDocs.listMailboxes.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('apiDocs.listMailboxes.description')}</p>
          <p className="text-sm font-medium">GET /api/mailboxes</p>
          <ApiDocCodeBlock>{`curl "${baseUrl}/api/mailboxes" \\
  -H "Authorization: Bearer YOUR_TOKEN"`}</ApiDocCodeBlock>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t('apiDocs.latestCode.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('apiDocs.latestCode.description')}</p>
          <p className="text-sm font-medium">GET /api/mailboxes/:address/latest-code</p>
          <ApiDocCodeBlock>{curlLatestCode(baseUrl)}</ApiDocCodeBlock>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t('apiDocs.latestLink.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('apiDocs.latestLink.description')}</p>
          <p className="text-sm font-medium">GET /api/mailboxes/:address/latest-link</p>
          <ApiDocCodeBlock>{`curl "${baseUrl}/api/mailboxes/abc123/latest-link" \\
  -H "Authorization: Bearer YOUR_TOKEN"`}</ApiDocCodeBlock>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t('apiDocs.rawEmail.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('apiDocs.rawEmail.description')}</p>
          <p className="text-sm font-medium">GET /api/emails/:id/raw</p>
          <ApiDocCodeBlock>{`curl "${baseUrl}/api/emails/EMAIL_ID/raw" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -o message.eml`}</ApiDocCodeBlock>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t('apiDocs.mailboxOps.title')}</h2>
          <div className="text-sm text-muted-foreground space-y-3">
            <div>
              <p className="font-medium text-foreground">{t('apiDocs.mailboxOps.randomTitle')}</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>{t('apiDocs.mailboxOps.randomLease')}</li>
                <li>{t('apiDocs.mailboxOps.randomMailboxes')}</li>
                <li>{t('apiDocs.mailboxOps.randomUserMailboxes')}</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground">{t('apiDocs.mailboxOps.customTitle')}</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>{t('apiDocs.mailboxOps.customMailboxes')}</li>
                <li>{t('apiDocs.mailboxOps.customUserMailboxes')}</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground">{t('apiDocs.mailboxOps.deleteTitle')}</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>{t('apiDocs.mailboxOps.deleteMailboxes')}</li>
                <li>{t('apiDocs.mailboxOps.deleteUserNote')}</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t('apiDocs.rateLimit.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('apiDocs.rateLimit.description')}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t('apiDocs.mail.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('apiDocs.mail.description')}</p>
          <p className="text-sm font-medium">GET /api/mail</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium">{t('apiDocs.param')}</th>
                  <th className="text-left py-2 font-medium">{t('apiDocs.description')}</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-foreground">to</td>
                  <td className="py-2">{t('apiDocs.mail.params.to')}</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-foreground">timeout</td>
                  <td className="py-2">{t('apiDocs.mail.params.timeout')}</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-foreground">since</td>
                  <td className="py-2">{t('apiDocs.mail.params.since')}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-foreground">require_code</td>
                  <td className="py-2">{t('apiDocs.mail.params.requireCode')}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ApiDocCodeBlock>{curlMail(baseUrl)}</ApiDocCodeBlock>
          <p className="text-sm text-muted-foreground">{t('apiDocs.responseExample')}</p>
          <ApiDocCodeBlock>{mailResponse}</ApiDocCodeBlock>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t('apiDocs.send.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('apiDocs.send.description')}</p>
          <p className="text-sm font-medium">POST /api/send</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium">{t('apiDocs.param')}</th>
                  <th className="text-left py-2 font-medium">{t('apiDocs.description')}</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-foreground">to</td>
                  <td className="py-2">{t('apiDocs.send.params.to')}</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-foreground">subject</td>
                  <td className="py-2">{t('apiDocs.send.params.subject')}</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-foreground">text / html</td>
                  <td className="py-2">{t('apiDocs.send.params.body')}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-foreground">from</td>
                  <td className="py-2">{t('apiDocs.send.params.from')}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ApiDocCodeBlock>{curlSend(baseUrl)}</ApiDocCodeBlock>
          <p className="text-sm text-muted-foreground">{t('apiDocs.responseExample')}</p>
          <ApiDocCodeBlock>{sendResponse}</ApiDocCodeBlock>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t('apiDocs.python.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('apiDocs.python.description')}</p>
          <ApiDocCodeBlock>{pythonExample(baseUrl)}</ApiDocCodeBlock>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t('apiDocs.errors.title')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium">{t('apiDocs.errors.code')}</th>
                  <th className="text-left py-2 font-medium">{t('apiDocs.errors.meaning')}</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-foreground">401</td>
                  <td className="py-2">{t('apiDocs.errors.unauthorized')}</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-foreground">400</td>
                  <td className="py-2">{t('apiDocs.errors.badRequest')}</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-foreground">404</td>
                  <td className="py-2">{t('apiDocs.errors.notFound')}</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-foreground">408</td>
                  <td className="py-2">{t('apiDocs.errors.timeout')}</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-foreground">429</td>
                  <td className="py-2">{t('apiDocs.errors.rateLimit')}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-foreground">502</td>
                  <td className="py-2">{t('apiDocs.errors.sendFailed')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-2 text-sm text-muted-foreground border-t pt-6">
          <p>{t('apiDocs.webApiNote')}</p>
          <p>
            <Link to="/" className="text-primary hover:underline">
              {t('apiDocs.backHome')}
            </Link>
          </p>
        </section>
      </div>
    </Container>
  );
};

export default ApiDocsPage;
