import React, { useEffect, useRef } from 'react';
import Svg, {
  G,
  Rect,
  Circle,
  Path,
  Defs,
  LinearGradient,
  Stop,
  ClipPath,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Theme } from '../../../../constants/themes';

interface Slide01Props {
  colors: Theme['colors'];
}

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// PageKeep brand color
const PAGEKEEP_TEAL = '#1A5C5C';

// Enhanced timing constants for 4.5s loop
const TIMING = {
  SCENE_1A: 800,   // Initial state visible
  SCENE_1B: 600,   // Content scrolling
  SCENE_2: 400,    // Share button glow + press
  SCENE_3: 500,    // Share sheet slides up + icons fade in
  SCENE_4: 400,    // PageKeep icon glow + press
  SCENE_5: 900,    // Saved modal visible
  SCENE_6: 500,    // Modal + sheet dismiss
  PAUSE: 400,      // Pause before loop
};

const TOTAL_DURATION =
  TIMING.SCENE_1A +
  TIMING.SCENE_1B +
  TIMING.SCENE_2 +
  TIMING.SCENE_3 +
  TIMING.SCENE_4 +
  TIMING.SCENE_5 +
  TIMING.SCENE_6 +
  TIMING.PAUSE;

const Slide01ShareExtension: React.FC<Slide01Props> = ({ colors }) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Content scrolling
  const contentScrollY = useSharedValue(0);

  // Share button animation
  const shareButtonScale = useSharedValue(1);
  const shareButtonGlow = useSharedValue(0);

  // Share sheet animation
  const shareSheetY = useSharedValue(100);
  const shareSheetOpacity = useSharedValue(0);

  // Individual app icon fade-ins
  const messagesOpacity = useSharedValue(0);
  const mailOpacity = useSharedValue(0);
  const pageKeepOpacity = useSharedValue(0);
  const notesOpacity = useSharedValue(0);

  // PageKeep icon animation
  const pageKeepScale = useSharedValue(1);
  const pageKeepGlow = useSharedValue(0);
  const pageKeepHighlight = useSharedValue(0);

  // Saved modal animation
  const savedModalOpacity = useSharedValue(0);
  const savedModalScale = useSharedValue(0.8);

  const runAnimation = () => {
    'worklet';
    // Reset all values
    contentScrollY.value = 0;
    shareButtonScale.value = 1;
    shareButtonGlow.value = 0;
    shareSheetY.value = 100;
    shareSheetOpacity.value = 0;
    messagesOpacity.value = 0;
    mailOpacity.value = 0;
    pageKeepOpacity.value = 0;
    notesOpacity.value = 0;
    pageKeepScale.value = 1;
    pageKeepGlow.value = 0;
    pageKeepHighlight.value = 0;
    savedModalOpacity.value = 0;
    savedModalScale.value = 0.8;

    // Scene 1b: Content scrolls (at 800ms)
    contentScrollY.value = withDelay(
      TIMING.SCENE_1A,
      withTiming(-30, {
        duration: TIMING.SCENE_1B,
        easing: Easing.inOut(Easing.cubic),
      })
    );

    // Scene 2: Share button glow + press (starts at 1400ms)
    const scene2Start = TIMING.SCENE_1A + TIMING.SCENE_1B;

    // Glow starts at 1200ms (200ms before scene2Start)
    shareButtonGlow.value = withDelay(
      scene2Start - 200,
      withSequence(
        withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 100 })
      )
    );

    // Button press at 1400ms
    shareButtonScale.value = withDelay(
      scene2Start,
      withSequence(
        withTiming(0.85, { duration: 200, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) })
      )
    );

    // Scene 3: Share sheet slides up + icons fade in (starts at 1800ms)
    const scene3Start = scene2Start + TIMING.SCENE_2;
    shareSheetOpacity.value = withDelay(
      scene3Start,
      withTiming(1, { duration: 100 })
    );
    shareSheetY.value = withDelay(
      scene3Start,
      withTiming(0, {
        duration: TIMING.SCENE_3,
        easing: Easing.out(Easing.cubic),
      })
    );

    // Icons fade in sequentially (100ms apart)
    messagesOpacity.value = withDelay(
      scene3Start + 100,
      withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) })
    );
    mailOpacity.value = withDelay(
      scene3Start + 200,
      withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) })
    );
    pageKeepOpacity.value = withDelay(
      scene3Start + 300,
      withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) })
    );
    notesOpacity.value = withDelay(
      scene3Start + 400,
      withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) })
    );

    // Scene 4: PageKeep icon glow + press (starts at 2300ms)
    const scene4Start = scene3Start + TIMING.SCENE_3;

    // PageKeep glow starts at 2100ms (200ms before press)
    pageKeepGlow.value = withDelay(
      scene3Start + 300, // Same time as pageKeep icon fades in
      withSequence(
        withTiming(1, { duration: 400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 100 })
      )
    );

    // Icon press at 2300ms
    pageKeepScale.value = withDelay(
      scene4Start,
      withSequence(
        withTiming(0.85, { duration: 200, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) })
      )
    );
    pageKeepHighlight.value = withDelay(
      scene4Start,
      withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 200 })
      )
    );

    // Scene 5: Saved modal appears (at 2700ms)
    const scene5Start = scene4Start + TIMING.SCENE_4;
    savedModalOpacity.value = withDelay(
      scene5Start,
      withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) })
    );
    savedModalScale.value = withDelay(
      scene5Start,
      withTiming(1, { duration: 350, easing: Easing.out(Easing.back(1.2)) })
    );

    // Scene 6: Modal + sheet dismiss together (at 3600ms)
    const scene6Start = scene5Start + TIMING.SCENE_5;
    savedModalOpacity.value = withDelay(
      scene6Start,
      withTiming(0, { duration: TIMING.SCENE_6, easing: Easing.in(Easing.cubic) })
    );
    savedModalScale.value = withDelay(
      scene6Start,
      withTiming(0.9, { duration: TIMING.SCENE_6 })
    );
    shareSheetY.value = withDelay(
      scene6Start,
      withTiming(100, {
        duration: TIMING.SCENE_6,
        easing: Easing.in(Easing.cubic),
      })
    );
    shareSheetOpacity.value = withDelay(
      scene6Start + TIMING.SCENE_6 - 150,
      withTiming(0, { duration: 150 })
    );

    // Fade out icons
    messagesOpacity.value = withDelay(scene6Start, withTiming(0, { duration: 200 }));
    mailOpacity.value = withDelay(scene6Start, withTiming(0, { duration: 200 }));
    pageKeepOpacity.value = withDelay(scene6Start, withTiming(0, { duration: 200 }));
    notesOpacity.value = withDelay(scene6Start, withTiming(0, { duration: 200 }));
  };

  useEffect(() => {
    // Initial run
    runAnimation();

    // Loop animation
    intervalRef.current = setInterval(() => {
      runAnimation();
    }, TOTAL_DURATION);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Animated props
  const contentScrollAnimatedProps = useAnimatedProps(() => ({
    transform: [{ translateY: contentScrollY.value }],
  }));

  const shareButtonGlowAnimatedProps = useAnimatedProps(() => ({
    opacity: shareButtonGlow.value * 0.3,
  }));

  const shareButtonAnimatedProps = useAnimatedProps(() => ({
    transform: [{ scale: shareButtonScale.value }],
  }));

  const shareSheetAnimatedProps = useAnimatedProps(() => ({
    transform: [{ translateY: shareSheetY.value }],
    opacity: shareSheetOpacity.value,
  }));

  const messagesAnimatedProps = useAnimatedProps(() => ({
    opacity: messagesOpacity.value,
  }));

  const mailAnimatedProps = useAnimatedProps(() => ({
    opacity: mailOpacity.value,
  }));

  const pageKeepIconAnimatedProps = useAnimatedProps(() => ({
    opacity: pageKeepOpacity.value,
  }));

  const notesAnimatedProps = useAnimatedProps(() => ({
    opacity: notesOpacity.value,
  }));

  const pageKeepGlowAnimatedProps = useAnimatedProps(() => ({
    opacity: pageKeepGlow.value * 0.4,
  }));

  const pageKeepAnimatedProps = useAnimatedProps(() => ({
    transform: [{ scale: pageKeepScale.value }],
  }));

  const pageKeepHighlightAnimatedProps = useAnimatedProps(() => ({
    opacity: pageKeepHighlight.value * 0.4,
  }));

  const savedModalAnimatedProps = useAnimatedProps(() => ({
    opacity: savedModalOpacity.value,
    transform: [{ scale: savedModalScale.value }],
  }));

  // Phone dimensions
  const phoneX = 90;
  const phoneY = 10;
  const phoneW = 120;
  const phoneH = 195;
  const screenPadding = 4;
  const screenX = phoneX + screenPadding;
  const screenY = phoneY + 20;
  const screenW = phoneW - screenPadding * 2;
  const screenH = phoneH - 24;

  // Share sheet position (inside phone screen)
  const sheetHeight = 85;
  const sheetY = screenY + screenH - sheetHeight;

  return (
    <Svg width="300" height="220" viewBox="0 0 300 220">
      <Defs>
        <LinearGradient id="phoneGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={colors.card} stopOpacity="1" />
          <Stop offset="100%" stopColor={colors.card} stopOpacity="0.85" />
        </LinearGradient>
        <LinearGradient id="screenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <Stop offset="100%" stopColor="#F8F8F8" stopOpacity="1" />
        </LinearGradient>
        <LinearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.8" />
          <Stop offset="100%" stopColor={colors.highlight} stopOpacity="0.6" />
        </LinearGradient>
        <LinearGradient id="sheetGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#F9F9F9" stopOpacity="1" />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
        </LinearGradient>
        <LinearGradient id="mailGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#5AC8FA" stopOpacity="1" />
          <Stop offset="100%" stopColor="#007AFF" stopOpacity="1" />
        </LinearGradient>
        <ClipPath id="screenClip">
          <Rect
            x={screenX}
            y={screenY}
            width={screenW}
            height={screenH}
            rx="4"
          />
        </ClipPath>
      </Defs>

      {/* iPhone Frame */}
      <Rect
        x={phoneX}
        y={phoneY}
        width={phoneW}
        height={phoneH}
        rx="20"
        fill="url(#phoneGradient)"
        stroke={colors.border}
        strokeWidth="2"
      />

      {/* Dynamic Island */}
      <Rect
        x={phoneX + phoneW / 2 - 20}
        y={phoneY + 6}
        width="40"
        height="10"
        rx="5"
        fill="#000000"
      />

      {/* Screen background */}
      <Rect
        x={screenX}
        y={screenY}
        width={screenW}
        height={screenH}
        rx="4"
        fill="url(#screenGradient)"
      />

      {/* Content clipped to screen */}
      <G clipPath="url(#screenClip)">
        {/* Scrollable webpage content */}
        <AnimatedG animatedProps={contentScrollAnimatedProps}>
          {/* Safari URL bar */}
          <Rect
            x={screenX + 6}
            y={screenY + 8}
            width={screenW - 12}
            height="18"
            rx="9"
            fill={colors.muted}
            opacity="0.2"
          />
          {/* Lock icon */}
          <Circle
            cx={screenX + 14}
            cy={screenY + 17}
            r="3"
            fill={colors.text}
            opacity="0.3"
          />
          {/* URL text */}
          <Rect
            x={screenX + 22}
            y={screenY + 13}
            width="45"
            height="8"
            rx="4"
            fill={colors.text}
            opacity="0.15"
          />

          {/* Website header banner */}
          <Rect
            x={screenX}
            y={screenY + 32}
            width={screenW}
            height="14"
            fill={colors.accent}
            opacity="0.5"
          />
          {/* Logo in header */}
          <Circle
            cx={screenX + 10}
            cy={screenY + 39}
            r="5"
            fill="white"
            opacity="0.9"
          />
          {/* Brand name */}
          <Rect
            x={screenX + 18}
            y={screenY + 36}
            width="30"
            height="6"
            rx="2"
            fill="white"
            opacity="0.7"
          />

          {/* Navigation bar */}
          <G>
            <Rect
              x={screenX + 8}
              y={screenY + 52}
              width="18"
              height="6"
              rx="2"
              fill={colors.text}
              opacity="0.2"
            />
            <Rect
              x={screenX + 30}
              y={screenY + 52}
              width="22"
              height="6"
              rx="2"
              fill={colors.text}
              opacity="0.2"
            />
            <Rect
              x={screenX + 56}
              y={screenY + 52}
              width="20"
              height="6"
              rx="2"
              fill={colors.text}
              opacity="0.2"
            />
          </G>

          {/* Hero image */}
          <Rect
            x={screenX + 8}
            y={screenY + 64}
            width={screenW - 16}
            height="40"
            rx="6"
            fill="url(#heroGradient)"
          />

          {/* Article title */}
          <Rect
            x={screenX + 8}
            y={screenY + 112}
            width="88"
            height="10"
            rx="2"
            fill={colors.text}
            opacity="0.3"
          />

          {/* Author/date */}
          <Rect
            x={screenX + 8}
            y={screenY + 126}
            width="40"
            height="5"
            rx="2"
            fill={colors.text}
            opacity="0.15"
          />

          {/* Article content paragraphs */}
          <Rect
            x={screenX + 8}
            y={screenY + 138}
            width="96"
            height="6"
            rx="2"
            fill={colors.text}
            opacity="0.12"
          />
          <Rect
            x={screenX + 8}
            y={screenY + 148}
            width="92"
            height="6"
            rx="2"
            fill={colors.text}
            opacity="0.12"
          />
          <Rect
            x={screenX + 8}
            y={screenY + 158}
            width="100"
            height="6"
            rx="2"
            fill={colors.text}
            opacity="0.12"
          />

          {/* Inline image in article */}
          <Rect
            x={screenX + 8}
            y={screenY + 170}
            width="45"
            height="35"
            rx="4"
            fill={colors.muted}
            opacity="0.25"
          />
          {/* Text wrapping around image */}
          <Rect
            x={screenX + 58}
            y={screenY + 170}
            width="46"
            height="6"
            rx="2"
            fill={colors.text}
            opacity="0.12"
          />
          <Rect
            x={screenX + 58}
            y={screenY + 180}
            width="42"
            height="6"
            rx="2"
            fill={colors.text}
            opacity="0.12"
          />
          <Rect
            x={screenX + 58}
            y={screenY + 190}
            width="48"
            height="6"
            rx="2"
            fill={colors.text}
            opacity="0.12"
          />

          {/* More paragraphs */}
          <Rect
            x={screenX + 8}
            y={screenY + 212}
            width="94"
            height="6"
            rx="2"
            fill={colors.text}
            opacity="0.12"
          />
          <Rect
            x={screenX + 8}
            y={screenY + 222}
            width="88"
            height="6"
            rx="2"
            fill={colors.text}
            opacity="0.12"
          />
        </AnimatedG>

        {/* Safari bottom toolbar */}
        <Rect
          x={screenX}
          y={screenY + screenH - 28}
          width={screenW}
          height="28"
          fill="#FAFAFA"
        />
        <Rect
          x={screenX}
          y={screenY + screenH - 28}
          width={screenW}
          height="1"
          fill={colors.border}
          opacity="0.3"
        />

        {/* Share button with glow */}
        <G>
          {/* Glow effect */}
          <AnimatedCircle
            cx={screenX + screenW / 2}
            cy={screenY + screenH - 14}
            r="20"
            fill={colors.accent}
            animatedProps={shareButtonGlowAnimatedProps}
          />

          {/* Share button */}
          <AnimatedG
            animatedProps={shareButtonAnimatedProps}
            origin={`${screenX + screenW / 2}, ${screenY + screenH - 14}`}
          >
            <G transform={`translate(${screenX + screenW / 2}, ${screenY + screenH - 14})`}>
              {/* Share icon box */}
              <Rect
                x="-6"
                y="-2"
                width="12"
                height="9"
                rx="1.5"
                fill="none"
                stroke="#007AFF"
                strokeWidth="1.5"
              />
              {/* Share arrow */}
              <Path
                d="M 0,-8 L 0,2 M -3,-5 L 0,-8 L 3,-5"
                stroke="#007AFF"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </G>
          </AnimatedG>
        </G>

        {/* Animated Share Sheet */}
        <AnimatedG animatedProps={shareSheetAnimatedProps}>
          {/* Sheet background with rounded top corners */}
          <Path
            d={`
              M ${screenX},${sheetY + 12}
              Q ${screenX},${sheetY} ${screenX + 12},${sheetY}
              L ${screenX + screenW - 12},${sheetY}
              Q ${screenX + screenW},${sheetY} ${screenX + screenW},${sheetY + 12}
              L ${screenX + screenW},${sheetY + sheetHeight}
              L ${screenX},${sheetY + sheetHeight}
              Z
            `}
            fill="url(#sheetGradient)"
          />

          {/* Sheet handle */}
          <Rect
            x={screenX + screenW / 2 - 15}
            y={sheetY + 6}
            width="30"
            height="4"
            rx="2"
            fill={colors.muted}
            opacity="0.4"
          />

          {/* App icons row - each fades in individually */}

          {/* Messages icon */}
          <AnimatedG animatedProps={messagesAnimatedProps}>
            <Circle
              cx={screenX + 18}
              cy={sheetY + 35}
              r="12"
              fill="#34C759"
            />
            <Path
              d={`M ${screenX + 18 - 5},${sheetY + 35 - 2}
                  Q ${screenX + 18 - 5},${sheetY + 35 - 6} ${screenX + 18},${sheetY + 35 - 6}
                  Q ${screenX + 18 + 5},${sheetY + 35 - 6} ${screenX + 18 + 5},${sheetY + 35 - 2}
                  Q ${screenX + 18 + 5},${sheetY + 35 + 2} ${screenX + 18},${sheetY + 35 + 4}
                  Q ${screenX + 18 - 5},${sheetY + 35 + 2} ${screenX + 18 - 5},${sheetY + 35 - 2}`}
              fill="white"
            />
            <Rect
              x={screenX + 18 - 10}
              y={sheetY + 52}
              width="20"
              height="4"
              rx="2"
              fill={colors.text}
              opacity="0.15"
            />
          </AnimatedG>

          {/* Mail icon */}
          <AnimatedG animatedProps={mailAnimatedProps}>
            <Circle
              cx={screenX + 46}
              cy={sheetY + 35}
              r="12"
              fill="url(#mailGradient)"
            />
            <Path
              d={`M ${screenX + 46 - 6},${sheetY + 35 - 4}
                  L ${screenX + 46},${sheetY + 35}
                  L ${screenX + 46 + 6},${sheetY + 35 - 4}
                  M ${screenX + 46 - 6},${sheetY + 35 - 4}
                  L ${screenX + 46 - 6},${sheetY + 35 + 4}
                  L ${screenX + 46 + 6},${sheetY + 35 + 4}
                  L ${screenX + 46 + 6},${sheetY + 35 - 4}`}
              fill="none"
              stroke="white"
              strokeWidth="1.2"
            />
            <Rect
              x={screenX + 46 - 8}
              y={sheetY + 52}
              width="16"
              height="4"
              rx="2"
              fill={colors.text}
              opacity="0.15"
            />
          </AnimatedG>

          {/* PageKeep icon with glow */}
          <AnimatedG animatedProps={pageKeepIconAnimatedProps}>
            {/* Background glow */}
            <AnimatedCircle
              cx={screenX + 74}
              cy={sheetY + 35}
              r="18"
              fill={PAGEKEEP_TEAL}
              animatedProps={pageKeepGlowAnimatedProps}
            />

            {/* Highlight on press */}
            <AnimatedCircle
              cx={screenX + 74}
              cy={sheetY + 35}
              r="16"
              fill={PAGEKEEP_TEAL}
              animatedProps={pageKeepHighlightAnimatedProps}
            />

            {/* PageKeep icon */}
            <AnimatedG
              animatedProps={pageKeepAnimatedProps}
              origin={`${screenX + 74}, ${sheetY + 35}`}
            >
              <Circle
                cx={screenX + 74}
                cy={sheetY + 35}
                r="12"
                fill={PAGEKEEP_TEAL}
              />
              {/* Bookmark shape */}
              <Path
                d={`M ${screenX + 74 - 4},${sheetY + 35 - 6}
                    L ${screenX + 74 - 4},${sheetY + 35 + 5}
                    L ${screenX + 74},${sheetY + 35 + 2}
                    L ${screenX + 74 + 4},${sheetY + 35 + 5}
                    L ${screenX + 74 + 4},${sheetY + 35 - 6}
                    Z`}
                fill="white"
              />
            </AnimatedG>

            <Rect
              x={screenX + 74 - 12}
              y={sheetY + 52}
              width="24"
              height="4"
              rx="2"
              fill={colors.text}
              opacity="0.15"
            />
          </AnimatedG>

          {/* Notes icon */}
          <AnimatedG animatedProps={notesAnimatedProps}>
            <Circle
              cx={screenX + 102}
              cy={sheetY + 35}
              r="12"
              fill="#FFCC00"
            />
            <Rect
              x={screenX + 102 - 5}
              y={sheetY + 35 - 6}
              width="10"
              height="12"
              rx="1"
              fill="white"
            />
            <Rect
              x={screenX + 102 - 3}
              y={sheetY + 35 - 3}
              width="6"
              height="1.5"
              fill="#FFCC00"
            />
            <Rect
              x={screenX + 102 - 3}
              y={sheetY + 35}
              width="6"
              height="1.5"
              fill="#FFCC00"
            />
            <Rect
              x={screenX + 102 - 10}
              y={sheetY + 52}
              width="20"
              height="4"
              rx="2"
              fill={colors.text}
              opacity="0.15"
            />
          </AnimatedG>

          {/* Divider */}
          <Rect
            x={screenX + 8}
            y={sheetY + 62}
            width={screenW - 16}
            height="1"
            fill={colors.border}
            opacity="0.2"
          />

          {/* Action items */}
          <Rect
            x={screenX + 8}
            y={sheetY + 70}
            width="60"
            height="6"
            rx="2"
            fill={colors.text}
            opacity="0.1"
          />
        </AnimatedG>

        {/* Saved Modal */}
        <AnimatedG
          animatedProps={savedModalAnimatedProps}
          origin={`${screenX + screenW / 2}, ${screenY + screenH / 2}`}
        >
          {/* Modal overlay */}
          <Rect
            x={screenX}
            y={screenY}
            width={screenW}
            height={screenH}
            fill="rgba(0,0,0,0.4)"
          />
          {/* Modal card */}
          <Rect
            x={screenX + screenW / 2 - 35}
            y={screenY + screenH / 2 - 25}
            width="70"
            height="50"
            rx="12"
            fill="white"
          />
          {/* Checkmark */}
          <Circle
            cx={screenX + screenW / 2}
            cy={screenY + screenH / 2 - 5}
            r="12"
            fill="#34C759"
          />
          <Path
            d={`M ${screenX + screenW / 2 - 5},${screenY + screenH / 2 - 5}
                L ${screenX + screenW / 2 - 1},${screenY + screenH / 2 - 1}
                L ${screenX + screenW / 2 + 6},${screenY + screenH / 2 - 9}`}
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* "Saved!" text placeholder */}
          <Rect
            x={screenX + screenW / 2 - 18}
            y={screenY + screenH / 2 + 12}
            width="36"
            height="8"
            rx="4"
            fill={colors.text}
            opacity="0.7"
          />
        </AnimatedG>
      </G>
    </Svg>
  );
};

export default Slide01ShareExtension;
