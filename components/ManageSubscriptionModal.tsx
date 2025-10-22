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
  PanResponder,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface ManageSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  isOnline?: boolean;
}

export default function ManageSubscriptionModal({ visible, onClose, isOnline = true }: ManageSubscriptionModalProps) {
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

  const [isCancelled, setIsCancelled] = useState<boolean>(false);
  const [subscriptionActive, setSubscriptionActive] = useState<boolean>(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const cancelConfirmTranslateY = useRef(new Animated.Value(screenHeight)).current;
  const cancelConfirmOpacity = useRef(new Animated.Value(0)).current;
  const yesCancelScale = useRef(new Animated.Value(1)).current;
  const yesCancelOpacity = useRef(new Animated.Value(1)).current;
  const noContinueScale = useRef(new Animated.Value(1)).current;
  const noContinueOpacity = useRef(new Animated.Value(1)).current;

  const handleCancelSubscription = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (error) {
        console.log('Haptic feedback error:', error);
      }
    }
    setShowCancelConfirm(true);
    cancelConfirmTranslateY.setValue(screenHeight);
    cancelConfirmOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(cancelConfirmTranslateY, {
        toValue: 0,
        duration: 350,
        easing: easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(cancelConfirmOpacity, {
        toValue: 1,
        duration: 350,
        easing: easeInOut,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cancelConfirmTranslateY, cancelConfirmOpacity, screenHeight, easeInOut]);

  const handleConfirmCancel = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (error) {
        console.log('Haptic feedback error:', error);
      }
    }
    Animated.parallel([
      Animated.timing(cancelConfirmTranslateY, {
        toValue: screenHeight,
        duration: 250,
        easing: easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(cancelConfirmOpacity, {
        toValue: 0,
        duration: 250,
        easing: easeInOut,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowCancelConfirm(false);
      setIsCancelled(true);
    });
  }, [cancelConfirmTranslateY, cancelConfirmOpacity, screenHeight, easeInOut]);

  const handleCloseCancelConfirm = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (error) {
        console.log('Haptic feedback error:', error);
      }
    }
    Animated.parallel([
      Animated.timing(cancelConfirmTranslateY, {
        toValue: screenHeight,
        duration: 250,
        easing: easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(cancelConfirmOpacity, {
        toValue: 0,
        duration: 250,
        easing: easeInOut,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowCancelConfirm(false);
    });
  }, [cancelConfirmTranslateY, cancelConfirmOpacity, screenHeight, easeInOut]);

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
    <View style={styles.overlay} testID="manage-subscription-overlay">
      <Animated.View style={[styles.backdrop, { opacity }]} pointerEvents="none" />
      
      <Animated.View
        style={[
          styles.modalContainer,
          {
            height: screenHeight,
            transform: [{ translateY }, { translateX }],
          },
        ]}
        testID="manage-subscription-container"
        {...panResponder.panHandlers}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={closeModal} 
              testID="close-button" 
              activeOpacity={0.6}
            >
              <ChevronLeft color="#fbefd9" size={37.8} strokeWidth={1.5} />
            </TouchableOpacity>
            <Text style={styles.title}>Gestionar Suscripción</Text>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Suscripción:</Text>
              <Pressable 
                style={[
                  styles.statusBadge,
                  !subscriptionActive && styles.statusBadgeInactive
                ]}
                onPress={async () => {
                  if (Platform.OS !== 'web') {
                    try {
                      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    } catch (error) {
                      console.log('Haptic feedback error:', error);
                    }
                  }
                  setSubscriptionActive(!subscriptionActive);
                }}
              >
                <Text style={[
                  styles.statusText,
                  !subscriptionActive && styles.statusTextInactive
                ]}>
                  {subscriptionActive ? 'ACTIVA' : 'CANCELADA'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, !subscriptionActive && styles.infoLabelInactive]}>
                Plan actual:
              </Text>
              <Text style={[styles.infoValue, !subscriptionActive && styles.infoValueInactive]}>
                {subscriptionActive ? 'Mensual' : '-'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, !subscriptionActive && styles.infoLabelInactive]}>
                Próximo pago:
              </Text>
              <Text style={[styles.infoValue, !subscriptionActive && styles.infoValueInactive]}>
                {subscriptionActive ? '12 de Octubre' : '-'}
              </Text>
            </View>

            {isOnline && (
              <View style={styles.buttonContainer}>
                <Animated.View
                  style={{
                    transform: [{ scale: buttonAnimation.scale }],
                    opacity: buttonAnimation.opacity,
                    width: '100%',
                  }}
                >
                  <Pressable
                    style={[
                      styles.cancelButton,
                      isCancelled && styles.cancelButtonDisabled,
                      !subscriptionActive && styles.cancelButtonActive
                    ]}
                    onPress={async () => {
                      if (!subscriptionActive) {
                        if (Platform.OS !== 'web') {
                          try {
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                          } catch (error) {
                            console.log('Haptic feedback error:', error);
                          }
                        }
                      } else {
                        handleCancelSubscription();
                      }
                    }}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    android_ripple={Platform.OS === 'android' ? { color: 'transparent' } : undefined}
                    testID="cancel-subscription-button"
                    disabled={isCancelled}
                  >
                    <Text style={styles.cancelButtonText}>
                      {subscriptionActive ? 'Cancelar suscripción' : 'Suscribirse'}
                    </Text>
                  </Pressable>
                </Animated.View>
                {isCancelled && (
                  <Text style={styles.cancelledText}>
                    Ya has cancelado tu suscripción.{"\n"}
                    Seguirá activa hasta que finalice tu periodo de pago.
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </Animated.View>

      {showCancelConfirm && (
        <View style={styles.confirmOverlay}>
          <Animated.View style={[styles.confirmBackdrop, { opacity: cancelConfirmOpacity }]} pointerEvents="none" />
          <Animated.View
            style={[
              styles.confirmContainer,
              {
                height: screenHeight,
                opacity: cancelConfirmOpacity,
                transform: [{ translateY: cancelConfirmTranslateY }],
              },
            ]}
          >
            <View style={styles.confirmContent}>
              <View style={styles.confirmHeader}>
                <TouchableOpacity 
                  style={styles.confirmCloseButton} 
                  onPress={handleCloseCancelConfirm} 
                  activeOpacity={0.6}
                >
                  <ChevronLeft color="#fbefd9" size={37.8} strokeWidth={1.5} />
                </TouchableOpacity>
              </View>

              <View style={styles.confirmBody}>
                <Text style={styles.confirmTitle}>¿Estás seguro que{"\n"}quieres cancelar tu{"\n"}suscripción a Mental?</Text>
                <Text style={styles.confirmSubtitle}>
                  El siguiente click abre una línea de tiempo en la{"\n"}que no podrás pedir nuevas hipnosis.{"\n"}{"\n"}
                  Y para escuchar las anteriores, tendrás que{"\n"}renovar tu suscripción.
                </Text>

                <View style={styles.confirmButtons}>
                  <Animated.View style={{ transform: [{ scale: yesCancelScale }], opacity: yesCancelOpacity, marginBottom: 12 }}>
                    <Pressable
                      style={styles.confirmButton}
                      onPress={handleConfirmCancel}
                      onPressIn={async () => {
                        if (Platform.OS !== 'web') {
                          try {
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                          } catch (error) {
                            console.log('Haptic feedback error:', error);
                          }
                        }
                        Animated.parallel([
                          Animated.spring(yesCancelScale, {
                            toValue: 0.9,
                            useNativeDriver: true,
                            speed: 50,
                            bounciness: 0,
                          }),
                          Animated.timing(yesCancelOpacity, {
                            toValue: 0.2,
                            duration: 150,
                            useNativeDriver: true,
                          }),
                        ]).start();
                      }}
                      onPressOut={() => {
                        Animated.parallel([
                          Animated.spring(yesCancelScale, {
                            toValue: 1,
                            useNativeDriver: true,
                            speed: 50,
                            bounciness: 4,
                          }),
                          Animated.timing(yesCancelOpacity, {
                            toValue: 1,
                            duration: 150,
                            useNativeDriver: true,
                          }),
                        ]).start();
                      }}
                      android_ripple={Platform.OS === 'android' ? { color: 'transparent' } : undefined}
                    >
                      <Text style={styles.confirmButtonText}>Sí, quiero cancelar</Text>
                    </Pressable>
                  </Animated.View>

                  <Animated.View style={{ transform: [{ scale: noContinueScale }], opacity: noContinueOpacity }}>
                    <Pressable
                      style={styles.confirmButtonSecondary}
                      onPress={handleCloseCancelConfirm}
                      onPressIn={async () => {
                        if (Platform.OS !== 'web') {
                          try {
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                          } catch (error) {
                            console.log('Haptic feedback error:', error);
                          }
                        }
                        Animated.parallel([
                          Animated.spring(noContinueScale, {
                            toValue: 0.9,
                            useNativeDriver: true,
                            speed: 50,
                            bounciness: 0,
                          }),
                          Animated.timing(noContinueOpacity, {
                            toValue: 0.2,
                            duration: 150,
                            useNativeDriver: true,
                          }),
                        ]).start();
                      }}
                      onPressOut={() => {
                        Animated.parallel([
                          Animated.spring(noContinueScale, {
                            toValue: 1,
                            useNativeDriver: true,
                            speed: 50,
                            bounciness: 4,
                          }),
                          Animated.timing(noContinueOpacity, {
                            toValue: 1,
                            duration: 150,
                            useNativeDriver: true,
                          }),
                        ]).start();
                      }}
                      android_ripple={Platform.OS === 'android' ? { color: 'transparent' } : undefined}
                    >
                      <Text style={styles.confirmButtonSecondaryText}>No, deseo continuar</Text>
                    </Pressable>
                  </Animated.View>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>
      )}
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
    justifyContent: 'center',
  },
  header: {
    paddingBottom: 20,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
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
  infoSection: {
    gap: 32,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fbefd9',
  },
  infoValue: {
    fontSize: 20,
    fontWeight: '400',
    color: '#fbefd9',
  },
  statusBadge: {
    backgroundColor: '#fbefd9',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(201, 132, 30, 0.4)',
  },
  statusBadgeInactive: {
    backgroundColor: '#808080',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1a0d08',
    letterSpacing: 1.2,
  },
  statusTextInactive: {
    color: '#fbefd9',
  },
  buttonContainer: {
    marginTop: 16,
  },
  cancelButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B1C1C',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
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
  cancelButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  cancelButtonDisabled: {
    backgroundColor: '#808080',
    opacity: 0.3,
  },
  cancelButtonActive: {
    backgroundColor: '#ff6b35',
  },
  cancelledText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#fbefd9',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  infoLabelInactive: {
    opacity: 0.3,
  },
  infoValueInactive: {
    opacity: 0.3,
  },
  confirmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4000,
  },
  confirmBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  confirmContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#170501',
    overflow: 'hidden',
  },
  confirmContent: {
    flex: 1,
    paddingHorizontal: 44,
    paddingTop: Platform.OS === 'android' ? 16 : 60,
    paddingBottom: 40,
  },
  confirmHeader: {
    paddingBottom: 20,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 40,
    marginTop: Platform.OS === 'android' ? 0 : 30,
  },
  confirmCloseButton: {
    alignSelf: 'flex-start',
  },
  confirmBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fbefd9',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 38,
  },
  confirmSubtitle: {
    fontSize: 16,
    color: 'rgba(251, 239, 217, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },
  confirmButtons: {
    width: '100%',
    marginTop: 40,
  },
  confirmButton: {
    width: '100%',
    backgroundColor: 'rgba(251, 239, 217, 0.08)',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  confirmButtonSecondary: {
    width: '100%',
    backgroundColor: '#ff6b35',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmButtonSecondaryText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
});
