import { StyleSheet } from 'react-native';
import {
  CompassFonts,
  CompassRadius,
  CompassSpacing,
  CompassType,
  type CompassPalette,
} from '../../constants/compassDesign';

/** Theme-aware styles for the leaderboards preview screen (mockup 33). */
export function makeStyles(c: CompassPalette) {
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
    iconBtn: {
      width: 48,
      height: 48,
      borderRadius: CompassRadius.pill,
      backgroundColor: c.bgSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconGlyph: { fontSize: 18 },
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
      paddingBottom: CompassSpacing.s9,
      gap: CompassSpacing.s4,
    },

    conceptNote: {
      flexDirection: 'row',
      gap: CompassSpacing.s3,
      alignItems: 'flex-start',
      backgroundColor: c.communityTint,
      borderWidth: 1,
      borderColor: c.community,
      borderRadius: CompassRadius.md,
      padding: CompassSpacing.s3,
    },
    conceptIcon: { fontSize: 18 },
    conceptText: { flex: 1, fontSize: CompassType.bodyS.size, color: c.textPrimary, lineHeight: 19 },
    conceptStrong: { fontWeight: '700' },

    segmented: {
      flexDirection: 'row',
      gap: 6,
      backgroundColor: c.bgSubtle,
      padding: 4,
      borderRadius: CompassRadius.pill,
    },
    seg: {
      flex: 1,
      minHeight: 48,
      borderRadius: CompassRadius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segSelected: { backgroundColor: c.bgSurface },
    segText: { fontSize: 13, fontWeight: '600', color: c.textSecondary },
    segTextSelected: { color: c.textPrimary },

    card: {
      backgroundColor: c.bgSurface,
      borderRadius: CompassRadius.card,
      padding: CompassSpacing.s3,
      borderWidth: 1,
      borderColor: c.borderDefault,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: CompassSpacing.s3,
      padding: CompassSpacing.s3,
      borderRadius: CompassRadius.md,
    },
    rowMe: { backgroundColor: c.actionPrimary },
    rank: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: c.bgSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Top-3 ranks get the XP identity as a curated tint (design's gamification
    // identity), replacing the former solid `rewardXp` fill (which is the
    // text-safe alias and read as a muddy badge behind `textPrimary`).
    rankTop: { backgroundColor: c.xpTint },
    // "You" row sits on a solid actionPrimary background — the default
    // bgSubtle/textPrimary pairing (tuned for the plain card background)
    // reads as a mismatched grey badge on top of it. `actionPressed` keeps the
    // badge in-family with the row while staying AA against `onPrimary` text.
    rankMe: { backgroundColor: c.actionPressed },
    rankText: { fontFamily: CompassFonts.numeric, fontSize: 13, fontWeight: '800', color: c.textPrimary },
    rankTextMe: { color: c.onPrimary },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.communityTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: c.communityText, fontWeight: '700', fontSize: 15 },
    rowName: { flex: 1, fontSize: CompassType.bodyM.size, fontWeight: '600', color: c.textPrimary },
    rowXp: {
      fontFamily: CompassFonts.numeric,
      fontSize: 15,
      fontWeight: '800',
      color: c.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    rowNameMe: { color: c.onPrimary },

    footnote: {
      fontSize: CompassType.caption.size,
      color: c.textSecondary,
      textAlign: 'center',
      paddingHorizontal: CompassSpacing.s4,
      paddingTop: CompassSpacing.s2,
    },

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
    skel: { backgroundColor: c.bgSubtle, borderRadius: CompassRadius.card },
    skelCard: { height: 320 },
  });
}

export type LeaderboardsStyles = ReturnType<typeof makeStyles>;
