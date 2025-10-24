import React, { useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  Animated,
  Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';

interface DownloadCompleteModalProps {
  visible: boolean;
  onClose: () => void;
  hypnosisTitle: string;
}

export default function DownloadCompleteModal({ visible, onClose, hypnosisTitle }: DownloadCompleteModalProps) {
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonOpacity = useRef(new Animated.Value(1)).current;
  const modalScale = useRef(new Animated.Value(0.85)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  const handleAccept = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    }
    
    Animated.parallel([
      Animated.timing(modalScale, {
        toValue: 0.85,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [onClose, modalScale, modalOpacity]);

  const handleButtonPressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(buttonScale, {
        toValue: 0.95,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [buttonScale, buttonOpacity]);

  const handleButtonPressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(buttonScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [buttonScale, buttonOpacity]);

  React.useEffect(() => {
    if (visible) {
      modalScale.setValue(0.85);
      modalOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, modalScale, modalOpacity]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleAccept}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleAccept} />
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: modalOpacity,
              transform: [{ scale: modalScale }],
            },
          ]}
        >
          <View style={styles.gradientBg}>
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
              <Defs>
                <SvgLinearGradient id="downloadCompleteBg" x1="0%" y1="0%" x2="86.6%" y2="50%">
                  <Stop offset="0%" stopColor="#a2380e" stopOpacity={1} />
                  <Stop offset="100%" stopColor="#7c2709" stopOpacity={1} />
                </SvgLinearGradient>
              </Defs>
              <Rect x={0} y={0} width="100%" height="100%" fill="url(#downloadCompleteBg)" />
            </Svg>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.title}>Descarga completada</Text>
            <Text style={styles.message}>
              &ldquo;{hypnosisTitle}&rdquo; se ha descargado correctamente y está disponible offline, dentro de la app de Mental.
            </Text>
            
            <Animated.View
              style={{
                transform: [{ scale: buttonScale }],
                opacity: buttonOpacity,
              }}
            >
              <Pressable
                style={styles.button}
                onPress={handleAccept}
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
                android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.1)' } : undefined}
              >
                <Text style={styles.buttonText}>Aceptar</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </Modal>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    borderRadius: 20,
    width: '88%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    position: 'relative',
    zIndex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: '#fbefd9',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  message: {
    fontSize: 13.6,
    color: 'rgba(251, 239, 217, 0.85)',
    textAlign: 'center',
    lineHeight: 19.2,
    marginBottom: 28,
  },
  button: {
    paddingVertical: 16,
    backgroundColor: '#ff6b35',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#ffffff',
    letterSpacing: 0.2,
  },
});
