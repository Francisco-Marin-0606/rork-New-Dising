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
              manageSubscription: {
                title: 'Gestionar Suscripción',
                subscription: 'Suscripción:',
                currentPlan: 'Plan actual:',
                nextPayment: 'Próximo pago:',
                monthly: 'Mensual',
                cancelButton: 'Cancelar suscripción',
                subscribeButton: 'Suscribirse',
                cancelledMessage: 'Ya has cancelado tu suscripción.\nSeguirá activa hasta que finalice tu periodo de pago.',
                pendingMessage: 'Tu pago está pendiente. Intentamos realizar el cobro, pero no pasó. Lo volveremos a intentar, asegúrate de tener saldo suficiente.',
                confirmCancel: {
                  title: '¿Estás seguro que quieres cancelar tu suscripción a Mental?',
                  subtitle: 'El siguiente click abre una línea de tiempo en la que no podrás pedir nuevas hipnosis.\n\nY para escuchar las anteriores, tendrás que renovar tu suscripción.',
                  confirmButton: 'Sí, quiero cancelar',
                  cancelButton: 'No, deseo continuar',
                },
              },
              editProfile: {
                title: 'Editar mi perfil',
                firstName: 'Nombre',
                lastName: 'Apellido',
                preferredName: '¿Cómo quieres que te llamen?',
                preferredNameHelper: 'Escríbelo como se lee, y si tiene algún acento raro, márcalo. (Que no es lo mismo Julián, que Julian, o Yulian).',
                email: 'Tu correo electrónico',
                dateOfBirth: 'Fecha de nacimiento',
                gender: 'Género',
                placeholder: 'Escríbelo aquí…',
                saveButton: 'Listo',
                requiredField: 'Este campo es obligatorio',
              },
              errorModal: {
                title: 'Fallo en la matrix',
                subtitle: 'Es broma, algo falló en el sistema.\n\nPero si pasó, es por algo. Intenta de nuevo.',
                button: 'Volver',
              },
              yaDisponible: {
                title: 'Ya puedes pedir tu siguiente hipnosis',
                subtitle: 'Vuelvo otra vez: para preguntarte en quién te quieres convertir.\n\nNo hay forma de hacerlo mal.\n\nMira muy adentro y llega a lo que realmente quieres.',
                primaryButton: 'Pedir mi hipnosis ahora',
                secondaryButton: 'Pedir más tarde',
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
              manageSubscription: {
                title: 'Manage Subscription',
                subscription: 'Subscription:',
                currentPlan: 'Current plan:',
                nextPayment: 'Next payment:',
                monthly: 'Monthly',
                cancelButton: 'Cancel subscription',
                subscribeButton: 'Subscribe',
                cancelledMessage: 'You have already cancelled your subscription.\nIt will remain active until your billing period ends.',
                pendingMessage: 'Your payment is pending. We attempted to process the charge, but it failed. We will try again, please ensure you have sufficient balance.',
                confirmCancel: {
                  title: 'Are you sure you want to cancel your subscription to Mental?',
                  subtitle: 'The next click opens a timeline where you won\'t be able to request new hypnosis.\n\nAnd to listen to previous ones, you will have to renew your subscription.',
                  confirmButton: 'Yes, I want to cancel',
                  cancelButton: 'No, continue',
                },
              },
              editProfile: {
                title: 'Edit my profile',
                firstName: 'First name',
                lastName: 'Last name',
                preferredName: 'What do you want to be called?',
                preferredNameHelper: 'Write it as it sounds, and if it has an unusual accent, mark it. (Julián is not the same as Julian, or Yulian).',
                email: 'Your email',
                dateOfBirth: 'Date of birth',
                gender: 'Gender',
                placeholder: 'Write it here…',
                saveButton: 'Done',
                requiredField: 'This field is required',
              },
              errorModal: {
                title: 'Matrix failure',
                subtitle: 'Just kidding, something failed in the system.\n\nBut if it happened, it\'s for a reason. Try again.',
                button: 'Go back',
              },
              yaDisponible: {
                title: 'You can now request your next hypnosis',
                subtitle: 'I\'m back again: to ask you who you want to become.\n\nThere\'s no way to do it wrong.\n\nLook deep inside and reach what you really want.',
                primaryButton: 'Request my hypnosis now',
                secondaryButton: 'Request later',
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
