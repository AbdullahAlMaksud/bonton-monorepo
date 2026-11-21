import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import type { LangCode } from '@/shared/types/bonton';

import bn from './locales/bn.json';
import en from './locales/en.json';

export const DEFAULT_LANGUAGE: LangCode = 'bn';

// Resources are bundled, so init completes synchronously (initAsync: false).
void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    bn: { translation: bn },
  },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  initAsync: false,
});

export default i18n;
