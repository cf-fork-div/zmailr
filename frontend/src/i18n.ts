import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from '../i18n/locales/zh-CN.json';

const LOCALE = 'zh-CN';

let initPromise: Promise<typeof i18n> | null = null;

export function initI18n(): Promise<typeof i18n> {
  if (!initPromise) {
    initPromise = i18n
      .use(initReactI18next)
      .init({
        resources: {
          [LOCALE]: { translation: zhCN },
        },
        lng: LOCALE,
        fallbackLng: LOCALE,
        supportedLngs: [LOCALE],
        interpolation: {
          escapeValue: false,
        },
      })
      .then(() => i18n);
  }
  return initPromise;
}

export default i18n;
