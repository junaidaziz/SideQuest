/**
 * SideQuest "Halcyon+" design tokens — the current system, sourced from
 * `product-redesign/halcyon-plus/00-halcyon-plus-design-system.md` and
 * `product-redesign/halcyon-plus/tokens-halcyon-plus.css`.
 *
 * Halcyon+ is the evolution of the winning "Halcyon" colour direction: it keeps
 * the loved lavender-mist canvas and powder-blue / periwinkle primary and adds
 * the ownable layer base Halcyon lacked — the Aurora dawn/dusk gradient, four
 * distinct gamification identities (XP / Achievement / Streak / Community), a
 * shadow-first elevation + load-bearing border system, and Syne restored as the
 * display face. This file supersedes the former "Compass" palette; the export
 * names (`Compass*`) are kept so the 29 already-migrated screens keep compiling
 * during the incremental rollout — only the token *values* changed.
 *
 * (Historical note: this file previously transcribed the superseded "Compass"
 * tokens from `product-redesign/05-design-system.md` / `mockups-html/tokens.css`.
 * Those files document the "before" state and are intentionally left untouched.)
 *
 * This coexists with `./design.ts` (the light-only legacy tokens still used by
 * PaymentMethodsScreen) during an incremental, screen-by-screen migration. Do
 * not delete `design.ts` or mix the two systems within a single screen.
 *
 * Every hex value is transcribed verbatim from `tokens-halcyon-plus.css` — do
 * not re-derive. All colour pairings are computed-AA per the design doc's
 * § Accessibility table.
 */

export const CompassColorsLight = {
  // Surfaces & text
  bgCanvas: '#F2F1FB',
  bgSurface: '#FFFFFF',
  bgElevated: '#FFFFFF',
  bgSubtle: '#E7E5F6',
  textPrimary: '#1A1B2E',
  textSecondary: '#53546B',
  textTertiary: '#64657D',
  // Borders — `borderDefault` aliases the load-bearing `borderStrong` value
  // (per the design doc: base.css's single --border-default → the strong value)
  borderDefault: '#807EA2',
  borderStrong: '#807EA2',
  borderSubtle: '#E1E0F1',
  // Primary action
  actionPrimary: '#4B48C6',
  actionPressed: '#3B39A8',
  onPrimary: '#FFFFFF',
  focusRing: '#4B48C6',
  // Aurora — signature brand / celebration gradient (dawn horizon)
  heroGradStart: '#C9CBFF',
  heroGradEnd: '#FBD9BE',
  onHero: '#23243A',
  // Status
  statusSuccess: '#0E7C6A',
  statusWarning: '#8A5A00',
  statusError: '#C0413D',
  statusInfo: '#2564C0',
  // Curated status tint / text-safe pairs — the badge-fill counterpart of the
  // gamification identities. A runtime `${status}1F` alpha blend over the
  // lavender canvas fails AA for 12px badge text (success 3.90 / error 3.92 /
  // info 4.35 : 1), so these opaque, hand-tuned pairs replace it. Computed-AA:
  // success 6.27 · error 5.90 · warning 6.87 · info 6.38 : 1 (text on tint).
  statusSuccessTint: '#D3EAE4',
  statusSuccessText: '#0A5C4F',
  statusWarningTint: '#F5E7CC',
  statusWarningText: '#6B4600',
  statusErrorTint: '#F7DEDD',
  statusErrorText: '#9C2B28',
  statusInfoTint: '#DBE6F8',
  statusInfoText: '#1B4E9C',
  // Four gamification identities — each fill / tint / text-safe variant
  xp: '#E6A21E',
  xpTint: '#FBEFD3',
  xpText: '#795710',
  achievement: '#A23FC9',
  achievementTint: '#F3E1F9',
  achievementText: '#9A2FB8',
  streak: '#E8622A',
  streakTint: '#FCE3D6',
  streakText: '#AE3D14',
  community: '#1E88C9',
  communityTint: '#DCEEF9',
  communityText: '#1467A0',
  // base.css back-compat aliases (retained so unmigrated screens keep working)
  rewardXp: '#795710',
  socialCoral: '#D2543B',
  brandViolet: '#4B48C6',
  brandVioletDark: '#3B39A8',
  brandCoral: '#EE6C4D',
  brandGold: '#E6A21E',
  brandTeal: '#1E88C9',
  brandTealDark: '#1467A0',
  // Chart series — categorical, colourblind-safe (Okabe-Ito-derived)
  chart1: '#1F6FB2',
  chart2: '#B26A00',
  chart3: '#0E7C5A',
  chart4: '#9A4EA0',
  chart5: '#C4501C',
  chart6: '#B03E77',
  // Skeleton loading
  skeletonBase: '#E7E5F6',
  skeletonHighlight: '#F4F3FC',
  // Disabled state (WCAG-exempt from contrast, kept visually distinct)
  disabledBg: '#E7E5F6',
  disabledText: '#A3A2B8',
  disabledBorder: '#D9D7EC',
  // Shadow-first elevation base colour (design § 3 / tokens-halcyon-plus.css
  // `--shadow-1`): the ink RN's `shadowColor` tints on iOS. Light mode tints
  // toward the deep-indigo canvas ink; dark mode is pure black per the CSS
  // dark `--shadow-*` set. (Android ignores shadowColor and uses `elevation`.)
  shadowColor: '#1B183A',
  // Intentionally theme-invariant pure white — the one token that is the SAME
  // in light and dark. For elements that must stay a fixed white regardless of
  // theme, e.g. a switch thumb / control knob riding a coloured track (where
  // `onPrimary`/`bgSurface` would invert to a dark value and vanish against the
  // off-state track). Not for text — text always uses a theme-aware pairing.
  alwaysWhite: '#FFFFFF',
} as const;

