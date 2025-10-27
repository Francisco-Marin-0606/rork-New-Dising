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
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BUTTON_STYLES } from '@/constants/buttonStyles';

interface RenameHypnosisModalProps {
  visible: boolean;
  onClose: () => void;
  currentName: string;
  onSave: (newName: string) => void;
}

export default function RenameHypnosisModal({ visible, onClose, currentName, onSave }: RenameHypnosisModalProps) {
  const { height: screenHeight } = useWindowDimensions();
  
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  const [name, setName] = useState<string>(currentName);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const saveButtonScale = useRef(new Animated.Value(1)).current;
  const saveButtonOpacity = useRef(new Animated.Value(1)).current;

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
      onClose();
    });
  }, [opacity, translateY, screenHeight, onClose, easeInOut]);

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
      setName(currentName);
      openModal();
    }
  }, [visible, currentName, openModal]);

  useEffect(() => {
    if (!visible) {
      translateY.setValue(screenHeight);
      opacity.setValue(0);
      setIsSaving(false);
    }
  }, [visible, translateY, opacity, screenHeight]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    if (!name.trim()) return;
    
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (error) {
        console.log('Haptic feedback error:', error);
      }
    }

    setIsSaving(true);
    onSave(name.trim());
    
    setTimeout(() => {
      setIsSaving(false);
      closeModal();
    }, 300);
  }, [name, isSaving, onSave, closeModal]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(saveButtonScale, {
        toValue: 0.95,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }),
      Animated.timing(saveButtonOpacity, {
        toValue: 0.6,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(saveButtonScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(saveButtonOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay} testID="rename-hypnosis-overlay">
      <Animated.View style={[styles.backdrop, { opacity }]} pointerEvents="none" />
      
      <Animated.View
        style={[
          styles.modalContainer,
          {
            height: screenHeight,
            transform: [{ translateY }],
          },
        ]}
        testID="rename-hypnosis-container"
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={closeModal} 
              testID="back-button" 
              activeOpacity={0.6}
            >
              <ChevronLeft color="#fbefd9" size={24} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.mainContent}>
            <Text style={styles.title}>Cambiar nombre</Text>
            <Text style={styles.subtitle}>Edita el nombre de tu hipnosis</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nombre de la hipnosis"
                placeholderTextColor="rgba(251, 239, 217, 0.3)"
                autoFocus
                maxLength={100}
                testID="name-input"
              />
            </View>

            <Animated.View
              style={{
                transform: [{ scale: saveButtonScale }],
                opacity: saveButtonOpacity,
              }}
            >
              <Pressable
                style={[
                  styles.saveButton,
                  (!name.trim() || isSaving) && styles.saveButtonDisabled
                ]}
                onPress={handleSave}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={!name.trim() || isSaving}
                android_ripple={Platform.OS === 'android' ? { color: 'transparent' } : undefined}
                testID="save-button"
              >
                <Text style={styles.saveButtonText}>
                  {isSaving ? 'Guardando...' : 'Guardar'}
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
    zIndex: 4000,
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
  modalContent: {
    flex: 1,
    paddingHorizontal: 44,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    paddingBottom: 20,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  mainContent: {
    flex: 1,
  },
  title: {
    fontSize: 32.4,
    fontWeight: '700',
    color: '#fbefd9',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(251, 239, 217, 0.6)',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 32,
  },
  input: {
    ...BUTTON_STYLES.primaryButton,
    backgroundColor: 'rgba(251, 239, 217, 0.08)',
    color: '#fbefd9',
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'left',
  },
  saveButton: {
    ...BUTTON_STYLES.primaryButton,
    backgroundColor: '#ff6b35',
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(251, 239, 217, 0.2)',
  },
  saveButtonText: {
    ...BUTTON_STYLES.primaryButtonText,
    color: '#ffffff',
  },
});
