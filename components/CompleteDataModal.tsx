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
} from 'react-native';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BUTTON_STYLES } from '@/constants/buttonStyles';

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
  
  const handleNameChange = (text: string) => {
    const validText = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
    const limitedText = validText.slice(0, 25);
    setName(limitedText);
  };
  const [gender, setGender] = useState<'Hombre' | 'Mujer'>('Hombre');
  const [birthdate, setBirthdate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [date, setDate] = useState<Date>(new Date(2004, 9, 19));
  
  const datePickerSlideAnim = useRef(new Animated.Value(500)).current;
  const datePickerOpacityAnim = useRef(new Animated.Value(0)).current;

  const buttonAnimation = useRef({
    scale: new Animated.Value(1),
    opacity: new Animated.Value(1),
  }).current;

  const togglePosition = useRef(new Animated.Value(0)).current;

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

  const handleGenderPress = async (selectedGender: 'Hombre' | 'Mujer') => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.log('Haptic feedback error:', error);
      }
    }
    setGender(selectedGender);
    
    Animated.timing(togglePosition, {
      toValue: selectedGender === 'Hombre' ? 0 : 1,
      duration: 350,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const year = selectedDate.getFullYear();
      setBirthdate(`${day}/${month}/${year}`);
    }
  };

  const animateDatePickerIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(datePickerSlideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(datePickerOpacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [datePickerSlideAnim, datePickerOpacityAnim]);

  const animateDatePickerOut = useCallback(() => {
    Animated.parallel([
      Animated.timing(datePickerSlideAnim, {
        toValue: 500,
        duration: 250,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(datePickerOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowDatePicker(false);
    });
  }, [datePickerSlideAnim, datePickerOpacityAnim]);

  const handleDatePress = async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.log('Haptic feedback error:', error);
      }
    }
    Keyboard.dismiss();
    setShowDatePicker(true);
  };

  const handleDatePickerDone = async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.log('Haptic feedback error:', error);
      }
    }
    animateDatePickerOut();
  };

  useEffect(() => {
    if (showDatePicker && Platform.OS === 'ios') {
      datePickerSlideAnim.setValue(500);
      datePickerOpacityAnim.setValue(0);
      animateDatePickerIn();
    }
  }, [showDatePicker, animateDatePickerIn, datePickerSlideAnim, datePickerOpacityAnim]);

  const isFormValid = name.trim().length > 0 && birthdate.length > 0;

  if (!visible) return null;

  return (
    <View style={styles.overlay} testID="complete-data-overlay">
      <Pressable style={[styles.backdrop, { opacity }]} onPress={() => {}} />
      
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
        <View style={styles.content}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            scrollEventThrottle={16}
            bounces={true}
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
                    onChangeText={handleNameChange}
                    placeholder="Ingresa tu apodo"
                    placeholderTextColor="rgba(251, 239, 217, 0.3)"
                    maxLength={25}
                    testID="name-input"
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Eres...</Text>
                  <View style={styles.genderToggleWrapper}>
                    <Animated.View
                      style={[
                        styles.toggleSelector,
                        {
                          transform: [
                            {
                              translateX: togglePosition.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 133],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                    <View style={styles.genderContainer}>
                      <Pressable
                        style={styles.genderButton}
                        onPress={() => handleGenderPress('Hombre')}
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

                      <Pressable
                        style={styles.genderButton}
                        onPress={() => handleGenderPress('Mujer')}
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
                    </View>
                  </View>
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Fecha de nacimiento</Text>
                  <Pressable onPress={handleDatePress}>
                    <View style={styles.input} pointerEvents="none">
                      <Text style={[styles.inputText, !birthdate && styles.placeholderText]}>
                        {birthdate || '19/10/2004'}
                      </Text>
                    </View>
                  </Pressable>
                </View>


              </View>
            </ScrollView>

            {showDatePicker && Platform.OS === 'ios' && (
              <Pressable
                style={styles.datePickerOverlay}
                onPress={handleDatePickerDone}
                testID="date-picker-backdrop"
              >
                <Animated.View 
                  style={{
                    opacity: datePickerOpacityAnim,
                  }}
                >
                  <Pressable 
                    style={styles.datePickerPopup}
                    onPress={(e) => e.stopPropagation()}
                  >
                    <Animated.View
                      style={[
                        styles.datePickerPopupContent,
                        {
                          transform: [{ translateY: datePickerSlideAnim }],
                        },
                      ]}
                    >
                      <DateTimePicker
                        testID="dateTimePicker"
                        value={date}
                        mode="date"
                        display="spinner"
                        onChange={handleDateChange}
                        textColor="#fbefd9"
                        maximumDate={new Date()}
                      />
                      <View style={styles.datePickerFooter}>
                        <Pressable onPress={handleDatePickerDone}>
                          <Text style={styles.datePickerDoneText}>Confirmar</Text>
                        </Pressable>
                      </View>
                    </Animated.View>
                  </Pressable>
                </Animated.View>
              </Pressable>
            )}

            {showDatePicker && Platform.OS === 'android' && (
              <DateTimePicker
                testID="dateTimePicker"
                value={date}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}

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
    fontSize: 16,
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
  genderToggleWrapper: {
    position: 'relative',
  },
  toggleSelector: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 121,
    height: 48,
    backgroundColor: '#ff6b35',
    borderRadius: 12,
    zIndex: 1,
    padding: 5,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
    position: 'relative',
    zIndex: 2,
    width: 254,
    alignSelf: 'flex-start',
  },
  genderButton: {
    width: 121,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  genderButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(251, 239, 217, 0.6)',
    textAlign: 'center',
    lineHeight: 24,
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
    backgroundColor: '#ff6b35',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginBottom: 25,
    ...BUTTON_STYLES.elevatedShadow,
  },
  completeButtonDisabled: {
    backgroundColor: 'rgba(251, 239, 217, 0.15)',
  },
  completeButtonText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#fbefd9',
    letterSpacing: -0.3,
  },
  completeButtonTextDisabled: {
    color: 'rgba(251, 239, 217, 0.35)',
  },
  inputText: {
    fontSize: 16,
    color: '#fbefd9',
  },
  placeholderText: {
    color: 'rgba(251, 239, 217, 0.3)',
  },
  datePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  datePickerPopup: {
    width: '85%',
    maxWidth: 340,
  },
  datePickerPopupContent: {
    backgroundColor: '#2a1410',
    borderRadius: 16,
    paddingTop: 8,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 24,
  },
  datePickerFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  datePickerDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b35',
  },
});
