import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getUserSentEmailDetail, resendUserSentEmail, SentEmailDetail } from '../utils/api';
import { sanitizeEmailHtml } from '../utils/sanitizeHtml';

interface SentEmailDetailModalProps {
  emailId: number;
  onClose: () => void;
  onResent?: () => void;
}

const SentEmailDetailModal: React.FC<SentEmailDetailModalProps> = ({ emailId, onClose, onResent }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState<SentEmailDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [bodyMode, setBodyMode] = useState<'text' | 'html'>('text');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      const result = await getUserSentEmailDetail(emailId);
      if (cancelled) return;
      if (result.success) {
        setEmail(result.email);
        setBodyMode(result.email.bodyHtml && !result.email.bodyText ? 'html' : 'text');
      } else {
        setError(result.error || t('send.detailLoadFailed'));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [emailId, t]);

  const fmtTime = (ts: number) =>
    new Date(ts > 1e12 ? ts : ts * 1000).toLocaleString();

  const handleResend = async () => {
    setResending(true);
    setError('');
    const result = await resendUserSentEmail(emailId);
    setResending(false);
    if (result.success) {
      onResent?.();
      onClose();
    } else {
      setError(result.error || t('send.resendFailed'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">{t('send.detailTitle')}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted"
          >
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto space-y-3 text-sm">
          {loading ? (
            <p className="text-muted-foreground">{t('common.loading')}</p>
          ) : error && !email ? (
            <p className="text-destructive">{error}</p>
          ) : email ? (
            <>
              {error && <p className="text-destructive">{error}</p>}
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
                <span className="text-muted-foreground">{t('send.from')}</span>
                <span>{email.fromEmail || '—'}</span>
                <span className="text-muted-foreground">{t('send.to')}</span>
                <span>{email.toEmail}</span>
                <span className="text-muted-foreground">{t('send.subject')}</span>
                <span>{email.subject}</span>
                <span className="text-muted-foreground">{t('email.date')}</span>
                <span>{fmtTime(email.createdAt)}</span>
                <span className="text-muted-foreground">{t('send.status')}</span>
                <span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      email.status === 'sent'
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    {email.status}
                  </span>
                </span>
                {(email.attachmentCount ?? 0) > 0 && (
                  <>
                    <span className="text-muted-foreground">{t('send.attachments')}</span>
                    <span>{email.attachmentCount}</span>
                  </>
                )}
              </div>
              {email.errorMessage && (
                <div className="rounded-md bg-destructive/10 text-destructive px-3 py-2 text-xs whitespace-pre-wrap">
                  {email.errorMessage}
                </div>
              )}
              {(email.bodyText || email.bodyHtml) && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{t('send.body')}</span>
                    {email.bodyText && email.bodyHtml && (
                      <div className="flex rounded-md border overflow-hidden text-xs">
                        <button
                          type="button"
                          onClick={() => setBodyMode('text')}
                          className={`px-2 py-0.5 ${bodyMode === 'text' ? 'bg-primary text-primary-foreground' : ''}`}
                        >
                          {t('send.bodyText')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setBodyMode('html')}
                          className={`px-2 py-0.5 ${bodyMode === 'html' ? 'bg-primary text-primary-foreground' : ''}`}
                        >
                          {t('send.bodyHtml')}
                        </button>
                      </div>
                    )}
                  </div>
                  {bodyMode === 'html' && email.bodyHtml ? (
                    <div
                      className="border rounded-md p-3 prose prose-sm dark:prose-invert max-w-none bg-muted/20"
                      dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(email.bodyHtml) }}
                    />
                  ) : (
                    <pre className="border rounded-md p-3 whitespace-pre-wrap bg-muted/20 text-xs">{email.bodyText || email.bodyHtml}</pre>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
        {email && email.status !== 'sent' && (
          <div className="p-4 border-t flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border hover:bg-muted"
            >
              {t('common.close')}
            </button>
            <button
              onClick={handleResend}
              disabled={resending}
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground disabled:opacity-50"
            >
              {resending ? t('common.loading') : t('send.resend')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SentEmailDetailModal;