export const CompassColorsDark = {
  // Surfaces & text
  bgCanvas: '#0F1119',
  bgSurface: '#191C27',
  bgElevated: '#222533',
  bgSubtle: '#2A2E3C',
  textPrimary: '#ECEEF7',
  textSecondary: '#B4B8CB',
  textTertiary: '#9296AB',
  // Borders
  borderDefault: '#666C84',
  borderStrong: '#666C84',
  borderSubtle: '#2E3240',
  // Primary action
  actionPrimary: '#84A4F5',
  actionPressed: '#9AB5F8',
  onPrimary: '#0E1A2E',
  focusRing: '#84A4F5',
  // Aurora
  heroGradStart: '#CFC9F0',
  heroGradEnd: '#F3CDB0',
  onHero: '#20223A',
  // Status
  statusSuccess: '#45C7A6',
  statusWarning: '#E8B252',
  statusError: '#F2867C',
  statusInfo: '#7BB0F2',
  // Curated status tint / text-safe pairs (dark). Computed-AA: success 7.34 ·
  // error 7.23 · warning 7.13 · info 7.67 : 1 (text on tint).
  statusSuccessTint: '#123329',
  statusSuccessText: '#5FD1B0',
  statusWarningTint: '#372C13',
  statusWarningText: '#E8B252',
  statusErrorTint: '#3A211D',
  statusErrorText: '#F2A093',
  statusInfoTint: '#16263E',
  statusInfoText: '#8FBBF5',
  // Four gamification identities
  xp: '#F5C451',
  xpTint: '#3A3016',
  xpText: '#F5C451',
  achievement: '#C77DEA',
  achievementTint: '#3A2846',
  achievementText: '#CE86EC',
  streak: '#F2895C',
  streakTint: '#3E2A1E',
  streakText: '#F5936A',
  community: '#5AB6E8',
  communityTint: '#16303E',
  communityText: '#63B8E8',
  // base.css back-compat aliases
  rewardXp: '#F5C451',
  socialCoral: '#F2A088',
  brandViolet: '#84A4F5',
  brandVioletDark: '#6E90EE',
  brandCoral: '#F2895C',
  brandGold: '#F5C451',
  brandTeal: '#5AB6E8',
  brandTealDark: '#63B8E8',
  // Chart series (dark)
  chart1: '#6BA8E8',
  chart2: '#E8B24A',
  chart3: '#4FC79E',
  chart4: '#C98AD0',
  chart5: '#F0855C',
  chart6: '#E87BAE',
  // Skeleton loading
  skeletonBase: '#232735',
  skeletonHighlight: '#2E3344',
  // Disabled state
  disabledBg: '#23273550',
  disabledText: '#6B6F84',
  disabledBorder: '#2E3240',
  // Shadow base — pure black in dark mode, matching the CSS dark `--shadow-*`.
  shadowColor: '#000000',
  // Theme-invariant pure white — identical to the light palette by design (see
  // the light-mode note). Kept in both palettes so `CompassPalette` stays a
  // total mapping and call sites read `c.alwaysWhite` in either theme.
  alwaysWhite: '#FFFFFF',
} as const;

