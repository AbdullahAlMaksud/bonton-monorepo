import type en from './locales/en.json';

// Makes `t('some.key')` fully type-checked against the English resource shape.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof en;
    };
  }
}
