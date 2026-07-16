import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { CompassMotion } from '../../constants/compassDesign';

/**
 * Faithful port of the weekly-goal ring SVG in `19-progress-overview.html`.
 *
 * react-native-svg is NOT a dependency of this project, so the mockup's
 * `<circle stroke-dasharray/stroke-dashoffset>` arc is reproduced with the
 * canonical pure-RN "two clipped rotating half-discs + punched hole" technique
 * instead — visually identical, and it animates on the JS/UI thread via
 * Reanimated with no extra native module. The two half-disc leaves sweep a
 * solid pie of `fillColor` over a `trackColor` disc; a centred `holeColor`
 * circle punches the middle out to leave a stroked ring.
 *
 * The fill animates from 0 to `progress` on mount using
 * `CompassMotion.durationExpressive` + `easeStandard`, matching the design
 * system's motion tokens (the same spec used for the XP-bar fills).
 */
export interface ProgressRingProps {
  /** Outer diameter in px. */
  size: number;
  /** Ring band thickness in px. */
  strokeWidth: number;
  /** Target fill, 0–1. Values outside the range are clamped. */
  progress: number;
  /** Unfilled band colour. */
  trackColor: string;
  /** Filled arc colour. */
  fillColor: string;
  /** Centre punch colour — set to the surface the ring sits on. */
  holeColor: string;
  /** Optional centred label, e.g. "60%". */
  label?: string;
  labelColor?: string;
  /** Disable the mount animation (used in reduced-motion / test paths). */
  animate?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

/** Clamp any incoming progress into the drawable 0–1 range. */
export function clampProgress(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export default function ProgressRing({
  size,
  strokeWidth,
  progress,
  trackColor,
  fillColor,
  holeColor,
  label,
  labelColor,
  animate = true,
  accessibilityLabel,
  testID,
}: ProgressRingProps) {
  const target = clampProgress(progress);
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

  const rightStyle = useAnimatedStyle(() => {
    const deg = anim.value >= 0.5 ? 180 : anim.value * 360;
    return {
      transform: [
        { translateX: size / 4 },
        { rotate: `${deg}deg` },
        { translateX: -size / 4 },
      ],
    };
  });

  const leftStyle = useAnimatedStyle(() => {
    const deg = anim.value >= 0.5 ? (anim.value - 0.5) * 360 : 0;
    return {
      transform: [
        { translateX: -size / 4 },
        { rotate: `${deg}deg` },
        { translateX: size / 4 },
      ],
    };
  });

  const dims = useMemo(
    () =>
      makeDims({
        size,
        strokeWidth,
        trackColor,
        fillColor,
        holeColor,
      }),
    [size, strokeWidth, trackColor, fillColor, holeColor],
  );

  return (
    <View
      style={dims.circle}
      testID={testID}
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'progressbar' : undefined}
      accessibilityValue={
        accessibilityLabel
          ? { min: 0, max: 100, now: Math.round(target * 100) }
          : undefined
      }
      accessibilityLabel={accessibilityLabel}
    >
      <View style={dims.leftWrap}>
        <Animated.View style={[dims.leftLoader, leftStyle]} />
      </View>
      <View style={dims.rightWrap}>
        <Animated.View style={[dims.rightLoader, rightStyle]} />
      </View>
      <View style={dims.hole}>
        {label ? (
          <Text style={[dims.label, labelColor ? { color: labelColor } : null]}>
            {label}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

interface DimArgs {
  size: number;
  strokeWidth: number;
  trackColor: string;
  fillColor: string;
  holeColor: string;
}

/** Builds the size-and-colour-dependent StyleSheet for a single ring. */
function makeDims({ size, strokeWidth, trackColor, fillColor, holeColor }: DimArgs) {
  const half = size / 2;
  const holeSize = size - strokeWidth * 2;
  return StyleSheet.create({
    circle: {
      width: size,
      height: size,
      borderRadius: half,
      backgroundColor: trackColor,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    leftWrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: half,
      height: size,
      overflow: 'hidden',
    },
    rightWrap: {
      position: 'absolute',
      top: 0,
      left: half,
      width: half,
      height: size,
      overflow: 'hidden',
    },
    leftLoader: {
      position: 'absolute',
      top: 0,
      left: half,
      width: half,
      height: size,
      backgroundColor: fillColor,
      borderTopRightRadius: half,
      borderBottomRightRadius: half,
    },
    rightLoader: {
      position: 'absolute',
      top: 0,
      left: -half,
      width: half,
      height: size,
      backgroundColor: fillColor,
      borderTopLeftRadius: half,
      borderBottomLeftRadius: half,
    },
    hole: {
      width: holeSize,
      height: holeSize,
      borderRadius: holeSize / 2,
      backgroundColor: holeColor,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      // Inter, not Syne — this is always a numeric percentage ("60%"), and
      // Syne's "0" renders visually identical to a lowercase "o" at this size.
      fontFamily: 'Inter_800ExtraBold',
      fontWeight: '800',
      fontSize: Math.max(11, Math.round(size * 0.23)),
      color: fillColor,
    },
  });
}
