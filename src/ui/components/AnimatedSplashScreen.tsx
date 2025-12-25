import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import {
  Canvas,
  LinearGradient,
  RoundedRect,
} from '@shopify/react-native-skia';
import {
  SensorTypes,
  gyroscope,
  setUpdateIntervalForType,
  type Subscription,
} from 'react-native-sensors';
import Animated, {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

const { height: windowHeight, width: windowWidth } = Dimensions.get('window');
const splashAsset = require('../../assets/pagekeeper-icon-02-sky_blue_navy.png');

type CardPreset = 'aurora' | 'carbon';

type AnimatedSplashScreenProps = {
  isReady?: boolean;
  onAnimationEnd?: () => void;
  onFinish?: () => void;
  minVisibleDurationMs?: number;
  cardWidth?: number;
  cardHeight?: number;
  borderRadius?: number;
  cardStylePreset?: CardPreset;
  disableSensors?: boolean;
};

type HologramPreset = {
  baseColor: string;
  gradientColors: string[];
  shineColors: string[];
  borderColor: string;
  shadowColor: string;
};

type HologramCardProps = {
  width: number;
  height: number;
  borderRadius: number;
  maxTiltDegX: number;
  maxTiltDegY: number;
  perspective: number;
  tiltX: SharedValue<number>;
  tiltY: SharedValue<number>;
  tiltEnabled: SharedValue<number>;
  ambientShift: SharedValue<number>;
  preset: HologramPreset;
  children?: React.ReactNode;
};

type PointValue = { x: number; y: number };

const DEFAULT_MIN_VISIBLE_MS = 1400;
const DEFAULT_CARD_WIDTH = windowWidth;
const DEFAULT_CARD_HEIGHT = windowHeight;
const RAD_TO_DEG = 180 / Math.PI;

const HOLOGRAM_PRESETS: Record<CardPreset, HologramPreset> = {
  aurora: {
    baseColor: '#0B1021',
    gradientColors: ['#34D5FF', '#7C3AED', '#FF61D2', '#FFE98A'],
    shineColors: [
      'rgba(255,255,255,0.12)',
      'rgba(255,255,255,0.4)',
      'rgba(255,255,255,0.05)',
    ],
    borderColor: '#6DDCFF',
    shadowColor: 'rgba(12, 181, 255, 0.35)',
  },
  carbon: {
    baseColor: '#0F131A',
    gradientColors: ['#F2C94C', '#9B51E0', '#56CCF2', '#2F80ED'],
    shineColors: [
      'rgba(255,255,255,0.08)',
      'rgba(255,255,255,0.32)',
      'rgba(255,255,255,0.04)',
    ],
    borderColor: '#5C7CFF',
    shadowColor: 'rgba(20, 41, 82, 0.55)',
  },
};

const SPRING_CONFIG = {
  damping: 18,
  mass: 1,
  stiffness: 120,
  overshootClamping: true,
};

const clamp = (value: number, min: number, max: number): number => {
  'worklet';
  return Math.min(Math.max(value, min), max);
};

const mapToUnit = (value: number, min: number, max: number): number => {
  'worklet';
  if (max === min) {
    return 0;
  }
  return clamp((value - min) / (max - min), 0, 1);
};

const DefaultCardContent: React.FC<{ textColor: string }> = ({ textColor }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.cardContent}>
      <Image source={splashAsset} style={styles.logo} />
      <Text style={[styles.title, { color: textColor }]}>PageKeep</Text>
      <Text style={[styles.subtitle, { color: textColor }]}>
        {t('splash.tagline')}
      </Text>
    </View>
  );
};

