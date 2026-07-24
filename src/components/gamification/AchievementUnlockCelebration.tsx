import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { CompassFonts, CompassMotion, CompassRadius, CompassSpacing, COMPASS_TOUCH_MIN } from '../../constants/compassDesign';
import { TierBadge } from './TierBadge';
import { TIER_META, type AchievementTier } from './tiers';
import type { IconName } from '../icons';

export interface AchievementUnlockCelebrationProps {
  /** Rarity tier 1–5 of the unlocked achievement. */
  tier: AchievementTier;
  /** Achievement display name. */
  label: string;
  /** Optional glyph for the medallion (defaults to the brand spark). */
  iconName?: IconName;
  /** Optional XP bonus awarded, shown as a gold pill. */
  xpBonus?: number;
  /** Fired when the user taps the primary CTA. */
  onContinue: () => void;
  /** CTA label. Default "Nice!". */
  continueLabel?: string;
  testID?: string;
}

/**
 * Achievement-unlock celebration (design doc § 6 + § 7 Motion). An **Amethyst**
 * stage: the spark-medallion resolves from a tilt → settle on a spring, then a
 * rarity pill and a gold XP-bonus pill fade up staggered; one haptic fires. A
 * primary CTA is always in reach.
 *
 * **Reduced motion**: the tilt/scale spring and the staggered fade are replaced
 * by a plain dissolve with everything shown instantly — no rotation or parallax.
 */
export function AchievementUnlockCelebration({
  tier,
  label,
  iconName,
  xpBonus,
  onContinue,
  continueLabel = 'Nice!',
  testID,
}: AchievementUnlockCelebrationProps) {
  const { colors } = useCompassTheme();
  const reduced = useReducedMotion();
  const meta = TIER_META[tier];

  const opacity = useSharedValue(0);
  const scale = useSharedValue(reduced ? 1 : 0.5);
  const tilt = useSharedValue(reduced ? 0 : -12);
  const pillsOpacity = useSharedValue(reduced ? 1 : 0);
  const pillsRise = useSharedValue(reduced ? 0 : 10);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: CompassMotion.durationStandard });
    if (reduced) return;
    scale.value = withSpring(1, { damping: 10, stiffness: 130 });
    tilt.value = withSpring(0, { damping: 12, stiffness: 120 });
    pillsOpacity.value = withDelay(180, withTiming(1, { duration: CompassMotion.durationStandard }));
    pillsRise.value = withDelay(180, withSpring(0, { damping: 14, stiffness: 140 }));
  }, [opacity, scale, tilt, pillsOpacity, pillsRise, reduced]);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  const stageStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${tilt.value}deg` }],
  }));
  const pillsStyle = useAnimatedStyle(() => ({
    opacity: pillsOpacity.value,
    transform: [{ translateY: pillsRise.value }],
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.stage, { backgroundColor: colors.achievement }, stageStyle]}
      accessibilityViewIsModal
      testID={testID}
    >
      <Text style={[styles.eyebrow, { color: colors.onPrimary }]}>Achievement unlocked</Text>

      <Animated.View style={badgeStyle}>
        <TierBadge tier={tier} label={label} iconName={iconName} showTierLabel={false} size={120} />
      </Animated.View>

      <Text style={[styles.name, { color: colors.onPrimary }]}>{label}</Text>

      <Animated.View style={[styles.pillRow, pillsStyle]}>
        <View
          style={[styles.pill, { backgroundColor: colors.achievementTint }]}
          accessible
          accessibilityLabel={`${meta.name}, tier ${meta.tier} of 5`}
          testID={testID ? `${testID}-rarity` : undefined}
        >
          <Text style={[styles.pillText, { color: colors.achievementText }]}>
            {meta.pips} {meta.name}
          </Text>
        </View>

        {xpBonus != null ? (
          <View
            style={[styles.pill, { backgroundColor: colors.xpTint }]}
            accessible
            accessibilityLabel={`Plus ${xpBonus} XP bonus`}
            testID={testID ? `${testID}-xp` : undefined}
          >
            <Text style={[styles.pillText, { color: colors.xpText }]}>+{xpBonus} XP</Text>
          </View>
        ) : null}
      </Animated.View>

      <Pressable
        onPress={onContinue}
        accessibilityRole="button"
        accessibilityLabel={continueLabel}
        style={[styles.cta, { backgroundColor: colors.actionPrimary }]}
        testID={testID ? `${testID}-cta` : undefined}
      >
        <Text style={[styles.ctaLabel, { color: colors.onPrimary }]}>{continueLabel}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: CompassSpacing.s6,
    gap: CompassSpacing.s4,
  },
  eyebrow: {
    fontFamily: CompassFonts.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  name: {
    fontFamily: CompassFonts.display,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    gap: CompassSpacing.s2,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pill: {
    paddingHorizontal: CompassSpacing.s4,
    paddingVertical: CompassSpacing.s2,
    borderRadius: CompassRadius.pill,
  },
  pillText: {
    fontFamily: CompassFonts.bodySemiBold,
    fontSize: 13,
    fontWeight: '600',
  },
  cta: {
    marginTop: CompassSpacing.s4,
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
