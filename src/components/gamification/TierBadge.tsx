import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { CompassFonts, CompassRadius, CompassSpacing } from '../../constants/compassDesign';
import { Icon, type IconName } from '../icons';
import { TIER_META, tierVisual, type AchievementTier } from './tiers';

export interface TierBadgeProps {
  /** Rarity tier 1–5 (Common → Legendary). */
  tier: AchievementTier;
  /** Achievement name, woven into the accessibility label when provided. */
  label?: string;
  /** Glyph shown inside the medallion. Defaults to the brand spark. */
  iconName?: IconName;
  /** Medallion diameter in px. Default 76 (design gallery size). */
  size?: number;
  /** Show the tier name + pip row beneath the medallion. Default true. */
  showTierLabel?: boolean;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Achievement rarity badge — the shared spark-medallion (design doc § 5.2).
 *
 * The medallion is rendered as a soft rounded shape (approximating the spec's
 * rounded hexagon) filled per tier: neutral / cerulean-tint / amethyst /
 * amethyst→magenta gradient / full-Aurora gradient. Rarity is conveyed by the
 * **tier name + diamond pip count**, never colour alone — the pips are hidden
 * from assistive tech because the badge's own accessibilityLabel already states
 * the tier, and the whole badge announces e.g. "Trailblazer achievement, Rare,
 * tier 3 of 5".
 */
export function TierBadge({
  tier,
  label,
  iconName = 'spark',
  size = 76,
  showTierLabel = true,
  style,
  testID,
}: TierBadgeProps) {
  const { colors } = useCompassTheme();
  const meta = TIER_META[tier];
  const visual = tierVisual(tier, colors);
  const isGradient = visual.fill.length > 1;
  const glyphSize = Math.round(size * 0.42);

  const medallionStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: CompassRadius.lg,
    ...(visual.rim ? { borderWidth: 2, borderColor: visual.rim } : null),
    // Theme-aware celebration glow: shadowColor is resolved from the runtime
    // palette (not the static stylesheet, which can't read the active theme),
    // so dark mode gets its lighter spark hue instead of a fixed orange.
    ...(visual.glow ? { ...styles.glow, shadowColor: visual.glowColor } : null),
  };

  const a11yLabel = `${label ? `${label} achievement, ` : ''}${meta.name}, tier ${meta.tier} of 5`;

  return (
    <View
      style={[styles.container, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={a11yLabel}
      testID={testID}
    >
      {isGradient ? (
        <LinearGradient
          colors={visual.fill as [string, string, ...string[]]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.medallion, medallionStyle]}
          testID={testID ? `${testID}-gradient` : undefined}
        >
          <Icon name={iconName} size={glyphSize} color={visual.glyph} />
        </LinearGradient>
      ) : (
        <View
          style={[styles.medallion, medallionStyle, { backgroundColor: visual.fill[0] }]}
          testID={testID ? `${testID}-solid` : undefined}
        >
          <Icon name={iconName} size={glyphSize} color={visual.glyph} />
        </View>
      )}

      {showTierLabel ? (
        <View style={styles.labelRow}>
          <Text style={[styles.tierName, { color: colors.textPrimary }]}>{meta.name}</Text>
          <Text
            style={[styles.pips, { color: visual.accent }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {meta.pips}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  medallion: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    // shadowColor is applied inline from the resolved theme (see medallionStyle).
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 30,
    elevation: 8,
  },
  labelRow: {
    marginTop: CompassSpacing.s3,
    alignItems: 'center',
    gap: CompassSpacing.s1,
  },
  tierName: {
    fontFamily: CompassFonts.display,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.15,
  },
  pips: {
    fontSize: 11,
    letterSpacing: 3,
  },
});
