import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  StyleSheet,
  View,
  Pressable,
  Platform,
  Text,
  Image,
  useWindowDimensions,
  Animated,
  FlatList,
  ListRenderItemInfo,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MoreVertical, Play, Download, MessageCircle, Edit3, Settings, Check, X, ArrowDown } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import SwipeUpModal from '@/components/SwipeUpModal';
import PlayerModal from '@/components/PlayerModal';
import SettingsModal from '@/components/SettingsModal';
import { BUTTON_STYLES } from '@/constants/buttonStyles';
import YaDisponibleModal from '@/components/YaDisponibleModal';
import DownloadCompleteModal from '@/components/DownloadCompleteModal';
import RenameHypnosisModal from '@/components/RenameHypnosisModal';

interface HypnosisSession {
  id: string;
  title: string;
  imageUri: string;
  durationSec: number;
  isGrayscale?: boolean;
}

type DownloadState = 'idle' | 'downloading' | 'completed';

interface DownloadInfo {
  progress: number;
  state: DownloadState;
}

interface CarouselItemProps {
  item: HypnosisSession;
  index: number;
  cardWidth: number;
  cardSpacing: number;
  snapInterval: number;
  scrollX: Animated.Value;
  onPress: (session: HypnosisSession) => void;
  downloadInfo?: DownloadInfo;
  totalItems: number;
}

interface ListItemProps {
  item: HypnosisSession;
  onPress: (session: HypnosisSession) => void;
  onMenuPress: (session: HypnosisSession) => void;
  viewMode: ViewMode;
  downloadInfo?: DownloadInfo;
}

