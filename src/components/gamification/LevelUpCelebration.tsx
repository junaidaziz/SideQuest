import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { CompassFonts, CompassMotion, CompassRadius, CompassSpacing, COMPASS_TOUCH_MIN } from '../../constants/compassDesign';

export interface LevelUpCelebrationProps {
  /** The newly-reached level number. */
  level: number;
  /** Optional perk unlocked at this level, shown beneath the medallion. */
  perk?: string;
  /** Fired when the user taps the primary CTA to continue. */
  onContinue: () => void;
  /** CTA label. Default "Continue". */
  continueLabel?: string;
  testID?: string;
}

/**
 * Level-up celebration (design doc § 6 + § 7 Motion). A full-bleed **Aurora**
 * takeover: the medallion rises + settles on a spring, light rays rotate
 * ambiently, one success haptic fires. A clear primary CTA is always in reach
 * (delight never blocks the next action).
 *
 * **Reduced motion is first-class**: when `useReducedMotion()` is true, the
 * rays and the rise/scale are dropped for a simple dissolve with the value
 * shown instantly — no rotation, no spring, no parallax.
 */
export function LevelUpCelebration({
  level,
  perk,
  onContinue,
  continueLabel = 'Continue',
  testID,
}: LevelUpCelebrationProps) {
  const { colors } = useCompassTheme();
  const reduced = useReducedMotion();

  const opacity = useSharedValue(0);
  const rise = useSharedValue(reduced ? 0 : 24);
  const scale = useSharedValue(reduced ? 1 : 0.6);
  const rayAngle = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: CompassMotion.durationStandard });
    if (reduced) return;
    rise.value = withSpring(0, { damping: 12, stiffness: 120 });
    scale.value = withDelay(80, withSpring(1, { damping: 10, stiffness: 130 }));
    rayAngle.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [opacity, rise, scale, rayAngle, reduced]);

  useEffect(() => {
    // One success haptic — best-effort, never blocks the celebration.
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  const stageStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const medallionStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: rise.value }, { scale: scale.value }],
  }));
  const raysStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rayAngle.value}deg` }] }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, stageStyle]}
      accessibilityViewIsModal
      testID={testID}
    >
      <LinearGradient
        colors={[colors.heroGradStart, colors.heroGradEnd]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.stage}
      >
        <View style={styles.center} accessibilityRole="summary" accessibilityLabel={`Level ${level} reached`}>
          {!reduced ? (
            <Animated.View style={[styles.rays, raysStyle]} accessibilityElementsHidden testID={testID ? `${testID}-rays` : undefined}>
              {[0, 45, 90, 135].map((deg) => (
                <View
                  key={deg}
                  style={[styles.ray, { backgroundColor: colors.onHero, transform: [{ rotate: `${deg}deg` }] }]}
                />
              ))}
            </Animated.View>
          ) : null}

          <Animated.View style={[styles.medallion, { borderColor: colors.onHero }, medallionStyle]}>
            <Text style={[styles.levelNum, { color: colors.onHero }]}>{level}</Text>
          </Animated.View>

          <Text style={[styles.title, { color: colors.onHero }]}>Level {level}</Text>
          {perk ? <Text style={[styles.perk, { color: colors.onHero }]}>{perk}</Text> : null}
        </View>

        <Pressable
          onPress={onContinue}
          accessibilityRole="button"
          accessibilityLabel={continueLabel}
          style={[styles.cta, { backgroundColor: colors.actionPrimary }]}
          testID={testID ? `${testID}-cta` : undefined}
        >
          <Text style={[styles.ctaLabel, { color: colors.onPrimary }]}>{continueLabel}</Text>
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: CompassSpacing.s6,
  },
  center: {
    alignItems: 'center',
    gap: CompassSpacing.s3,
  },
  rays: {
    position: 'absolute',
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.22,
  },
  ray: {
    position: 'absolute',
    width: 3,
    height: 220,
    borderRadius: 2,
  },
  medallion: {
    width: 132,
    height: 132,
    borderRadius: CompassRadius.pill,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNum: {
    fontFamily: CompassFonts.display,
    fontSize: 56,
    fontWeight: '800',
  },
  title: {
    fontFamily: CompassFonts.display,
    fontSize: 26,
    fontWeight: '700',
  },
  perk: {
    fontFamily: CompassFonts.bodyMedium,
    fontSize: 15,
    textAlign: 'center',
  },
  cta: {
    position: 'absolute',
    bottom: CompassSpacing.s9,
    minHeight: COMPASS_TOUCH_MIN,
    paddingHorizontal: CompassSpacing.s8,
    borderRadius: CompassRadius.btn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    fontFamily: CompassFonts.bodySemiBold,
    fontSize: 16,
    fontWeight: '600',
  },
});
