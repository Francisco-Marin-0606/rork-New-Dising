import React, { useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BUTTON_STYLES } from '@/constants/buttonStyles';

const EPS = 0.0001;
const TITLE_CHARS = ['¿', 'T', 'o', 'd', 'o', ' ', 'l', 'i', 's', 't', 'o', '?'];

export default function ConfirmationScreen() {
  const insets = useSafeAreaInsets();
  const submitButtonScale = useRef(new Animated.Value(1)).current;
  const submitButtonOpacity = useRef(new Animated.Value(1)).current;
  const reviewButtonScale = useRef(new Animated.Value(1)).current;
  const reviewButtonOpacity = useRef(new Animated.Value(1)).current;
  const textEraseProgress = useRef(new Animated.Value(0)).current;
  const textRevealProgress = useRef(new Animated.Value(0)).current;
  const buttonEnterProgress = useRef(new Animated.Value(0)).current;
  const [isErasing, setIsErasing] = React.useState(false);

  React.useEffect(() => {
    Animated.timing(textRevealProgress, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    Animated.timing(buttonEnterProgress, {
      toValue: 1,
      duration: 600,
      delay: 100,
      useNativeDriver: true,
    }).start();
  }, [textRevealProgress, buttonEnterProgress]);

  const handleSubmit = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {}
    }
    console.log('Form submitted');
    setIsErasing(true);
    Animated.timing(textEraseProgress, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start(() => {
      router.push('/success');
    });
  }, [textEraseProgress]);

  const handleReview = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    router.back();
  }, []);

  const handleSubmitPressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(submitButtonScale, {
        toValue: 0.95,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }),
      Animated.timing(submitButtonOpacity, {
        toValue: 0.6,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [submitButtonScale, submitButtonOpacity]);

  const handleSubmitPressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(submitButtonScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(submitButtonOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [submitButtonScale, submitButtonOpacity]);

  const handleReviewPressIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(reviewButtonScale, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(reviewButtonOpacity, {
        toValue: 0.2,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reviewButtonScale, reviewButtonOpacity]);

  const handleReviewPressOut = useCallback(() => {
    Animated.parallel([
      Animated.timing(reviewButtonScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(reviewButtonOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reviewButtonScale, reviewButtonOpacity]);

  const totalChars = TITLE_CHARS.length;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <View style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.titleContainer}>
              {TITLE_CHARS.map((char, index) => {
                // Delays “simétricos”
                const revealDelay =
                  index < totalChars / 2
                    ? (totalChars / 2 - index) / totalChars
                    : (index - totalChars / 2) / totalChars;

                const eraseDelay =
                  index < totalChars / 2
                    ? index / totalChars
                    : (totalChars - 1 - index) / totalChars;

                // Evitar 0 en puntos intermedios
                const revealStart = Math.max(EPS, revealDelay * 0.5);
                const revealMid = Math.min(1 - EPS, revealStart + 0.5);

                const eraseStart = Math.max(EPS, eraseDelay);
                const eraseMid = Math.min(1 - EPS, eraseStart + 0.3);

                const revealOpacity = textRevealProgress.interpolate({
                  inputRange: [0, revealStart, revealMid, 1],
                  outputRange: [0, 0, 1, 1],
                  extrapolate: 'clamp',
                });

                const eraseOpacity = textEraseProgress.interpolate({
                  inputRange: [0, eraseStart, eraseMid, 1],
                  outputRange: [1, 1, 0, 0],
                  extrapolate: 'clamp',
                });

                const finalOpacity = Animated.multiply(revealOpacity, eraseOpacity);

                return (
                  <Animated.Text
                    key={`char-${index}`}
                    style={[styles.titleChar, { opacity: finalOpacity }]}
                  >
                    {char}
                  </Animated.Text>
                );
              })}
            </View>
          </View>

          <View
            style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}
            pointerEvents={isErasing ? 'none' : 'auto'}
          >
            <Animated.View
              style={{
                transform: [
                  { scale: submitButtonScale },
                  {
                    translateY: buttonEnterProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
                opacity: Animated.multiply(
                  Animated.multiply(submitButtonOpacity, buttonEnterProgress),
                  textEraseProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0],
                  })
                ),
              }}
            >
              <Pressable
                style={styles.submitButton}
                onPress={handleSubmit}
                onPressIn={handleSubmitPressIn}
                onPressOut={handleSubmitPressOut}
                android_ripple={
                  Platform.OS === 'android'
                    ? { color: 'rgba(255,255,255,0.08)' }
                    : undefined
                }
              >
                <Text style={styles.submitButtonText}>Enviar sin miedo</Text>
              </Pressable>
            </Animated.View>

            <Animated.View
              style={{
                transform: [
                  { scale: reviewButtonScale },
                  {
                    translateY: buttonEnterProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
                opacity: Animated.multiply(
                  Animated.multiply(reviewButtonOpacity, buttonEnterProgress),
                  textEraseProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0],
                  })
                ),
              }}
            >
              <Pressable
                style={styles.reviewButton}
                onPress={handleReview}
                onPressIn={handleReviewPressIn}
                onPressOut={handleReviewPressOut}
                android_ripple={
                  Platform.OS === 'android'
                    ? { color: 'rgba(255,255,255,0.08)' }
                    : undefined
                }
              >
                <Text style={styles.reviewButtonText}>Revisar respuestas</Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#170501',
  },
  safe: {
    flex: 1,
    backgroundColor: '#170501',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  titleContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  titleChar: {
    fontSize: 48,
    fontWeight: '600' as const,
    color: '#fbefd9',
    letterSpacing: -0.5,
  },
  footer: {
    paddingHorizontal: 44,
    paddingTop: 30,
    gap: 10,
  },
  submitButton: {
    ...BUTTON_STYLES.primaryButton,
    backgroundColor: '#ff6b35',
  },
  submitButtonText: {
    ...BUTTON_STYLES.primaryButtonText,
    color: '#ffffff',
  },
  reviewButton: {
    ...BUTTON_STYLES.primaryButton,
    backgroundColor: 'rgba(251, 239, 217, 0.1)',
  },
  reviewButtonText: {
    ...BUTTON_STYLES.primaryButtonText,
    color: '#ffffff',
  },
});
