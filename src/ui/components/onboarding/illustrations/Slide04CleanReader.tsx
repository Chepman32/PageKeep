import React, { useEffect } from 'react';
import Svg, {
  G,
  Rect,
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Theme } from '../../../../constants/themes';

interface Slide04Props {
  colors: Theme['colors'];
}

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

const Slide04CleanReader: React.FC<Slide04Props> = ({ colors }) => {
  // Arrow animation (right-pointing transformation arrow)
  const arrowX = useSharedValue(0);
  const arrowOpacity = useSharedValue(1);

  // Clutter fade animation
  const clutterOpacity = useSharedValue(1);

  useEffect(() => {
    // Arrow sliding animation (2s loop)
    arrowX.value = withRepeat(
      withTiming(10, {
        duration: 2000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );

    // Arrow pulse opacity
    arrowOpacity.value = withRepeat(
      withTiming(0.6, {
        duration: 2000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );

    // Clutter fading in/out to show transformation
    clutterOpacity.value = withRepeat(
      withTiming(0.3, {
        duration: 3000,
        easing: Easing.inOut(Easing.cubic),
      }),
      -1,
      true,
    );
  }, [arrowX, arrowOpacity, clutterOpacity]);

  // Animated props for arrow
  const arrowAnimatedProps = useAnimatedProps(() => ({
    transform: [{ translateX: 150 + arrowX.value }, { translateY: 110 }],
    opacity: arrowOpacity.value,
  }));

  // Animated props for clutter
  const clutterAnimatedProps = useAnimatedProps(() => ({
    opacity: clutterOpacity.value,
  }));

  return (
    <Svg width="300" height="220" viewBox="0 0 300 220">
      <Defs>
        <LinearGradient id="messyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={colors.muted} stopOpacity="0.4" />
          <Stop offset="100%" stopColor={colors.muted} stopOpacity="0.2" />
        </LinearGradient>
        <LinearGradient id="cleanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={colors.card} stopOpacity="1" />
          <Stop offset="100%" stopColor={colors.card} stopOpacity="0.8" />
        </LinearGradient>
      </Defs>

      {/* Left side - Messy/Cluttered */}
      <G>
        {/* Messy document background */}
        <Rect
          x="20"
          y="30"
          width="110"
          height="160"
          rx="6"
          fill="url(#messyGradient)"
          stroke={colors.border}
          strokeWidth="1.5"
          opacity="0.6"
        />

        {/* Animated clutter elements */}
        <AnimatedG animatedProps={clutterAnimatedProps}>
          {/* Popup ads/distractions */}
          <Rect
            x="30"
            y="45"
            width="50"
            height="30"
            rx="4"
            fill={colors.secondary}
            opacity="0.5"
            stroke={colors.accent}
            strokeWidth="1.5"
          />
          <Rect
            x="70"
            y="90"
            width="45"
            height="35"
            rx="4"
            fill={colors.secondary}
            opacity="0.5"
            stroke={colors.accent}
            strokeWidth="1.5"
          />

          {/* Messy overlapping elements */}
          <Circle cx="45" cy="125" r="15" fill={colors.muted} opacity="0.6" />
          <Rect
            x="25"
            y="145"
            width="40"
            height="25"
            rx="3"
            fill={colors.muted}
            opacity="0.6"
          />
          <Path
            d="M 80,130 L 110,130 L 95,160 Z"
            fill={colors.secondary}
            opacity="0.5"
          />
        </AnimatedG>

        {/* Some barely visible text underneath */}
        <Rect
          x="30"
          y="80"
          width="60"
          height="4"
          rx="2"
          fill={colors.text}
          opacity="0.15"
        />
        <Rect
          x="30"
          y="170"
          width="50"
          height="4"
          rx="2"
          fill={colors.text}
          opacity="0.15"
        />
      </G>

      {/* Center - Transformation arrow */}
      <AnimatedPath
        d="M 0,-15 L 25,0 L 0,15 M 25,0 L -15,0"
        stroke={colors.accent}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        animatedProps={arrowAnimatedProps}
      />

      {/* Right side - Clean/Organized */}
      <G>
        {/* Clean document background */}
        <Rect
          x="170"
          y="30"
          width="110"
          height="160"
          rx="6"
          fill="url(#cleanGradient)"
          stroke={colors.border}
          strokeWidth="2"
        />

        {/* Clean, organized text lines */}
        <Rect
          x="185"
          y="50"
          width="80"
          height="8"
          rx="4"
          fill={colors.text}
          opacity="0.35"
        />
        <Rect
          x="185"
          y="65"
          width="70"
          height="8"
          rx="4"
          fill={colors.text}
          opacity="0.3"
        />
        <Rect
          x="185"
          y="80"
          width="85"
          height="8"
          rx="4"
          fill={colors.text}
          opacity="0.35"
        />

        <Rect
          x="185"
          y="100"
          width="75"
          height="8"
          rx="4"
          fill={colors.text}
          opacity="0.3"
        />
        <Rect
          x="185"
          y="115"
          width="80"
          height="8"
          rx="4"
          fill={colors.text}
          opacity="0.35"
        />
        <Rect
          x="185"
          y="130"
          width="65"
          height="8"
          rx="4"
          fill={colors.text}
          opacity="0.3"
        />

        <Rect
          x="185"
          y="150"
          width="70"
          height="8"
          rx="4"
          fill={colors.text}
          opacity="0.35"
        />
        <Rect
          x="185"
          y="165"
          width="80"
          height="8"
          rx="4"
          fill={colors.text}
          opacity="0.3"
        />

        {/* Sparkle effect to show cleanliness */}
        <Path
          d="M 260,45 L 262,50 L 267,52 L 262,54 L 260,59 L 258,54 L 253,52 L 258,50 Z"
          fill={colors.highlight}
          opacity="0.7"
        />
        <Path
          d="M 245,175 L 246,178 L 249,179 L 246,180 L 245,183 L 244,180 L 241,179 L 244,178 Z"
          fill={colors.highlight}
          opacity="0.7"
        />
      </G>

      {/* Label text placeholders */}
      <Rect
        x="45"
        y="200"
        width="40"
        height="8"
        rx="4"
        fill={colors.muted}
        opacity="0.4"
      />
      <Rect
        x="215"
        y="200"
        width="40"
        height="8"
        rx="4"
        fill={colors.accent}
        opacity="0.4"
      />
    </Svg>
  );
};

export default Slide04CleanReader;
