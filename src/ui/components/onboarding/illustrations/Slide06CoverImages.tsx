import React, { useEffect } from 'react';
import Svg, {
  G,
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
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Theme } from '../../../../constants/themes';

interface Slide06Props {
  colors: Theme['colors'];
}

const AnimatedG = Animated.createAnimatedComponent(G);

const Slide06CoverImages: React.FC<Slide06Props> = ({ colors }) => {
  // Staggered card appearance animations
  const card1Opacity = useSharedValue(0);
  const card1Scale = useSharedValue(0.8);

  const card2Opacity = useSharedValue(0);
  const card2Scale = useSharedValue(0.8);

  const card3Opacity = useSharedValue(0);
  const card3Scale = useSharedValue(0.8);

  const card4Opacity = useSharedValue(0);
  const card4Scale = useSharedValue(0.8);

  const card5Opacity = useSharedValue(0);
  const card5Scale = useSharedValue(0.8);

  const card6Opacity = useSharedValue(0);
  const card6Scale = useSharedValue(0.8);

  useEffect(() => {
    const animateCard = (opacity: any, scale: any, delay: number) => {
      opacity.value = withRepeat(
        withSequence(
          withDelay(
            delay,
            withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) })
          ),
          withTiming(1, { duration: 2000 }), // Hold
          withTiming(0, { duration: 300 }) // Fade out
        ),
        -1,
        false
      );

      scale.value = withRepeat(
        withSequence(
          withDelay(
            delay,
            withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.2)) })
          ),
          withTiming(1, { duration: 2000 }), // Hold
          withTiming(0.8, { duration: 300 }) // Scale down
        ),
        -1,
        false
      );
    };

    // Staggered animation (100ms delays)
    animateCard(card1Opacity, card1Scale, 0);
    animateCard(card2Opacity, card2Scale, 100);
    animateCard(card3Opacity, card3Scale, 200);
    animateCard(card4Opacity, card4Scale, 300);
    animateCard(card5Opacity, card5Scale, 400);
    animateCard(card6Opacity, card6Scale, 500);
  }, [card1Opacity, card1Scale, card2Opacity, card2Scale, card3Opacity, card3Scale, card4Opacity, card4Scale, card5Opacity, card5Scale, card6Opacity, card6Scale]);

  // Create animated props for each card
  const card1AnimatedProps = useAnimatedProps(() => ({
    opacity: card1Opacity.value,
    transform: [{ translateX: 30 }, { translateY: 30 }, { scale: card1Scale.value }],
  }));

  const card2AnimatedProps = useAnimatedProps(() => ({
    opacity: card2Opacity.value,
    transform: [{ translateX: 125 }, { translateY: 30 }, { scale: card2Scale.value }],
  }));

  const card3AnimatedProps = useAnimatedProps(() => ({
    opacity: card3Opacity.value,
    transform: [{ translateX: 220 }, { translateY: 30 }, { scale: card3Scale.value }],
  }));

  const card4AnimatedProps = useAnimatedProps(() => ({
    opacity: card4Opacity.value,
    transform: [{ translateX: 30 }, { translateY: 125 }, { scale: card4Scale.value }],
  }));

  const card5AnimatedProps = useAnimatedProps(() => ({
    opacity: card5Opacity.value,
    transform: [{ translateX: 125 }, { translateY: 125 }, { scale: card5Scale.value }],
  }));

  const card6AnimatedProps = useAnimatedProps(() => ({
    opacity: card6Opacity.value,
    transform: [{ translateX: 220 }, { translateY: 125 }, { scale: card6Scale.value }],
  }));

  return (
    <Svg width="300" height="220" viewBox="0 0 300 220">
      <Defs>
        <LinearGradient id="cover1" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#3A84F7" stopOpacity="0.8" />
          <Stop offset="100%" stopColor="#6BA8FF" stopOpacity="0.6" />
        </LinearGradient>
        <LinearGradient id="cover2" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FF8A3D" stopOpacity="0.8" />
          <Stop offset="100%" stopColor="#FFB366" stopOpacity="0.6" />
        </LinearGradient>
        <LinearGradient id="cover3" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#34D5FF" stopOpacity="0.8" />
          <Stop offset="100%" stopColor="#7C3AED" stopOpacity="0.6" />
        </LinearGradient>
        <LinearGradient id="cover4" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#9B51E0" stopOpacity="0.8" />
          <Stop offset="100%" stopColor="#F2C94C" stopOpacity="0.6" />
        </LinearGradient>
        <LinearGradient id="cover5" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#2F80ED" stopOpacity="0.8" />
          <Stop offset="100%" stopColor="#56CCF2" stopOpacity="0.6" />
        </LinearGradient>
        <LinearGradient id="cover6" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FF61D2" stopOpacity="0.8" />
          <Stop offset="100%" stopColor="#FFE98A" stopOpacity="0.6" />
        </LinearGradient>
      </Defs>

      {/* Card 1 */}
      <AnimatedG animatedProps={card1AnimatedProps}>
        <Rect width="80" height="80" rx="8" fill={colors.card} stroke={colors.border} strokeWidth="2" />
        <Rect y="0" width="80" height="50" rx="8" fill="url(#cover1)" />
        <Rect x="8" y="58" width="50" height="5" rx="2.5" fill={colors.text} opacity="0.3" />
        <Rect x="8" y="68" width="40" height="4" rx="2" fill={colors.text} opacity="0.2" />
      </AnimatedG>

      {/* Card 2 */}
      <AnimatedG animatedProps={card2AnimatedProps}>
        <Rect width="80" height="80" rx="8" fill={colors.card} stroke={colors.border} strokeWidth="2" />
        <Rect y="0" width="80" height="50" rx="8" fill="url(#cover2)" />
        <Rect x="8" y="58" width="55" height="5" rx="2.5" fill={colors.text} opacity="0.3" />
        <Rect x="8" y="68" width="45" height="4" rx="2" fill={colors.text} opacity="0.2" />
      </AnimatedG>

      {/* Card 3 */}
      <AnimatedG animatedProps={card3AnimatedProps}>
        <Rect width="80" height="80" rx="8" fill={colors.card} stroke={colors.border} strokeWidth="2" />
        <Rect y="0" width="80" height="50" rx="8" fill="url(#cover3)" />
        <Rect x="8" y="58" width="48" height="5" rx="2.5" fill={colors.text} opacity="0.3" />
        <Rect x="8" y="68" width="50" height="4" rx="2" fill={colors.text} opacity="0.2" />
      </AnimatedG>

      {/* Card 4 */}
      <AnimatedG animatedProps={card4AnimatedProps}>
        <Rect width="80" height="80" rx="8" fill={colors.card} stroke={colors.border} strokeWidth="2" />
        <Rect y="0" width="80" height="50" rx="8" fill="url(#cover4)" />
        <Rect x="8" y="58" width="52" height="5" rx="2.5" fill={colors.text} opacity="0.3" />
        <Rect x="8" y="68" width="38" height="4" rx="2" fill={colors.text} opacity="0.2" />
      </AnimatedG>

      {/* Card 5 */}
      <AnimatedG animatedProps={card5AnimatedProps}>
        <Rect width="80" height="80" rx="8" fill={colors.card} stroke={colors.border} strokeWidth="2" />
        <Rect y="0" width="80" height="50" rx="8" fill="url(#cover5)" />
        <Rect x="8" y="58" width="45" height="5" rx="2.5" fill={colors.text} opacity="0.3" />
        <Rect x="8" y="68" width="55" height="4" rx="2" fill={colors.text} opacity="0.2" />
      </AnimatedG>

      {/* Card 6 */}
      <AnimatedG animatedProps={card6AnimatedProps}>
        <Rect width="80" height="80" rx="8" fill={colors.card} stroke={colors.border} strokeWidth="2" />
        <Rect y="0" width="80" height="50" rx="8" fill="url(#cover6)" />
        <Rect x="8" y="58" width="50" height="5" rx="2.5" fill={colors.text} opacity="0.3" />
        <Rect x="8" y="68" width="42" height="4" rx="2" fill={colors.text} opacity="0.2" />
      </AnimatedG>
    </Svg>
  );
};

export default Slide06CoverImages;
