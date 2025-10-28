import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  Platform,
  Animated,
  Image,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { router, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BUTTON_STYLES } from '@/constants/buttonStyles';
import { useTranslation } from 'react-i18next';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const backButtonScale = useRef(new Animated.Value(1)).current;
  const enterButtonScale = useRef(new Animated.Value(1)).current;
  const enterButtonOpacity = useRef(new Animated.Value(1)).current;
  const formTranslateY = useRef(new Animated.Value(0)).current;
  const controlsRef = useRef<View>(null);
  const hasShiftedRef = useRef<boolean>(false);

  const validateEmail = (text: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const sanitizeEmail = (text: string): string => {
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{FE00}-\u{FE0F}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu;
    return text.replace(emojiRegex, '').replace(/\s+/g, '').replace(/\n/g, '');
  };

  const handleEmailChange = useCallback((text: string) => {
    const sanitized = sanitizeEmail(text);
    setEmail(sanitized);
  }, []);

  const handleBack = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  }, []);

  const handleEnter = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {}
    }
    console.log('Email entered:', email);
    router.push('/auth');
    
    setTimeout(() => {
      setIsSubmitting(false);
    }, 1000);
  }, [email, isSubmitting]);

  const isEmailValid = validateEmail(email);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        if (!controlsRef.current) return;
        const screenHeight = Dimensions.get('window').height;
        const keyboardTop = screenHeight - e.endCoordinates.height;
        setTimeout(() => {
          controlsRef.current?.measureInWindow((x, y, width, height) => {
            const bottom = y + height;
            const overlap = bottom + 12 - keyboardTop;
            if (overlap > 0) {
              hasShiftedRef.current = true;
              Animated.timing(formTranslateY, {
                toValue: -overlap,
                duration: Platform.OS === 'ios' ? 220 : 0,
                useNativeDriver: true,
              }).start();
            }
          });
        }, Platform.OS === 'ios' ? 50 : 100);
      }
    );

    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        if (!hasShiftedRef.current) return;
        hasShiftedRef.current = false;
        Animated.timing(formTranslateY, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? 220 : 0,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      show.remove();
      hide.remove();
    };
  }, [formTranslateY]);





  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <View style={styles.brownBackground} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <Pressable
          style={styles.backButton}
          onPress={handleBack}
          onPressIn={() => {
            Animated.spring(backButtonScale, {
              toValue: 0.85,
              useNativeDriver: true,
              speed: 50,
              bounciness: 0,
            }).start();
          }}
          onPressOut={() => {
            Animated.spring(backButtonScale, {
              toValue: 1,
              useNativeDriver: true,
              speed: 50,
              bounciness: 0,
            }).start();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID="back-button"
        >
          <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
            <ChevronLeft color="#fbefd9" size={31.5} strokeWidth={1.5} />
          </Animated.View>
        </Pressable>

        <View style={styles.container}>

          <View style={styles.logoContainer}>
            <Image
              source={{ uri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/app-general/LogoMentalCrema.png' }}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <KeyboardAvoidingView
            style={styles.formAvoider}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
          <Animated.View style={[styles.formContainer, { transform: [{ translateY: formTranslateY }] }]} testID="login-animated-container">
            <Text style={styles.title}>{t('login.title')}</Text>

            <View ref={controlsRef} collapsable={false} style={styles.controlsWrap}>
              <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={handleEmailChange}
                placeholder={t('login.emailPlaceholder')}
                placeholderTextColor="rgba(251, 239, 217, 0.4)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="done"
                testID="email-input"
              />
            </View>

            <Animated.View
              style={{
                width: '100%',
                transform: [{ scale: enterButtonScale }],
                opacity: enterButtonOpacity,
              }}
            >
              <Pressable
                style={[
                  styles.enterButton,
                  !isEmailValid && styles.enterButtonDisabled,
                ]}
                onPress={handleEnter}
                onPressIn={() => {
                  if (!isEmailValid || isSubmitting) return;
                  Animated.parallel([
                    Animated.spring(enterButtonScale, {
                      toValue: 0.95,
                      useNativeDriver: true,
                      speed: 50,
                      bounciness: 0,
                    }),
                    Animated.timing(enterButtonOpacity, {
                      toValue: 0.6,
                      duration: 150,
                      useNativeDriver: true,
                    }),
                  ]).start();
                }}
                onPressOut={() => {
                  if (!isEmailValid || isSubmitting) return;
                  Animated.parallel([
                    Animated.spring(enterButtonScale, {
                      toValue: 1,
                      useNativeDriver: true,
                      speed: 50,
                      bounciness: 4,
                    }),
                    Animated.timing(enterButtonOpacity, {
                      toValue: 1,
                      duration: 150,
                      useNativeDriver: true,
                    }),
                  ]).start();
                }}
                disabled={!isEmailValid || isSubmitting}
                testID="enter-button"
              >
                <Text style={[
                  styles.enterButtonText,
                  !isEmailValid && styles.enterButtonTextDisabled,
                ]}>
                  {t('login.enterButton')}
                </Text>
              </Pressable>
            </Animated.View>
            </View>
          </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#170501',
  },
  brownBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#170501',
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    paddingHorizontal: 44,
  },
  backButton: {
    marginHorizontal: 44,
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  logo: {
    width: 120,
    height: 120,
  },
  formAvoider: {
    flex: 1,
    width: '100%',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 70,
    minHeight: 400,
  },
  title: {
    fontSize: 41.31,
    fontWeight: '600' as const,
    color: '#fbefd9',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: -1,
  },
  controlsWrap: {
    width: '100%',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 10,
  },
  input: {
    ...BUTTON_STYLES.primaryButton,
    backgroundColor: 'rgba(251, 239, 217, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(251, 239, 217, 0.15)',
    fontSize: 17,
    fontWeight: '400' as const,
    color: '#fbefd9',
    letterSpacing: 0,
    textAlign: 'left',
    paddingHorizontal: 24,
  },
  enterButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fbefd9',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    ...BUTTON_STYLES.elevatedShadow,
  },
  enterButtonDisabled: {
    backgroundColor: Platform.OS === 'android' ? '#3d2f28' : 'rgba(251, 239, 217, 0.15)',
  },
  enterButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#000000',
    letterSpacing: -0.3,
  },
  enterButtonTextDisabled: {
    color: '#170501',
  },
});
