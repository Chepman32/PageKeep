import React, { useEffect } from 'react';
import Svg, {
  G,
  Rect,
  Circle,
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

interface Slide01Props {
  colors: Theme['colors'];
}

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const Slide01ShareExtension: React.FC<Slide01Props> = ({ colors }) => {
  // Floating animation for share arrow
  const floatY = useSharedValue(0);

  // Pulsing animation for link icon
  const pulseScale = useSharedValue(1);

  // Ripple animation
  const rippleScale = useSharedValue(1);
  const rippleOpacity = useSharedValue(0.6);

  useEffect(() => {
    // Floating arrow animation (2s loop)
    floatY.value = withRepeat(
      withTiming(-8, {
        duration: 2000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    // Pulsing link icon (1.5s loop)
    pulseScale.value = withRepeat(
      withTiming(1.15, {
        duration: 1500,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    // Ripple effect (2s loop)
    rippleScale.value = withRepeat(
      withTiming(1.8, {
        duration: 2000,
        easing: Easing.out(Easing.cubic),
      }),
      -1,
      false
    );

    rippleOpacity.value = withRepeat(
      withTiming(0, {
        duration: 2000,
        easing: Easing.out(Easing.cubic),
      }),
      -1,
      false
    );
  }, [floatY, pulseScale, rippleScale, rippleOpacity]);

  // Animated props for floating arrow
  const arrowAnimatedProps = useAnimatedProps(() => ({
    transform: `translate(0, ${floatY.value})`,
  }));

  // Animated props for pulsing link icon
  const linkAnimatedProps = useAnimatedProps(() => ({
    transform: `translate(150, 100) scale(${pulseScale.value})`,
  }));

  // Animated props for ripple
  const rippleAnimatedProps = useAnimatedProps(() => ({
    transform: `translate(150, 100) scale(${rippleScale.value})`,
    opacity: rippleOpacity.value,
  }));

  return (
    <Svg width="300" height="220" viewBox="0 0 300 220">
      <Defs>
        <LinearGradient id="phoneGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={colors.card} stopOpacity="1" />
          <Stop offset="100%" stopColor={colors.card} stopOpacity="0.7" />
        </LinearGradient>
        <LinearGradient id="shareSheetGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={colors.background} stopOpacity="1" />
          <Stop offset="100%" stopColor={colors.card} stopOpacity="1" />
        </LinearGradient>
      </Defs>

      {/* Phone outline */}
      <Rect
        x="75"
        y="20"
        width="150"
        height="180"
        rx="20"
        fill="url(#phoneGradient)"
        stroke={colors.border}
        strokeWidth="2"
      />

      {/* Phone notch */}
      <Rect
        x="120"
        y="20"
        width="60"
        height="6"
        rx="3"
        fill={colors.background}
      />

      {/* Phone screen content - browser bars */}
      <Rect
        x="85"
        y="40"
        width="130"
        height="20"
        rx="4"
        fill={colors.muted}
        opacity="0.3"
      />
      <Rect
        x="85"
        y="70"
        width="100"
        height="12"
        rx="2"
        fill={colors.text}
        opacity="0.15"
      />
      <Rect
        x="85"
        y="88"
        width="120"
        height="12"
        rx="2"
        fill={colors.text}
        opacity="0.15"
      />

      {/* Share sheet modal (bottom of phone) */}
      <Rect
        x="80"
        y="120"
        width="140"
        height="75"
        rx="12"
        fill="url(#shareSheetGradient)"
        stroke={colors.border}
        strokeWidth="1.5"
      />

      {/* Share sheet handle */}
      <Rect
        x="135"
        y="128"
        width="30"
        height="4"
        rx="2"
        fill={colors.muted}
        opacity="0.5"
      />

      {/* Share sheet icon placeholders */}
      <Circle cx="105" cy="155" r="12" fill={colors.accent} opacity="0.3" />
      <Circle cx="150" cy="155" r="12" fill={colors.accent} opacity="0.3" />
      <Circle cx="195" cy="155" r="12" fill={colors.accent} opacity="0.3" />

      {/* Small text labels under icons */}
      <Rect x="95" y="172" width="20" height="4" rx="2" fill={colors.text} opacity="0.2" />
      <Rect x="140" y="172" width="20" height="4" rx="2" fill={colors.text} opacity="0.2" />
      <Rect x="185" y="172" width="20" height="4" rx="2" fill={colors.text} opacity="0.2" />

      {/* Animated ripple effect behind link icon */}
      <AnimatedCircle
        cx="0"
        cy="0"
        r="20"
        fill={colors.highlight}
        animatedProps={rippleAnimatedProps}
      />

      {/* Animated link icon with pulse */}
      <AnimatedG animatedProps={linkAnimatedProps}>
        {/* Link chain icon */}
        <Path
          d="M -8,-4 A 6,6 0 0,1 -8,4 L -4,4"
          stroke={colors.accent}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M 8,-4 A 6,6 0 0,0 8,4 L 4,4"
          stroke={colors.accent}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M -2,0 L 2,0"
          stroke={colors.accent}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </AnimatedG>

      {/* Animated floating share arrow */}
      <AnimatedG animatedProps={arrowAnimatedProps}>
        <G transform="translate(150, 60)">
          {/* Arrow shaft */}
          <Rect
            x="-3"
            y="0"
            width="6"
            height="30"
            rx="3"
            fill={colors.accent}
          />
          {/* Arrow head */}
          <Path
            d="M 0,-10 L 8,0 L 0,2 L -8,0 Z"
            fill={colors.accent}
          />
          {/* Arrow glow */}
          <Circle
            cx="0"
            cy="5"
            r="15"
            fill={colors.accent}
            opacity="0.2"
          />
        </G>
      </AnimatedG>
    </Svg>
  );
};

export default Slide01ShareExtension;
