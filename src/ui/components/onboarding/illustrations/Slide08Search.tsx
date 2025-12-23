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
  withSequence,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Theme } from '../../../../constants/themes';

interface Slide08Props {
  colors: Theme['colors'];
}

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedG = Animated.createAnimatedComponent(G);

const Slide08Search: React.FC<Slide08Props> = ({ colors }) => {
  // Highlight animation (appearing sequentially)
  const highlight1Opacity = useSharedValue(0);
  const highlight2Opacity = useSharedValue(0);
  const highlight3Opacity = useSharedValue(0);

  // Magnifying glass subtle movement
  const magX = useSharedValue(0);
  const magY = useSharedValue(0);

  useEffect(() => {
    // Magnifying glass floating (3s loop)
    magX.value = withRepeat(
      withTiming(5, {
        duration: 3000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    magY.value = withRepeat(
      withTiming(3, {
        duration: 2500,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    // Staggered highlight appearance (each 0.5s apart)
    highlight1Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
        withDelay(2000, withTiming(0, { duration: 300 }))
      ),
      -1,
      false
    );

    highlight2Opacity.value = withRepeat(
      withSequence(
        withDelay(500, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) })),
        withDelay(1500, withTiming(0, { duration: 300 }))
      ),
      -1,
      false
    );

    highlight3Opacity.value = withRepeat(
      withSequence(
        withDelay(1000, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) })),
        withDelay(1000, withTiming(0, { duration: 300 }))
      ),
      -1,
      false
    );
  }, [magX, magY, highlight1Opacity, highlight2Opacity, highlight3Opacity]);

  // Animated props for magnifying glass
  const magAnimatedProps = useAnimatedProps(() => ({
    transform: `translate(${70 + magX.value}, ${50 + magY.value})`,
  }));

  // Animated props for highlights
  const highlight1AnimatedProps = useAnimatedProps(() => ({
    opacity: highlight1Opacity.value,
  }));

  const highlight2AnimatedProps = useAnimatedProps(() => ({
    opacity: highlight2Opacity.value,
  }));

  const highlight3AnimatedProps = useAnimatedProps(() => ({
    opacity: highlight3Opacity.value,
  }));

  return (
    <Svg width="300" height="220" viewBox="0 0 300 220">
      <Defs>
        <LinearGradient id="magnifierGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.2" />
          <Stop offset="100%" stopColor={colors.accent} stopOpacity="0.05" />
        </LinearGradient>
      </Defs>

      {/* Document/article text */}
      <G transform="translate(40, 40)">
        {/* Background */}
        <Rect
          x="0"
          y="0"
          width="220"
          height="150"
          rx="10"
          fill={colors.card}
          opacity="0.5"
        />

        {/* Text lines */}
        <Rect x="15" y="20" width="140" height="7" rx="3.5" fill={colors.text} opacity="0.3" />
        <Rect x="15" y="35" width="120" height="7" rx="3.5" fill={colors.text} opacity="0.25" />

        {/* Highlighted text line 1 */}
        <Rect x="15" y="50" width="60" height="7" rx="3.5" fill={colors.text} opacity="0.3" />
        <AnimatedRect
          x="80"
          y="50"
          width="50"
          height="7"
          rx="3.5"
          fill={colors.highlight}
          animatedProps={highlight1AnimatedProps}
        />
        <Rect x="135" y="50" width="30" height="7" rx="3.5" fill={colors.text} opacity="0.3" />

        <Rect x="15" y="65" width="150" height="7" rx="3.5" fill={colors.text} opacity="0.25" />

        {/* Highlighted text line 2 */}
        <Rect x="15" y="80" width="85" height="7" rx="3.5" fill={colors.text} opacity="0.3" />
        <AnimatedRect
          x="105"
          y="80"
          width="45"
          height="7"
          rx="3.5"
          fill={colors.highlight}
          animatedProps={highlight2AnimatedProps}
        />

        <Rect x="15" y="95" width="130" height="7" rx="3.5" fill={colors.text} opacity="0.25" />

        {/* Highlighted text line 3 */}
        <Rect x="15" y="110" width="50" height="7" rx="3.5" fill={colors.text} opacity="0.3" />
        <AnimatedRect
          x="70"
          y="110"
          width="55"
          height="7"
          rx="3.5"
          fill={colors.highlight}
          animatedProps={highlight3AnimatedProps}
        />
        <Rect x="130" y="110" width="40" height="7" rx="3.5" fill={colors.text} opacity="0.3" />

        <Rect x="15" y="125" width="110" height="7" rx="3.5" fill={colors.text} opacity="0.25" />
      </G>

      {/* Animated magnifying glass */}
      <AnimatedG animatedProps={magAnimatedProps}>
        {/* Glass lens */}
        <Circle
          cx="0"
          cy="0"
          r="35"
          fill="url(#magnifierGradient)"
          stroke={colors.accent}
          strokeWidth="4"
        />

        {/* Glass shine */}
        <Circle
          cx="-10"
          cy="-10"
          r="12"
          fill={colors.background}
          opacity="0.6"
        />

        {/* Handle */}
        <Path
          d="M 25,25 L 45,45"
          stroke={colors.accent}
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Handle end cap */}
        <Circle
          cx="45"
          cy="45"
          r="5"
          fill={colors.accent}
        />
      </AnimatedG>

      {/* Recent searches list (bottom) */}
      <G transform="translate(40, 195)">
        <Rect x="0" y="0" width="80" height="8" rx="4" fill={colors.secondary} opacity="0.3" />
        <Rect x="90" y="0" width="130" height="18" rx="9" fill={colors.card} opacity="0.4" />
        <Rect x="100" y="5" width="60" height="8" rx="4" fill={colors.text} opacity="0.25" />
        <Circle cx="210" cy="9" r="5" fill={colors.muted} opacity="0.3" />
      </G>
    </Svg>
  );
};

export default Slide08Search;
