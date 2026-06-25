import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createUserToken, deleteUserToken, UserTokenItem } from '../utils/api';

const ALL_SCOPES = ['lease', 'mail', 'send'] as const;

const SCOPE_I18N: Record<(typeof ALL_SCOPES)[number], { label: string; desc: string }> = {
  lease: { label: 'tokens.scopeLease', desc: 'tokens.scopeLeaseDesc' },
  mail: { label: 'tokens.scopeMail', desc: 'tokens.scopeMailDesc' },
  send: { label: 'tokens.scopeSend', desc: 'tokens.scopeSendDesc' },
};

interface ApiTokenManagerProps {
  compact?: boolean;
}

const ApiTokenManager: React.FC<ApiTokenManagerProps> = ({ compact = false }) => {
  const { t } = useTranslation();
  const [tokens, setTokens] = useState<UserTokenItem[]>([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenDays, setNewTokenDays] = useState(30);
  const [newTokenScopes, setNewTokenScopes] = useState<string[]>([...ALL_SCOPES]);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadTokens = async () => {
    setTokensLoading(true);
    try {
      const res = await fetch('/api/user/tokens', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setTokens(data.tokens);
    } finally {
      setTokensLoading(false);
    }
  };

  React.useEffect(() => {
    loadTokens();
  }, []);

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = await createUserToken({
      name: newTokenName || undefined,
      expiresInDays: newTokenDays,
      scopes: newTokenScopes,
    });
    if (result.success && result.token) {
      setCreatedToken(result.token.token);
      setShowCreate(false);
      setNewTokenName('');
      loadTokens();
    } else {
      setError(result.error || t('auth.tokenCreateFailed'));
    }
  };

  const handleDeleteToken = async (id: number) => {
    if (!confirm(t('auth.confirmDeleteToken'))) return;
    await deleteUserToken(id);
    loadTokens();
  };

  const toggleScope = (scope: string) => {
    setNewTokenScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const fmtTime = (ts: number) => new Date(ts > 1e12 ? ts : ts * 1000).toLocaleString();

  return (
    <div className="space-y-4">
      {createdToken && (
        <div className="border border-primary/50 rounded-lg p-4 bg-primary/5">
          <p className="text-sm font-medium mb-2">{t('auth.tokenCreated')}</p>
          <code className="block text-xs break-all bg-muted p-2 rounded">{createdToken}</code>
          <p className="text-xs text-muted-foreground mt-2">{t('auth.tokenCopyWarning')}</p>
          <button onClick={() => setCreatedToken(null)} className="text-xs mt-2 text-primary">
            {t('common.close')}
          </button>
        </div>
      )}

      <div className={compact ? 'space-y-3' : 'border rounded-lg p-4 bg-card'}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={compact ? 'text-sm font-semibold' : 'font-semibold'}>{t('auth.apiTokens')}</h2>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            {t('auth.createToken')}
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreateToken} className="mb-4 p-3 border rounded-md space-y-3">
            {error && <p className="text-destructive text-sm">{error}</p>}
            <input
              type="text"
              placeholder={t('auth.tokenName')}
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm"
            />
            <div>
              <label htmlFor="token-expires-days" className="text-sm font-medium block mb-1">
                {t('tokens.expiresDaysLabel')}
              </label>
              <div className="relative">
                <input
                  id="token-expires-days"
                  type="number"
                  min={1}
                  max={365}
                  value={newTokenDays}
                  onChange={(e) => setNewTokenDays(parseInt(e.target.value) || 30)}
                  className="w-full px-3 py-2 pr-10 border rounded-md bg-background text-sm"
                  placeholder={t('tokens.expiresDaysPlaceholder')}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                  {t('tokens.daysUnit')}
                </span>
              </div>
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{t('tokens.scopesLabel')}</legend>
              {ALL_SCOPES.map((s) => (
                <label
                  key={s}
                  className="flex items-start gap-2 text-sm cursor-pointer"
                  title={t(SCOPE_I18N[s].desc)}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={newTokenScopes.includes(s)}
                    onChange={() => toggleScope(s)}
                  />
                  <span>
                    <span className="font-medium">{t(SCOPE_I18N[s].label)}</span>
                    <span className="block text-xs text-muted-foreground">{t(SCOPE_I18N[s].desc)}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <button type="submit" className="text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded-md">
              {t('common.create')}
            </button>
          </form>
        )}

        {tokensLoading ? (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        ) : tokens.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('auth.noTokens')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-muted-foreground border-b">
                  <th className="pb-2 pr-4 font-medium">{t('tokens.nameLabel')}</th>
                  <th className="pb-2 pr-4 font-medium">{t('tokens.permissionsLabel')}</th>
                  <th className="pb-2 pr-4 font-medium">{t('tokens.expiresAtLabel')}</th>
                  <th className="pb-2 w-16" />
                </tr>
              </thead>
              <tbody>
                {tokens.map((tok) => (
                  <tr key={tok.id} className="border-b last:border-b-0">
                    <td className="py-2 pr-4 font-medium">{tok.name || `#${tok.id}`}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {tok.scopes
                        .map((s) =>
                          s in SCOPE_I18N ? t(SCOPE_I18N[s as (typeof ALL_SCOPES)[number]].label) : s
                        )
                        .join(', ')}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">
                      {fmtTime(tok.expiresAt)}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => handleDeleteToken(tok.id)}
                        className="text-destructive hover:underline text-xs"
                      >
                        {t('common.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiTokenManager;
