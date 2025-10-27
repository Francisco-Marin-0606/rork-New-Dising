import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Easing,
  Platform,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

export default function QAScreen() {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const DURATION_OPEN = 400;
  const DURATION_CLOSE = 350;
  const easeInOut = Easing.bezier(0.4, 0.0, 0.2, 1);

  const closeScreen = useCallback(async () => {
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
  }, [opacity, translateY, screenHeight, easeInOut, translateX]);

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
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && gestureState.dx > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          translateX.setValue(gestureState.dx);
          const progress = Math.min(gestureState.dx / screenWidth, 1);
          opacity.setValue(1 - progress * 0.5);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
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

  const qaData = [
    {
      question: '${name}, dime ¿qué situaciones te generan más miedo o estrés últimamente?',
      answer: 'La convivencia con mi pareja, nuestra situación financiera, el desorden en el hogar, la maternidad, mi trabajo.',
    },
    {
      question: '¿Qué es eso que definitivamente NO quieres más en tu vida?',
      answer: 'Que nuestra situación financiera sea un obstáculo para hacer lo que soñamos.',
    },
    {
      question: '${name}, vamos a jugar un rato a que tus posibilidades son infinitas, sin reglas, sin límites.',
      answer: 'Que nuestros ingresos sean tan altos que yo no tenga que preocuparme por el dinero.',
    },
  ];

  return (
    <View style={styles.overlay} testID="qa-overlay">
      <Animated.View style={[styles.backdrop, { opacity }]} pointerEvents="none" />
      
      <Animated.View
        style={[
          styles.container,
          {
            height: screenHeight,
            transform: [{ translateY }, { translateX }],
          },
        ]}
        testID="qa-container"
        {...panResponder.panHandlers}
      >
        <View style={[
          styles.content,
          { paddingTop: (Platform.OS === 'android' ? 12 : insets.top + 15), paddingBottom: insets.bottom + 40 }
        ]}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={closeScreen} 
              testID="close-button" 
              activeOpacity={0.6}
            >
              <ChevronLeft color="#fbefd9" size={37.8} strokeWidth={1.5} />
            </TouchableOpacity>
            <Text style={styles.title}>Preguntas y respuestas</Text>
          </View>

          <View style={styles.hypnosisCard}>
            <Text style={styles.hypnosisTitle}>Hipnosis Enero</Text>
            <Text style={styles.hypnosisDate}>23-01-2025 01:38 hrs</Text>
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.answersContainer}>
              {qaData.map((item, index) => (
                <View key={index} style={styles.questionBlock}>
                  <Text style={styles.qaQuestionText}>{`${index + 1}. ${item.question}`}</Text>
                  <Text style={styles.qaAnswerText}>{item.answer}</Text>
                  {index !== qaData.length - 1 ? <View style={styles.separator} /> : null}
                </View>
              ))}
            </View>
          </ScrollView>
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
    zIndex: 3000,
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
    backgroundColor: '#170501',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    paddingHorizontal: 44,
  },
  header: {
    paddingBottom: 20,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: Platform.OS === 'android' ? 8 : 15,
  },
  closeButton: {
    position: 'absolute',
    left: 0,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 20.16,
    fontWeight: '700',
    color: '#fbefd9',
    lineHeight: 37.8,
  },
  hypnosisCard: {
    marginBottom: 24,
  },
  hypnosisTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fbefd9',
    marginBottom: 8,
    lineHeight: 28,
  },
  hypnosisDate: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(251, 239, 217, 0.6)',
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  answersContainer: {
    gap: 32,
  },
  questionBlock: {
    gap: 16,
  },
  qaQuestionText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fbefd9',
    lineHeight: 26,
    textAlign: 'left',
  },
  qaAnswerText: {
    fontSize: 18,
    fontWeight: '400',
    color: 'rgba(251, 239, 217, 0.9)',
    lineHeight: 24,
    textAlign: 'left',
  },
  separator: {
    height: 1,
    backgroundColor: '#ffffff',
    opacity: 0.2,
    marginTop: 8,
  }
});
