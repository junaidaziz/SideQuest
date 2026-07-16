/**
 * SideQuest design tokens.
 *
 * Single source of truth for colour, typography, shape, spacing, and motion.
 * Established on screen 1 (onboarding) from `mockups/design-tokens.md`.
 * Every screen imports from here — do not hardcode hex colours or magic numbers.
 */

/** Named colour tokens. */
export const Colors = {
  ink: '#0E0E1A',
  surface: '#FFFFFF',
  surfaceMuted: '#F5F3FF',
  primary: '#5B3DE8',
  primaryDark: '#4A2ED6',
  primaryLight: '#EBE7FD',
  accent: '#FFB800',
  /** Tinted accent background for XP/reward badges. */
  accentLight: '#FFF8E1',
  /** Darkened accent for accent-on-light text (WCAG contrast). */
  accentDark: '#B45309',
  textSecondary: '#6B6880',
  border: '#E8E5F4',
  error: '#E53935',
  success: '#2E7D32',
  /** Tinted success background for the "saved" affordance. */
  successLight: '#E8F5E9',
  /** Third category accent ("discover" quests). */
  teal: '#0F766E',
  /** Tinted teal background for "discover" badges. */
  tealLight: '#F0FDFA',
  white: '#FFFFFF',
  /** Translucent white for elements sitting on a `primary`-filled surface. */
  onPrimaryBorder: 'rgba(255, 255, 255, 0.4)',
  onPrimaryFill: 'rgba(255, 255, 255, 0.18)',
  /** Dim backdrop behind modals and bottom sheets. */
  scrim: 'rgba(14, 14, 26, 0.55)',
} as const;

/** Border radii by role. */
export const Radius = {
  card: 16,
  btn: 14,
  chip: 8,
  sheet: 24,
} as const;

/**
 * Spacing scale: 4 · 8 · 12 · 16 · 20 · 24 · 28 · 32 · 40 · 48 · 64.
 * `base` (16) is the default gutter.
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  xxxl: 32,
  huge: 40,
  giant: 48,
  colossal: 64,
} as const;

/**
 * Font family names, loaded via `@expo-google-fonts/plus-jakarta-sans` +
 * `@expo-google-fonts/inter` and `useFonts` in the root `app/_layout.tsx`
 * (which blocks first render — behind the native splash screen — until these
 * are ready, so text never flashes in a system font first).
 */
export const Fonts = {
  displayExtraBold: 'PlusJakartaSans_800ExtraBold',
  displayBold: 'PlusJakartaSans_700Bold',
  bodySemiBold: 'Inter_600SemiBold',
  bodyMedium: 'Inter_500Medium',
  bodyRegular: 'Inter_400Regular',
} as const;

/** Font sizes by role (px). */
export const FontSize = {
  h1: 30,
  h2: 22,
  cardLabel: 16,
  body: 15,
  /** Between `caption` and `body` — long-form text in a detail sheet (e.g. a
   * mission's full brief), per the mockup's `.sheet-body` (14px/1.65). */
  bodySmall: 14,
  caption: 13,
  button: 16,
  /** Large numeral in a stat cell (e.g. Profile's "Quests done" count) —
   * per the mockup's `.stat-num` (20px/800). */
  statValue: 20,
  /** Caption under a stat-cell numeral — per the mockup's `.stat-cap` (12px). */
  statCaption: 12,
} as const;

/** Line heights by role (px). */
export const LineHeight = {
  h1: 35,
  h2: 26,
  cardLabel: 22,
  body: 24,
  /** Pairs with `FontSize.bodySmall` — 14 * 1.65 from the mockup, rounded. */
  bodySmall: 23,
  caption: 20,
  /** A tighter caption-sized line height (13px * 1.5, vs. `caption`'s 1.54)
   * used where the mockup specifies a distinct ratio — e.g. `.proof-text`. */
  captionTight: 19,
} as const;

/** Motion durations (ms). */
export const Duration = {
  quick: 150,
  screen: 350,
} as const;

/** Standard easing bezier control points. */
export const Easing = {
  standard: [0.4, 0, 0.2, 1] as const,
} as const;

export type ColorKey = keyof typeof Colors;
export type SpacingKey = keyof typeof Spacing;
export type RadiusKey = keyof typeof Radius;
export type FontKey = keyof typeof Fonts;
