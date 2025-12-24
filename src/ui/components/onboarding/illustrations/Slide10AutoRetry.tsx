import React, { useEffect } from 'react';
import Svg, {
  G,
  Circle,
  Path,
  Rect,
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

interface Slide10Props {
  colors: Theme['colors'];
}

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

const Slide10AutoRetry: React.FC<Slide10Props> = ({ colors }) => {
  // Circular arrows rotation
  const arrowsRotation = useSharedValue(0);

  // WiFi bars appearing sequentially
  const wifiBat1Height = useSharedValue(0);
  const wifiBar2Height = useSharedValue(0);
  const wifiBar3Height = useSharedValue(0);

  // Checkmark appearance
  const checkmarkScale = useSharedValue(0);

  useEffect(() => {
    // Rotating arrows (3s per rotation)
    arrowsRotation.value = withRepeat(
      withTiming(360, {
        duration: 3000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // WiFi bars appearing sequentially (staggered)
    wifiBat1Height.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 300, easing: Easing.out(Easing.cubic) }),
        withTiming(10, { duration: 2200 }), // Hold
        withTiming(0, { duration: 200 }) // Reset
      ),
      -1,
      false
    );

    wifiBar2Height.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 300 }),
        withTiming(16, { duration: 300, easing: Easing.out(Easing.cubic) }),
        withTiming(16, { duration: 1900 }), // Hold
        withTiming(0, { duration: 200 }) // Reset
      ),
      -1,
      false
    );

    wifiBar3Height.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 600 }),
        withTiming(22, { duration: 300, easing: Easing.out(Easing.cubic) }),
        withTiming(22, { duration: 1600 }), // Hold
        withTiming(0, { duration: 200 }) // Reset
      ),
      -1,
      false
    );

    // Checkmark pops in after WiFi connects
    checkmarkScale.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1800 }),
        withTiming(1.2, { duration: 200, easing: Easing.out(Easing.back(1.5)) }),
        withTiming(1, { duration: 100 }),
        withTiming(1, { duration: 600 }), // Hold
        withTiming(0, { duration: 0 }) // Reset
      ),
      -1,
      false
    );
  }, [arrowsRotation, wifiBat1Height, wifiBar2Height, wifiBar3Height, checkmarkScale]);

  // Animated props for rotating arrows
  const arrowsAnimatedProps = useAnimatedProps(() => ({
    transform: [{ translateX: 100 }, { translateY: 110 }, { rotate: `${arrowsRotation.value}deg` }],
  }));

  // Animated props for WiFi bars
  const wifiBar1AnimatedProps = useAnimatedProps(() => ({
    y: 122 - wifiBat1Height.value,
    height: wifiBat1Height.value,
  }));

  const wifiBar2AnimatedProps = useAnimatedProps(() => ({
    y: 122 - wifiBar2Height.value,
    height: wifiBar2Height.value,
  }));

  const wifiBar3AnimatedProps = useAnimatedProps(() => ({
    y: 122 - wifiBar3Height.value,
    height: wifiBar3Height.value,
  }));

  // Animated props for checkmark
  const checkmarkAnimatedProps = useAnimatedProps(() => ({
    transform: [{ translateX: 200 }, { translateY: 110 }, { scale: checkmarkScale.value }],
  }));

  return (
    <Svg width="300" height="220" viewBox="0 0 300 220">
      {/* Circular retry arrows */}
      <AnimatedG animatedProps={arrowsAnimatedProps}>
        {/* Circle path for arrows */}
        <Path
          d="M 0,-35 A 35,35 0 1,1 0,35 A 35,35 0 1,1 0,-35"
          fill="none"
          stroke={colors.accent}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="30, 20"
        />

        {/* Arrow heads */}
        <Path
          d="M 0,-35 L -8,-28 L 5,-32 Z"
          fill={colors.accent}
        />
        <Path
          d="M 0,35 L 8,28 L -5,32 Z"
          fill={colors.accent}
        />

        {/* Center circle */}
        <Circle
          cx="0"
          cy="0"
          r="25"
          fill={colors.background}
          stroke={colors.border}
          strokeWidth="2"
        />

        {/* Retry icon in center */}
        <Path
          d="M -8,-5 L -8,5 M 8,-5 L 8,5"
          stroke={colors.accent}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </AnimatedG>

      {/* WiFi signal icon */}
      <G transform="translate(200, 110)">
        {/* WiFi base */}
        <Circle
          cx="0"
          cy="15"
          r="4"
          fill={colors.highlight}
        />

        {/* Animated WiFi bars */}
        <AnimatedRect
          x="7"
          width="5"
          rx="2.5"
          fill={colors.highlight}
          opacity="0.7"
          animatedProps={wifiBar1AnimatedProps}
        />
        <AnimatedRect
          x="17"
          width="5"
          rx="2.5"
          fill={colors.highlight}
          opacity="0.8"
          animatedProps={wifiBar2AnimatedProps}
        />
        <AnimatedRect
          x="27"
          width="5"
          rx="2.5"
          fill={colors.highlight}
          animatedProps={wifiBar3AnimatedProps}
        />
      </G>

      {/* Animated checkmark (appears when connected) */}
      <AnimatedG animatedProps={checkmarkAnimatedProps}>
        <Circle
          cx="0"
          cy="0"
          r="18"
          fill={colors.highlight}
        />
        <Path
          d="M -7,0 L -3,6 L 7,-6"
          stroke="#FFFFFF"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </AnimatedG>

      {/* Network status indicator (bottom) */}
      <G transform="translate(100, 170)">
        <Rect
          x="0"
          y="0"
          width="100"
          height="24"
          rx="12"
          fill={colors.card}
          opacity="0.5"
        />
        <Rect
          x="10"
          y="8"
          width="80"
          height="8"
          rx="4"
          fill={colors.text}
          opacity="0.3"
        />
        <Circle cx="50" cy="12" r="3" fill={colors.accent} />
      </G>
    </Svg>
  );
};

export default Slide10AutoRetry;
