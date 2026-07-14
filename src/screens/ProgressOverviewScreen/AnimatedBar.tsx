import React, { useEffect } from 'react';
import { StyleSheet, View, type AccessibilityValue } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { CompassMotion, CompassRadius } from '../../constants/compassDesign';

/**
 * The `.xp-bar-track` / `.xp-bar-fill` pair from `base.css`, ported as a
 * reusable RN component. The fill animates its width from 0 to `progress`
 * on mount with `durationExpressive` + `easeStandard`, per the design brief
 * for XP-bar fills. Height/colours are caller-supplied so the same bar serves
 * XP (violet), weekly-goal and category rows.
 */
export interface AnimatedBarProps {
  /** Fill fraction, 0–1 (clamped). */
  progress: number;
  trackColor: string;
  fillColor: string;
  /** Bar height in px. Defaults to the 10px `base.css` track height. */
  height?: number;
  animate?: boolean;
  accessibilityLabel?: string;
  accessibilityValue?: AccessibilityValue;
  testID?: string;
}

/** Clamp to the 0–1 range, treating NaN as empty. */
export function clampBar(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export default function AnimatedBar({
  progress,
  trackColor,
  fillColor,
  height = 10,
  animate = true,
  accessibilityLabel,
  accessibilityValue,
  testID,
}: AnimatedBarProps) {
  const target = clampBar(progress);
  const anim = useSharedValue(animate ? 0 : target);

  useEffect(() => {
    if (animate) {
      anim.value = withTiming(target, {
        duration: CompassMotion.durationExpressive,
        easing: Easing.bezier(
          CompassMotion.easeStandard[0],
          CompassMotion.easeStandard[1],
          CompassMotion.easeStandard[2],
          CompassMotion.easeStandard[3],
        ),
      });
    } else {
      anim.value = target;
    }
  }, [anim, animate, target]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${anim.value * 100}%`,
  }));

  return (
    <View
      testID={testID}
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: trackColor }]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={
        accessibilityValue ?? { min: 0, max: 100, now: Math.round(target * 100) }
      }
    >
      <Animated.View
        style={[styles.fill, { borderRadius: height / 2, backgroundColor: fillColor }, fillStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: CompassRadius.pill,
  },
  fill: {
    height: '100%',
  },
});
