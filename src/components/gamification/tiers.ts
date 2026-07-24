import type { CompassPalette } from '../../constants/compassDesign';

/**
 * The five achievement rarity tiers (design doc § 5.2 Badge & tier system).
 * All share the one spark-medallion shape; rarity ramps around the Achievement
 * amethyst anchor. Rarity is **never colour-only** — every badge also renders
 * its tier name and a diamond pip count (1–5), so meaning survives for
 * colour-blind users and screen readers.
 */
export type AchievementTier = 1 | 2 | 3 | 4 | 5;

export interface TierMeta {
  readonly tier: AchievementTier;
  readonly name: string;
  /** Diamond pip string (1–5), the non-colour rarity cue. */
  readonly pips: string;
}

export const TIER_META: Record<AchievementTier, TierMeta> = {
  1: { tier: 1, name: 'Common', pips: '◆' },
  2: { tier: 2, name: 'Uncommon', pips: '◆◆' },
  3: { tier: 3, name: 'Rare', pips: '◆◆◆' },
  4: { tier: 4, name: 'Epic', pips: '◆◆◆◆' },
  5: { tier: 5, name: 'Legendary', pips: '◆◆◆◆◆' },
};

export interface TierVisual {
  /** 2+ stops → render a gradient medallion; 1 stop → a solid fill. */
  readonly fill: readonly string[];
  /** Glyph + text-on-medallion colour. */
  readonly glyph: string;
  /** Pip / tier-name text colour (AA on the surrounding surface). */
  readonly accent: string;
  /** Optional rim colour (Legendary gold rim). */
  readonly rim?: string;
  /**
   * Whether this tier carries the celebration glow shadow. When true, the glow
   * is drawn in {@link TierVisual.glowColor} (the theme-resolved spark hue) so
   * dark mode gets its lighter `--shadow-glow` spark rather than a fixed orange.
   */
  readonly glow: boolean;
  /** Theme-resolved glow shadow colour (design doc `--shadow-glow` spark). */
  readonly glowColor: string;
}

/**
 * Resolves the per-tier medallion treatment against the active palette.
 * Kept as a pure function so it can be unit-tested without rendering.
 */
export function tierVisual(tier: AchievementTier, colors: CompassPalette): TierVisual {
  // `brandCoral` resolves to the Halcyon+ spark (#EE6C4D light / #F2895C dark),
  // matching the design doc's `--shadow-glow` spark hue in each theme.
  const glowColor = colors.brandCoral;
  switch (tier) {
    case 1: // Common — neutral fill, tertiary glyph
      return { fill: [colors.bgSubtle], glyph: colors.textTertiary, accent: colors.textTertiary, glow: false, glowColor };
    case 2: // Uncommon — Community cerulean tint (beside the anchor)
      return { fill: [colors.communityTint], glyph: colors.community, accent: colors.communityText, glow: false, glowColor };
    case 3: // Rare — Amethyst, the system anchor
      return { fill: [colors.achievement], glyph: colors.onPrimary, accent: colors.achievementText, glow: false, glowColor };
    case 4: // Epic — amethyst → magenta gradient + inner glow
      return {
        fill: [colors.achievement, colors.chart6],
        glyph: colors.onPrimary,
        accent: colors.achievementText,
        glow: true,
        glowColor,
      };
    default: // 5 · Legendary — full Aurora + gold rim + glow
      return {
        fill: [colors.heroGradStart, colors.heroGradEnd],
        glyph: colors.onHero,
        accent: colors.streakText,
        rim: colors.brandGold,
        glow: true,
        glowColor,
      };
  }
}
