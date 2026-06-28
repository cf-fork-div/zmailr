import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getUserMailboxes,
  deleteMailbox as apiDeleteMailbox,
  UserMailboxItem,
} from '../utils/api';
import {
  formatMailboxDisplayEmail,
  getMailboxLocalPart,
  isSameMailbox,
} from '../utils/mailbox';

interface MailboxHistoryListProps {
  activeMailbox?: Mailbox | null;
  onSelect: (mailbox: UserMailboxItem) => void;
  onDeleted?: (mailbox: UserMailboxItem) => void;
}

const MailboxHistoryList: React.FC<MailboxHistoryListProps> = ({
  activeMailbox,
  onSelect,
  onDeleted,
}) => {
  const { t } = useTranslation();
  const [latest, setLatest] = useState<UserMailboxItem | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async (searchTerm = search) => {
    setLoading(true);
    const result = await getUserMailboxes({
      hasEmails: true,
      withLatestEmail: true,
      orderBy: 'latestEmail',
      page: 1,
      limit: 1,
      search: searchTerm || undefined,
    });
    if (result.success) {
      setLatest(result.mailboxes[0] ?? null);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    load(search);
  }, [search]);

  const handleDelete = async () => {
    if (!latest) return;
    if (!confirm(t('mailbox.confirmDeleteMailbox'))) return;
    setBusy(true);
    await apiDeleteMailbox(getMailboxLocalPart(latest.address));
    onDeleted?.(latest);
    await load(search);
    setBusy(false);
  };

  const isActive = latest && activeMailbox ? isSameMailbox(latest, activeMailbox) : false;
  const subject = latest?.latestEmail?.subject?.trim() || t('email.noSubject');
  const extracted =
    latest?.latestEmail?.extractedCode?.trim() || t('email.noExtractedCode');

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/20 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide">{t('history.mailboxList')}</h2>
        <button
          onClick={() => load(search)}
          disabled={busy}
          className="p-2 min-w-10 min-h-10 rounded-md hover:bg-muted transition-colors text-muted-foreground"
          title={t('common.refresh')}
        >
          <i className={`fas fa-sync-alt text-sm ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="px-4 py-2 border-b bg-muted/5">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t('history.searchMailbox')}
          className="w-full px-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label={t('history.searchMailbox')}
        />
      </div>
      {loading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">{t('common.loading')}</div>
      ) : !latest ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {search ? t('history.noSearchResults') : t('history.noMailboxes')}
        </div>
      ) : (
        <div
          className={`px-4 py-4 ${isActive ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
        >
          <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto] gap-3 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            <span>{t('mailbox.address')}</span>
            <span>{t('email.subject')}</span>
            <span>{t('email.ruleExtract')}</span>
            <span />
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-center text-sm">
            <button
              onClick={() => onSelect(latest)}
              className="min-w-0 text-left font-mono truncate text-primary hover:underline"
              title={formatMailboxDisplayEmail(latest)}
            >
              {formatMailboxDisplayEmail(latest)}
            </button>
            <p className="min-w-0 truncate text-muted-foreground" title={subject}>
              {subject}
            </p>
            <p
              className={`min-w-0 truncate font-mono text-sm ${
                latest.latestEmail?.extractedCode ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
              }`}
              title={extracted}
            >
              {extracted}
            </p>
            <div className="flex sm:justify-end">
              <button
                onClick={handleDelete}
                disabled={busy}
                className="text-muted-foreground hover:text-destructive p-2 min-w-8 min-h-8"
                title={t('common.delete')}
              >
                <i className="fas fa-trash-alt text-xs" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MailboxHistoryList;
