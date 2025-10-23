import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  useWindowDimensions,
  Easing,
  Platform,
  TextInput,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface CompleteDataModalProps {
  visible: boolean;
  onComplete: (data: UserData) => void;
}

interface UserData {
  name: string;
  gender: 'Hombre' | 'Mujer';
  birthdate: string;
}

export default function CompleteDataModal({ visible, onComplete }: CompleteDataModalProps) {
  const { height: screenHeight } = useWindowDimensions();
  
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  const [name, setName] = useState<string>('');
  const [gender, setGender] = useState<'Hombre' | 'Mujer'>('Hombre');
  const [birthdate, setBirthdate] = useState<string>('');

  const buttonAnimation = useRef({
    scale: new Animated.Value(1),
    opacity: new Animated.Value(1),
  }).current;

  const genderButtonAnimation = useRef({
    hombre: {
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
    },
    mujer: {
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
    },
  }).current;

  const DURATION_OPEN = 400;
  const easeInOut = Easing.bezier(0.4, 0.0, 0.2, 1);

  const openModal = useCallback(() => {
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
    if (visible) {
      openModal();
    }
  }, [visible, openModal]);

  useEffect(() => {
    if (!visible) {
      translateY.setValue(screenHeight);
      opacity.setValue(0);
    }
  }, [visible, translateY, opacity, screenHeight]);

  const handleComplete = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (error) {
        console.log('Haptic feedback error:', error);
      }
    }
    console.log('Completing data:', { name, gender, birthdate });
    onComplete({ name, gender, birthdate });
  }, [name, gender, birthdate, onComplete]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(buttonAnimation.scale, {
        toValue: 0.9,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }),
      Animated.timing(buttonAnimation.opacity, {
        toValue: 0.2,
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

  const handleGenderPressIn = (selectedGender: 'Hombre' | 'Mujer') => {
    const anim = selectedGender === 'Hombre' ? genderButtonAnimation.hombre : genderButtonAnimation.mujer;
    Animated.parallel([
      Animated.spring(anim.scale, {
        toValue: 0.9,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }),
      Animated.timing(anim.opacity, {
        toValue: 0.2,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleGenderPressOut = (selectedGender: 'Hombre' | 'Mujer') => {
    const anim = selectedGender === 'Hombre' ? genderButtonAnimation.hombre : genderButtonAnimation.mujer;
    Animated.parallel([
      Animated.spring(anim.scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(anim.opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleGenderPress = async (selectedGender: 'Hombre' | 'Mujer') => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.log('Haptic feedback error:', error);
      }
    }
    setGender(selectedGender);
  };

  const isFormValid = name.trim().length > 0 && birthdate.length > 0;

  if (!visible) return null;

  return (
    <View style={styles.overlay} testID="complete-data-overlay">
      <Animated.View style={[styles.backdrop, { opacity }]} pointerEvents="none" />
      
      <Animated.View
        style={[
          styles.modalContainer,
          {
            height: screenHeight,
            transform: [{ translateY }],
          },
        ]}
        testID="complete-data-container"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'on-drag' : 'none'}
              scrollEventThrottle={16}
            >
              <View style={styles.formContainer}>
                <Text style={styles.mainTitle}>Completa tus datos antes de pedir tu hipnosis</Text>

                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    Antes de pedir tu primera hipnosis personalizada, y para que sea de verdad personalizada, deja aquí tus datos.
                  </Text>
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>¿Cómo quieres que te llamen?</Text>
                  <Text style={styles.helperText}>
                    Escríbelo como se lee, y si tiene algún acento raro, márcalo. (Que no es lo mismo Julián, que Julian, o Yulian).
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Ingresa tu apodo"
                    placeholderTextColor="rgba(251, 239, 217, 0.3)"
                    testID="name-input"
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Eres...</Text>
                  <View style={styles.genderContainer}>
                    <Animated.View
                      style={{
                        flex: 1,
                        transform: [{ scale: genderButtonAnimation.hombre.scale }],
                        opacity: genderButtonAnimation.hombre.opacity,
                      }}
                    >
                      <Pressable
                        style={[
                          styles.genderButton,
                          gender === 'Hombre' && styles.genderButtonActive,
                        ]}
                        onPress={() => handleGenderPress('Hombre')}
                        onPressIn={() => handleGenderPressIn('Hombre')}
                        onPressOut={() => handleGenderPressOut('Hombre')}
                        testID="gender-hombre-button"
                      >
                        <Text
                          style={[
                            styles.genderButtonText,
                            gender === 'Hombre' && styles.genderButtonTextActive,
                          ]}
                        >
                          Hombre
                        </Text>
                      </Pressable>
                    </Animated.View>

                    <Animated.View
                      style={{
                        flex: 1,
                        transform: [{ scale: genderButtonAnimation.mujer.scale }],
                        opacity: genderButtonAnimation.mujer.opacity,
                      }}
                    >
                      <Pressable
                        style={[
                          styles.genderButton,
                          gender === 'Mujer' && styles.genderButtonActive,
                        ]}
                        onPress={() => handleGenderPress('Mujer')}
                        onPressIn={() => handleGenderPressIn('Mujer')}
                        onPressOut={() => handleGenderPressOut('Mujer')}
                        testID="gender-mujer-button"
                      >
                        <Text
                          style={[
                            styles.genderButtonText,
                            gender === 'Mujer' && styles.genderButtonTextActive,
                          ]}
                        >
                          Mujer
                        </Text>
                      </Pressable>
                    </Animated.View>
                  </View>
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Fecha de nacimiento</Text>
                  <TextInput
                    style={styles.input}
                    value={birthdate}
                    onChangeText={setBirthdate}
                    placeholder="19/10/2004"
                    placeholderTextColor="rgba(251, 239, 217, 0.3)"
                    testID="birthdate-input"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Animated.View
                style={{
                  transform: [{ scale: buttonAnimation.scale }],
                  opacity: buttonAnimation.opacity,
                  width: '100%',
                }}
              >
                <Pressable
                  style={[
                    styles.completeButton,
                    !isFormValid && styles.completeButtonDisabled,
                  ]}
                  onPress={handleComplete}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  disabled={!isFormValid}
                  android_ripple={Platform.OS === 'android' ? { color: 'transparent' } : undefined}
                  testID="complete-button"
                >
                  <Text style={[
                    styles.completeButtonText,
                    !isFormValid && styles.completeButtonTextDisabled,
                  ]}>
                    Siguiente
                  </Text>
                </Pressable>
              </Animated.View>
            </View>
          </View>
        </TouchableWithoutFeedback>
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
  modalContainer: {
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
    paddingTop: Platform.OS === 'android' ? 60 : 90,
    paddingBottom: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 180,
  },
  formContainer: {
    gap: 24,
  },
  mainTitle: {
    fontSize: 37,
    fontWeight: '700',
    color: '#fbefd9',
    lineHeight: 42,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  infoBox: {
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(251, 239, 217, 0.3)',
    paddingLeft: 16,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    color: 'rgba(251, 239, 217, 0.5)',
    lineHeight: 22,
  },
  fieldContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fbefd9',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: 'rgba(251, 239, 217, 0.5)',
    marginBottom: 12,
    lineHeight: 20,
  },
  input: {
    backgroundColor: 'rgba(251, 239, 217, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fbefd9',
    borderWidth: 1,
    borderColor: 'rgba(251, 239, 217, 0.2)',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 239, 217, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 239, 217, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#ff6b35',
    borderColor: '#ff6b35',
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(251, 239, 217, 0.6)',
  },
  genderButtonTextActive: {
    color: '#fbefd9',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 44,
    paddingTop: 24,
    paddingBottom: 55,
    backgroundColor: '#170501',
  },
  completeButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#935139',
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
  completeButtonDisabled: {
    backgroundColor: 'rgba(147, 81, 57, 0.3)',
  },
  completeButtonText: {
    color: '#fbefd9',
    fontSize: 18,
    fontWeight: '700',
  },
  completeButtonTextDisabled: {
    color: 'rgba(251, 239, 217, 0.3)',
  },
});
