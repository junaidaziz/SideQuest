/**
 * SideQuest "Compass" design tokens — the new system from
 * `product-redesign/05-design-system.md` / `product-redesign/mockups-html/tokens.css`.
 *
 * This coexists with `./design.ts` (the current shipped tokens) during an
 * incremental, screen-by-screen migration: each ported screen imports from
 * here instead of `design.ts`, verified individually, before the app-wide
 * navigation swap to the 4-tab Today/Explore/Progress/You structure happens
 * as the final step. Do not delete `design.ts` or mix the two systems
 * within a single screen.
 *
 * Values are transcribed verbatim from `tokens.css` — do not re-derive.
 */

export const CompassColorsLight = {
  bgCanvas: '#F6F4FC',
  bgSurface: '#FFFFFF',
  bgElevated: '#FFFFFF',
  bgSubtle: '#EFECF8',
  textPrimary: '#171527',
  textSecondary: '#68637A',
  textTertiary: '#8D879D',
  borderDefault: '#E3DFED',
  actionPrimary: '#6547F5',
  actionPressed: '#5135D7',
  focusRing: '#8069FF',
  statusSuccess: '#14866D',
  statusWarning: '#A86400',
  statusError: '#C93D4B',
  statusInfo: '#246BCE',
  rewardXp: '#C78500',
  socialCoral: '#E95549',
  brandViolet: '#6547F5',
  brandVioletDark: '#4A2ED6',
  brandCoral: '#FF6B5E',
  brandGold: '#F5B82E',
  brandTeal: '#18A999',
  brandTealDark: '#0E7A6E',
} as const;

export const CompassColorsDark = {
  bgCanvas: '#0F0D18',
  bgSurface: '#1B1827',
  bgElevated: '#242033',
  bgSubtle: '#2C283C',
  textPrimary: '#F7F5FF',
  textSecondary: '#B8B2C9',
  textTertiary: '#918AA5',
  borderDefault: '#393448',
  actionPrimary: '#8B78FF',
  actionPressed: '#A294FF',
  focusRing: '#A99DFF',
  statusSuccess: '#4ED6A8',
  statusWarning: '#FFD166',
  statusError: '#FF7C88',
  statusInfo: '#75AFFF',
  rewardXp: '#FFD166',
  socialCoral: '#FF8177',
  brandViolet: '#8B78FF',
  brandVioletDark: '#6547F5',
  brandCoral: '#FF8177',
  brandGold: '#FFD166',
  brandTeal: '#4ED6C5',
  brandTealDark: '#18A999',
} as const;

/**
 * Same shape as `Colors` in `design.ts`, but resolved for the active theme at
 * call sites via `useCompassTheme()`. Widened to `string` per key (not
 * `typeof CompassColorsLight` directly) — pinning to the light palette's
 * literal hex values would make `CompassColorsDark` (different literals,
 * same keys) structurally fail to satisfy this type.
 */
export type CompassPalette = { readonly [K in keyof typeof CompassColorsLight]: string };

export const CompassFonts = {
  display: 'PlusJakartaSans_800ExtraBold',
  displayBold: 'PlusJakartaSans_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
} as const;

/** Mirrors tokens.css's type scale exactly — size/lineHeight/weight per role. */
export const CompassType = {
  displayXl: { size: 36, lineHeight: 42, weight: '800' as const },
  displayL: { size: 30, lineHeight: 36, weight: '800' as const },
  h1: { size: 26, lineHeight: 32, weight: '700' as const, letterSpacing: -0.015 * 26 },
  h2: { size: 22, lineHeight: 28, weight: '700' as const, letterSpacing: -0.01 * 22 },
  h3: { size: 18, lineHeight: 24, weight: '600' as const },
  bodyL: { size: 17, lineHeight: 26, weight: '400' as const },
  bodyM: { size: 15, lineHeight: 23, weight: '400' as const },
  bodyS: { size: 13, lineHeight: 19, weight: '400' as const },
  labelL: { size: 16, lineHeight: 20, weight: '600' as const },
  labelM: { size: 14, lineHeight: 18, weight: '600' as const },
  caption: { size: 12, lineHeight: 16, weight: '500' as const },
  metric: { size: 32, lineHeight: 36, weight: '800' as const, letterSpacing: -0.02 * 32 },
} as const;

/** Spacing scale, base grid 4 — identical values to `tokens.css`'s `--space-*`. */
export const CompassSpacing = {
  s1: 4, s2: 8, s3: 12, s4: 16, s5: 20, s6: 24, s7: 32, s8: 40, s9: 48, s10: 64, s11: 80,
  gutterPhone: 20,
  gutterCompact: 16,
} as const;

export const CompassRadius = {
  xs: 6, sm: 10, md: 14, lg: 20, xl: 28, pill: 999,
  btn: 14, card: 20, hero: 28, sheet: 28,
} as const;

/** Matches `tokens.css`'s `--duration-*` / `--ease-*` for Reanimated timing configs. */
export const CompassMotion = {
  durationInstant: 0,
  durationFast: 120,
  durationStandard: 240,
  durationExpressive: 420,
  durationCelebration: 900,
  easeStandard: [0.2, 0, 0, 1] as const,
  easeEnter: [0, 0, 0, 1] as const,
  easeExit: [0.3, 0, 1, 1] as const,
} as const;

/** `tokens.css`'s `--touch-min` — minimum interactive target size. */
export const COMPASS_TOUCH_MIN = 48;
