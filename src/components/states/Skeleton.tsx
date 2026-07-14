import React, { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { CompassRadius } from '../../constants/compassDesign';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: ViewStyle;
  testID?: string;
}

/**
 * A single shimmering placeholder block. Decorative by design — always hidden
 * from assistive tech (the parent LoadingState owns the single "Loading"
 * announcement) so a screen reader never reads a wall of empty shapes.
 */
export function Skeleton({
  width = '100%',
  height = 16,
  radius = CompassRadius.md,
  style,
  testID,
}: SkeletonProps) {
  const { colors } = useCompassTheme();
  const shimmer = useSharedValue(0.5);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value,
  }));

  return (
    <Animated.View
      testID={testID}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[
        styles.base,
        { width, height, borderRadius: radius, backgroundColor: colors.bgSubtle },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** Convenience wrapper for a solid non-shimmer spacer inside skeleton layouts. */
export function SkeletonRow({ children, gap = 12 }: { children: React.ReactNode; gap?: number }) {
  return <View style={[styles.row, { gap }]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
});
