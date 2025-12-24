import React, { useEffect } from 'react';
import Svg, {
  G,
  Rect,
  Circle,
  Path,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Theme } from '../../../../constants/themes';

interface Slide07Props {
  colors: Theme['colors'];
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const Slide07Organization: React.FC<Slide07Props> = ({ colors }) => {
  // Star icon pulsing glow
  const starGlowRadius = useSharedValue(20);
  const starGlowOpacity = useSharedValue(0.3);

  // Long-press gesture indicator animation
  const pressScale = useSharedValue(1);
  const pressOpacity = useSharedValue(0.6);

  useEffect(() => {
    // Star glow pulsing (2s loop)
    starGlowRadius.value = withRepeat(
      withTiming(28, {
        duration: 2000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    starGlowOpacity.value = withRepeat(
      withTiming(0.1, {
        duration: 2000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    // Press indicator animation (3s loop with pause)
    pressScale.value = withRepeat(
      withTiming(0.85, {
        duration: 1500,
        easing: Easing.inOut(Easing.cubic),
      }),
      -1,
      true
    );

    pressOpacity.value = withRepeat(
      withTiming(0.3, {
        duration: 1500,
        easing: Easing.inOut(Easing.cubic),
      }),
      -1,
      true
    );
  }, [starGlowRadius, starGlowOpacity, pressScale, pressOpacity]);

  // Animated props for star glow
  const starGlowAnimatedProps = useAnimatedProps(() => ({
    r: starGlowRadius.value,
    opacity: starGlowOpacity.value,
  }));

  // Animated props for long-press indicator
  const pressAnimatedProps = useAnimatedProps(() => ({
    transform: [{ translateX: 150 }, { translateY: 150 }, { scale: pressScale.value }],
    opacity: pressOpacity.value,
  }));

  return (
    <Svg width="300" height="220" viewBox="0 0 300 220">
      {/* Tab bar */}
      <G transform="translate(30, 30)">
        {/* Tab container */}
        <Rect
          x="0"
          y="0"
          width="240"
          height="50"
          rx="10"
          fill={colors.card}
          stroke={colors.border}
          strokeWidth="2"
        />

        {/* Tab 1 - All (inactive) */}
        <G transform="translate(10, 12)">
          <Rect
            x="0"
            y="0"
            width="70"
            height="26"
            rx="8"
            fill={colors.muted}
            opacity="0.2"
          />
          {/* Document icon */}
          <Path
            d="M 22,6 L 22,20 L 33,20 L 33,10 L 29,6 Z M 29,6 L 29,10 L 33,10"
            fill="none"
            stroke={colors.text}
            strokeWidth="2"
            opacity="0.4"
          />
          <Rect x="18" y="18" width="18" height="3" rx="1.5" fill={colors.text} opacity="0.2" />
        </G>

        {/* Tab 2 - Favorites (active with glow) */}
        <G transform="translate(90, 12)">
          <Rect
            x="0"
            y="0"
            width="70"
            height="26"
            rx="8"
            fill={colors.accent}
            opacity="0.15"
          />
          {/* Animated glow behind star */}
          <AnimatedCircle
            cx="35"
            cy="13"
            fill={colors.highlight}
            animatedProps={starGlowAnimatedProps}
          />
          {/* Star icon (filled) */}
          <Path
            d="M 35,5 L 37,11 L 43,11 L 38,15 L 40,21 L 35,17 L 30,21 L 32,15 L 27,11 L 33,11 Z"
            fill={colors.accent}
          />
          <Rect x="18" y="18" width="34" height="3" rx="1.5" fill={colors.accent} opacity="0.5" />
        </G>

        {/* Tab 3 - Archived (inactive) */}
        <G transform="translate(170, 12)">
          <Rect
            x="0"
            y="0"
            width="60"
            height="26"
            rx="8"
            fill={colors.muted}
            opacity="0.2"
          />
          {/* Folder icon */}
          <Path
            d="M 23,9 L 28,9 L 30,11 L 37,11 L 37,19 L 23,19 Z"
            fill="none"
            stroke={colors.text}
            strokeWidth="2"
            opacity="0.4"
          />
          <Rect x="18" y="18" width="24" height="3" rx="1.5" fill={colors.text} opacity="0.2" />
        </G>
      </G>

      {/* Article card below showing long-press gesture */}
      <G transform="translate(30, 100)">
        {/* Card background */}
        <Rect
          x="0"
          y="0"
          width="240"
          height="70"
          rx="12"
          fill={colors.card}
          stroke={colors.border}
          strokeWidth="2"
        />

        {/* Thumbnail placeholder */}
        <Rect
          x="10"
          y="10"
          width="50"
          height="50"
          rx="6"
          fill={colors.accent}
          opacity="0.2"
        />

        {/* Text lines */}
        <Rect x="70" y="15" width="120" height="8" rx="4" fill={colors.text} opacity="0.35" />
        <Rect x="70" y="30" width="90" height="6" rx="3" fill={colors.text} opacity="0.25" />
        <Rect x="70" y="42" width="100" height="6" rx="3" fill={colors.text} opacity="0.25" />

        {/* Long-press indicator (animated) */}
        <AnimatedG animatedProps={pressAnimatedProps}>
          <Circle
            cx="0"
            cy="0"
            r="30"
            fill="none"
            stroke={colors.accent}
            strokeWidth="3"
            strokeDasharray="5,3"
          />
          {/* Finger/touch icon */}
          <Path
            d="M 0,-10 L 0,5 M -5,0 L 5,0"
            stroke={colors.accent}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </AnimatedG>
      </G>

      {/* Context menu popup (shown) */}
      <G transform="translate(180, 95)">
        <Rect
          x="0"
          y="0"
          width="90"
          height="85"
          rx="10"
          fill={colors.card}
          stroke={colors.border}
          strokeWidth="2"
          opacity="0.95"
        />

        {/* Menu items */}
        <G transform="translate(10, 12)">
          {/* Rename */}
          <Rect x="0" y="0" width="70" height="18" rx="6" fill={colors.accent} opacity="0.1" />
          <Rect x="5" y="6" width="35" height="6" rx="3" fill={colors.text} opacity="0.3" />

          {/* Delete */}
          <Rect x="0" y="25" width="70" height="18" rx="6" fill={colors.muted} opacity="0.1" />
          <Rect x="5" y="31" width="30" height="6" rx="3" fill={colors.text} opacity="0.3" />

          {/* Archive */}
          <Rect x="0" y="50" width="70" height="18" rx="6" fill={colors.muted} opacity="0.1" />
          <Rect x="5" y="56" width="40" height="6" rx="3" fill={colors.text} opacity="0.3" />
        </G>
      </G>
    </Svg>
  );
};

export default Slide07Organization;
