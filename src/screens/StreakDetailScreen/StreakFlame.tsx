import React, { useEffect } from 'react';
import { StyleSheet, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { CompassMotion } from '../../constants/compassDesign';

/**
 * The streak flame with a subtle, looping scale "breathing" pulse — the design
 * brief's streak-flame animation. Uses a slow ease in/out on `durationCelebration`
 * so it reads as alive without being distracting. Falls back to static when
 * `animate` is false (reduced-motion / test paths).
 */
export interface StreakFlameProps {
  size?: number;
  animate?: boolean;
}

export default function StreakFlame({ size = 44, animate = true }: StreakFlameProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (animate) {
      scale.value = withRepeat(
        withTiming(1.12, {
          duration: CompassMotion.durationCelebration,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      );
    } else {
      scale.value = 1;
    }
  }, [animate, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.Text
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[styles.flame, { fontSize: size } as TextStyle, style]}
    >
      {'\u{1F525}'}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  flame: { textAlign: 'center' },
});
