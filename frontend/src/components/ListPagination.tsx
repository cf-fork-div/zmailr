import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const HISTORY_PAGE_SIZE = 10;

export function useClientPagination<T>(items: T[], pageSize = HISTORY_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const pageItems = items.slice((page - 1) * pageSize, page * pageSize);
  const resetPage = () => setPage(1);

  return { page, setPage, totalPages, pageItems, resetPage };
}

interface ListPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

const ListPagination: React.FC<ListPaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [jumpInput, setJumpInput] = useState('');

  if (totalPages <= 1) return null;

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(jumpInput, 10);
    if (!Number.isNaN(target) && target >= 1 && target <= totalPages) {
      onPageChange(target);
      setJumpInput('');
    }
  };

  return (
    <div className="px-4 py-3 border-t bg-muted/10 flex flex-wrap items-center justify-between gap-2">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={disabled || page <= 1}
        className="px-3 py-2 min-h-10 text-xs rounded-md hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40"
      >
        {t('history.prevPage')}
      </button>
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <span className="text-xs text-muted-foreground tabular-nums">
          {t('history.pageInfo', { current: page, total: totalPages })}
        </span>
        <form onSubmit={handleJump} className="flex items-center gap-1">
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            placeholder={t('history.jumpToPage')}
            disabled={disabled}
            className="w-14 px-2 py-1.5 min-h-8 text-xs rounded-md border bg-background tabular-nums"
            aria-label={t('history.jumpToPage')}
          />
          <button
            type="submit"
            disabled={disabled || !jumpInput}
            className="px-2 py-1.5 min-h-8 text-xs rounded-md hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40"
          >
            {t('history.goToPage')}
          </button>
        </form>
      </div>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={disabled || page >= totalPages}
        className="px-3 py-2 min-h-10 text-xs rounded-md hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40"
      >
        {t('history.nextPage')}
      </button>
    </div>
  );
};

export default ListPagination;