/** Helper: DO → Weserv (gris real con filt=greyscale o sat=0) */
function weservProxy(url: string, opts?: { grayscale?: boolean }) {
  try {
    if (!/^https?:\/\//i.test(url)) return url;

    const u = new URL(url);
    // host + path + query (sin protocolo)
    const hostAndPath = `${u.host}${u.pathname}${u.search ?? ''}`;

    // Evita doble-encoding de %20 etc.
    const normalized = encodeURIComponent(decodeURIComponent(hostAndPath));

    const params: string[] = [];
    if (opts?.grayscale) {
      // cualquiera de las dos sirve; usamos filt=greyscale
      params.push('filt=greyscale');
      // params.push('sat=0');
    }
    // extras (opcionales)
    // params.push('sharp=1');
    // params.push('dpr=2');

    const suffix = params.length ? `&${params.join('&')}` : '';
    return `https://images.weserv.nl/?url=${normalized}${suffix}`;
  } catch {
    return url;
  }
}

function ListItem({ item, onPress, onMenuPress, viewMode, downloadInfo }: ListItemProps) {
  const { t } = useTranslation();
  const pressScale = useRef(new Animated.Value(1)).current;
  const [isRevealing, setIsRevealing] = useState<boolean>(false);
  const [revealProgress, setRevealProgress] = useState<number>(0);

  const handlePressIn = useCallback(() => {
    Animated.spring(pressScale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }, [pressScale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }, [pressScale]);

  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  const handleMenuPress = useCallback(async (e: any) => {
    e.stopPropagation();
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    }
    onMenuPress(item);
  }, [item, onMenuPress]);

  return (
    <Animated.View style={{ transform: [{ scale: pressScale }] }}>
      <Pressable
        style={styles.listItem}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.08)' } : undefined}
      >
        {({ pressed }) => (
          <>
            <View style={[styles.listItemImageContainer, pressed && { opacity: 0.2 }]}>
              {item.isGrayscale ? (
                <RevealFromBottom
                  grayscaleUri={item.imageUri}
                  colorUri={weservProxy(DO_IMAGE)}
                  onRevealChange={setIsRevealing}
                  onProgressChange={setRevealProgress}
                />
              ) : (
                <Image
                  source={{ uri: item.imageUri }}
                  style={styles.listItemImage}
                  resizeMode="cover"
                />
              )}
            </View>
            <View style={[styles.listItemContent, pressed && { opacity: 0.2 }]}>
              <Text style={styles.listItemTitle} numberOfLines={2}>
                {item.isGrayscale && revealProgress < 100 ? t('index.creating') : item.title}
              </Text>
              {!(item.isGrayscale && revealProgress < 100) && (
                <View style={styles.durationRow}>
                  {downloadInfo?.state === 'downloading' && (
                    <View style={styles.downloadingIconContainer}>
                      <Download size={12} color="#ff9a2e" />
                      <Text style={styles.downloadingPercentage}>{Math.max(0, Math.min(100, Math.round(downloadInfo.progress)))}%</Text>
                    </View>
                  )}
                  {downloadInfo?.state === 'completed' && (
                    <View style={[styles.durationIconCircle, styles.durationIconCircleCompleted]}>
                      <ArrowDown size={10.2} color="#ffffff" strokeWidth={3} />
                    </View>
                  )}
                  <Text style={styles.durationText}>{t('index.duration')} {formatDuration(item.durationSec)}</Text>
                </View>
              )}
            </View>

            {!(item.isGrayscale && revealProgress < 100) && (
              <Pressable
                style={styles.menuButton}
                onPress={handleMenuPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MoreVertical color="#fbefd9" size={20} />
              </Pressable>
            )}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

function CarouselItem({ item, index, cardWidth, cardSpacing, snapInterval, scrollX, onPress, downloadInfo, totalItems }: CarouselItemProps) {
  const { t } = useTranslation();
  const inputRange = [
    (index - 1) * snapInterval,
    index * snapInterval,
    (index + 1) * snapInterval,
  ];

  const scale = scrollX.interpolate({
    inputRange,
    outputRange: [0.9, 1, 0.9],
    extrapolate: 'clamp',
  });

  const translateY = scrollX.interpolate({
    inputRange,
    outputRange: [8, 0, 8],
    extrapolate: 'clamp',
  });

  const pressScale = useRef(new Animated.Value(1)).current;
  const combinedScale = Animated.multiply(scale, pressScale);
  const [isRevealing, setIsRevealing] = useState<boolean>(false);
  const [revealProgress, setRevealProgress] = useState<number>(0);

  const handlePressIn = useCallback(() => {
    Animated.spring(pressScale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }, [pressScale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }, [pressScale]);

  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          width: cardWidth,
          marginRight: index === totalItems - 1 ? 0 : cardSpacing,
          transform: [{ scale: combinedScale }, { translateY }],
        },
      ]}
    >
      <Pressable
        testID="carousel-card"
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.08)' } : undefined}
        style={({ pressed }) => [
          styles.cardColumn,
          pressed && { opacity: 0.2 }
        ]}
      >
        <View style={styles.cardShadow}>
          <View style={styles.cardInner} onLayout={(e) => {
            try {
              const h = e?.nativeEvent?.layout?.height ?? 0;
              if (item.isGrayscale && h > 0) {
                console.log('[Reveal] layout height', h);
              }
            } catch (err) {
              console.log('[Reveal] onLayout error', err);
            }
          }}>
            {item.isGrayscale ? (
              <RevealFromBottom
                grayscaleUri={item.imageUri}
                colorUri={weservProxy(DO_IMAGE)}
                onRevealChange={setIsRevealing}
                onProgressChange={setRevealProgress}
              />
            ) : (
              <Image
                source={{ uri: item.imageUri }}
                style={styles.cardImage}
                resizeMode="cover"
              />
            )}
            {downloadInfo?.state === 'completed' && (
              <View style={styles.cardDownloadIconInside}>
                <ArrowDown size={11.73} color="#ffffff" strokeWidth={3} />
              </View>
            )}
          </View>
          {index === 1 && (
            <View style={styles.badge} testID="listen-badge">
              <Text style={styles.badgeText}>{t('index.badge')}</Text>
            </View>
          )}
        </View>

        <View style={[styles.cardTitleContainer, { width: cardWidth }]}>
          <Text style={styles.cardTitle} numberOfLines={3}>
            {item.isGrayscale && revealProgress < 100 ? t('index.creating') : item.title}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const DO_IMAGE = 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarruselnaranja.jpg';

const HYPNOSIS_SESSIONS: HypnosisSession[] = [
  // Esta hipnosis se muestra PRIMERA - está siendo creada (gris real con filt=greyscale)
  { id: '12', title: 'Tu nueva hipnosis personalizada', imageUri: weservProxy(DO_IMAGE, { grayscale: true }), durationSec: 24 * 60 + 9, isGrayscale: true },
  // NUEVAS (10 hipnosis - títulos más descriptivos y personalizados) - SE MUESTRAN EN CARRUSEL/LISTA
  { id: '6', title: 'Relajación profunda al atardecer', imageUri: weservProxy(DO_IMAGE), durationSec: 35 * 60 + 33 },
  { id: '7', title: 'Liberación de miedos y ansiedades', imageUri: weservProxy(DO_IMAGE), durationSec: 19 * 60 + 11 },
  { id: '8', title: 'Conexión con tu esencia interior', imageUri: weservProxy(DO_IMAGE), durationSec: 28 * 60 + 46 },
  { id: '9', title: 'Sanación emocional y bienestar', imageUri: weservProxy(DO_IMAGE), durationSec: 21 * 60 + 7 },
  { id: '10', title: 'Meditación guiada en el jardín', imageUri: weservProxy(DO_IMAGE), durationSec: 31 * 60 + 54 },
  { id: '11', title: 'Despertar la confianza en ti mismo', imageUri: weservProxy(DO_IMAGE), durationSec: 27 * 60 + 18 },
  { id: '13', title: 'Viaje al bosque de bambú sagrado', imageUri: weservProxy(DO_IMAGE), durationSec: 22 * 60 + 40 },
  { id: '14', title: 'Equilibrio mental y emocional', imageUri: weservProxy(DO_IMAGE), durationSec: 26 * 60 + 15 },
  { id: '15', title: 'Transformación profunda interior', imageUri: weservProxy(DO_IMAGE), durationSec: 33 * 60 + 22 },
  { id: '16', title: 'Abundancia y prosperidad consciente', imageUri: weservProxy(DO_IMAGE), durationSec: 29 * 60 + 8 },
];

const HYPNOSIS_PREVIOUS: HypnosisSession[] = [
  // ANTERIORES (5 hipnosis - títulos de 2 palabras) - SE MUESTRAN EN "ANTERIORES"
  { id: '1', title: 'Sueño Profundo', imageUri: weservProxy(DO_IMAGE), durationSec: 30 * 60 + 14 },
  { id: '2', title: 'Calma Mental', imageUri: weservProxy(DO_IMAGE), durationSec: 20 * 60 + 24 },
  { id: '3', title: 'Paz Interior', imageUri: weservProxy(DO_IMAGE), durationSec: 18 * 60 + 5 },
  { id: '4', title: 'Energía Renovada', imageUri: weservProxy(DO_IMAGE), durationSec: 25 * 60 + 10 },
  { id: '5', title: 'Descanso Total', imageUri: weservProxy(DO_IMAGE), durationSec: 42 * 60 + 2 },
];

type ViewMode = 'carousel' | 'list' | 'previous';

function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const mm = minutes.toString();
  const ss = seconds.toString().padStart(2, '0');
  if (hours > 0) {
    const hh = hours.toString();
    const mm2 = minutes.toString().padStart(2, '0');
    return `${hh}:${mm2}:${ss}`;
  }
  return `${mm}:${ss}`;
}

type NavSection = 'hipnosis' | 'aura';

function RevealFromBottom({ grayscaleUri, colorUri, onRevealChange, onProgressChange }: { grayscaleUri: string; colorUri: string; onRevealChange?: (revealing: boolean) => void; onProgressChange?: (progress: number) => void }) {
  const containerHeightRef = useRef<number>(0);
  const revealHeight = useRef(new Animated.Value(0)).current;
  const [hasLayout, setHasLayout] = useState<boolean>(false);
  const progressListenerId = useRef<string | null>(null);

  const onLayout = useCallback((e: { nativeEvent: { layout?: { height?: number } } }) => {
    const h = e?.nativeEvent?.layout?.height ?? 0;
    if (h > 0) {
      containerHeightRef.current = h;
      setHasLayout(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLayout) return;
    const h = containerHeightRef.current;
    try {
      revealHeight.setValue(0);
      onRevealChange?.(true);
      onProgressChange?.(0);
      
      if (progressListenerId.current) {
        revealHeight.removeListener(progressListenerId.current);
      }
      
      progressListenerId.current = revealHeight.addListener(({ value }) => {
        const raw = (value / h) * 100;
        const progress = Math.min(85, raw);
        onProgressChange?.(progress);
      });
      
      Animated.timing(revealHeight, {
        toValue: h * 0.85,
        duration: 20000,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          onRevealChange?.(false);
          onProgressChange?.(85);
        }
        if (progressListenerId.current) {
          revealHeight.removeListener(progressListenerId.current);
          progressListenerId.current = null;
        }
      });
    } catch (err) {
      console.log('[Reveal] animation error', err);
      onRevealChange?.(false);
    }
    
    return () => {
      if (progressListenerId.current) {
        revealHeight.removeListener(progressListenerId.current);
        progressListenerId.current = null;
      }
    };
  }, [hasLayout, revealHeight, onRevealChange, onProgressChange]);

  return (
    <View style={styles.revealContainer} onLayout={onLayout} testID="reveal-grayscale-card">
      <Image source={{ uri: grayscaleUri }} style={styles.revealImage} resizeMode="cover" />
      <Animated.View style={[styles.revealOverlay, { height: revealHeight }]} testID="reveal-overlay">
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: containerHeightRef.current }}>
          <Image source={{ uri: colorUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
      </Animated.View>
    </View>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedSession, setSelectedSession] = useState<HypnosisSession | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('carousel');
  const [menuModalVisible, setMenuModalVisible] = useState<boolean>(false);
  const [menuSession, setMenuSession] = useState<HypnosisSession | null>(null);
  const [menuViewMode, setMenuViewMode] = useState<ViewMode>('carousel');
  const [playerModalVisible, setPlayerModalVisible] = useState<boolean>(false);
  const [playerSession, setPlayerSession] = useState<HypnosisSession | null>(null);
  const [navSection, setNavSection] = useState<NavSection>('hipnosis');
  const [settingsModalVisible, setSettingsModalVisible] = useState<boolean>(false);
  const [yaDisponibleModalVisible, setYaDisponibleModalVisible] = useState<boolean>(false);
  const [downloadCompleteModalVisible, setDownloadCompleteModalVisible] = useState<boolean>(false);
  const [completedDownloadTitle, setCompletedDownloadTitle] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [renameModalVisible, setRenameModalVisible] = useState<boolean>(false);
  const [sessionToRename, setSessionToRename] = useState<HypnosisSession | null>(null);
  const [hypnosisSessions, setHypnosisSessions] = useState<HypnosisSession[]>(HYPNOSIS_SESSIONS);
  const [previousSessions, setPreviousSessions] = useState<HypnosisSession[]>(HYPNOSIS_PREVIOUS);
  const { width: screenWidth } = useWindowDimensions();

  const menuPrimaryScale = useRef(new Animated.Value(1)).current;
  const menuDownloadScale = useRef(new Animated.Value(1)).current;
  const menuQAScale = useRef(new Animated.Value(1)).current;
  const menuRenameScale = useRef(new Animated.Value(1)).current;
  const menuCancelScale = useRef(new Animated.Value(1)).current;
  const settingsButtonOpacity = useRef(new Animated.Value(1)).current;
  const menuContainerScale = useRef(new Animated.Value(0.85)).current;
  const menuContainerOpacity = useRef(new Animated.Value(0)).current;
  const nextHypnosisScale = useRef(new Animated.Value(1)).current;
  const nextHypnosisOpacity = useRef(new Animated.Value(1)).current;

  const [downloads, setDownloads] = useState<Record<string, DownloadInfo>>({});
  const timersRef = useRef<Record<string, NodeJS.Timeout | number>>({});

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Tamaño/espaciado estilo “foto 1”
  const cardWidth = useMemo(() => Math.min(263.35, screenWidth * 1.725), [screenWidth]);
  const cardSpacing = 20;
  const snapInterval = cardWidth + cardSpacing;
  const sidePadding = (screenWidth - cardWidth) / 2;

  const scrollX = useRef(new Animated.Value(0)).current;
  const currentIndexRef = useRef<number>(0);
  const lastHapticIndexRef = useRef<number>(0);

  const carouselScrollOffsetRef = useRef<number>(0);
  const listScrollOffsetRef = useRef<number>(0);
  const previousScrollOffsetRef = useRef<number>(0);

  const carouselFlatListRef = useRef<FlatList<HypnosisSession>>(null);
  const listFlatListRef = useRef<FlatList<HypnosisSession>>(null);
  const previousFlatListRef = useRef<FlatList<HypnosisSession>>(null);

  const cardHeight = useMemo(() => cardWidth * (5 / 4), [cardWidth]);
  const titleHeight = 90;
  const totalCardHeight = cardHeight + titleHeight;

  const isFirstLoadRef = useRef<boolean>(true);
  const [isCarouselReady, setIsCarouselReady] = useState<boolean>(true);

  const toggleIndicatorAnim = useRef(new Animated.Value(0)).current;
  const [toggleButtonLayouts, setToggleButtonLayouts] = useState<{
    carousel: { x: number; width: number };
    list: { x: number; width: number };
    previous: { x: number; width: number };
  }>({ carousel: { x: 0, width: 32 }, list: { x: 0, width: 32 }, previous: { x: 0, width: 0 } });

  const navIndicatorAnim = useRef(new Animated.Value(0)).current;
  const [navButtonLayouts, setNavButtonLayouts] = useState<{
    hipnosis: { x: number; width: number };
    aura: { x: number; width: number };
  }>({ hipnosis: { x: 0, width: 100 }, aura: { x: 0, width: 100 } });

  const handleOpen = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
    }
    setModalVisible(true);
  }, []);

  const handleClose = useCallback(() => setModalVisible(false), []);

  const isNavigatingNextHypnosisRef = useRef<boolean>(false);

  const handleNextHypnosis = useCallback(async () => {
    if (isNavigatingNextHypnosisRef.current) return;
    isNavigatingNextHypnosisRef.current = true;

    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
    }
    router.push('/form');

    setTimeout(() => {
      isNavigatingNextHypnosisRef.current = false;
    }, 1000);
  }, []);

  const handleNextHypnosisPressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(nextHypnosisScale, {
        toValue: 0.95,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }),
      Animated.timing(nextHypnosisOpacity, {
        toValue: 0.6,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [nextHypnosisScale, nextHypnosisOpacity]);

  const handleNextHypnosisPressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(nextHypnosisScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(nextHypnosisOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [nextHypnosisScale, nextHypnosisOpacity]);

  const onScroll = useCallback((e: { nativeEvent: { contentOffset: { x: number } } }) => {
    try {
      const x = e?.nativeEvent?.contentOffset?.x ?? 0;
      carouselScrollOffsetRef.current = x;
      const currentIndex = Math.round(x / snapInterval);
      if (currentIndex !== lastHapticIndexRef.current) {
        lastHapticIndexRef.current = currentIndex;
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        }
      }
    } catch (err) {
      console.log('[Carousel] onScroll error', err);
    }
  }, [snapInterval]);

  const onMomentumScrollEnd = useCallback((e: { nativeEvent: { contentOffset: { x: number } } }) => {
    try {
      const x = e?.nativeEvent?.contentOffset?.x ?? 0;
      const nextIndex = Math.round(x / snapInterval);
      currentIndexRef.current = nextIndex;
      console.log('[Carousel] momentum end x:', x, 'nextIndex:', nextIndex);
    } catch (err) {
      console.log('[Carousel] onMomentumScrollEnd error', err);
    }
  }, [snapInterval]);

  const handleCardPress = useCallback(async (session: HypnosisSession) => {
    if (session.isGrayscale) {
      return;
    }
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
    }
    setSelectedSession(session);
    handleOpen();
  }, [handleOpen]);

  const keyExtractor = useCallback((i: HypnosisSession) => i.id, []);

  const restoreScrollPositions = useCallback((targetMode: ViewMode) => {
    try {
      if (targetMode === 'carousel' && carouselFlatListRef.current) {
        const x = Math.max(0, carouselScrollOffsetRef.current ?? 0);
        console.log('[Restore] Carousel to x:', x);
        carouselFlatListRef.current.scrollToOffset({ offset: x, animated: false });
      }
      if (targetMode === 'list' && listFlatListRef.current) {
        const y = Math.max(0, listScrollOffsetRef.current ?? 0);
        console.log('[Restore] List to y:', y);
        listFlatListRef.current.scrollToOffset({ offset: y, animated: false });
      }
      if (targetMode === 'previous' && previousFlatListRef.current) {
        const y2 = Math.max(0, previousScrollOffsetRef.current ?? 0);
        console.log('[Restore] Previous to y:', y2);
        previousFlatListRef.current.scrollToOffset({ offset: y2, animated: false });
      }
    } catch (err) {
      console.log('[Restore] error restoring scroll', err);
    }
  }, []);

  const handleNavSectionChange = useCallback(async (section: NavSection) => {
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
    }

    const targetPosition = section === 'hipnosis' ? 0 : 1;
    Animated.spring(navIndicatorAnim, {
      toValue: targetPosition,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();

    setNavSection(section);
  }, [navIndicatorAnim]);

  const hasPreviousDownloadsRef = useRef<boolean>(true);

  const handleViewModeChange = useCallback(async (mode: ViewMode) => {
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    }

    if (mode === 'previous' && !isOnline && !hasPreviousDownloadsRef.current) {
      return;
    }

    const targetPosition = mode === 'carousel' ? 0 : mode === 'list' ? 1 : 2;
    Animated.spring(toggleIndicatorAnim, {
      toValue: targetPosition,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();

    const isChangingToPrevious = mode === 'previous';
    const isChangingFromPrevious = viewMode === 'previous';
    const shouldAnimate = isChangingToPrevious || isChangingFromPrevious;

    if (shouldAnimate) {
      const enterFrom = mode === 'previous' ? 50 : -50;
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start(() => {
        setViewMode(mode);
        requestAnimationFrame(() => {
          fadeAnim.setValue(0);
          slideAnim.setValue(enterFrom);
          requestAnimationFrame(() => {
            restoreScrollPositions(mode);
            requestAnimationFrame(() => {
              Animated.parallel([
                Animated.timing(fadeAnim, {
                  toValue: 1,
                  duration: 150,
                  useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                  toValue: 0,
                  duration: 150,
                  useNativeDriver: true,
                }),
              ]).start();
            });
          });
        });
      });
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start(() => {
        setViewMode(mode);
        requestAnimationFrame(() => {
          restoreScrollPositions(mode);
          requestAnimationFrame(() => {
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 120,
              useNativeDriver: true,
            }).start();
          });
        });
      });
      slideAnim.setValue(0);
    }
  }, [fadeAnim, slideAnim, toggleIndicatorAnim, viewMode, restoreScrollPositions, isOnline]);

  const handleMenuPress = useCallback((session: HypnosisSession, mode: ViewMode) => {
    setMenuSession(session);
    setMenuViewMode(mode);
    setMenuModalVisible(true);
    
    menuContainerScale.setValue(0.85);
    menuContainerOpacity.setValue(0);
    menuPrimaryScale.setValue(1);
    menuDownloadScale.setValue(1);
    menuQAScale.setValue(1);
    menuRenameScale.setValue(1);
    menuCancelScale.setValue(1);
    
    Animated.parallel([
      Animated.spring(menuContainerScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }),
      Animated.timing(menuContainerOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [menuContainerScale, menuContainerOpacity, menuPrimaryScale, menuDownloadScale, menuQAScale, menuRenameScale, menuCancelScale]);

  const handleMenuClose = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    }
    
    Animated.parallel([
      Animated.timing(menuContainerScale, {
        toValue: 0.85,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(menuContainerOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMenuModalVisible(false);
    });
  }, [menuContainerScale, menuContainerOpacity]);

  const startDownload = useCallback((id: string) => {
    setDownloads((prev) => ({
      ...prev,
      [id]: { progress: 0, state: 'downloading' },
    }));
    try {
      const stepMs = 400;
      const handle = setInterval(() => {
        setDownloads((prev) => {
          const current = prev[id] ?? { progress: 0, state: 'downloading' };
          if (current.state !== 'downloading') return prev;
          const next = Math.min(100, (current.progress ?? 0) + Math.floor(5 + Math.random() * 12));
          const state: DownloadState = next >= 100 ? 'completed' : 'downloading';
          return { ...prev, [id]: { progress: next, state } };
        });
      }, stepMs) as unknown as number;
      timersRef.current[id] = handle;
    } catch (e) {
      console.log('Download simulation error', e);
      setDownloads((prev) => ({ ...prev, [id]: { progress: 0, state: 'idle' } }));
    }
  }, []);

  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState<boolean>(false);
  const [sessionToDelete, setSessionToDelete] = useState<HypnosisSession | null>(null);
  const deleteAlertScale = useRef(new Animated.Value(0.85)).current;
  const deleteAlertOpacity = useRef(new Animated.Value(0)).current;
  const deleteCancelButtonScale = useRef(new Animated.Value(1)).current;
  const deleteCancelButtonOpacity = useRef(new Animated.Value(1)).current;
  const deleteConfirmButtonScale = useRef(new Animated.Value(1)).current;
  const deleteConfirmButtonOpacity = useRef(new Animated.Value(1)).current;

  const handleMenuAction = useCallback(async (action: string) => {
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
    }
    console.log(`Action: ${action} for session:`, menuSession?.title);
    
    if (!menuSession) return;

    if (action === 'play') {
      setMenuModalVisible(false);
      setPlayerSession(menuSession);
      setPlayerModalVisible(true);
    }

    if (action === 'qa') {
      setMenuModalVisible(false);
      router.push('/qa');
    }

    if (action === 'rename') {
      setMenuModalVisible(false);
      setSessionToRename(menuSession);
      setRenameModalVisible(true);
    }

    if (action === 'download') {
      const id = menuSession.id;
      const downloadInfo = downloads[id];
      
      if (downloadInfo?.state === 'completed') {
        setMenuModalVisible(false);
        setSessionToDelete(menuSession);
        setDeleteConfirmVisible(true);
        deleteAlertScale.setValue(0.85);
        deleteAlertOpacity.setValue(0);
        Animated.parallel([
          Animated.spring(deleteAlertScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 120,
            friction: 14,
          }),
          Animated.timing(deleteAlertOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      } else if (downloadInfo?.state !== 'downloading') {
        setMenuModalVisible(false);
        startDownload(id);
      }
    }
  }, [menuSession, startDownload, downloads]);

  const handleListItemPress = useCallback(async (session: HypnosisSession) => {
    if (session.isGrayscale) {
      return;
    }
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
    }
    
    if (viewMode === 'previous') {
      setPlayerSession(session);
      setPlayerModalVisible(true);
    } else {
      setSelectedSession(session);
      handleOpen();
    }
  }, [viewMode, handleOpen]);

  const previousDownloadsRef = useRef<Record<string, DownloadState>>({});

  useEffect(() => {
    Object.entries(downloads).forEach(([id, info]) => {
      const previousState = previousDownloadsRef.current[id];
      
      if (info?.state === 'completed') {
        if (timersRef.current[id]) {
          const t = timersRef.current[id];
          if (typeof t === 'number') clearInterval(t as number);
          timersRef.current[id] = 0;
        }
        
        if (previousState !== 'completed') {
          const session = [...hypnosisSessions, ...previousSessions].find(s => s.id === id);
          if (session) {
            console.log('[Download] Completed download for:', session.title);
            setCompletedDownloadTitle(session.title);
            setDownloadCompleteModalVisible(true);
          }
        }
      }
      
      previousDownloadsRef.current[id] = info?.state ?? 'idle';
    });
  }, [downloads, hypnosisSessions, previousSessions]);

  const menuDownload: DownloadInfo | undefined = menuSession ? downloads[menuSession.id] : undefined;

  const renderListItem = useCallback(
    ({ item }: ListRenderItemInfo<HypnosisSession>) => (
      <ListItem
        item={item}
        onPress={handleListItemPress}
        onMenuPress={(session) => handleMenuPress(session, viewMode)}
        viewMode={viewMode}
        downloadInfo={downloads[item.id]}
      />
    ),
    [handleListItemPress, handleMenuPress, viewMode, downloads]
  );

  const onListScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
    listScrollOffsetRef.current = e?.nativeEvent?.contentOffset?.y ?? 0;
  }, []);

  const onPreviousScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
    previousScrollOffsetRef.current = e?.nativeEvent?.contentOffset?.y ?? 0;
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? true;
      setIsOnline(connected);
      console.log('[NetInfo] Connection status:', connected);
      
      if (!connected) {
        setYaDisponibleModalVisible(false);
      }
    });

    NetInfo.fetch().then(state => {
      const connected = state.isConnected ?? true;
      setIsOnline(connected);
      console.log('[NetInfo] Initial connection status:', connected);
      
      if (connected) {
        setYaDisponibleModalVisible(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const filteredSessions = useMemo(() => {
    if (isOnline) {
      return hypnosisSessions;
    }
    return hypnosisSessions.filter(session => downloads[session.id]?.state === 'completed');
  }, [isOnline, downloads, hypnosisSessions]);

  const filteredPreviousSessions = useMemo(() => {
    if (isOnline) {
      return previousSessions;
    }
    return previousSessions.filter(session => downloads[session.id]?.state === 'completed');
  }, [isOnline, downloads, previousSessions]);

  const hasPreviousDownloads = useMemo(() => {
    return filteredPreviousSessions.length > 0;
  }, [filteredPreviousSessions]);

  const hasCarouselListDownloads = useMemo(() => {
    return filteredSessions.length > 0;
  }, [filteredSessions]);

  useEffect(() => {
    hasPreviousDownloadsRef.current = hasPreviousDownloads;
  }, [hasPreviousDownloads]);

  useEffect(() => {
    if (!isOnline) {
      const hasNewDownloads = hasCarouselListDownloads;
      const hasOldDownloads = hasPreviousDownloads;
      
      if (hasNewDownloads && !hasOldDownloads && viewMode === 'previous') {
        const targetPosition = 0;
        Animated.spring(toggleIndicatorAnim, {
          toValue: targetPosition,
          useNativeDriver: false,
          tension: 80,
          friction: 10,
        }).start();
        setViewMode('carousel');
      } else if (!hasNewDownloads && hasOldDownloads && (viewMode === 'carousel' || viewMode === 'list')) {
        const targetPosition = 2;
        Animated.spring(toggleIndicatorAnim, {
          toValue: targetPosition,
          useNativeDriver: false,
          tension: 80,
          friction: 10,
        }).start();
        setViewMode('previous');
      }
    }
  }, [isOnline, hasCarouselListDownloads, hasPreviousDownloads, viewMode, toggleIndicatorAnim]);

  const showToggle = useMemo(() => {
    if (isOnline) {
      return previousSessions.length > 0;
    }
    return hasPreviousDownloads || hasCarouselListDownloads;
  }, [isOnline, hasPreviousDownloads, hasCarouselListDownloads, previousSessions]);

  const headerTitle = useMemo(() => {
    if (!isOnline) {
      return t('index.headerTitleOffline');
    }
    return t('index.headerTitle');
  }, [isOnline, t]);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<HypnosisSession>) => (
      <CarouselItem
        item={item}
        index={index}
        cardWidth={cardWidth}
        cardSpacing={cardSpacing}
        snapInterval={snapInterval}
        scrollX={scrollX}
        onPress={handleCardPress}
        downloadInfo={downloads[item.id]}
        totalItems={filteredSessions.length}
      />
    ),
    [cardWidth, cardSpacing, snapInterval, scrollX, handleCardPress, downloads, filteredSessions]
  );

  return (
    <View style={styles.root} testID="root-fullscreen">
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <SafeAreaView style={styles.safe} testID="safe-area">
        <View style={styles.container}>
          <View style={styles.headerRow} testID="header-row">
            <Text style={styles.headerTitle}>{headerTitle}</Text>
            <Pressable 
              style={styles.headerRight}
              onPress={async () => {
                if (Platform.OS !== 'web') {
                  try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
                }
                setSettingsModalVisible(true);
              }}
              onPressIn={() => {
                Animated.timing(settingsButtonOpacity, {
                  toValue: 0.5,
                  duration: 150,
                  useNativeDriver: true,
                }).start();
              }}
              onPressOut={() => {
                Animated.timing(settingsButtonOpacity, {
                  toValue: 1,
                  duration: 150,
                  useNativeDriver: true,
                }).start();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Animated.View style={{ opacity: settingsButtonOpacity }}>
                <Settings
                  color="#fbefd9"
                  size={28}
                  strokeWidth={1.5}
                  testID="header-settings-icon"
                  accessibilityLabel="Configuración"
                />
              </Animated.View>
            </Pressable>
          </View>

          {showToggle && (
            <View style={styles.toggleRow} testID="toggle-under-title">
              <View style={styles.toggleContainer}>
                <Animated.View
                  style={[
                    styles.toggleIndicator,
                    {
                      transform: [{
                        translateX: toggleIndicatorAnim.interpolate({
                          inputRange: [0, 1, 2],
                          outputRange: [
                            toggleButtonLayouts.carousel.x,
                            toggleButtonLayouts.list.x,
                            toggleButtonLayouts.previous.x,
                          ],
                        }),
                      }],
                      width: toggleIndicatorAnim.interpolate({
                        inputRange: [0, 1, 2],
                        outputRange: [
                          toggleButtonLayouts.carousel.width,
                          toggleButtonLayouts.list.width,
                          toggleButtonLayouts.previous.width,
                        ],
                      }),
                    },
                  ]}
                />
                {(isOnline || hasCarouselListDownloads) && (
                  <>
                    <Pressable
                      style={styles.toggleOption}
                      onPress={() => handleViewModeChange('carousel')}
                      android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.08)', borderless: true } : undefined}
                      testID="toggle-carousel"
                      accessibilityLabel="Vista carrusel"
                      onLayout={(event) => {
                        const { x, width } = event.nativeEvent.layout;
                        setToggleButtonLayouts(prev => ({ ...prev, carousel: { x, width } }));
                      }}
                    >
                      <View style={styles.toggleIconCarouselVertical}>
                        <View style={[styles.toggleIconBarSingle, viewMode === 'carousel' && styles.toggleIconActiveBg]} />
                      </View>
                    </Pressable>
                    <Pressable
                      style={styles.toggleOption}
                      onPress={() => handleViewModeChange('list')}
                      android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.08)', borderless: true } : undefined}
                      testID="toggle-list"
                      accessibilityLabel="Vista lista"
                      onLayout={(event) => {
                        const { x, width } = event.nativeEvent.layout;
                        setToggleButtonLayouts(prev => ({ ...prev, list: { x, width } }));
                      }}
                    >
                      <View style={styles.toggleIconList}>
                        <View style={[styles.toggleIconListLine, viewMode === 'list' && styles.toggleIconActiveListLine]} />
                        <View style={[styles.toggleIconListLine, viewMode === 'list' && styles.toggleIconActiveListLine]} />
                        <View style={[styles.toggleIconListLine, viewMode === 'list' && styles.toggleIconActiveListLine]} />
                      </View>
                    </Pressable>
                  </>
                )}
                {(isOnline || hasPreviousDownloads) && (
                  <Pressable
                    style={[styles.toggleOption, styles.toggleOptionText]}
                    onPress={() => handleViewModeChange('previous')}
                    android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.08)', borderless: true } : undefined}
                    testID="toggle-previous"
                    accessibilityLabel="Anteriores"
                    onLayout={(event) => {
                      const { x, width } = event.nativeEvent.layout;
                      setToggleButtonLayouts(prev => ({ ...prev, previous: { x, width } }));
                    }}
                  >
                    <Text numberOfLines={1} style={[styles.toggleText, viewMode === 'previous' && styles.toggleTextActive]}>{t('index.toggle.previous')}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {viewMode === 'carousel' ? (
            <Animated.View style={[styles.carouselContainer, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
              {!isCarouselReady && (
                <View style={styles.skeletonContainer}>
                  <View style={styles.skeletonCarouselWrapper}>
                    <View style={[styles.skeletonCard, styles.skeletonCardSide, { width: cardWidth * 0.9 }]} />
                    <View style={[styles.skeletonCard, styles.skeletonCardCenter, { width: cardWidth }]}>
                      <View style={styles.skeletonImage} />
                      <View style={styles.skeletonTitle} />
                      <View style={styles.skeletonTitleShort} />
                    </View>
                    <View style={[styles.skeletonCard, styles.skeletonCardSide, { width: cardWidth * 0.9 }]} />
                  </View>
                </View>
              )}
              {filteredSessions.length === 0 ? (
                <View style={styles.emptyStateCarousel}>
                  <Text style={styles.emptyMainTitle}>{t('index.empty.title')}</Text>
                  <Text style={styles.emptySubtitle}>{t('index.empty.subtitle')}</Text>
                  <Text style={styles.emptySubtitle2}>{t('index.empty.subtitle2')}</Text>
                </View>
              ) : (
                <Animated.FlatList
                  ref={carouselFlatListRef}
                  data={filteredSessions}
                  keyExtractor={keyExtractor}
                  renderItem={renderItem}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  bounces
                  alwaysBounceHorizontal
                  overScrollMode={Platform.OS === 'android' ? 'always' : 'auto'}
                  decelerationRate="fast"
                  snapToInterval={snapInterval}
                  snapToAlignment="start"
                  onMomentumScrollEnd={onMomentumScrollEnd}
                  testID="hypnosis-carousel"
                  getItemLayout={(data: ArrayLike<HypnosisSession> | null | undefined, index: number) => ({
                    length: snapInterval,
                    offset: index * snapInterval,
                    index,
                  })}
                  contentContainerStyle={{
                    paddingLeft: sidePadding,
                    paddingRight: sidePadding,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false, listener: onScroll }
                  )}
                  scrollEventThrottle={16}
                  style={!isCarouselReady ? { opacity: 0 } : undefined}
                />
              )}
            </Animated.View>
          ) : viewMode === 'list' ? (
            <Animated.View style={[styles.listContainer, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
              {filteredSessions.length === 0 ? (
                <View style={styles.emptyStateList}>
                  <Text style={styles.emptyMainTitle}>{t('index.empty.title')}</Text>
                  <Text style={styles.emptySubtitle}>{t('index.empty.subtitle')}</Text>
                  <Text style={styles.emptySubtitle2}>{t('index.empty.subtitle2')}</Text>
                </View>
              ) : (
                <FlatList
                  ref={listFlatListRef}
                  data={filteredSessions}
                  keyExtractor={keyExtractor}
                  renderItem={renderListItem}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContentContainer}
                  testID="hypnosis-list"
                  onScroll={onListScroll}
                  scrollEventThrottle={16}
                />
              )}
            </Animated.View>
          ) : (
            <Animated.View style={[styles.listContainer, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
              {filteredPreviousSessions.length === 0 ? (
                <View style={styles.emptyStateList}>
                  {isOnline ? (
                    <Text style={styles.emptyMainTitle}>{t('index.empty.noPrevious')}</Text>
                  ) : (
                    <>
                      <Text style={styles.emptyMainTitle}>{t('index.empty.title')}</Text>
                      <Text style={styles.emptySubtitle}>{t('index.empty.subtitle')}</Text>
                      <Text style={styles.emptySubtitle2}>{t('index.empty.subtitle2')}</Text>
                    </>
                  )}
                </View>
              ) : (
                <FlatList
                  ref={previousFlatListRef}
                  data={filteredPreviousSessions}
                  keyExtractor={keyExtractor}
                  renderItem={renderListItem}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContentContainer}
                  testID="hypnosis-previous-list"
                  onScroll={onPreviousScroll}
                  scrollEventThrottle={16}
                />
              )}
            </Animated.View>
          )}
        </View>

        {isOnline && (
          <View style={styles.bottomSection}>
            <Animated.View
              style={{
                transform: [{ scale: nextHypnosisScale }],
                opacity: nextHypnosisOpacity,
              }}
            >
              <Pressable
                style={styles.nextButton}
                onPress={handleNextHypnosis}
                onPressIn={handleNextHypnosisPressIn}
                onPressOut={handleNextHypnosisPressOut}
                android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.08)' } : undefined}
              >
                <Text style={styles.nextButtonText}>{t('index.nextButton')}</Text>
              </Pressable>
            </Animated.View>
          </View>
        )}

      </SafeAreaView>

      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>{t('index.offline.banner')}</Text>
        </View>
      )}

      <View style={styles.footerNav}>
        <View style={styles.navToggleContainer}>
          <Pressable
            style={styles.navToggleOption}
            onPress={() => handleNavSectionChange('hipnosis')}
            android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.08)', borderless: true } : undefined}
            testID="nav-hipnosis"
            accessibilityLabel="Hipnosis"
          >
            <Text style={[styles.navToggleTextLabel, navSection === 'hipnosis' && styles.navToggleTextLabelActive]}>{t('index.nav.hypnosis')}</Text>
          </Pressable>
          <Pressable
            style={styles.navToggleOption}
            onPress={() => handleNavSectionChange('aura')}
            android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.08)', borderless: true } : undefined}
            testID="nav-aura"
            accessibilityLabel="Aura"
          >
            <Text style={[styles.navToggleTextLabel, navSection === 'aura' && styles.navToggleTextLabelActive]}>{t('index.nav.aura')}</Text>
          </Pressable>
        </View>
      </View>

      <SwipeUpModal
        visible={modalVisible}
        onClose={handleClose}
        imageUri={selectedSession?.imageUri ?? ''}
        title={selectedSession?.title ?? ''}
        downloadInfo={selectedSession ? downloads[selectedSession.id] : undefined}
        onRequestDownload={() => {
          if (selectedSession) {
            startDownload(selectedSession.id);
          }
        }}
        onRequestDelete={() => {
          if (selectedSession) {
            const id = selectedSession.id;
            setDownloads((prev) => {
              const { [id]: _, ...rest } = prev;
              return rest;
            });
          }
        }}
        isOnline={isOnline}
      />

      {menuModalVisible && (
        <View style={styles.menuOverlay}>
          <Pressable style={styles.menuBackdrop} onPress={handleMenuClose} />
          <Animated.View style={[
            styles.menuContainer,
            {
              opacity: menuContainerOpacity,
              transform: [{ scale: menuContainerScale }],
            },
          ]}>
            <View style={styles.menuGradientBg}>
              <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
                <Defs>
                  <SvgLinearGradient id="menuBg" x1="0%" y1="0%" x2="86.6%" y2="50%">
                    <Stop offset="0%" stopColor="#a2380e" stopOpacity={1} />
                    <Stop offset="100%" stopColor="#7c2709" stopOpacity={1} />
                  </SvgLinearGradient>
                </Defs>
                <Rect x={0} y={0} width="100%" height="100%" fill="url(#menuBg)" />
              </Svg>
            </View>
            
            <View style={styles.menuContent}>
              <View style={styles.menuHeader}>
                <Pressable
                  style={styles.menuCloseButton}
                  onPress={handleMenuClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X color="#ffffff" size={24} strokeWidth={2} />
                </Pressable>
              </View>
              <Text style={styles.menuTitle} numberOfLines={2}>{menuSession?.title}</Text>

              <Pressable
                onPress={() => handleMenuAction('play')}
                onPressIn={() => {
                  Animated.spring(menuPrimaryScale, {
                    toValue: 0.9,
                    useNativeDriver: true,
                    speed: 50,
                    bounciness: 0,
                  }).start();
                }}
                onPressOut={() => {
                  Animated.spring(menuPrimaryScale, {
                    toValue: 1,
                    useNativeDriver: true,
                    speed: 50,
                    bounciness: 0,
                  }).start();
                }}
                android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.15)' } : undefined}
                testID="menu-primary-play"
                accessibilityLabel="Reproducir"
              >
                <Animated.View style={[styles.menuPrimary, { transform: [{ scale: menuPrimaryScale }], opacity: menuPrimaryScale.interpolate({ inputRange: [0.9, 1], outputRange: [0.2, 1] }) }]}>
                  <Play color="#1a0d08" size={22} fill="#1a0d08" />
                  <Text style={styles.menuPrimaryText}>{t('index.menu.playNow')}</Text>
                </Animated.View>
              </Pressable>

              <View style={styles.menuDivider} />

              <Pressable
                onPress={() => handleMenuAction('download')}
                onPressIn={() => {
                  if (menuDownload?.state === 'downloading') return;
                  Animated.spring(menuDownloadScale, {
                    toValue: 0.9,
                    useNativeDriver: true,
                    speed: 50,
                    bounciness: 0,
                  }).start();
                }}
                onPressOut={() => {
                  if (menuDownload?.state === 'downloading') return;
                  Animated.spring(menuDownloadScale, {
                    toValue: 1,
                    useNativeDriver: true,
                    speed: 50,
                    bounciness: 0,
                  }).start();
                }}
                android_ripple={Platform.OS === 'android' ? { color: 'transparent' } : undefined}
                testID="menu-download"
                accessibilityLabel="Descargar"
                disabled={menuDownload?.state === 'downloading'}
              >
                <Animated.View style={[styles.menuItem, { transform: [{ scale: menuDownloadScale }], opacity: menuDownloadScale.interpolate({ inputRange: [0.9, 1], outputRange: [0.8, 1] }) }]}>
                  {menuDownload?.state === 'downloading' && (
                    <View 
                      style={[
                        styles.menuItemProgressBar,
                        { width: `${Math.max(0, Math.min(100, Math.round(menuDownload.progress)))}%` }
                      ]}
                    />
                  )}
                  {menuDownload?.state === 'downloading' ? (
                    <Text style={styles.menuItemText}>{Math.max(0, Math.min(100, Math.round(menuDownload.progress)))}%</Text>
                  ) : (
                    <>
                      <View style={[styles.menuIconContainer, styles.menuIconAccent]}>
                        {menuDownload?.state === 'completed' ? (
                          <Check color="#ffffff" size={20} />
                        ) : (
                          <Download color="#ffffff" size={20} />
                        )}
                      </View>
                      <Text style={styles.menuItemText}>
                        {menuDownload?.state === 'completed' ? t('index.menu.downloaded') : t('index.menu.download')}
                      </Text>
                    </>
                  )}
                </Animated.View>
              </Pressable>

              {menuViewMode === 'previous' && (
                <>
                  <View style={styles.menuDivider} />
                  <Pressable
                    onPress={() => handleMenuAction('qa')}
                    onPressIn={() => {
                      Animated.spring(menuQAScale, {
                        toValue: 0.9,
                        useNativeDriver: true,
                        speed: 50,
                        bounciness: 0,
                      }).start();
                    }}
                    onPressOut={() => {
                      Animated.spring(menuQAScale, {
                        toValue: 1,
                        useNativeDriver: true,
                        speed: 50,
                        bounciness: 0,
                      }).start();
                    }}
                    android_ripple={Platform.OS === 'android' ? { color: 'transparent' } : undefined}
                    testID="menu-qa"
                    accessibilityLabel="Preguntas y respuestas"
                  >
                    <Animated.View style={[styles.menuItem, { transform: [{ scale: menuQAScale }], opacity: menuQAScale.interpolate({ inputRange: [0.9, 1], outputRange: [0.8, 1] }) }]}>
                      <View style={styles.menuIconContainer}>
                        <MessageCircle color="#ffffff" size={20} />
                      </View>
                      <Text style={styles.menuItemText}>{t('index.menu.qa')}</Text>
                    </Animated.View>
                  </Pressable>

                  <Pressable
                    onPress={() => handleMenuAction('rename')}
                    onPressIn={() => {
                      Animated.spring(menuRenameScale, {
                        toValue: 0.9,
                        useNativeDriver: true,
                        speed: 50,
                        bounciness: 0,
                      }).start();
                    }}
                    onPressOut={() => {
                      Animated.spring(menuRenameScale, {
                        toValue: 1,
                        useNativeDriver: true,
                        speed: 50,
                        bounciness: 0,
                      }).start();
                    }}
                    android_ripple={Platform.OS === 'android' ? { color: 'transparent' } : undefined}
                    testID="menu-rename"
                    accessibilityLabel="Cambiar nombre"
                  >
                    <Animated.View style={[styles.menuItem, { transform: [{ scale: menuRenameScale }], opacity: menuRenameScale.interpolate({ inputRange: [0.9, 1], outputRange: [0.8, 1] }) }]}>
                      <View style={styles.menuIconContainer}>
                        <Edit3 color="#ffffff" size={20} />
                      </View>
                      <Text style={styles.menuItemText}>{t('index.menu.rename')}</Text>
                    </Animated.View>
                  </Pressable>
                </>
              )}
            </View>
          </Animated.View>
        </View>
      )}

      <PlayerModal
        visible={playerModalVisible}
        onClose={() => setPlayerModalVisible(false)}
        mode="audio"
        title={playerSession?.title}
        mediaUri="https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/Mental%20Login%20Background_1.mp4"
      />

      <SettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        isOnline={isOnline}
      />

      <YaDisponibleModal
        visible={yaDisponibleModalVisible}
        onClose={() => setYaDisponibleModalVisible(false)}
        onRequestNow={() => {
          setYaDisponibleModalVisible(false);
          router.push('/form');
        }}
      />

      <DownloadCompleteModal
        visible={downloadCompleteModalVisible}
        onClose={() => setDownloadCompleteModalVisible(false)}
        hypnosisTitle={completedDownloadTitle}
      />

      {renameModalVisible && sessionToRename && (
        <RenameHypnosisModal
          visible={renameModalVisible}
          onClose={() => {
            setRenameModalVisible(false);
            setSessionToRename(null);
          }}
          currentName={sessionToRename.title}
          onSave={(newName) => {
            const isInPrevious = previousSessions.some(s => s.id === sessionToRename.id);
            
            if (isInPrevious) {
              setPreviousSessions(prev => 
                prev.map(s => s.id === sessionToRename.id ? { ...s, title: newName } : s)
              );
            } else {
              setHypnosisSessions(prev => 
                prev.map(s => s.id === sessionToRename.id ? { ...s, title: newName } : s)
              );
            }
            
            console.log('[Rename] Changed name to:', newName);
          }}
        />
      )}

      {deleteConfirmVisible && sessionToDelete && (
        <View style={styles.menuOverlay}>
          <Pressable 
            style={styles.menuBackdrop} 
            onPress={() => {
              Animated.parallel([
                Animated.timing(deleteAlertScale, {
                  toValue: 0.85,
                  duration: 150,
                  useNativeDriver: true,
                }),
                Animated.timing(deleteAlertOpacity, {
                  toValue: 0,
                  duration: 150,
                  useNativeDriver: true,
                }),
              ]).start(() => {
                setDeleteConfirmVisible(false);
              });
            }} 
          />
          <Animated.View style={[
            styles.deleteConfirmContainer,
            {
              opacity: deleteAlertOpacity,
              transform: [{ scale: deleteAlertScale }],
            },
          ]}>
            <View style={styles.deleteConfirmGradientBg}>
              <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
                <Defs>
                  <SvgLinearGradient id="deleteBg" x1="0%" y1="0%" x2="86.6%" y2="50%">
                    <Stop offset="0%" stopColor="#a2380e" stopOpacity={1} />
                    <Stop offset="100%" stopColor="#7c2709" stopOpacity={1} />
                  </SvgLinearGradient>
                </Defs>
                <Rect x={0} y={0} width="100%" height="100%" fill="url(#deleteBg)" />
              </Svg>
            </View>
            <View style={styles.deleteConfirmContent}>
              <Text style={styles.deleteConfirmTitle}>{t('index.delete.title')}</Text>
              <Text style={styles.deleteConfirmMessage}>{t('index.delete.message')}</Text>
              <View style={styles.deleteConfirmButtons}>
                <Animated.View style={{ flex: 1, transform: [{ scale: deleteCancelButtonScale }], opacity: deleteCancelButtonOpacity }}>
                  <Pressable
                    style={styles.deleteConfirmCancelButton}
                    onPress={async () => {
                      if (Platform.OS !== 'web') {
                        try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                      }
                      Animated.parallel([
                        Animated.timing(deleteAlertScale, {
                          toValue: 0.85,
                          duration: 150,
                          useNativeDriver: true,
                        }),
                        Animated.timing(deleteAlertOpacity, {
                          toValue: 0,
                          duration: 150,
                          useNativeDriver: true,
                        }),
                      ]).start(() => {
                        setDeleteConfirmVisible(false);
                      });
                    }}
                    onPressIn={() => {
                      Animated.parallel([
                        Animated.spring(deleteCancelButtonScale, {
                          toValue: 0.9,
                          useNativeDriver: true,
                          speed: 50,
                          bounciness: 0,
                        }),
                        Animated.timing(deleteCancelButtonOpacity, {
                          toValue: 0.2,
                          duration: 150,
                          useNativeDriver: true,
                        }),
                      ]).start();
                    }}
                    onPressOut={() => {
                      Animated.parallel([
                        Animated.spring(deleteCancelButtonScale, {
                          toValue: 1,
                          useNativeDriver: true,
                          speed: 50,
                          bounciness: 4,
                        }),
                        Animated.timing(deleteCancelButtonOpacity, {
                          toValue: 1,
                          duration: 150,
                          useNativeDriver: true,
                        }),
                      ]).start();
                    }}
                  >
                    <Text style={styles.deleteConfirmCancelText}>{t('index.delete.cancel')}</Text>
                  </Pressable>
                </Animated.View>
                <Animated.View style={{ flex: 1, transform: [{ scale: deleteConfirmButtonScale }], opacity: deleteConfirmButtonOpacity }}>
                  <Pressable
                    style={styles.deleteConfirmDeleteButton}
                    onPress={async () => {
                      if (Platform.OS !== 'web') {
                        try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
                      }
                      const id = sessionToDelete.id;
                      Animated.parallel([
                        Animated.timing(deleteAlertScale, {
                          toValue: 0.85,
                          duration: 150,
                          useNativeDriver: true,
                        }),
                        Animated.timing(deleteAlertOpacity, {
                          toValue: 0,
                          duration: 150,
                          useNativeDriver: true,
                        }),
                      ]).start(() => {
                        setDownloads((prev) => {
                          const { [id]: _, ...rest } = prev;
                          return rest;
                        });
                        setDeleteConfirmVisible(false);
                        setMenuModalVisible(false);
                      });
                    }}
                    onPressIn={() => {
                      Animated.parallel([
                        Animated.spring(deleteConfirmButtonScale, {
                          toValue: 0.9,
                          useNativeDriver: true,
                          speed: 50,
                          bounciness: 0,
                        }),
                        Animated.timing(deleteConfirmButtonOpacity, {
                          toValue: 0.2,
                          duration: 150,
                          useNativeDriver: true,
                        }),
                      ]).start();
                    }}
                    onPressOut={() => {
                      Animated.parallel([
                        Animated.spring(deleteConfirmButtonScale, {
                          toValue: 1,
                          useNativeDriver: true,
                          speed: 50,
                          bounciness: 4,
                        }),
                        Animated.timing(deleteConfirmButtonOpacity, {
                          toValue: 1,
                          duration: 150,
                          useNativeDriver: true,
                        }),
                      ]).start();
                    }}
                  >
                    <Text style={styles.deleteConfirmDeleteText}>{t('index.delete.confirm')}</Text>
                  </Pressable>
                </Animated.View>
              </View>
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#170501' },
  safe: { flex: 1, backgroundColor: '#170501' },
  offlineBanner: {
    backgroundColor: '#ff9a2e',
    paddingVertical: 6,
    paddingHorizontal: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  offlineBannerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  container: { flex: 1, paddingTop: 24, paddingBottom: 8, justifyContent: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 44,
    paddingRight: 44,
    marginBottom: 16,
    height: 40,
  },
  headerTitle: {
    fontSize: 32.4,
    fontWeight: Platform.OS === 'android' ? '600' : '700',
    color: '#fbefd9',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: { width: 28, height: 28 },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingLeft: 44,
    paddingRight: 44,
    marginBottom: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(251, 239, 217, 0.15)',
    borderRadius: 8,
    padding: 4,
    gap: 6,
    alignItems: 'center',
    position: 'relative',
  },
  toggleIndicator: {
    position: 'absolute',
    height: 32,
    backgroundColor: '#c9841e',
    borderRadius: 6,
    top: 4,
  },
  toggleOption: {
    minWidth: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  toggleOptionText: { paddingHorizontal: 10 },
  toggleIconCarouselVertical: {
    width: 12,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleIconBarSingle: {
    width: 12,
    height: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 239, 217, 0.6)',
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  toggleIconActiveBg: { borderColor: '#fbefd9' },
  toggleIconActiveListLine: { backgroundColor: '#fbefd9' },
  toggleIconList: { width: 16, height: 12, justifyContent: 'space-between' },
  toggleIconListLine: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(251, 239, 217, 0.6)',
    borderRadius: 1,
  },
  toggleText: {
    color: 'rgba(251, 239, 217, 0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleTextActive: { color: '#fbefd9' },

  // Carrusel
  carouselContainer: { flex: 1, position: 'relative', justifyContent: 'center' },
  cardWrapper: { alignItems: 'flex-start' },
  cardColumn: { alignSelf: 'stretch' },

  // Contenedor de sombra (no recorta sombras)
  cardShadow: {
    width: '100%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 18,
    backgroundColor: 'transparent',
    position: 'relative',
  },

  // Contenedor interior que recorta la imagen
  cardInner: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#2a1410',
    position: 'relative',
    justifyContent: 'center',
  },

  cardImage: { width: '100%', height: '100%' },
  revealContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  revealOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  revealImage: { ...StyleSheet.absoluteFillObject },

  cardTitleContainer: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 26,
    fontWeight: Platform.OS === 'android' ? '500' : '600',
    color: '#fbefd9',
    textAlign: 'left',
    lineHeight: 30,
  },
  cardDownloadIcon: {
    width: 15.3,
    height: 15.3,
    borderRadius: 7.65,
    backgroundColor: '#c9841e',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 7,
  },
  cardDownloadIconInside: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 17.595,
    height: 17.595,
    borderRadius: 8.7975,
    backgroundColor: '#c9841e',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  badge: {
    position: 'absolute',
    top: -13.125,
    right: 16,
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
    zIndex: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1a0d08',
    letterSpacing: 1.2,
  },

  // Pie
  bottomSection: { paddingHorizontal: 44, paddingBottom: 0, paddingTop: 0 },
  nextButton: { ...BUTTON_STYLES.primaryButton, backgroundColor: '#ff6b35', marginBottom: 0 },
  nextButtonText: { ...BUTTON_STYLES.primaryButtonText, color: '#ffffff' },

  listContainer: { flex: 1, paddingHorizontal: 44 },
  listContentContainer: { paddingTop: 24, paddingBottom: 180 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 239, 217, 0.08)',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listItemImage: {
    width: '100%',
    height: '100%',
  },
  listItemImageContainer: {
    width: 60,
    height: 75,
    borderRadius: 8,
    backgroundColor: '#2a1410',
    overflow: 'hidden',
    position: 'relative',
  },
  listItemContent: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  listItemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fbefd9',
    lineHeight: 24,
    paddingRight: 40,
  },
  durationRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 8 },
  durationIconCircle: {
    width: 15.3,
    height: 15.3,
    borderRadius: 7.65,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 239, 217, 0.3)',
  },
  durationIconCircleCompleted: {
    backgroundColor: '#c9841e',
    borderColor: '#c9841e',
  },
  durationText: { color: 'rgba(251, 239, 217, 0.6)', fontSize: 14 },
  downloadingLabel: { color: '#ff9a2e', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  downloadingIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 154, 46, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  downloadingPercentage: { color: '#ff9a2e', fontSize: 12, fontWeight: '700' },
  menuButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -5 }],
    padding: 4,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.7)' },
  menuContainer: {
    borderRadius: 20,
    width: '92%',
    maxWidth: 440,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  menuGradientBg: { ...StyleSheet.absoluteFillObject },
  menuContent: { paddingVertical: 24, paddingHorizontal: 20, position: 'relative', zIndex: 1 },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 17,
    minHeight: 32,
  },
  menuCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
    lineHeight: 28,
  },
  menuPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  menuPrimaryText: { color: '#1a0d08', fontSize: 18, fontWeight: '600', letterSpacing: 0.2 },
  menuDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 16 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 10,
    borderRadius: 14,
    backgroundColor: Platform.OS === 'android' ? '#935139' : 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  menuItemProgressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
  },
  menuIconContainer: { width: 22, height: 22, justifyContent: 'center', alignItems: 'center' },
  menuIconAccent: { width: 22, height: 22 },
  menuItemText: { fontSize: 18, fontWeight: '600', color: '#ffffff', letterSpacing: 0.2 },
  menuItemMeta: { fontSize: 15, fontWeight: '600', color: '#ffffff', opacity: 0.9 },
  menuSpacer: { height: 12 },
  menuCancel: {
    alignSelf: 'stretch',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCancelText: { color: '#ffffff', fontSize: 18, fontWeight: '600', letterSpacing: 0.2 },
  emptyStateCarousel: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: 400,
    marginTop: -40,
    paddingHorizontal: 44,
  },
  emptyStateList: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: 400,
    marginTop: -40,
  },
  emptyMainTitle: { width: '100%', textAlign: 'center', color: '#fbefd9', fontSize: 32, fontWeight: '700' as const, marginBottom: 20, marginTop: 40, lineHeight: 38 },
  emptySubtitle: { width: '100%', textAlign: 'center', color: 'rgba(251, 239, 217, 0.7)', fontSize: Platform.OS === 'android' ? 15 : 16, lineHeight: Platform.OS === 'android' ? 22 : 24, marginBottom: 16 },
  emptySubtitle2: { width: '100%', textAlign: 'center', color: 'rgba(251, 239, 217, 0.7)', fontSize: 16, lineHeight: 24 },
  deleteConfirmContainer: {
    borderRadius: 20,
    width: '92%',
    maxWidth: 440,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  deleteConfirmGradientBg: { ...StyleSheet.absoluteFillObject },
  deleteConfirmContent: { backgroundColor: '#2a1410', paddingVertical: 32, paddingHorizontal: 24, position: 'relative', zIndex: 1 },
  deleteConfirmTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  deleteConfirmMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  deleteConfirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteConfirmCancelButton: {
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteConfirmCancelText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  deleteConfirmDeleteButton: {
    paddingVertical: 16,
    backgroundColor: '#ff3b30',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteConfirmDeleteText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  footerNav: {
    backgroundColor: '#170501',
    paddingHorizontal: 44,
    paddingBottom: 20,
    paddingTop: 10,
    marginBottom: 20,
  },
  navToggleContainer: { flexDirection: 'row', gap: 80, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  navToggleOption: { justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  navToggleText: { color: 'rgba(251, 239, 217, 0.2)', fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
  navToggleTextActive: { color: '#fbefd9' },
  navToggleTextLabel: { color: 'rgba(251, 239, 217, 0.2)', fontSize: 16, fontWeight: '600' as const, letterSpacing: 0.2 },
  navToggleTextLabelActive: { color: '#fbefd9' },
  navIconImage: { width: 35.7, height: 35.7 },

  skeletonContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    paddingTop: -190,
  },
  skeletonCarouselWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  skeletonCard: { alignItems: 'flex-start' },
  skeletonCardSide: {
    aspectRatio: 4 / 5,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 239, 217, 0.05)',
    opacity: 0.5,
  },
  skeletonCardCenter: { alignItems: 'flex-start' },
  skeletonImage: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 239, 217, 0.1)',
  },
  skeletonTitle: {
    width: '90%',
    height: 26,
    marginTop: 20,
    borderRadius: 6,
    backgroundColor: 'rgba(251, 239, 217, 0.08)',
  },
  skeletonTitleShort: {
    width: '60%',
    height: 26,
    marginTop: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(251, 239, 217, 0.08)',
  },
});
