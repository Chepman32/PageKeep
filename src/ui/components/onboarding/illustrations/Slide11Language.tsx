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
  Easing,
} from 'react-native-reanimated';
import { Theme } from '../../../../constants/themes';

interface Slide11Props {
  colors: Theme['colors'];
}

const AnimatedG = Animated.createAnimatedComponent(G);

const Slide11Language: React.FC<Slide11Props> = ({ colors }) => {
  // Orbiting flags rotation
  const orbitRotation = useSharedValue(0);

  // Globe rotation
  const globeRotation = useSharedValue(0);

  useEffect(() => {
    // Flags orbiting around globe (8s per rotation)
    orbitRotation.value = withRepeat(
      withTiming(360, {
        duration: 8000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Globe subtle rotation (12s per rotation)
    globeRotation.value = withRepeat(
      withTiming(360, {
        duration: 12000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [orbitRotation, globeRotation]);

  // Animated props for orbiting flags
  const orbitAnimatedProps = useAnimatedProps(() => ({
    transform: `translate(150, 110) rotate(${orbitRotation.value})`,
  }));

  // Animated props for globe
  const globeAnimatedProps = useAnimatedProps(() => ({
    transform: `translate(150, 110) rotate(${globeRotation.value})`,
  }));

  return (
    <Svg width="300" height="220" viewBox="0 0 300 220">
      <Defs>
        <LinearGradient id="globeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.4" />
          <Stop offset="100%" stopColor={colors.accent} stopOpacity="0.15" />
        </LinearGradient>
      </Defs>

      {/* Animated globe */}
      <AnimatedG animatedProps={globeAnimatedProps}>
        {/* Globe circle */}
        <Circle
          cx="0"
          cy="0"
          r="50"
          fill="url(#globeGradient)"
          stroke={colors.accent}
          strokeWidth="3"
        />

        {/* Meridian lines */}
        <Path
          d="M 0,-50 Q -15,-25 -15,0 Q -15,25 0,50"
          fill="none"
          stroke={colors.accent}
          strokeWidth="1.5"
          opacity="0.5"
        />
        <Path
          d="M 0,-50 Q 15,-25 15,0 Q 15,25 0,50"
          fill="none"
          stroke={colors.accent}
          strokeWidth="1.5"
          opacity="0.5"
        />

        {/* Latitude lines */}
        <Path
          d="M -50,0 Q -25,5 0,0 Q 25,-5 50,0"
          fill="none"
          stroke={colors.accent}
          strokeWidth="1.5"
          opacity="0.5"
        />
        <Path
          d="M -40,-25 Q -20,-20 0,-25 Q 20,-30 40,-25"
          fill="none"
          stroke={colors.accent}
          strokeWidth="1.5"
          opacity="0.4"
        />
        <Path
          d="M -40,25 Q -20,30 0,25 Q 20,20 40,25"
          fill="none"
          stroke={colors.accent}
          strokeWidth="1.5"
          opacity="0.4"
        />
      </AnimatedG>

      {/* Animated orbiting flags */}
      <AnimatedG animatedProps={orbitAnimatedProps}>
        {/* Flag 1 at top (EN) */}
        <G transform="translate(0, -75)">
          <Rect x="-12" y="-8" width="24" height="16" rx="3" fill={colors.highlight} opacity="0.8" />
          <Rect x="-9" y="-5" width="18" height="10" rx="2" fill={colors.card} />
          <Rect x="-7" y="-3" width="14" height="6" rx="1.5" fill={colors.text} opacity="0.3" />
        </G>

        {/* Flag 2 at right (ES) */}
        <G transform="translate(75, 0)">
          <Rect x="-12" y="-8" width="24" height="16" rx="3" fill="#FF8A3D" opacity="0.8" />
          <Rect x="-9" y="-5" width="18" height="10" rx="2" fill={colors.card} />
          <Rect x="-7" y="-3" width="14" height="6" rx="1.5" fill={colors.text} opacity="0.3" />
        </G>

        {/* Flag 3 at bottom (FR) */}
        <G transform="translate(0, 75)">
          <Rect x="-12" y="-8" width="24" height="16" rx="3" fill="#3A84F7" opacity="0.8" />
          <Rect x="-9" y="-5" width="18" height="10" rx="2" fill={colors.card} />
          <Rect x="-7" y="-3" width="14" height="6" rx="1.5" fill={colors.text} opacity="0.3" />
        </G>

        {/* Flag 4 at left (中文) */}
        <G transform="translate(-75, 0)">
          <Rect x="-12" y="-8" width="24" height="16" rx="3" fill="#FF61D2" opacity="0.8" />
          <Rect x="-9" y="-5" width="18" height="10" rx="2" fill={colors.card} />
          <Rect x="-7" y="-3" width="14" height="6" rx="1.5" fill={colors.text} opacity="0.3" />
        </G>

        {/* Flag 5 at top-right (日本語) */}
        <G transform="translate(53, -53)">
          <Rect x="-10" y="-7" width="20" height="14" rx="2.5" fill="#9B51E0" opacity="0.7" />
          <Rect x="-8" y="-5" width="16" height="10" rx="2" fill={colors.card} />
          <Rect x="-6" y="-3" width="12" height="6" rx="1.5" fill={colors.text} opacity="0.3" />
        </G>
      </AnimatedG>

      {/* Translation symbol/icon in center of globe */}
      <G transform="translate(150, 110)">
        <Path
          d="M -12,-8 L -12,8 M -12,0 L -4,0"
          stroke={colors.text}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.3"
        />
        <Path
          d="M 4,-8 L 4,8 M 4,0 L 12,0"
          stroke={colors.text}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.3"
        />
      </G>

      {/* Language codes labels (bottom) */}
      <G transform="translate(70, 190)">
        <Rect x="0" y="0" width="160" height="16" rx="8" fill={colors.card} opacity="0.4" />
        <Rect x="10" y="4" width="25" height="8" rx="4" fill={colors.text} opacity="0.25" />
        <Rect x="45" y="4" width="25" height="8" rx="4" fill={colors.text} opacity="0.25" />
        <Rect x="80" y="4" width="25" height="8" rx="4" fill={colors.text} opacity="0.25" />
        <Rect x="115" y="4" width="35" height="8" rx="4" fill={colors.accent} opacity="0.3" />
      </G>
    </Svg>
  );
};

export default Slide11Language;
