import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  TextInput,
  Platform,
  Animated,
  ScrollView,
  Keyboard,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import type { TextInput as RNTextInput } from 'react-native';

import { router, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BUTTON_STYLES } from '@/constants/buttonStyles';
import CompleteDataModal from '@/components/CompleteDataModal';

export default function AuthScreen() {
  const [code, setCode] = useState<string[]>(['', '', '', '']);
  const [timer, setTimer] = useState<number>(555);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [showCompleteDataModal, setShowCompleteDataModal] = useState<boolean>(false);
  const inputRefs = useRef<(RNTextInput | null)[]>([]);
  const backButtonScale = useRef(new Animated.Value(1)).current;
  const verifyButtonScale = useRef(new Animated.Value(1)).current;
  const verifyButtonOpacity = useRef(new Animated.Value(1)).current;
  const resendButtonScale = useRef(new Animated.Value(1)).current;
  const resendButtonOpacity = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const resendButtonRef = useRef<View>(null);
  const hasScrolledRef = useRef<boolean>(false);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        if (hasScrolledRef.current) return;
        
        const screenHeight = Dimensions.get('window').height;
        const keyboardHeight = e.endCoordinates.height;
        
        setTimeout(() => {
          resendButtonRef.current?.measureInWindow((x, y, width, height) => {
            const resendButtonBottom = y + height;
            const targetPosition = screenHeight - keyboardHeight - 20;
            
            if (resendButtonBottom > targetPosition) {
              const scrollAmount = resendButtonBottom - targetPosition;
              scrollViewRef.current?.scrollTo({
                y: scrollAmount,
                animated: Platform.OS === 'ios',
              });
              hasScrolledRef.current = true;
            }
          });
        }, Platform.OS === 'ios' ? 50 : 100);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        scrollViewRef.current?.scrollTo({
          y: 0,
          animated: true,
        });
        hasScrolledRef.current = false;
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  const handleCodeChange = useCallback((text: string, index: number) => {
    const newCode = [...code];
    
    if (text.length === 0) {
      newCode[index] = '';
      setCode(newCode);
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (text.length === 1 && /^[0-9]$/.test(text)) {
      newCode[index] = text;
      setCode(newCode);
      if (index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    } else if (text.length === 4 && /^[0-9]{4}$/.test(text)) {
      const digits = text.split('');
      setCode(digits);
      inputRefs.current[3]?.focus();
    }
  }, [code]);

  const handleBack = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    router.back();
  }, []);

  const handleVerify = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {}
    }
    const fullCode = code.join('');
    console.log('Code entered:', fullCode);
    
    Keyboard.dismiss();
    
    setTimeout(() => {
      setShowCompleteDataModal(true);
      setIsSubmitting(false);
    }, 100);
  }, [code, isSubmitting]);

  const handleResendCode = useCallback(async () => {
    if (isResending) return;
    setIsResending(true);
    
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    setTimer(555);
    setCode(['', '', '', '']);
    console.log('Code resent');
    
    setTimeout(() => {
      setIsResending(false);
    }, 500);
  }, [isResending]);

  const isCodeComplete = code.every(digit => digit !== '');

  const handleCompleteData = useCallback((data: { name: string; gender: string; birthdate: string }) => {
    console.log('User data completed:', data);
    setShowCompleteDataModal(false);
    router.push('/');
  }, []);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <View style={styles.brownBackground} />

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

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
            <View style={styles.container}>
              <View style={styles.contentContainer}>
                <View style={styles.imageContainer}>
                  <Text style={styles.imagePlaceholder}>🎨</Text>
                </View>

                <View style={styles.textContainer}>
                  <Text style={styles.title}>Ingresa el código</Text>
                  <Text style={styles.title}>que llegó a tu correo</Text>
                </View>

                <View style={styles.infoContainer}>
                  <Text style={styles.infoText}>Tiene cuatro dígitos.</Text>
                  <Text style={styles.infoText}>Y una duración de {timer} segundos.</Text>
                  <Text style={styles.infoText}>(No hagas la cuenta, te sobra tiempo)</Text>
                </View>

                <View style={styles.codeContainer}>
                  {code.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => { inputRefs.current[index] = ref; }}
                      style={styles.codeInput}
                      value={digit}
                      onChangeText={(t) => handleCodeChange(t, index)}
                      keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                      maxLength={1}
                      returnKeyType={index === 3 ? 'done' : 'next'}
                      textAlign="center"
                      selectionColor="#fbefd9"
                      placeholder=""
                      importantForAutofill="yes"
                      autoCapitalize="none"
                      autoCorrect={false}
                      textContentType="oneTimeCode"
                      onKeyPress={({ nativeEvent }) => {
                        if (nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
                          inputRefs.current[index - 1]?.focus();
                        }
                      }}
                      testID={`code-input-${index}`}
                    />
                  ))}
                </View>

                <Animated.View
                  style={{
                    width: '100%',
                    transform: [{ scale: verifyButtonScale }],
                    opacity: verifyButtonOpacity,
                  }}
                >
                  <Pressable
                    style={[
                      styles.verifyButton,
                      !isCodeComplete && styles.verifyButtonDisabled,
                    ]}
                    onPress={handleVerify}
                    onPressIn={() => {
                      if (!isCodeComplete || isSubmitting) return;
                      Animated.parallel([
                        Animated.spring(verifyButtonScale, {
                          toValue: 0.95,
                          useNativeDriver: true,
                          speed: 50,
                          bounciness: 0,
                        }),
                        Animated.timing(verifyButtonOpacity, {
                          toValue: 0.6,
                          duration: 150,
                          useNativeDriver: true,
                        }),
                      ]).start();
                    }}
                    onPressOut={() => {
                      if (!isCodeComplete || isSubmitting) return;
                      Animated.parallel([
                        Animated.spring(verifyButtonScale, {
                          toValue: 1,
                          useNativeDriver: true,
                          speed: 50,
                          bounciness: 4,
                        }),
                        Animated.timing(verifyButtonOpacity, {
                          toValue: 1,
                          duration: 150,
                          useNativeDriver: true,
                        }),
                      ]).start();
                    }}
                    disabled={!isCodeComplete || isSubmitting}
                    testID="verify-button"
                  >
                    <Text style={[
                      styles.verifyButtonText,
                      !isCodeComplete && styles.verifyButtonTextDisabled,
                    ]}>
                      Verificar
                    </Text>
                  </Pressable>
                </Animated.View>

                <View ref={resendButtonRef} collapsable={false}>
                  <Animated.View
                    style={{
                      transform: [{ scale: resendButtonScale }],
                      opacity: resendButtonOpacity,
                    }}
                  >
                    <Pressable
                      onPress={handleResendCode}
                      disabled={isResending}
                      onPressIn={() => {
                        if (isResending) return;
                        Animated.parallel([
                          Animated.spring(resendButtonScale, {
                            toValue: 0.9,
                            useNativeDriver: true,
                            speed: 50,
                            bounciness: 0,
                          }),
                          Animated.timing(resendButtonOpacity, {
                            toValue: 0.2,
                            duration: 150,
                            useNativeDriver: true,
                          }),
                        ]).start();
                      }}
                      onPressOut={() => {
                        if (isResending) return;
                        Animated.parallel([
                          Animated.spring(resendButtonScale, {
                            toValue: 1,
                            useNativeDriver: true,
                            speed: 50,
                            bounciness: 4,
                          }),
                          Animated.timing(resendButtonOpacity, {
                            toValue: 1,
                            duration: 150,
                            useNativeDriver: true,
                          }),
                        ]).start();
                      }}
                      style={styles.resendButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      testID="resend-button"
                    >
                      <Text style={styles.resendText}>Reenviar código</Text>
                    </Pressable>
                  </Animated.View>
                </View>
              </View>
            </View>
        </ScrollView>
      </SafeAreaView>
      
      <CompleteDataModal
        visible={showCompleteDataModal}
        onComplete={handleCompleteData}
      />
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

  scrollContent: {
    paddingBottom: 40,
  },
  container: {
    paddingHorizontal: 44,
    minHeight: 1100,
  },
  backButton: {
    marginHorizontal: 44,
    marginTop: 16,
    alignSelf: 'flex-start',
    zIndex: 10,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  imageContainer: {
    marginBottom: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    fontSize: 120,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '600' as const,
    color: '#fbefd9',
    textAlign: 'center',
    letterSpacing: -1.0,
    lineHeight: 34,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  infoText: {
    fontSize: Platform.OS === 'android' ? 16 : 18,
    fontWeight: '400' as const,
    color: '#fbefd9',
    textAlign: 'center',
    lineHeight: Platform.OS === 'android' ? 22 : 24,
    letterSpacing: 0,
    opacity: 0.5,
  },
  codeContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
    width: '100%',
    justifyContent: 'center',
  },
  codeInput: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(251, 239, 217, 0.1)',
    borderRadius: 12,
    color: '#fbefd9',
    fontSize: 32,
    fontWeight: '600' as const,
  },

  verifyButton: {
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
  verifyButtonDisabled: {
    backgroundColor: 'rgba(251, 239, 217, 0.15)',
  },
  verifyButtonText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#000000',
    letterSpacing: -0.3,
  },
  verifyButtonTextDisabled: {
    color: 'rgba(251, 239, 217, 0.35)',
  },
  resendButton: {
    marginTop: 24,
  },
  resendText: {
    fontSize: 20,
    fontWeight: '500' as const,
    color: '#fbefd9',
    textAlign: 'center',
  },
});