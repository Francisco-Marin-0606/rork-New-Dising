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
} from 'react-native';
import { X, User, Edit3, HelpCircle, Mail } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BUTTON_STYLES } from '@/constants/buttonStyles';
import { router } from 'expo-router';
import EditProfileModal from './EditProfileModal';
import ManageSubscriptionModal from './ManageSubscriptionModal';
import ErrorModal from './ErrorModal';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  isOnline?: boolean;
}

export default function SettingsModal({ visible, onClose, isOnline = true }: SettingsModalProps) {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  const buttonAnimations = useRef<{ [key: string]: { scale: Animated.Value; opacity: Animated.Value } }>({}).current;
  
  const [editProfileModalVisible, setEditProfileModalVisible] = useState<boolean>(false);
  const [manageSubscriptionModalVisible, setManageSubscriptionModalVisible] = useState<boolean>(false);
  const [errorModalVisible, setErrorModalVisible] = useState<boolean>(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'cancelled' | 'pending' | 'subscribe'>('active');

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
      openModal();
    }
  }, [visible, openModal]);

  useEffect(() => {
    if (!visible) {
      translateY.setValue(screenHeight);
      opacity.setValue(0);
    }
  }, [visible, translateY, opacity, screenHeight]);

  const handleMenuAction = useCallback(async (action: string) => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (error) {
        console.log('Haptic feedback error:', error);
      }
    }
    console.log(`Settings action: ${action}`);
    
    if (action === 'edit-profile') {
      setEditProfileModalVisible(true);
      return;
    }

    if (action === 'manage-subscription') {
      setManageSubscriptionModalVisible(true);
      return;
    }

    if (action === 'contact') {
      setErrorModalVisible(true);
      return;
    }
    
    if (action === 'logout') {
      closeModal();
      setTimeout(() => {
        router.push('/login');
      }, 400);
    }
  }, [closeModal]);

  const getButtonAnimation = (buttonId: string) => {
    if (!buttonAnimations[buttonId]) {
      buttonAnimations[buttonId] = {
        scale: new Animated.Value(1),
        opacity: new Animated.Value(1),
      };
    }
    return buttonAnimations[buttonId];
  };

  const handlePressIn = (buttonId: string) => {
    const anim = getButtonAnimation(buttonId);
    
    Animated.parallel([
      Animated.spring(anim.scale, {
        toValue: 0.95,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }),
      Animated.timing(anim.opacity, {
        toValue: 0.6,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = (buttonId: string) => {
    const anim = getButtonAnimation(buttonId);
    
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

  if (!visible) return null;

  return (
    <View style={styles.overlay} testID="settings-overlay">
      <Animated.View style={[styles.backdrop, { opacity }]} pointerEvents="none" />
      
      <Animated.View
        style={[
          styles.modalContainer,
          {
            height: screenHeight,
            transform: [{ translateY }],
          },
        ]}
        testID="settings-container"
      >
        <View style={[
            styles.modalContent,
            { paddingTop: (Platform.OS === 'android' ? insets.top + 12 : insets.top + 20), paddingBottom: insets.bottom + 20 }
          ]}>
          <TouchableOpacity 
            style={[styles.closeButton, { top: (Platform.OS === 'android' ? insets.top + 8 : insets.top + 12) }]} 
            onPress={closeModal} 
            testID="close-button" 
            activeOpacity={0.6}
          >
            <View style={styles.closeButtonInner}>
              <X color="#fbefd9" size={24} strokeWidth={2} />
            </View>
          </TouchableOpacity>

          <Text style={styles.title}>Mi cuenta</Text>

          <View style={styles.subscriptionSection}>
            <View style={styles.subscriptionRow}>
              <View style={styles.subscriptionInfo}>
                <Text style={styles.subscriptionLabel}>Suscripción</Text>
                <Text style={styles.subscriptionType}>Mensual</Text>
              </View>
              <Pressable 
                style={[
                  styles.budgetContainer,
                  subscriptionStatus === 'active' && styles.budgetContainerActive,
                  subscriptionStatus === 'cancelled' && styles.budgetContainerCancelled,
                  (subscriptionStatus === 'subscribe' || subscriptionStatus === 'pending') && styles.budgetContainerInactive
                ]}
                onPress={async () => {
                  if (Platform.OS !== 'web') {
                    try {
                      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    } catch (error) {
                      console.log('Haptic feedback error:', error);
                    }
                  }
                  const statusCycle: ('active' | 'cancelled' | 'pending' | 'subscribe')[] = ['active', 'pending', 'cancelled', 'subscribe'];
                  const currentIndex = statusCycle.indexOf(subscriptionStatus);
                  const nextIndex = (currentIndex + 1) % statusCycle.length;
                  setSubscriptionStatus(statusCycle[nextIndex]);
                }}
              >
                <Text style={[
                  styles.budgetText,
                  subscriptionStatus === 'active' && styles.budgetTextActive,
                  subscriptionStatus === 'cancelled' && styles.budgetTextCancelled,
                  (subscriptionStatus === 'subscribe' || subscriptionStatus === 'pending') && styles.budgetTextInactive
                ]}>
                  {subscriptionStatus === 'active' ? 'ACTIVA' : 
                   subscriptionStatus === 'pending' ? 'PAGO PENDIENTE' : 
                   subscriptionStatus === 'cancelled' ? 'CANCELADA' : 'SUSCRIBIRSE'}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.menuSection}>
            <Animated.View
              style={{
                transform: [{ scale: getButtonAnimation('manage-subscription').scale }],
                opacity: getButtonAnimation('manage-subscription').opacity,
              }}
            >
              <Pressable
                style={styles.menuItem}
                onPress={() => handleMenuAction('manage-subscription')}
                onPressIn={() => handlePressIn('manage-subscription')}
                onPressOut={() => handlePressOut('manage-subscription')}
                android_ripple={Platform.OS === 'android' ? { color: 'transparent' } : undefined}
                testID="menu-manage-subscription"
              >
                <View style={styles.menuIconContainer}>
                  <User color="#ffffff" size={20} />
                </View>
                <Text style={styles.menuItemText}>Gestionar suscripción</Text>
              </Pressable>
            </Animated.View>

            <Animated.View
              style={{
                transform: [{ scale: getButtonAnimation('edit-profile').scale }],
                opacity: getButtonAnimation('edit-profile').opacity,
              }}
            >
              <Pressable
                style={styles.menuItem}
                onPress={() => handleMenuAction('edit-profile')}
                onPressIn={() => handlePressIn('edit-profile')}
                onPressOut={() => handlePressOut('edit-profile')}
                android_ripple={Platform.OS === 'android' ? { color: 'transparent' } : undefined}
                testID="menu-edit-profile"
              >
                <View style={styles.menuIconContainer}>
                  <Edit3 color="#ffffff" size={20} />
                </View>
                <Text style={styles.menuItemText}>Editar mi perfil</Text>
              </Pressable>
            </Animated.View>

            <Animated.View
              style={{
                transform: [{ scale: getButtonAnimation('faq').scale }],
                opacity: getButtonAnimation('faq').opacity,
              }}
            >
              <Pressable
                style={styles.menuItem}
                onPress={() => handleMenuAction('faq')}
                onPressIn={() => handlePressIn('faq')}
                onPressOut={() => handlePressOut('faq')}
                android_ripple={Platform.OS === 'android' ? { color: 'transparent' } : undefined}
                testID="menu-faq"
              >
                <View style={styles.menuIconContainer}>
                  <HelpCircle color="#ffffff" size={20} />
                </View>
                <Text style={styles.menuItemText}>Preguntas frecuentes</Text>
              </Pressable>
            </Animated.View>

            <Animated.View
              style={{
                transform: [{ scale: getButtonAnimation('contact').scale }],
                opacity: getButtonAnimation('contact').opacity,
              }}
            >
              <Pressable
                style={styles.menuItem}
                onPress={() => handleMenuAction('contact')}
                onPressIn={() => handlePressIn('contact')}
                onPressOut={() => handlePressOut('contact')}
                android_ripple={Platform.OS === 'android' ? { color: 'transparent' } : undefined}
                testID="menu-contact"
              >
                <View style={styles.menuIconContainer}>
                  <Mail color="#ffffff" size={20} />
                </View>
                <Text style={styles.menuItemText}>Contacto</Text>
              </Pressable>
            </Animated.View>
          </View>

          <Animated.View
            style={{
              transform: [{ scale: getButtonAnimation('logout').scale }],
              opacity: getButtonAnimation('logout').opacity,
            }}
          >
            <Pressable
              style={[
                styles.logoutButton,
                subscriptionStatus === 'active' ? styles.logoutButtonActive : styles.logoutButtonInactive
              ]}
              onPress={() => handleMenuAction('logout')}
              onPressIn={() => handlePressIn('logout')}
              onPressOut={() => handlePressOut('logout')}
              android_ripple={Platform.OS === 'android' ? { color: 'transparent' } : undefined}
              testID="logout-button"
            >
              <Text style={[
                styles.logoutButtonText,
                subscriptionStatus !== 'active' && styles.logoutButtonTextInactive
              ]}>Cerrar sesión</Text>
            </Pressable>
          </Animated.View>

          <Text style={styles.versionText}>Versión de la app 3.1.63</Text>

          <View style={styles.footerContainer}>
            <View style={styles.footerLinks}>
            <Pressable
              onPress={() => handleMenuAction('terms')}
              android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.1)', borderless: true } : undefined}
            >
              <Text style={styles.footerLinkText}>Términos de uso</Text>
            </Pressable>
            <Pressable
              onPress={() => handleMenuAction('privacy')}
              android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.1)', borderless: true } : undefined}
            >
              <Text style={styles.footerLinkText}>Políticas de privacidad</Text>
            </Pressable>
            </View>
          </View>
        </View>
      </Animated.View>

      {editProfileModalVisible && (
        <EditProfileModal
          visible={editProfileModalVisible}
          onClose={() => setEditProfileModalVisible(false)}
        />
      )}

      {manageSubscriptionModalVisible && (
        <ManageSubscriptionModal
          visible={manageSubscriptionModalVisible}
          onClose={() => setManageSubscriptionModalVisible(false)}
          isOnline={isOnline}
          subscriptionStatus={subscriptionStatus}
        />
      )}

      {errorModalVisible && (
        <ErrorModal
          visible={errorModalVisible}
          onClose={() => setErrorModalVisible(false)}
        />
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
  modalContent: {
    flex: 1,
    paddingHorizontal: 44,
    justifyContent: 'space-between',
  },
  closeButton: {
    position: 'absolute',
    right: 44,
    zIndex: 10,
  },
  closeButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32.4,
    fontWeight: '700',
    color: '#fbefd9',
    marginBottom: 24,
    marginTop: 8,
  },
  subscriptionSection: {
    marginBottom: 12,
    marginTop: 8,
  },
  subscriptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fbefd9',
    marginBottom: 0,
  },
  subscriptionType: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(251, 239, 217, 0.35)',
  },
  budgetContainer: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  budgetContainerActive: {
    backgroundColor: '#fbefd9',
    borderColor: 'rgba(201, 132, 30, 0.4)',
  },
  budgetContainerInactive: {
    backgroundColor: '#ff6b35',
    borderColor: 'rgba(255, 107, 53, 0.4)',
  },
  budgetContainerCancelled: {
    backgroundColor: '#808080',
    borderColor: 'rgba(128, 128, 128, 0.4)',
  },
  budgetText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  budgetTextActive: {
    color: '#1a0d08',
  },
  budgetTextInactive: {
    color: '#ffffff',
  },
  budgetTextCancelled: {
    color: '#fbefd9',
  },

  menuSection: {
    gap: 0,
    marginBottom: 24,
  },
  menuItem: {
    ...BUTTON_STYLES.primaryButton,
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    gap: 16,
    backgroundColor: 'rgba(251, 239, 217, 0.08)',
    marginBottom: 10,
    overflow: 'hidden',
  },

  menuIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    ...BUTTON_STYLES.primaryButtonText,
    flex: 1,
  },
  logoutButton: {
    ...BUTTON_STYLES.primaryButton,
    marginBottom: 24,
    overflow: 'hidden',
  },
  logoutButtonActive: {
    backgroundColor: '#ff6b35',
  },
  logoutButtonInactive: {
    backgroundColor: '#fbefd9',
  },

  logoutButtonText: {
    ...BUTTON_STYLES.primaryButtonText,
  },
  logoutButtonTextInactive: {
    color: '#1a0d08',
  },
  versionText: {
    fontSize: 10.5,
    fontWeight: '400',
    color: 'rgba(251, 239, 217, 0.15)',
    textAlign: 'center',
    marginBottom: 20,
  },
  footerContainer: {
    marginTop: 'auto',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 24,
  },
  footerLinkText: {
    fontSize: 10.5,
    fontWeight: '400',
    color: 'rgba(251, 239, 217, 0.3)',
    textAlign: 'center',
  },
});
