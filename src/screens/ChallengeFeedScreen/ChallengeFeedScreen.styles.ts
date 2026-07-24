import { StyleSheet } from 'react-native';
import {
  CompassFonts,
  CompassRadius,
  CompassSpacing,
  CompassType,
  type CompassPalette,
} from '../../constants/compassDesign';

/** Theme-aware styles for the challenge feed (mockup 26). */
export function makeStyles(c: CompassPalette) {
  // Halcyon+ shadow-first elevation (design § 3, `--shadow-1`) tinted with the
  // `shadowColor` token — a white card is only ~1.12:1 on the lavender canvas,
  // so the shadow, not a border, carries the separation.
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
    iconBtn: {
      width: 48,
      height: 48,
      borderRadius: CompassRadius.pill,
      backgroundColor: c.communityTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      flex: 1,
      textAlign: 'center',
      fontFamily: CompassFonts.fallbackHeavy,
      fontSize: CompassType.h2.size,
      fontWeight: '800',
      color: c.textPrimary,
    },

    segmentedWrap: { paddingHorizontal: CompassSpacing.gutterPhone, paddingBottom: CompassSpacing.s3 },
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    segSelected: { backgroundColor: c.bgSurface, ...shadow1 },
    segText: { fontSize: 13, fontWeight: '600', color: c.textSecondary },
    segTextSelected: { color: c.textPrimary },
    // Count badge = Community identity (challenges are the peer-to-peer social
    // surface): `communityTint` fill + `communityText` label. This is the
    // semantically-correct pairing — an earlier version used `--on-primary`
    // (white) on a solid community/coral fill, a contrast + meaning mismatch.
    count: {
      minWidth: 18,
      height: 18,
      paddingHorizontal: 5,
      borderRadius: CompassRadius.pill,
      backgroundColor: c.communityTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    countText: { color: c.communityText, fontSize: 11, fontWeight: '700' },

    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: CompassSpacing.gutterPhone,
      paddingBottom: CompassSpacing.s9,
      gap: CompassSpacing.s4,
    },
    list: { gap: CompassSpacing.s3 },

    // Shadow-first elevation (design § 3): the card is separated from the
    // lavender canvas by `shadow1`, not a load-bearing outline.
    card: {
      flexDirection: 'row',
      gap: CompassSpacing.s3,
      backgroundColor: c.bgSurface,
      borderRadius: CompassRadius.card,
      padding: CompassSpacing.s3,
      ...shadow1,
    },
    cardPressed: { backgroundColor: c.bgSubtle },
    // Challenge thumbnail well carries the Community identity tint.
    hex: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: c.communityTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hexGlyph: { fontSize: 24 },
    cardBody: { flex: 1, minWidth: 0 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: CompassSpacing.s2 },
    cardTitle: {
      flex: 1,
      fontFamily: CompassFonts.fallbackBold,
      fontWeight: '700',
      fontSize: 16,
      color: c.textPrimary,
    },
    deadline: { fontSize: 12, fontWeight: '700' },
    cardDesc: { fontSize: CompassType.bodyS.size, color: c.textSecondary, marginTop: 2 },
    cardMeta: { flexDirection: 'row', gap: CompassSpacing.s2, marginTop: CompassSpacing.s2, flexWrap: 'wrap' },
    statusChip: {
      paddingHorizontal: CompassSpacing.s3,
      paddingVertical: 4,
      borderRadius: CompassRadius.pill,
      backgroundColor: c.bgSubtle,
    },
    statusChipText: { fontSize: 12, fontWeight: '600', color: c.textSecondary },
    // XP identity chip: `xpTint` fill + `xpText` label (design § 2.3).
    xpChip: {
      paddingHorizontal: CompassSpacing.s3,
      paddingVertical: 4,
      borderRadius: CompassRadius.pill,
      backgroundColor: c.xpTint,
    },
    xpChipText: { fontSize: 12, fontWeight: '700', color: c.xpText },

    empty: {
      alignItems: 'center',
      textAlign: 'center',
      paddingVertical: CompassSpacing.s8,
      gap: CompassSpacing.s2,
    },
    emptyGlyph: { fontSize: 40 },
    emptyTitle: { fontFamily: CompassFonts.fallbackBold, fontSize: 18, fontWeight: '700', color: c.textPrimary },
    emptyBody: {
      fontSize: CompassType.bodyM.size,
      color: c.textSecondary,
      textAlign: 'center',
      maxWidth: 260,
    },
    emptyCta: {
      marginTop: CompassSpacing.s3,
      minHeight: 48,
      paddingHorizontal: CompassSpacing.s6,
      borderRadius: CompassRadius.btn,
      backgroundColor: c.actionPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyCtaPressed: { backgroundColor: c.actionPressed },
    emptyCtaText: { color: c.onPrimary, fontWeight: '600', fontSize: CompassType.labelL.size },

    footnote: {
      fontSize: CompassType.caption.size,
      color: c.textSecondary,
      textAlign: 'center',
      paddingHorizontal: CompassSpacing.s4,
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
    skel: { backgroundColor: c.skeletonBase, borderRadius: CompassRadius.card },
    skelCard: { height: 96 },
  });
}

export type ChallengeFeedStyles = ReturnType<typeof makeStyles>;
