import { Language } from '@/contexts/LanguageContext';

export interface Translations {
  settings: {
    title: string;
    subscription: string;
    subscriptionType: string;
    statusActive: string;
    statusPending: string;
    statusSubscribe: string;
    manageSubscription: string;
    editProfile: string;
    faq: string;
    contact: string;
    logout: string;
    version: string;
    termsOfUse: string;
    privacyPolicy: string;
    language: string;
    changeLanguage: string;
  };
}

const es: Translations = {
  settings: {
    title: 'Mi cuenta',
    subscription: 'Suscripción',
    subscriptionType: 'Mensual',
    statusActive: 'ACTIVA',
    statusPending: 'PAGO PENDIENTE',
    statusSubscribe: 'SUSCRIBIRSE',
    manageSubscription: 'Gestionar suscripción',
    editProfile: 'Editar mi perfil',
    faq: 'Preguntas frecuentes',
    contact: 'Contacto',
    logout: 'Cerrar sesión',
    version: 'Versión de la app',
    termsOfUse: 'Términos de uso',
    privacyPolicy: 'Políticas de privacidad',
    language: 'Idioma',
    changeLanguage: 'Cambiar idioma',
  },
};

const en: Translations = {
  settings: {
    title: 'My Account',
    subscription: 'Subscription',
    subscriptionType: 'Monthly',
    statusActive: 'ACTIVE',
    statusPending: 'PAYMENT PENDING',
    statusSubscribe: 'SUBSCRIBE',
    manageSubscription: 'Manage subscription',
    editProfile: 'Edit my profile',
    faq: 'Frequently asked questions',
    contact: 'Contact',
    logout: 'Sign out',
    version: 'App version',
    termsOfUse: 'Terms of use',
    privacyPolicy: 'Privacy policy',
    language: 'Language',
    changeLanguage: 'Change language',
  },
};

export const translations: Record<Language, Translations> = {
  es,
  en,
};

export const getTranslations = (language: Language): Translations => {
  return translations[language];
};