const HologramCard: React.FC<HologramCardProps> = ({
  width,
  height,
  borderRadius,
  maxTiltDegX,
  maxTiltDegY,
  perspective,
  tiltX,
  tiltY,
  tiltEnabled,
  ambientShift,
  preset,
  children,
}) => {
  const gradientStart = useDerivedValue<PointValue>(() => {
    const effectiveX = tiltX.value * tiltEnabled.value;
    const effectiveY = tiltY.value * tiltEnabled.value;
    const u = mapToUnit(effectiveY, -maxTiltDegY, maxTiltDegY);
    const v = mapToUnit(effectiveX, -maxTiltDegX, maxTiltDegX);
    const ambient = ambientShift.value * 2 - 1; // center around 0 for stronger swing
    return {
      x: width * (0.12 + 0.65 * u + 0.06 * ambient),
      y: height * (0.06 + 0.55 * v + 0.2 * ambient),
    };
  });

  const gradientEnd = useDerivedValue<PointValue>(() => {
    const effectiveX = tiltX.value * tiltEnabled.value;
    const effectiveY = tiltY.value * tiltEnabled.value;
    const u = mapToUnit(effectiveY, -maxTiltDegY, maxTiltDegY);
    const v = mapToUnit(effectiveX, -maxTiltDegX, maxTiltDegX);
    const ambient = ambientShift.value * 2 - 1;
    return {
      x: width * (0.84 + 0.18 * ambient - 0.18 * u),
      y: height * (0.9 - 0.32 * v + 0.08 * ambient),
    };
  });

  const shineStart = useDerivedValue<PointValue>(() => {
    const effectiveY = tiltY.value * tiltEnabled.value;
    const u = mapToUnit(effectiveY, -maxTiltDegY, maxTiltDegY);
    const ambient = ambientShift.value * 2 - 1;
    return {
      x: width * (0.24 + 0.55 * u + 0.08 * ambient),
      y: height * (0.18 + 0.28 * ambient),
    };
  });

  const shineEnd = useDerivedValue<PointValue>(() => {
    const effectiveY = tiltY.value * tiltEnabled.value;
    const u = mapToUnit(effectiveY, -maxTiltDegY, maxTiltDegY);
    const ambient = ambientShift.value * 2 - 1;
    return {
      x: width * (0.78 + 0.25 * ambient - 0.22 * u),
      y: height * (0.82 + 0.18 * ambient),
    };
  });

  const hologramStyle = useAnimatedStyle(() => {
    const clampedX = clamp(
      tiltX.value * tiltEnabled.value,
      -maxTiltDegX,
      maxTiltDegX,
    );
    const clampedY = clamp(
      tiltY.value * tiltEnabled.value,
      -maxTiltDegY,
      maxTiltDegY,
    );
    const magnitude = Math.abs(clampedX) + Math.abs(clampedY);
    const scale =
      1 +
      interpolate(
        magnitude,
        [0, maxTiltDegX + maxTiltDegY],
        [0, 0.03],
        Extrapolation.CLAMP,
      );

    return {
      transform: [
        { perspective },
        { rotateX: `${clampedX}deg` },
        { rotateY: `${clampedY}deg` },
        { scale },
      ],
      shadowColor: preset.shadowColor,
      shadowOpacity:
        0.35 + 0.15 * clamp(magnitude / (maxTiltDegX + maxTiltDegY), 0, 1),
      shadowRadius: 18,
      shadowOffset: { width: clampedY * 1.5, height: clampedX * 1.5 },
      elevation: 14,
    };
  }, [
    maxTiltDegX,
    maxTiltDegY,
    perspective,
    preset.shadowColor,
    tiltEnabled,
    tiltX,
    tiltY,
  ]);

  return (
    <Animated.View
      style={[
        styles.hologramCard,
        { width, height, borderRadius },
        hologramStyle,
      ]}
    >
      <Canvas style={{ width, height }}>
        <RoundedRect
          x={0}
          y={0}
          width={width}
          height={height}
          r={borderRadius}
          color={preset.baseColor}
        />
        <RoundedRect
          x={0}
          y={0}
          width={width}
          height={height}
          r={borderRadius}
          color={preset.baseColor}
        >
          <LinearGradient
            start={gradientStart as unknown as PointValue}
            end={gradientEnd as unknown as PointValue}
            colors={preset.gradientColors}
            positions={[0, 0.35, 0.72, 1]}
          />
        </RoundedRect>
        <RoundedRect
          x={0}
          y={0}
          width={width}
          height={height}
          r={borderRadius}
          color={preset.baseColor}
        >
          <LinearGradient
            start={shineStart as unknown as PointValue}
            end={shineEnd as unknown as PointValue}
            colors={preset.shineColors}
          />
        </RoundedRect>
      </Canvas>
      <View
        style={[
          styles.borderOverlay,
          { borderRadius, borderColor: preset.borderColor },
        ]}
      />
      <View style={[styles.cardInner, { borderRadius }]} pointerEvents="none">
        {children}
      </View>
    </Animated.View>
  );
};

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  isReady = false,
  onAnimationEnd,
  onFinish,
  minVisibleDurationMs = DEFAULT_MIN_VISIBLE_MS,
  cardWidth = DEFAULT_CARD_WIDTH,
  cardHeight = DEFAULT_CARD_HEIGHT,
  borderRadius = 24,
  cardStylePreset = 'aurora',
  disableSensors = false,
}) => {
  const { theme } = useTheme();
  const preset = HOLOGRAM_PRESETS[cardStylePreset];
  const [sensorActive, setSensorActive] = useState(!disableSensors);
  const [sensorAvailable, setSensorAvailable] = useState(true);
  const [minDurationElapsed, setMinDurationElapsed] = useState(false);
  const [hasExited, setHasExited] = useState(false);

  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const tiltEnabled = useSharedValue(0);
  const ambientShift = useSharedValue(0);
  const entryProgress = useSharedValue(0);
  const exitProgress = useSharedValue(0);

  const maxTiltDegX = 18;
  const maxTiltDegY = 22;
  const perspective = 1100;

  useEffect(() => {
    const timer = setTimeout(
      () => setMinDurationElapsed(true),
      minVisibleDurationMs,
    );
    return () => clearTimeout(timer);
  }, [minVisibleDurationMs]);

  useEffect(() => {
    entryProgress.value = withTiming(1, {
      duration: 650,
      easing: Easing.out(Easing.cubic),
    });
    tiltEnabled.value = withTiming(1, {
      duration: 620,
      easing: Easing.out(Easing.cubic),
    });
    ambientShift.value = withRepeat(
      withTiming(1, {
        duration: 1600,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [ambientShift, entryProgress, tiltEnabled]);

  useEffect(() => {
    return () => {
      cancelAnimation(tiltX);
      cancelAnimation(tiltY);
      cancelAnimation(ambientShift);
      cancelAnimation(entryProgress);
      cancelAnimation(exitProgress);
    };
  }, [ambientShift, entryProgress, exitProgress, tiltX, tiltY]);

  useEffect(() => {
    if (!isReady || !minDurationElapsed || hasExited) {
      return;
    }
    const finishSplash = () => {
      if (hasExited) {
        return;
      }
      setHasExited(true);
      (onFinish ?? onAnimationEnd)?.();
    };
    exitProgress.value = withTiming(
      1,
      { duration: 480, easing: Easing.inOut(Easing.cubic) },
      finished => {
        if (finished) {
          runOnJS(finishSplash)();
        }
      },
    );
  }, [
    exitProgress,
    hasExited,
    isReady,
    minDurationElapsed,
    onAnimationEnd,
    onFinish,
  ]);

  useEffect(() => {
    if (!sensorActive || disableSensors) {
      return;
    }

    let subscription: Subscription | undefined;
    let lastTimestamp = Date.now();
    let integratedX = 0;
    let integratedY = 0;

    try {
      setUpdateIntervalForType(SensorTypes.gyroscope, 16);
      subscription = gyroscope.subscribe(
        ({ x, y }) => {
          const now = Date.now();
          const dt = Math.min((now - lastTimestamp) / 1000, 0.08);
          lastTimestamp = now;
          integratedX = clamp(
            integratedX + y * dt * RAD_TO_DEG,
            -maxTiltDegX,
            maxTiltDegX,
          );
          integratedY = clamp(
            integratedY + x * dt * RAD_TO_DEG,
            -maxTiltDegY,
            maxTiltDegY,
          );
          tiltX.value = withSpring(integratedX, SPRING_CONFIG);
          tiltY.value = withSpring(integratedY, SPRING_CONFIG);
        },
        () => {
          setSensorAvailable(false);
          setSensorActive(false);
        },
      );
      setSensorAvailable(true);
    } catch {
      setSensorAvailable(false);
      setSensorActive(false);
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [disableSensors, maxTiltDegX, maxTiltDegY, sensorActive, tiltX, tiltY]);

  useEffect(() => {
    if (sensorActive && sensorAvailable && !disableSensors) {
      cancelAnimation(tiltX);
      cancelAnimation(tiltY);
      return;
    }

    tiltX.value = withRepeat(
      withTiming(maxTiltDegX * 0.75, {
        duration: 1900,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
    tiltY.value = withRepeat(
      withTiming(-maxTiltDegY * 0.75, {
        duration: 2200,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(tiltX);
      cancelAnimation(tiltY);
    };
  }, [
    disableSensors,
    maxTiltDegX,
    maxTiltDegY,
    sensorActive,
    sensorAvailable,
    tiltX,
    tiltY,
  ]);

  const containerStyle = useAnimatedStyle(() => {
    const entryScale = interpolate(
      entryProgress.value,
      [0, 1],
      [0.9, 1],
      Extrapolation.CLAMP,
    );
    const exitScale = interpolate(
      exitProgress.value,
      [0, 1],
      [1, 1.05],
      Extrapolation.CLAMP,
    );
    const opacity = Math.max(
      0,
      entryProgress.value - exitProgress.value * 0.95,
    );

    return {
      opacity,
      transform: [
        { scale: entryScale * exitScale },
        {
          translateY: interpolate(
            exitProgress.value,
            [0, 1],
            [0, -windowHeight * 0.02],
          ),
        },
      ],
    };
  }, [entryProgress, exitProgress]);

  const bgStyle = useMemo(() => {
    return { backgroundColor: theme.colors.background };
  }, [theme.colors.background]);

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.container, bgStyle]}
      pointerEvents="box-none"
    >
      <StatusBar hidden animated translucent />
      <Animated.View style={[styles.cardWrapper, containerStyle]}>
        <HologramCard
          width={cardWidth}
          height={cardHeight}
          borderRadius={borderRadius}
          maxTiltDegX={maxTiltDegX}
          maxTiltDegY={maxTiltDegY}
          perspective={perspective}
          tiltX={tiltX}
          tiltY={tiltY}
          tiltEnabled={tiltEnabled}
          ambientShift={ambientShift}
          preset={preset}
        >
          <DefaultCardContent textColor={theme.colors.text} />
        </HologramCard>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    zIndex: 999,
    elevation: 999,
  },
  cardWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hologramCard: {
    overflow: 'visible',
  },
  cardInner: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  borderOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: 1,
    opacity: 0.6,
  },
  cardContent: {
    alignItems: 'center',
    gap: 6,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 22,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.85,
  },
});
