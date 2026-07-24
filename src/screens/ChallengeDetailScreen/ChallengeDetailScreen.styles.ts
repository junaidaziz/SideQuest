import { StyleSheet } from 'react-native';
import {
  CompassFonts,
  CompassRadius,
  CompassSpacing,
  CompassType,
  type CompassPalette,
} from '../../constants/compassDesign';

/** Theme-aware styles for the challenge detail screen (mockup 27). */
export function makeStyles(c: CompassPalette) {
  // Shadow-first elevation (design § 3, `--shadow-1`) tinted with `shadowColor`.
  const shadow1 = {
    shadowColor: c.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
  } as const;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bgCanvas },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: CompassSpacing.s3,
      paddingVertical: CompassSpacing.s2,
    },
    backBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    backBtnPressed: { opacity: 0.5 },
    headerSpacer: { width: 48 },
    title: {
      flex: 1,
      textAlign: 'center',
      fontFamily: CompassFonts.fallbackHeavy,
      fontSize: CompassType.h2.size,
      fontWeight: '800',
      color: c.textPrimary,
    },

    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: CompassSpacing.gutterPhone,
      paddingBottom: CompassSpacing.s7,
      gap: CompassSpacing.s4,
    },

    hero: { flexDirection: 'row', gap: CompassSpacing.s4, alignItems: 'center' },
    // Challenge thumbnail well carries the Community identity tint.
    hex: {
      width: 64,
      height: 64,
      borderRadius: 18,
      backgroundColor: c.communityTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hexGlyph: { fontSize: 30 },
    heroBody: { flex: 1 },
    heroTitle: {
      fontFamily: CompassFonts.fallbackBold,
      fontSize: CompassType.h2.size,
      fontWeight: '700',
      color: c.textPrimary,
    },
    heroDesc: { fontSize: CompassType.bodyS.size, color: c.textSecondary, marginTop: 2 },
    // Base badge shape; the tone-specific fill/label colours are resolved from
    // `statusTone(status)` and applied inline (see the screen), so a "Completed"
    // task reads success-green and a "Rejected" one reads error-red, instead of
    // every status sharing one hardcoded warning tint.
    statusBadge: {
      alignSelf: 'flex-start',
      marginTop: 6,
      paddingHorizontal: CompassSpacing.s3,
      paddingVertical: 4,
      borderRadius: CompassRadius.pill,
    },
    statusBadgeText: { fontSize: 12, fontWeight: '700' },

    // Shadow-first elevation (design § 3): cards separate from canvas by shadow.
    card: {
      backgroundColor: c.bgSurface,
      borderRadius: CompassRadius.card,
      padding: CompassSpacing.s4,
      gap: CompassSpacing.s2,
      ...shadow1,
    },
    cardLabel: { fontSize: CompassType.labelL.size, fontWeight: '600', color: c.textPrimary, marginBottom: CompassSpacing.s2 },
    cardSub: { fontSize: CompassType.bodyS.size, color: c.textSecondary },
    partRow: { flexDirection: 'row', alignItems: 'center', gap: CompassSpacing.s3 },
    partName: { fontSize: CompassType.labelM.size, fontWeight: '600', color: c.textPrimary },

    tlRow: { flexDirection: 'row', gap: CompassSpacing.s3, alignItems: 'flex-start', paddingVertical: 4 },
    tlNode: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: c.borderDefault,
      marginTop: 3,
    },
    tlNodeDone: { backgroundColor: c.statusSuccess },
    tlNodeRejected: { backgroundColor: c.statusError },
    tlBody: { flex: 1 },
    tlTitle: { fontSize: CompassType.bodyM.size, fontWeight: '600', color: c.textPrimary },
    tlDetail: { fontSize: CompassType.caption.size, color: c.textSecondary, marginTop: 2 },

    privacyCard: {
      flexDirection: 'row',
      gap: CompassSpacing.s3,
      alignItems: 'center',
      backgroundColor: c.bgSurface,
      borderRadius: CompassRadius.card,
      padding: CompassSpacing.s4,
      ...shadow1,
    },
    privacyText: { flex: 1, fontSize: CompassType.bodyS.size, color: c.textSecondary },

    ctaBar: {
      paddingHorizontal: CompassSpacing.gutterPhone,
      paddingTop: CompassSpacing.s3,
      paddingBottom: CompassSpacing.s4,
      borderTopWidth: 1,
      borderTopColor: c.borderDefault,
      backgroundColor: c.bgCanvas,
      gap: CompassSpacing.s3,
    },
    ctaRow: { flexDirection: 'row', gap: CompassSpacing.s3 },
    rejectWrap: { gap: CompassSpacing.s3 },
    reasonInput: {
      minHeight: 56,
      borderWidth: 1.5,
      borderColor: c.borderDefault,
      borderRadius: CompassRadius.md,
      backgroundColor: c.bgSurface,
      paddingHorizontal: CompassSpacing.s4,
      paddingVertical: CompassSpacing.s3,
      fontSize: CompassType.bodyM.size,
      color: c.textPrimary,
      textAlignVertical: 'top',
    },
    primaryBtn: {
      flex: 1.4,
      height: 52,
      borderRadius: CompassRadius.btn,
      backgroundColor: c.actionPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryBtnFull: {
      height: 52,
      borderRadius: CompassRadius.btn,
      backgroundColor: c.actionPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryBtnText: { color: c.onPrimary, fontWeight: '600', fontSize: CompassType.labelL.size },
    secondaryBtn: {
      flex: 1,
      height: 52,
      borderRadius: CompassRadius.btn,
      backgroundColor: c.bgSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryBtnText: { color: c.actionPrimary, fontWeight: '600', fontSize: CompassType.labelL.size },
    // Destructive = red-tint surface (design § 5). Uses the curated error
    // tint/text pair (5.90:1 light / 7.23:1 dark) rather than a runtime
    // `${statusError}1A` blend, which was a borderline 4.02:1 in light mode.
    destructiveBtn: {
      flex: 1,
      height: 52,
      borderRadius: CompassRadius.btn,
      backgroundColor: c.statusErrorTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    destructiveBtnText: { color: c.statusErrorText, fontWeight: '600', fontSize: CompassType.labelL.size },
    btnDisabled: { opacity: 0.45 },
    btnPressed: { opacity: 0.85 },

    stateArea: {
      flex: 1,
      paddingHorizontal: CompassSpacing.gutterPhone,
      paddingTop: CompassSpacing.s4,
      justifyContent: 'center',
      gap: CompassSpacing.s4,
    },
    stateHeading: {
      fontFamily: CompassFonts.fallbackBold,
      fontSize: CompassType.h3.size,
      fontWeight: '700',
      color: c.textPrimary,
      textAlign: 'center',
    },
    stateBody: { fontSize: CompassType.bodyM.size, color: c.textSecondary, textAlign: 'center' },
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
    retryBtnText: { color: c.onPrimary, fontWeight: '600', fontSize: CompassType.labelL.size },
    skel: { backgroundColor: c.skeletonBase, borderRadius: CompassRadius.card },
    skelHero: { height: 80 },
    skelCard: { height: 180 },
  });
}

export type ChallengeDetailStyles = ReturnType<typeof makeStyles>;
