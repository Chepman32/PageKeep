import React, { useEffect } from 'react';
import Svg, {
  G,
  Circle,
  Rect,
  Path,
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

interface Slide09Props {
  colors: Theme['colors'];
}

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const Slide09ReadingTime: React.FC<Slide09Props> = ({ colors }) => {
  // Clock hands rotation
  const minuteHandRotation = useSharedValue(0);
  const secondHandRotation = useSharedValue(0);

  // Time label pulse
  const timeLabelScale = useSharedValue(1);

  useEffect(() => {
    // Minute hand slow rotation (8s for full rotation)
    minuteHandRotation.value = withRepeat(
      withTiming(360, {
        duration: 8000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Second hand faster rotation (4s for full rotation)
    secondHandRotation.value = withRepeat(
      withTiming(360, {
        duration: 4000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Time label subtle pulse (2s loop)
    timeLabelScale.value = withRepeat(
      withTiming(1.08, {
        duration: 2000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
  }, [minuteHandRotation, secondHandRotation, timeLabelScale]);

  // Animated props for minute hand
  const minuteHandAnimatedProps = useAnimatedProps(() => ({
    transform: `translate(150, 85) rotate(${minuteHandRotation.value})`,
  }));

  // Animated props for second hand
  const secondHandAnimatedProps = useAnimatedProps(() => ({
    transform: `translate(150, 85) rotate(${secondHandRotation.value})`,
  }));

  // Animated props for time label
  const timeLabelAnimatedProps = useAnimatedProps(() => ({
    transform: `translate(150, 175) scale(${timeLabelScale.value})`,
  }));

  return (
    <Svg width="300" height="220" viewBox="0 0 300 220">
      <Defs>
        <LinearGradient id="clockGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.3" />
          <Stop offset="100%" stopColor={colors.accent} stopOpacity="0.1" />
        </LinearGradient>
        <LinearGradient id="documentGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={colors.card} stopOpacity="1" />
          <Stop offset="100%" stopColor={colors.card} stopOpacity="0.7" />
        </LinearGradient>
      </Defs>

      {/* Document in background */}
      <G transform="translate(70, 25)">
        <Rect
          x="0"
          y="0"
          width="160"
          height="120"
          rx="10"
          fill="url(#documentGradient2)"
          stroke={colors.border}
          strokeWidth="2"
          opacity="0.7"
        />

        {/* Text lines */}
        <Rect x="15" y="20" width="100" height="7" rx="3.5" fill={colors.text} opacity="0.25" />
        <Rect x="15" y="35" width="120" height="7" rx="3.5" fill={colors.text} opacity="0.2" />
        <Rect x="15" y="50" width="90" height="7" rx="3.5" fill={colors.text} opacity="0.25" />
        <Rect x="15" y="65" width="110" height="7" rx="3.5" fill={colors.text} opacity="0.2" />
        <Rect x="15" y="80" width="95" height="7" rx="3.5" fill={colors.text} opacity="0.25" />
        <Rect x="15" y="95" width="105" height="7" rx="3.5" fill={colors.text} opacity="0.2" />
      </G>

      {/* Clock overlapping document */}
      <G transform="translate(150, 85)">
        {/* Clock face outer glow */}
        <Circle
          cx="0"
          cy="0"
          r="55"
          fill="url(#clockGradient)"
        />

        {/* Clock face */}
        <Circle
          cx="0"
          cy="0"
          r="45"
          fill={colors.background}
          stroke={colors.accent}
          strokeWidth="4"
        />

        {/* Clock hour markers */}
        <Circle cx="0" cy="-35" r="3" fill={colors.accent} opacity="0.5" />
        <Circle cx="35" cy="0" r="3" fill={colors.accent} opacity="0.5" />
        <Circle cx="0" cy="35" r="3" fill={colors.accent} opacity="0.5" />
        <Circle cx="-35" cy="0" r="3" fill={colors.accent} opacity="0.5" />

        {/* Smaller hour markers */}
        <Circle cx="25" cy="-25" r="2" fill={colors.muted} opacity="0.4" />
        <Circle cx="25" cy="25" r="2" fill={colors.muted} opacity="0.4" />
        <Circle cx="-25" cy="25" r="2" fill={colors.muted} opacity="0.4" />
        <Circle cx="-25" cy="-25" r="2" fill={colors.muted} opacity="0.4" />

        {/* Center dot */}
        <Circle
          cx="0"
          cy="0"
          r="4"
          fill={colors.accent}
        />

        {/* Animated minute hand */}
        <AnimatedPath
          d="M 0,0 L 0,-28"
          stroke={colors.accent}
          strokeWidth="4"
          strokeLinecap="round"
          animatedProps={minuteHandAnimatedProps}
        />

        {/* Animated second hand */}
        <AnimatedPath
          d="M 0,0 L 0,-20"
          stroke={colors.highlight}
          strokeWidth="2"
          strokeLinecap="round"
          animatedProps={secondHandAnimatedProps}
        />
      </G>

      {/* Reading time label (animated) */}
      <G>
        <AnimatedCircle
          cx="0"
          cy="0"
          r="28"
          fill={colors.accent}
          opacity="0.15"
          animatedProps={timeLabelAnimatedProps}
        />
        <Rect
          x="110"
          y="165"
          width="80"
          height="20"
          rx="10"
          fill={colors.accent}
          opacity="0.2"
          transform={`scale(${timeLabelScale.value})`}
          transform-origin="150 175"
        />
        {/* "5 min read" text placeholder */}
        <Rect
          x="125"
          y="170"
          width="50"
          height="10"
          rx="5"
          fill={colors.text}
          opacity="0.4"
        />
      </G>
    </Svg>
  );
};

export default Slide09ReadingTime;
