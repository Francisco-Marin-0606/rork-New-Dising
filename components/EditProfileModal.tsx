import React, { useEffect, useRef, useCallback, useState } from 'react';
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
  TextInput,
  ScrollView,
  PanResponder,
  Keyboard,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ visible, onClose }: EditProfileModalProps) {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  const [nombre, setNombre] = useState<string>('Pancho');
  const [apellido, setApellido] = useState<string>('Noo');
  const [nombrePreferido, setNombrePreferido] = useState<string>('Paco');
  const [email] = useState<string>('panchito.contacto@gmail.com');
  const [fechaNacimiento] = useState<string>('26 septiembre 2009');
  const [genero] = useState<string>('Hombre');
  const [validationError, setValidationError] = useState<string>('');

  const buttonAnimation = useRef({
    scale: new Animated.Value(1),
    opacity: new Animated.Value(1),
  }).current;

  const DURATION_OPEN = 400;
  const DURATION_CLOSE = 350;
  const easeInOut = Easing.bezier(0.4, 0.0, 0.2, 1);

  const closeModal = useCallback(async () => {
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
      onClose();
    });
  }, [opacity, translateY, translateX, screenHeight, onClose, easeInOut]);

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
      translateX.setValue(0);
      opacity.setValue(0);
    }
  }, [visible, translateY, translateX, opacity, screenHeight]);

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
            onClose();
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

  const handleSave = useCallback(async () => {
    const trimmedNombrePreferido = nombrePreferido.trim();
    
    if (trimmedNombrePreferido.length === 0) {
      setValidationError('Este campo es obligatorio');
      if (Platform.OS !== 'web') {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (error) {
          console.log('Haptic feedback error:', error);
        }
      }
      return;
    }
    
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (error) {
        console.log('Haptic feedback error:', error);
      }
    }
    const trimmedNombre = nombre.trim();
    const trimmedApellido = apellido.trim();
    console.log('Saving profile:', { nombre: trimmedNombre, apellido: trimmedApellido, nombrePreferido: trimmedNombrePreferido, email, fechaNacimiento, genero });
    closeModal();
  }, [nombre, apellido, nombrePreferido, email, fechaNacimiento, genero, closeModal]);

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

  if (!visible) return null;

  return (
    <View style={styles.overlay} testID="edit-profile-overlay">
      <Animated.View style={[styles.backdrop, { opacity }]} pointerEvents="none" />
      
      <Animated.View
        style={[
          styles.modalContainer,
          {
            height: screenHeight,
            transform: [{ translateY }, { translateX }],
          },
        ]}
        testID="edit-profile-container"
        {...panResponder.panHandlers}
      >
        <View style={styles.content}>
          <Pressable style={styles.header} onPress={Keyboard.dismiss}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={closeModal} 
              testID="close-button" 
              activeOpacity={0.6}
            >
              <ChevronLeft color="#fbefd9" size={37.8} strokeWidth={1.5} />
            </TouchableOpacity>
            <Text style={styles.title}>Editar mi perfil</Text>
          </Pressable>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={Platform.OS === 'android'}
            keyboardDismissMode="none"
            scrollEventThrottle={16}
          >
            <View style={styles.formContainer}>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Escríbelo aquí…"
                  placeholderTextColor="rgba(251, 239, 217, 0.3)"
                  testID="nombre-input"
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Apellido</Text>
                <TextInput
                  style={styles.input}
                  value={apellido}
                  onChangeText={setApellido}
                  placeholder="Escríbelo aquí…"
                  placeholderTextColor="rgba(251, 239, 217, 0.3)"
                  testID="apellido-input"
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>¿Cómo quieres que te llamen?</Text>
                <Text style={styles.helperText}>
                  Escríbelo como se lee, y si tiene algún acento raro, márcalo. (Que no es lo mismo Julián, que Julian, o Yulian).
                </Text>
                <TextInput
                  style={[styles.input, validationError && styles.inputError]}
                  value={nombrePreferido}
                  onChangeText={(text) => {
                    setNombrePreferido(text);
                    if (validationError && text.trim().length > 0) {
                      setValidationError('');
                    }
                  }}
                  placeholder="Escríbelo aquí…"
                  placeholderTextColor="rgba(251, 239, 217, 0.3)"
                  testID="nombre-preferido-input"
                />
                {validationError && (
                  <Text style={styles.errorText}>{validationError}</Text>
                )}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Tu correo electrónico</Text>
                <Text style={styles.readOnlyText}>{email}</Text>
              </View>

              <View style={styles.rowContainer}>
                <View style={[styles.fieldContainer, styles.halfField]}>
                  <Text style={styles.label} numberOfLines={1}>Fecha de nacimiento</Text>
                  <Text style={styles.readOnlyText}>{fechaNacimiento}</Text>
                </View>

                <View style={[styles.fieldContainer, styles.halfFieldSmaller]}>
                  <Text style={styles.label}>Género</Text>
                  <Text style={styles.readOnlyText}>{genero}</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <Pressable style={styles.footer} onPress={Keyboard.dismiss}>
            <Animated.View
              style={{
                transform: [{ scale: buttonAnimation.scale }],
                opacity: buttonAnimation.opacity,
                width: '100%',
              }}
            >
              <Pressable
                style={styles.saveButton}
                onPress={handleSave}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                android_ripple={Platform.OS === 'android' ? { color: 'transparent' } : undefined}
                testID="save-button"
              >
                <Text style={styles.saveButtonText}>Listo</Text>
              </Pressable>
            </Animated.View>
          </Pressable>
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
    paddingTop: Platform.OS === 'android' ? 16 : 60,
    paddingBottom: 40,
  },
  header: {
    paddingBottom: 20,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: Platform.OS === 'android' ? 0 : 30,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 240,
  },
  formContainer: {
    gap: 24,
  },
  fieldContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fbefd9',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 15,
    color: 'rgba(251, 239, 217, 0.6)',
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
  inputText: {
    fontSize: 16,
    color: '#fbefd9',
  },
  readOnlyText: {
    fontSize: 16,
    color: 'rgba(251, 239, 217, 0.3)',
    textAlign: 'left',
  },
  inputError: {
    borderColor: '#ff6b35',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 13,
    color: '#ff6b35',
    marginTop: 8,
    fontWeight: '600',
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1.3,
  },
  halfFieldSmaller: {
    flex: 0.7,
  },
  inputTransparent: {
    paddingHorizontal: 0,
    paddingVertical: 14,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0,
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
  saveButton: {
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
  saveButtonText: {
    color: '#fbefd9',
    fontSize: 18,
    fontWeight: '700',
  },
});
