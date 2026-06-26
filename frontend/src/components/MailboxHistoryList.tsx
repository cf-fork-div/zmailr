import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getUserMailboxes,
  deleteMailbox as apiDeleteMailbox,
  reactivateUserMailbox,
  UserMailboxItem,
} from '../utils/api';
import { getDefaultEmailDomain, DEFAULT_EMAIL_DOMAIN } from '../config';
import { formatMailboxTimeLeft } from '../utils/mailboxTime';
import ListPagination, { HISTORY_PAGE_SIZE } from './ListPagination';

interface MailboxHistoryListProps {
  activeAddress?: string;
  onSelect: (mailbox: UserMailboxItem) => void;
  onReactivated?: (mailbox: UserMailboxItem) => void;
  onDeleted?: (address: string) => void;
}

const MailboxHistoryList: React.FC<MailboxHistoryListProps> = ({
  activeAddress,
  onSelect,
  onReactivated,
  onDeleted,
}) => {
  const { t } = useTranslation();
  const [mailboxes, setMailboxes] = useState<UserMailboxItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState(DEFAULT_EMAIL_DOMAIN);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE));

  const load = async (pageNum = page, searchTerm = search) => {
    setLoading(true);
    const result = await getUserMailboxes({
      includeExpired: true,
      hasEmails: true,
      page: pageNum,
      limit: HISTORY_PAGE_SIZE,
      search: searchTerm || undefined,
    });
    if (result.success) {
      setMailboxes(result.mailboxes);
      setTotal(result.total);
      setPage(result.page);
    }
    setLoading(false);
    setSelected(new Set());
  };

  useEffect(() => {
    getDefaultEmailDomain().then(setDomain).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    load(page, search);
  }, [page, search]);

  const fmtTime = (ts: number) =>
    new Date(ts > 1e12 ? ts : ts * 1000).toLocaleString();

  const toggleSelect = (address: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(address)) next.delete(address);
      else next.add(address);
      return next;
    });
  };

  const pageAddresses = mailboxes.map((m) => m.address);
  const allPageSelected =
    pageAddresses.length > 0 && pageAddresses.every((address) => selected.has(address));

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        pageAddresses.forEach((address) => next.delete(address));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        pageAddresses.forEach((address) => next.add(address));
        return next;
      });
    }
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(t('history.confirmDeleteMailboxes', { count: selected.size }))) return;
    setBusy(true);
    for (const address of selected) {
      await apiDeleteMailbox(address);
      onDeleted?.(address);
    }
    await load(page, search);
    setBusy(false);
  };

  const handleDeleteOne = async (address: string) => {
    if (!confirm(t('mailbox.confirmDeleteMailbox'))) return;
    setBusy(true);
    await apiDeleteMailbox(address);
    onDeleted?.(address);
    await load(page, search);
    setBusy(false);
  };

  const handleReactivate = async (address: string) => {
    setBusy(true);
    const result = await reactivateUserMailbox(address);
    if (result.success) {
      await load(page, search);
      onReactivated?.(result.mailbox);
    }
    setBusy(false);
  };

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/20 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide">{t('history.mailboxList')}</h2>
        <div className="flex items-center gap-1">
          {mailboxes.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={busy || selected.size === 0}
              className="px-3 py-2 min-h-10 text-xs rounded-md hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40"
            >
              {t('history.deleteSelected')}
            </button>
          )}
          <button
            onClick={() => load(page, search)}
            disabled={busy}
            className="p-2 min-w-10 min-h-10 rounded-md hover:bg-muted transition-colors text-muted-foreground"
            title={t('common.refresh')}
          >
            <i className={`fas fa-sync-alt text-sm ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
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
      ) : mailboxes.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {search ? t('history.noSearchResults') : t('history.noMailboxes')}
        </div>
      ) : (
        <>
          <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto] gap-2 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b bg-muted/10 items-center">
            <input
              type="checkbox"
              checked={allPageSelected}
              onChange={toggleSelectAll}
              className="rounded"
            />
            <span>{t('mailbox.address')}</span>
            <span>{t('mailbox.created')}</span>
            <span className="text-right">{t('mailbox.expiresAt')}</span>
          </div>
          <div className="divide-y">
            {mailboxes.map((mb) => {
              const full = mb.email || `${mb.address}@${domain}`;
              const isActive = activeAddress === mb.address;
              const isExpired = mb.isExpired ?? mb.expiresAt <= Math.floor(Date.now() / 1000);
              return (
                <div
                  key={mb.id}
                  className={`px-4 py-3 grid sm:grid-cols-[auto_1fr_auto_auto] gap-2 items-center text-sm ${
                    isActive ? 'bg-primary/5' : 'hover:bg-muted/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(mb.address)}
                    onChange={() => toggleSelect(mb.address)}
                    className="rounded"
                  />
                  <button
                    onClick={() => onSelect(mb)}
                    className="min-w-0 text-left"
                  >
                    <p className="font-mono truncate">{full}</p>
                    {isExpired && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground mt-0.5 inline-block">
                        {t('mailbox.expired')}
                      </span>
                    )}
                  </button>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {fmtTime(mb.createdAt)}
                  </span>
                  <div className="flex items-center gap-1 sm:justify-end">
                    <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
                      {formatMailboxTimeLeft(mb.expiresAt, t, { later: true })}
                    </span>
                    {isExpired && (
                      <button
                        onClick={() => handleReactivate(mb.address)}
                        disabled={busy}
                        className="text-xs px-2 py-1 min-h-8 rounded-md bg-primary/10 text-primary hover:bg-primary/20"
                        title={t('history.reactivate')}
                      >
                        {t('history.reactivate')}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteOne(mb.address)}
                      disabled={busy}
                      className="text-muted-foreground hover:text-destructive p-2 min-w-8 min-h-8"
                      title={t('common.delete')}
                    >
                      <i className="fas fa-trash-alt text-xs" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <ListPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            disabled={busy || loading}
          />
        </>
      )}
    </div>
  );
};

export default MailboxHistoryList;
