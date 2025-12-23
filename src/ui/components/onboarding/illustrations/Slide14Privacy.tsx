import React, { useEffect } from 'react';
import Svg, {
  G,
  Path,
  Circle,
  Rect,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Theme } from '../../../../constants/themes';

interface Slide14Props {
  colors: Theme['colors'];
}

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

const Slide14Privacy: React.FC<Slide14Props> = ({ colors }) => {
  // Checkmark drawing animation
  const checkmarkProgress = useSharedValue(0);

  // Shield glow/pulse animation
  const shieldGlowRadius = useSharedValue(70);
  const shieldGlowOpacity = useSharedValue(0.2);

  // Lock icon subtle bob
  const lockY = useSharedValue(0);

  useEffect(() => {
    // Checkmark drawing animation (2s loop)
    checkmarkProgress.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 1000,
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(1, { duration: 1500 }), // Hold
        withTiming(0, { duration: 0 }) // Reset
      ),
      -1,
      false
    );

    // Shield glow pulsing (3s loop)
    shieldGlowRadius.value = withRepeat(
      withTiming(85, {
        duration: 3000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    shieldGlowOpacity.value = withRepeat(
      withTiming(0.1, {
        duration: 3000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    // Lock subtle floating (2.5s loop)
    lockY.value = withRepeat(
      withTiming(-4, {
        duration: 2500,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
  }, [checkmarkProgress, shieldGlowRadius, shieldGlowOpacity, lockY]);

  // Animated props for checkmark
  const checkmarkAnimatedProps = useAnimatedProps(() => {
    const pathLength = 50; // Approximate path length
    const dashOffset = pathLength * (1 - checkmarkProgress.value);

    return {
      strokeDasharray: pathLength,
      strokeDashoffset: dashOffset,
    };
  });

  // Animated props for shield glow
  const shieldGlowAnimatedProps = useAnimatedProps(() => ({
    r: shieldGlowRadius.value,
    opacity: shieldGlowOpacity.value,
  }));

  // Animated props for lock
  const lockAnimatedProps = useAnimatedProps(() => ({
    transform: `translate(150, ${55 + lockY.value})`,
  }));

  return (
    <Svg width="300" height="220" viewBox="0 0 300 220">
      <Defs>
        <LinearGradient id="shieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.6" />
          <Stop offset="100%" stopColor={colors.accent} stopOpacity="0.3" />
        </LinearGradient>
      </Defs>

      {/* Shield glow (animated) */}
      <AnimatedCircle
        cx="150"
        cy="110"
        fill={colors.highlight}
        animatedProps={shieldGlowAnimatedProps}
      />

      {/* Main shield shape */}
      <G transform="translate(150, 110)">
        {/* Shield outline */}
        <Path
          d="M 0,-60 L -50,-40 L -50,20 Q -50,50 0,70 Q 50,50 50,20 L 50,-40 Z"
          fill="url(#shieldGradient)"
          stroke={colors.accent}
          strokeWidth="4"
        />

        {/* Shield inner highlight */}
        <Path
          d="M 0,-55 L -45,-37 L -45,20 Q -45,47 0,65 Q 45,47 45,20 L 45,-37 Z"
          fill={colors.background}
          opacity="0.3"
        />

        {/* Animated checkmark (drawn progressively) */}
        <AnimatedPath
          d="M -20,0 L -8,15 L 20,-20"
          stroke={colors.highlight}
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          animatedProps={checkmarkAnimatedProps}
        />
      </G>

      {/* Animated lock icon (top of shield) */}
      <AnimatedG animatedProps={lockAnimatedProps}>
        {/* Lock shackle */}
        <Path
          d="M -10,-5 L -10,-12 Q -10,-18 0,-18 Q 10,-18 10,-12 L 10,-5"
          fill="none"
          stroke={colors.accent}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Lock body */}
        <Rect
          x="-12"
          y="-5"
          width="24"
          height="16"
          rx="3"
          fill={colors.accent}
        />

        {/* Keyhole */}
        <Circle
          cx="0"
          cy="2"
          r="3"
          fill={colors.background}
        />
        <Rect
          x="-1.5"
          y="2"
          width="3"
          height="5"
          rx="1.5"
          fill={colors.background}
        />
      </AnimatedG>

      {/* "No tracking" indicator (bottom) */}
      <G transform="translate(80, 185)">
        <Rect
          x="0"
          y="0"
          width="140"
          height="22"
          rx="11"
          fill={colors.accent}
          opacity="0.15"
        />
        <Rect
          x="15"
          y="7"
          width="110"
          height="8"
          rx="4"
          fill={colors.text}
          opacity="0.35"
        />

        {/* Crossed out tracking icon */}
        <Circle cx="140" cy="11" r="8" fill={colors.muted} opacity="0.2" />
        <Path
          d="M 134,5 L 146,17"
          stroke={colors.secondary}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </G>

      {/* Privacy stars/sparkles */}
      <Path
        d="M 70,70 L 72,75 L 77,77 L 72,79 L 70,84 L 68,79 L 63,77 L 68,75 Z"
        fill={colors.highlight}
        opacity="0.6"
      />
      <Path
        d="M 230,90 L 232,95 L 237,97 L 232,99 L 230,104 L 228,99 L 223,97 L 228,95 Z"
        fill={colors.highlight}
        opacity="0.6"
      />
      <Path
        d="M 210,140 L 211,143 L 214,144 L 211,145 L 210,148 L 209,145 L 206,144 L 209,143 Z"
        fill={colors.highlight}
        opacity="0.5"
      />
    </Svg>
  );
};

export default Slide14Privacy;
