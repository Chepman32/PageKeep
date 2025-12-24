import React, { useEffect } from 'react';
import Svg, {
  G,
  Circle,
  Path,
  Rect,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Theme } from '../../../../constants/themes';

interface Slide03Props {
  colors: Theme['colors'];
}

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const Slide03OfflineReading: React.FC<Slide03Props> = ({ colors }) => {
  // Download arrow animation (downward motion)
  const arrowY = useSharedValue(0);

  // Checkmark appearance on device
  const checkmarkScale = useSharedValue(0);

  // Cloud subtle floating
  const cloudY = useSharedValue(0);

  useEffect(() => {
    // Cloud floating animation (3s loop)
    cloudY.value = withRepeat(
      withTiming(-5, {
        duration: 3000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );

    // Download arrow moving downward (2s loop with pause)
    arrowY.value = withRepeat(
      withSequence(
        withTiming(40, {
          duration: 1500,
          easing: Easing.in(Easing.cubic),
        }),
        withTiming(40, { duration: 300 }), // Pause at bottom
        withTiming(0, { duration: 0 }), // Reset instantly
      ),
      -1,
      false,
    );

    // Checkmark appears when arrow reaches bottom
    checkmarkScale.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1500 }), // Hidden while arrow moves
        withTiming(1.2, {
          duration: 200,
          easing: Easing.out(Easing.back(1.5)),
        }),
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 0 }), // Reset
      ),
      -1,
      false,
    );
  }, [arrowY, checkmarkScale, cloudY]);

  // Animated props for cloud
  const cloudAnimatedProps = useAnimatedProps(() => ({
    transform: [{ translateY: cloudY.value }],
  }));

  // Animated props for download arrow
  const arrowAnimatedProps = useAnimatedProps(() => ({
    transform: [{ translateX: 150 }, { translateY: 60 + arrowY.value }],
  }));

  // Animated props for checkmark
  const checkmarkAnimatedProps = useAnimatedProps(() => ({
    transform: [
      { translateX: 150 },
      { translateY: 165 },
      { scale: checkmarkScale.value },
    ],
  }));

  return (
    <Svg width="300" height="220" viewBox="0 0 300 220">
      <Defs>
        <LinearGradient id="cloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.4" />
          <Stop offset="100%" stopColor={colors.accent} stopOpacity="0.2" />
        </LinearGradient>
        <LinearGradient id="deviceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={colors.card} stopOpacity="1" />
          <Stop offset="100%" stopColor={colors.card} stopOpacity="0.7" />
        </LinearGradient>
      </Defs>

      {/* Animated cloud */}
      <AnimatedG animatedProps={cloudAnimatedProps}>
        <G transform="translate(150, 50)">
          {/* Cloud made of circles */}
          <Circle cx="-30" cy="0" r="20" fill="url(#cloudGradient)" />
          <Circle cx="-10" cy="-8" r="25" fill="url(#cloudGradient)" />
          <Circle cx="15" cy="-8" r="25" fill="url(#cloudGradient)" />
          <Circle cx="30" cy="0" r="20" fill="url(#cloudGradient)" />
          <Circle cx="0" cy="5" r="22" fill="url(#cloudGradient)" />

          {/* Cloud outline */}
          <Path
            d="M -50,0 Q -50,-15 -30,-15 Q -20,-25 0,-25 Q 20,-25 30,-15 Q 50,-15 50,0 Q 50,20 30,20 L -30,20 Q -50,20 -50,0 Z"
            fill={colors.secondary}
            opacity="0.1"
            stroke={colors.accent}
            strokeWidth="2"
          />
        </G>
      </AnimatedG>

      {/* Animated download arrow */}
      <AnimatedG animatedProps={arrowAnimatedProps}>
        {/* Arrow shaft */}
        <Rect x="-4" y="0" width="8" height="35" rx="4" fill={colors.accent} />
        {/* Arrow head */}
        <Path d="M 0,35 L -12,20 L 0,25 L 12,20 Z" fill={colors.accent} />
        {/* Arrow glow */}
        <Circle cx="0" cy="17" r="18" fill={colors.accent} opacity="0.15" />
      </AnimatedG>

      {/* Device/Phone at bottom */}
      <Rect
        x="105"
        y="130"
        width="90"
        height="70"
        rx="12"
        fill="url(#deviceGradient)"
        stroke={colors.border}
        strokeWidth="2"
      />

      {/* Device screen */}
      <Rect
        x="112"
        y="138"
        width="76"
        height="54"
        rx="6"
        fill={colors.background}
        opacity="0.5"
      />

      {/* Document icon on device */}
      <Rect
        x="135"
        y="148"
        width="30"
        height="34"
        rx="3"
        fill={colors.text}
        opacity="0.2"
      />
      <Rect
        x="140"
        y="156"
        width="20"
        height="3"
        rx="1.5"
        fill={colors.text}
        opacity="0.15"
      />
      <Rect
        x="140"
        y="162"
        width="15"
        height="3"
        rx="1.5"
        fill={colors.text}
        opacity="0.15"
      />
      <Rect
        x="140"
        y="168"
        width="18"
        height="3"
        rx="1.5"
        fill={colors.text}
        opacity="0.15"
      />

      {/* Animated checkmark on device */}
      <AnimatedCircle
        cx="0"
        cy="0"
        r="10"
        fill={colors.highlight}
        animatedProps={checkmarkAnimatedProps}
      />
      <AnimatedPath
        d="M -4,0 L -1,4 L 4,-4"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        animatedProps={checkmarkAnimatedProps}
      />
    </Svg>
  );
};

export default Slide03OfflineReading;
