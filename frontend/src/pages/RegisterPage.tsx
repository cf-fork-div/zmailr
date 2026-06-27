import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import ThemeSwitcher from '../components/ThemeSwitcher';
import TurnstileWidget from '../components/TurnstileWidget';
import RegistrationEmailDomainPicker from '../components/RegistrationEmailDomainPicker';
import { getRegistrationConfig, type RegistrationDomainGroup } from '../config';
import { authRegisterResend, authRegisterSendCode, authRegisterVerify } from '../utils/api';

const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, refresh } = useAuth();
  const navigate = useNavigate();

  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);
  const [domainGroups, setDomainGroups] = useState<RegistrationDomainGroup[]>([]);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState<string | null>(null);
  const [turnstileRequired, setTurnstileRequired] = useState(false);
  const [emailPrefix, setEmailPrefix] = useState('');
  const [emailDomain, setEmailDomain] = useState('qq.com');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [deliveryHint, setDeliveryHint] = useState('');
  const [sentForKey, setSentForKey] = useState<string | null>(null);
  const [sentEmail, setSentEmail] = useState('');
  const [error, setError] = useState('');
  const [successHint, setSuccessHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState('');

  const credentialsKey = useMemo(
    () => `${emailPrefix.trim().toLowerCase()}@${emailDomain}:${password}`,
    [emailPrefix, emailDomain, password]
  );

  const codeSentForCurrentCredentials = sentForKey === credentialsKey && Boolean(sentEmail);

  useEffect(() => {
    getRegistrationConfig().then((cfg) => {
      setRegistrationOpen(cfg.enabled);
      setDomainGroups(cfg.domainGroups);
      setTurnstileRequired(cfg.turnstile.enabled);
      setTurnstileSiteKey(cfg.turnstile.siteKey);
      const defaultDomain =
        cfg.allowedDomains.find((d) => d === 'qq.com') ?? cfg.allowedDomains[0] ?? 'qq.com';
      setEmailDomain(defaultDomain);
    });
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard/usage" replace />;
  }

  if (registrationOpen === false) {
    return <Navigate to="/login" replace />;
  }

  const validateCredentials = (): boolean => {
    if (!emailPrefix.trim()) {
      setError(t('auth.registerPrefixRequired'));
      return false;
    }
    if (password !== confirmPassword) {
      setError(t('auth.registerPasswordMismatch'));
      return false;
    }
    if (turnstileRequired && !turnstileToken) {
      setError(t('auth.turnstileRequired'));
      return false;
    }
    return true;
  };

  const sendCode = async (): Promise<{ ok: true; email: string } | { ok: false }> => {
    const result = await authRegisterSendCode({
      localPart: emailPrefix.trim(),
      domain: emailDomain,
      password,
      turnstileToken: turnstileRequired ? turnstileToken : undefined,
    });
    if (!result.success) {
      setError(result.error || t('auth.registerSendFailed'));
      setSuccessHint('');
      return { ok: false };
    }
    setSentEmail(result.email);
    setSentForKey(credentialsKey);
    setDeliveryHint(result.deliveryHint || t('auth.registerDeliveryHint'));
    setResendCooldown(60);
    return { ok: true, email: result.email };
  };

  const handleSendCode = async () => {
    if (sendingCode || loading || resendCooldown > 0) return;
    setError('');
    setSuccessHint('');
    if (!validateCredentials()) return;

    setSendingCode(true);
    if (codeSentForCurrentCredentials) {
      const result = await authRegisterResend(sentEmail, turnstileRequired ? turnstileToken : undefined);
      setSendingCode(false);
      if (result.success) {
        setResendCooldown(60);
        if (result.deliveryHint) setDeliveryHint(result.deliveryHint);
        setSuccessHint(t('auth.registerCodeSentHint'));
        return;
      }
      setError(result.error || t('auth.registerSendFailed'));
      return;
    }

    const sent = await sendCode();
    setSendingCode(false);
    if (sent.ok) {
      setSuccessHint(t('auth.registerCodeSentHint'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessHint('');
    if (!validateCredentials()) return;

    if (code.trim().length < 6) {
      setError(t('auth.registerEnterCode'));
      return;
    }

    if (!codeSentForCurrentCredentials) {
      setError(t('auth.registerSendCodeFirst'));
      return;
    }

    setLoading(true);
    const result = await authRegisterVerify(sentEmail, code.trim());
    setLoading(false);
    if (result.success) {
      await refresh();
      navigate('/dashboard/usage');
      return;
    }
    setError(result.error || t('auth.registerVerifyFailed'));
  };

  const handlePrefixChange = (value: string) => {
    setEmailPrefix(value.replace(/@.*$/, '').slice(0, 64));
  };

  const sendCodeDisabled =
    sendingCode || loading || resendCooldown > 0 || (turnstileRequired && !turnstileToken);

  const sendCodeLabel =
    resendCooldown > 0
      ? t('auth.registerResendIn', { seconds: resendCooldown })
      : codeSentForCurrentCredentials
        ? t('auth.registerResend')
        : t('auth.registerSendCode');

  return (
    <div className="login-shell relative min-h-screen flex flex-col">
      <div className="absolute top-4 right-4 z-10">
        <ThemeSwitcher />
      </div>

      <div className="relative flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-md rounded-2xl border border-sky-200/70 dark:border-border bg-card shadow-xl shadow-sky-500/10 dark:shadow-black/20 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center">
              <i className="fas fa-user-plus text-sm text-sky-600 dark:text-sky-400" />
            </span>
            <span className="font-semibold">{t('auth.register')}</span>
          </div>

          <h1 className="text-xl font-bold">{t('auth.registerTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-6">{t('auth.registerHint')}</p>

          {error && (
            <p className="text-sm rounded-md border px-3 py-2 mb-4 text-destructive border-destructive/30 bg-destructive/5">
              {error}
            </p>
          )}

          {successHint && (
            <p className="text-sm rounded-md border px-3 py-2 mb-4 border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100">
              {successHint}
            </p>
          )}

          {deliveryHint && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-950 dark:text-amber-100 mb-4">
              <i className="fas fa-inbox mr-2" aria-hidden />
              {deliveryHint}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('auth.registerEmail')}</label>
              <div className="flex items-stretch border rounded-lg bg-background overflow-visible focus-within:ring-2 focus-within:ring-sky-500/40">
                <input
                  type="text"
                  value={emailPrefix}
                  onChange={(e) => handlePrefixChange(e.target.value)}
                  placeholder={t('auth.registerEmailPrefixPlaceholder')}
                  className="flex-1 min-w-0 px-3 py-2.5 min-h-10 bg-transparent font-mono focus:outline-none rounded-l-lg"
                  autoComplete="username"
                  inputMode="email"
                  required
                />
                <span className="flex items-center px-2 sm:px-3 border-l bg-muted/40 text-sm shrink-0 rounded-r-lg">
                  @
                  <RegistrationEmailDomainPicker
                    value={emailDomain}
                    onChange={setEmailDomain}
                    domainGroups={domainGroups}
                    disabled={loading || sendingCode || domainGroups.length === 0}
                    className="ml-0.5"
                  />
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('auth.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 min-h-10 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('auth.registerConfirmPassword')}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 min-h-10 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            {turnstileRequired && turnstileSiteKey && (
              <TurnstileWidget siteKey={turnstileSiteKey} onTokenChange={setTurnstileToken} />
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('auth.registerCode')}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="flex-1 min-w-0 px-3 py-2.5 min-h-10 border rounded-lg bg-background font-mono tracking-widest text-center text-lg focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  autoComplete="one-time-code"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sendCodeDisabled}
                  className="shrink-0 px-4 py-2.5 min-h-10 rounded-lg font-medium text-sm border border-sky-500/40 text-sky-700 dark:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {sendingCode ? t('common.loading') : sendCodeLabel}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('auth.registerCodeFieldHint')}</p>
            </div>
            <button
              type="submit"
              disabled={
                loading ||
                sendingCode ||
                registrationOpen === null ||
                (turnstileRequired && !turnstileToken)
              }
              className="w-full py-2.5 min-h-10 rounded-lg font-medium text-white bg-sky-600 hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400 disabled:opacity-50 shadow-md shadow-sky-600/20 transition-colors"
            >
              {loading ? t('common.loading') : t('auth.registerSubmit')}
            </button>
          </form>

          <p className="text-sm text-muted-foreground mt-6 text-center">
            {t('auth.registerHasAccount')}{' '}
            <Link to="/login" className="text-sky-600 dark:text-sky-400 hover:underline font-medium">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
