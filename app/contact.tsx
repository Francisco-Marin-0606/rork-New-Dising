import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Pressable,
  useWindowDimensions,
  Easing,
  Platform,
  PanResponder,
} from 'react-native';
import { ChevronLeft, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

export default function ContactScreen() {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const buttonAnimation = useRef({
    scale: new Animated.Value(1),
    opacity: new Animated.Value(1),
  }).current;

  const DURATION_OPEN = 400;
  const DURATION_CLOSE = 350;
  const easeInOut = Easing.bezier(0.4, 0.0, 0.2, 1);

  const goBack = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (error) {
        console.log('Haptic feedback error:', error);
      }
    }
    
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: DURATION_CLOSE,
        easing: easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: screenHeight,
        duration: DURATION_CLOSE,
        easing: easeInOut,
        useNativeDriver: true,
      }),
    ]).start(() => {
      translateX.setValue(0);
      router.back();
    });
  }, [opacity, translateY, translateX, screenHeight, easeInOut]);

  const openScreen = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: DURATION_OPEN,
        easing: easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: DURATION_OPEN,
        easing: easeInOut,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, easeInOut]);

  useEffect(() => {
    openScreen();
  }, [openScreen]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && gestureState.dx > 10;
      },
      onMoveShouldSetPanResponderCapture: (_evt, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && gestureState.dx > 10;
      },
      onPanResponderMove: (_evt, gestureState) => {
        if (gestureState.dx > 0) {
          translateX.setValue(gestureState.dx);
          const progress = Math.min(gestureState.dx / screenWidth, 1);
          opacity.setValue(1 - progress * 0.5);
        }
      },
      onPanResponderRelease: (_evt, gestureState) => {
        if (gestureState.dx > screenWidth * 0.3) {
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: screenWidth,
              duration: 250,
              easing: easeInOut,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 250,
              easing: easeInOut,
              useNativeDriver: true,
            }),
          ]).start(() => {
            translateX.setValue(0);
            translateY.setValue(screenHeight);
            router.back();
          });
        } else {
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 65,
              friction: 10,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(buttonAnimation.scale, {
        toValue: 0.95,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }),
      Animated.timing(buttonAnimation.opacity, {
        toValue: 0.6,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(buttonAnimation.scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(buttonAnimation.opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={styles.overlay} testID="contact-overlay">
      <Animated.View style={[styles.backdrop, { opacity }]} pointerEvents="none" />
      
      <Animated.View
        style={[
          styles.container,
          {
            height: screenHeight,
            transform: [{ translateY }, { translateX }],
          },
        ]}
        testID="contact-container"
        {...panResponder.panHandlers}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={goBack} 
              testID="back-button" 
              activeOpacity={0.6}
            >
              <ChevronLeft color="#fbefd9" size={37.8} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          <View style={styles.centerContent}>
            <View style={styles.iconContainer}>
              <AlertCircle color="#fbefd9" size={80} strokeWidth={1.5} />
            </View>

            <Text style={styles.title}>Es broma, algo falló en el{'\n'}sistema. Intenta de nuevo.</Text>
            
            <Text style={styles.subtitle}>
              Sí, ya sé... tienes que escribir todo otra vez. Pero si{'\n'}pasó, es por algo. Confía.
            </Text>
          </View>

          <View style={styles.footer}>
            <Animated.View
              style={{
                transform: [{ scale: buttonAnimation.scale }],
                opacity: buttonAnimation.opacity,
                width: '100%',
              }}
            >
              <Pressable
                style={styles.button}
                onPress={goBack}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                android_ripple={Platform.OS === 'android' ? { color: 'transparent' } : undefined}
                testID="volver-button"
              >
                <Text style={styles.buttonText}>Volver</Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2a1410',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    paddingHorizontal: 44,
    paddingTop: Platform.OS === 'android' ? 16 : 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  header: {
    paddingBottom: 20,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 0 : 30,
  },
  backButton: {
    position: 'absolute',
    left: -10,
    alignSelf: 'flex-start',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fbefd9',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 16,
    color: '#fbefd9',
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
  },
  footer: {
    paddingTop: 24,
    paddingBottom: 15,
  },
  button: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b35',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  buttonText: {
    color: '#fbefd9',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
});
