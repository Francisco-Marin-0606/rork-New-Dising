import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const initI18n = async () => {
  if (!i18n.isInitialized) {
    await i18n
      .use(initReactI18next)
      .init({
        resources: {
          es: {
            translation: {},
          },
          en: {
            translation: {},
          },
        },
        lng: 'es',
        fallbackLng: 'es',
        interpolation: {
          escapeValue: false,
        },
        react: {
          useSuspense: false,
        },
      });
  }
};

initI18n().catch((err) => console.log('i18n initialization error:', err));

export default i18n;
