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
              confirmation: {
                title: '¿Todo listo?',
                submitButton: 'Enviar sin miedo',
                reviewButton: 'Revisar respuestas',
              },
              success: {
                title: ['Tu hipnosis ', 'está siendo ', 'creada.'],
                subtitle: ['En menos de 1140 minutos (24hs)', 'te enviaré tu hipnosis.'],
                button: 'Volver',
              },
              form: {
                placeholder: 'Escríbelo aquí…',
                validation: {
                  min: 'Mínimo 10 caracteres',
                  max: 'Máximo 500 caracteres',
                },
                buttons: {
                  back: 'Atrás',
                  next: 'Siguiente',
                  submit: 'Enviar',
                },
                alerts: {
                  saveProgress: {
                    title: '¿Deseas responder estas preguntas luego?',
                    no: 'No',
                    yes: 'Sí',
                  },
                  micPermission: {
                    title: 'Permiso denegado',
                    message: 'Necesitamos acceso al micrófono para grabar audio.',
                  },
                  recordingError: {
                    title: 'Error',
                    message: 'No se pudo iniciar la grabación.',
                  },
                  stopRecordingError: {
                    title: 'Error',
                    message: 'No se pudo detener la grabación.',
                  },
                  recordingUriError: {
                    title: 'Error',
                    message: 'No se pudo obtener la grabación.',
                  },
                  transcriptionError: {
                    title: 'Error',
                    message: 'No se pudo transcribir el audio.',
                  },
                  micAccessError: {
                    title: 'Error',
                    message: 'No se pudo acceder al micrófono.',
                  },
                },
              },
              login: {
                title: 'Iniciar sesión',
                emailPlaceholder: 'Correo electrónico',
                enterButton: 'Entrar',
              },
              auth: {
                title1: 'Ingresa el código',
                title2: 'que llegó a tu correo',
                info1: 'Tiene cuatro dígitos.',
                info2: 'Y una duración de {{timer}} segundos.',
                info3: '(No hagas la cuenta, te sobra tiempo)',
                verifyButton: 'Verificar',
                resendButton: 'Reenviar código',
              },
              completeData: {
                title: 'Completa tus datos antes de pedir tu hipnosis',
                infoText: 'Antes de pedir tu primera hipnosis personalizada, y para que sea de verdad personalizada, deja aquí tus datos.',
                preferredName: '¿Cómo quieres que te llamen?',
                preferredNameHelper: 'Escríbelo como se lee, y si tiene algún acento raro, márcalo. (Que no es lo mismo Julián, que Julian, o Yulian).',
                preferredNamePlaceholder: 'Ingresa tu apodo',
                gender: 'Eres...',
                genderOptions: {
                  male: 'Hombre',
                  female: 'Mujer',
                },
                dateOfBirth: 'Fecha de nacimiento',
                datePlaceholder: 'dd/mm/aaaa',
                confirmButton: 'CONFIRMAR',
                nextButton: 'Siguiente',
                ageAlert: {
                  title: '¿Seguro que eres tan joven?',
                  message: 'No me cuadra...\nDale otra vez.',
                  button: 'OK',
                },
              },
              downloadComplete: {
                title: 'Descarga completada',
                message: '"{{hypnosisTitle}}" se ha descargado correctamente y está disponible offline, dentro de la app de Mental.',
                button: 'Aceptar',
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
              confirmation: {
                title: 'All set?',
                submitButton: 'Submit without fear',
                reviewButton: 'Review answers',
              },
              success: {
                title: ['Your hypnosis ', 'is being ', 'created.'],
                subtitle: ['In less than 1140 minutes (24hrs)', 'I will send you your hypnosis.'],
                button: 'Go back',
              },
              form: {
                placeholder: 'Write it here…',
                validation: {
                  min: 'Minimum 10 characters',
                  max: 'Maximum 500 characters',
                },
                buttons: {
                  back: 'Back',
                  next: 'Next',
                  submit: 'Submit',
                },
                alerts: {
                  saveProgress: {
                    title: 'Do you want to answer these questions later?',
                    no: 'No',
                    yes: 'Yes',
                  },
                  micPermission: {
                    title: 'Permission denied',
                    message: 'We need access to the microphone to record audio.',
                  },
                  recordingError: {
                    title: 'Error',
                    message: 'Could not start recording.',
                  },
                  stopRecordingError: {
                    title: 'Error',
                    message: 'Could not stop recording.',
                  },
                  recordingUriError: {
                    title: 'Error',
                    message: 'Could not get the recording.',
                  },
                  transcriptionError: {
                    title: 'Error',
                    message: 'Could not transcribe the audio.',
                  },
                  micAccessError: {
                    title: 'Error',
                    message: 'Could not access the microphone.',
                  },
                },
              },
              login: {
                title: 'Log in',
                emailPlaceholder: 'Email address',
                enterButton: 'Enter',
              },
              auth: {
                title1: 'Enter the code',
                title2: 'that was sent to your email',
                info1: 'It has four digits.',
                info2: 'And a duration of {{timer}} seconds.',
                info3: '(Don\'t do the math, you have plenty of time)',
                verifyButton: 'Verify',
                resendButton: 'Resend code',
              },
              completeData: {
                title: 'Complete your information before requesting your hypnosis',
                infoText: 'Before requesting your first personalized hypnosis, and for it to be truly personalized, please provide your information here.',
                preferredName: 'What do you want to be called?',
                preferredNameHelper: 'Write it as it sounds, and if it has an unusual accent, mark it. (Julián is not the same as Julian, or Yulian).',
                preferredNamePlaceholder: 'Enter your nickname',
                gender: 'You are...',
                genderOptions: {
                  male: 'Male',
                  female: 'Female',
                },
                dateOfBirth: 'Date of birth',
                datePlaceholder: 'mm/dd/yyyy',
                confirmButton: 'CONFIRM',
                nextButton: 'Next',
                ageAlert: {
                  title: 'Are you sure you\'re that young?',
                  message: 'Doesn\'t add up...\nTry again.',
                  button: 'OK',
                },
              },
              downloadComplete: {
                title: 'Download complete',
                message: '"{{hypnosisTitle}}" has been successfully downloaded and is available offline within the Mental app.',
                button: 'Accept',
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
