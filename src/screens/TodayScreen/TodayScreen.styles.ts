import { StyleSheet } from 'react-native';
import {
  CompassRadius,
  CompassSpacing,
  CompassType,
  type CompassPalette,
} from '../../constants/compassDesign';

/**
 * Factory so the stylesheet resolves against the active Compass palette
 * (light/dark) supplied by `useCompassTheme()` — the shipped app is light-only,
 * but every migrated Compass screen is theme-aware from day one.
 */
export function makeStyles(c: CompassPalette) {
  // Halcyon+ shadow-first elevation (design § 3, `--shadow-1`): the ink is the
  // `shadowColor` token (deep-indigo in light, black in dark), never hardcoded.
  // A white card is only ~1.12:1 on the lavender canvas, so the shadow — not a
  // border — is what carries the card separation.
  const shadow1 = {
    shadowColor: c.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
  } as const;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bgCanvas },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: CompassSpacing.gutterPhone,
      paddingTop: CompassSpacing.s5,
      paddingBottom: CompassSpacing.s2,
    },
    greeting: {
      fontSize: CompassType.h2.size,
      lineHeight: CompassType.h2.lineHeight,
      fontWeight: CompassType.h2.weight,
      color: c.textPrimary,
      letterSpacing: -0.22,
    },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: CompassSpacing.s3 },
    iconBtn: {
      width: 48,
      height: 48,
      borderRadius: CompassRadius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.bgSubtle,
    },
    iconBtnPressed: { backgroundColor: c.borderDefault },
    unreadBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      minWidth: 18,
      height: 18,
      paddingHorizontal: 4,
      borderRadius: 9,
      // Curated status tint/text pair — the app's standard badge language
      // (matches VerificationDetailScreen). The prior solid `socialCoral` fill
      // with white text was not AA in either theme (white-on-socialCoral is
      // 4.14:1 light / 2.07:1 dark); this pair is 5.90:1 light / 7.23:1 dark.
      backgroundColor: c.statusErrorTint,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: c.bgCanvas,
    },
    unreadBadgeText: {
      color: c.statusErrorText,
      fontSize: 10,
      fontWeight: '700',
      lineHeight: 12,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: CompassRadius.pill,
      backgroundColor: c.actionPrimary,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarText: { color: c.onPrimary, fontWeight: '800', fontSize: 16 },
    avatarImage: { width: 48, height: 48 },
    scroll: { flex: 1 },
    content: {
      paddingHorizontal: CompassSpacing.gutterPhone,
      paddingTop: CompassSpacing.s4,
      paddingBottom: CompassSpacing.s9,
      gap: CompassSpacing.s6,
    },
    // Aurora hero (design § 2.2): dawn-horizon gradient + dark `onHero` ink at
    // every layer — never white — so it reads premium on the light gradient and
    // survives the theme switch, matching QuestDetailScreen's hero.
    hero: {
      borderRadius: CompassRadius.hero,
      padding: CompassSpacing.s6,
      overflow: 'hidden',
    },
    heroEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    heroEyebrow: {
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.5,
      color: c.onHero,
      textTransform: 'uppercase',
    },
    heroTitle: {
      fontSize: 26,
      lineHeight: 32,
      fontWeight: '800',
      color: c.onHero,
      marginTop: 6,
      marginBottom: 4,
      letterSpacing: -0.39,
    },
    heroSub: {
      fontSize: 15,
      lineHeight: 22,
      color: c.onHero,
      marginBottom: CompassSpacing.s4,
      maxWidth: 250,
    },
    heroCta: {
      alignSelf: 'flex-start',
      height: 48,
      paddingHorizontal: CompassSpacing.s5,
      borderRadius: CompassRadius.btn,
      backgroundColor: c.bgSurface,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow1,
    },
    heroCtaText: { color: c.actionPrimary, fontWeight: '700', fontSize: 15 },
    secondaryRow: { flexDirection: 'row', gap: CompassSpacing.s3 },
    card: {
      backgroundColor: c.bgSurface,
      borderRadius: CompassRadius.card,
      padding: CompassSpacing.s4,
      ...shadow1,
    },
    goalCard: { flex: 1.3 },
    // Stacked (label / bar / count), not the mockup's single-line row — at
    // this card's real half-width on device, "This week's goal" (17 chars)
    // and "3 of 5 quests" (13 chars) don't both fit on one line at a legible
    // size, no matter how the row's gap/space-between is tuned. Stacking
    // gives each line the card's full width instead of fighting over it.
    label: { fontSize: 14, fontWeight: '600', color: c.textPrimary, marginBottom: CompassSpacing.s2 },
    caption: { fontSize: 12, fontWeight: '500', color: c.textSecondary, marginTop: CompassSpacing.s2 },
    track: {
      width: '100%',
      height: 10,
      borderRadius: CompassRadius.pill,
      backgroundColor: c.bgSubtle,
      overflow: 'hidden',
    },
    fill: { height: '100%', borderRadius: CompassRadius.pill, backgroundColor: c.actionPrimary },
    streakCard: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    // Streak surfaces carry the Ember identity (design § 2.3): flame + streakText.
    streakNum: { fontSize: 20, fontWeight: '800', color: c.streakText, letterSpacing: -0.3 },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textSecondary,
      marginBottom: CompassSpacing.s3,
    },
    storyRow: { flexDirection: 'row', alignItems: 'center', gap: CompassSpacing.s3 },
    storyIconWrap: {
      width: 44,
      height: 44,
      borderRadius: CompassRadius.md,
      backgroundColor: c.bgSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    storyIcon: { fontSize: 20 },
    storyBody: { flex: 1 },
    storyTitle: { fontSize: 16, fontWeight: '600', color: c.textPrimary },
    // "XP pending" review chip → XP identity tint (design § 2.3), replacing the
    // former hardcoded warning rgba.
    badgePending: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: CompassRadius.pill,
      backgroundColor: c.xpTint,
    },
    badgePendingText: { fontSize: 12, fontWeight: '700', color: c.xpText },
    exploreLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: CompassSpacing.s3,
    },
    exploreLinkText: { fontSize: 16, fontWeight: '600', color: c.textPrimary, flex: 1 },
    // States
    stateArea: { flex: 1, justifyContent: 'center', paddingHorizontal: CompassSpacing.gutterPhone },
    skeletonWrap: { gap: CompassSpacing.s4 },
    skel: { backgroundColor: c.bgSubtle, borderRadius: CompassRadius.card },
    skelHero: { height: 180 },
    skelBar: { height: 88 },
    skelRow: { height: 72 },
    stateTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: c.textPrimary,
      textAlign: 'center',
      marginBottom: CompassSpacing.s2,
    },
    stateBody: { fontSize: 14, color: c.textSecondary, textAlign: 'center', marginBottom: CompassSpacing.s5 },
    retryBtn: {
      alignSelf: 'center',
      height: 48,
      paddingHorizontal: CompassSpacing.s6,
      borderRadius: CompassRadius.btn,
      backgroundColor: c.actionPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    retryBtnPressed: { backgroundColor: c.actionPressed },
    retryBtnText: { color: c.onPrimary, fontWeight: '600', fontSize: 16 },
  });
}
