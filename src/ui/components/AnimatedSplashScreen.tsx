import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const { height: windowHeight, width: windowWidth } = Dimensions.get('window');
const splashAsset = require('../../assets/pagekeeper-icon-02-sky_blue_navy.png');

type AnimatedSplashScreenProps = {
  onAnimationEnd?: () => void;
  isReady?: boolean;
};

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  onAnimationEnd,
  isReady = false,
}) => {
  const { theme } = useTheme();
  const dropAnimation = useRef(new Animated.Value(-windowHeight)).current;
  const flipAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const opacityAnimation = useRef(new Animated.Value(1)).current;

  const targetScale = 2.4;
  const baseImageSize = useMemo(
    () => Math.min(windowWidth * 0.6, 260),
    [],
  );

  useEffect(() => {
    if (!isReady) {
      dropAnimation.setValue(0);
      flipAnimation.setValue(0);
      scaleAnimation.setValue(1);
      opacityAnimation.setValue(1);
      return;
    }

    dropAnimation.setValue(-windowHeight);
    const animation = Animated.sequence([
      Animated.spring(dropAnimation, {
        toValue: 0,
        useNativeDriver: true,
        speed: 70,
        bounciness: 14,
      }),
      Animated.parallel([
        Animated.timing(flipAnimation, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: targetScale,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacityAnimation, {
        toValue: 0,
        duration: 200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        onAnimationEnd?.();
      }
    });

    return () => {
      animation.stop();
    };
  }, [
    dropAnimation,
    flipAnimation,
    scaleAnimation,
    opacityAnimation,
    onAnimationEnd,
    targetScale,
    isReady,
  ]);

  const rotateY = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '190deg'],
  });

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [
              { translateY: dropAnimation },
              { perspective: 900 },
              { rotateY },
              { scale: scaleAnimation },
            ],
            opacity: opacityAnimation,
          },
        ]}
      >
        <Image
          source={splashAsset}
          style={[styles.image, { width: baseImageSize, height: baseImageSize }]}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    resizeMode: 'contain',
  },
});
