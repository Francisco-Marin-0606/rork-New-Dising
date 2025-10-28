import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const initI18n = async () => {
  if (!i18n.isInitialized) {
    await i18n
      .use(initReactI18next)
      .init({
        resources: {
          es: {
            translation: {
              settings: {
                title: 'Mi cuenta',
                subscription: {
                  label: 'Suscripción',
                  type: 'Mensual',
                  status: {
                    active: 'ACTIVA',
                    pending: 'PAGO PENDIENTE',
                    cancelled: 'SUSCRIBIRSE',
                  },
                },
                menu: {
                  manageSubscription: 'Gestionar suscripción',
                  editProfile: 'Editar mi perfil',
                  faq: 'Preguntas frecuentes',
                  contact: 'Contacto',
                  language: 'Idioma',
                },
                logout: 'Cerrar sesión',
                version: 'Versión de la app',
                footer: {
                  terms: 'Términos de uso',
                  privacy: 'Políticas de privacidad',
                },
              },
            },
          },
          en: {
            translation: {
              settings: {
                title: 'My Account',
                subscription: {
                  label: 'Subscription',
                  type: 'Monthly',
                  status: {
                    active: 'ACTIVE',
                    pending: 'PAYMENT PENDING',
                    cancelled: 'SUBSCRIBE',
                  },
                },
                menu: {
                  manageSubscription: 'Manage subscription',
                  editProfile: 'Edit my profile',
                  faq: 'Frequently asked questions',
                  contact: 'Contact',
                  language: 'Language',
                },
                logout: 'Log out',
                version: 'App version',
                footer: {
                  terms: 'Terms of use',
                  privacy: 'Privacy policy',
                },
              },
            },
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