/**
 * Same shape as `Colors` in `design.ts`, but resolved for the active theme at
 * call sites via `useCompassTheme()`. Widened to `string` per key (not
 * `typeof CompassColorsLight` directly) — pinning to the light palette's
 * literal hex values would make `CompassColorsDark` (different literals,
 * same keys) structurally fail to satisfy this type.
 */
export type CompassPalette = { readonly [K in keyof typeof CompassColorsLight]: string };

/**
 * Halcyon+ typography faces:
 * - Display / headings 1–2 → **Syne** (the distinctive, premium editorial voice
 *   that replaces the generic Plus Jakarta Sans — see design doc § 4).
 * - Body, labels, UI → **Inter**.
 * - Dense metrics/numerics → **Inter tabular** (`numeric`). Syne's decorative
 *   "0" reads as "o", so numbers never use the display face; pair `numeric` with
 *   `fontVariant: ['tabular-nums']` at the call site for aligned ledgers/stats.
 *
 * Plus Jakarta Sans is retained only as a fallback face still bundled for the
 * not-yet-migrated screens that hardcode it in their `.styles.ts`; it is loaded
 * in `app/_layout.tsx` alongside Syne + Inter until those screens move over.
 */
export const CompassFonts = {
  display: 'Syne_800ExtraBold',
  displayBold: 'Syne_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  numeric: 'Inter_800ExtraBold',
  // Plus Jakarta Sans fallback faces — the pre-Syne display face still bundled
  // and used by the not-yet-migrated screens. Named here so those screens
  // reference a token instead of a raw string; migrating them to `display` /
  // `displayBold` (Syne) is a separate, deliberate future pass.
  fallbackHeavy: 'PlusJakartaSans_800ExtraBold',
  fallbackBold: 'PlusJakartaSans_700Bold',
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

/**
 * Matches `tokens-halcyon-plus.css`'s `--duration-*` / `--ease-*` for Reanimated
 * timing configs. Durations are kept 1:1 with Compass so existing specs still
 * map. Halcyon+ adds `easeSpring` — a tactile overshoot curve used on badge
 * resolution and the XP chip pop (design doc § 7 Motion).
 */
export const CompassMotion = {
  durationInstant: 0,
  durationFast: 120,
  durationStandard: 240,
  durationExpressive: 420,
  durationCelebration: 900,
  easeStandard: [0.2, 0, 0, 1] as const,
  easeEnter: [0, 0, 0, 1] as const,
  easeExit: [0.3, 0, 1, 1] as const,
  easeSpring: [0.34, 1.56, 0.64, 1] as const,
} as const;

/** `tokens.css`'s `--touch-min` — minimum interactive target size. */
export const COMPASS_TOUCH_MIN = 48;
