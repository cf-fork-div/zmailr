/** Landing page capability grid (9 items). */
export const PRODUCT_FEATURES = [
  { icon: 'fas fa-envelope', titleKey: 'landing.primitiveReceiveTitle', descKey: 'landing.primitiveReceiveDesc' },
  { icon: 'fas fa-clock', titleKey: 'landing.primitivePollTitle', descKey: 'landing.primitivePollDesc' },
  { icon: 'fas fa-robot', titleKey: 'landing.primitiveAgentTitle', descKey: 'landing.primitiveAgentDesc' },
  { icon: 'fas fa-inbox', titleKey: 'landing.consoleInbox', descKey: 'landing.consoleInboxDesc' },
  { icon: 'fas fa-paper-plane', titleKey: 'landing.consoleOutbox', descKey: 'landing.consoleOutboxDesc' },
  { icon: 'fas fa-filter', titleKey: 'landing.consoleRules', descKey: 'landing.consoleRulesDesc' },
  { icon: 'fas fa-key', titleKey: 'landing.consoleApiKeys', descKey: 'landing.consoleApiKeysDesc' },
  { icon: 'fas fa-terminal', titleKey: 'landing.consoleDebug', descKey: 'landing.consoleDebugDesc' },
  { icon: 'fas fa-chart-bar', titleKey: 'landing.consoleUsage', descKey: 'landing.consoleUsageDesc' },
] as const;

/** Login page left panel — concise highlights (original 5 + MCP). */
export const LOGIN_PAGE_FEATURES = [
  { icon: 'fas fa-inbox', titleKey: 'auth.loginFeatureInbox', descKey: 'auth.loginFeatureInboxDesc' },
  { icon: 'fas fa-code', titleKey: 'auth.loginFeatureApi', descKey: 'auth.loginFeatureApiDesc' },
  { icon: 'fas fa-robot', titleKey: 'auth.loginFeatureMcp', descKey: 'auth.loginFeatureMcpDesc' },
  { icon: 'fas fa-filter', titleKey: 'auth.loginFeatureExtract', descKey: 'auth.loginFeatureExtractDesc' },
  { icon: 'fas fa-clock', titleKey: 'auth.loginFeatureExpire', descKey: 'auth.loginFeatureExpireDesc' },
  { icon: 'fas fa-paper-plane', titleKey: 'auth.loginFeatureSend', descKey: 'auth.loginFeatureSendDesc' },
] as const;
