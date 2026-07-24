import { StyleSheet } from 'react-native';
import {
  CompassFonts,
  CompassRadius,
  CompassSpacing,
  CompassType,
  type CompassPalette,
} from '../../constants/compassDesign';

/** Theme-aware styles for the rewards screen (mockup 34). */
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
    title: {
      flex: 1,
      textAlign: 'center',
      fontFamily: CompassFonts.fallbackHeavy,
      fontSize: CompassType.h2.size,
      fontWeight: '800',
      color: c.textPrimary,
    },
    headerSpacer: { width: 48 },

    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: CompassSpacing.gutterPhone,
      paddingBottom: CompassSpacing.s9,
      gap: CompassSpacing.s4,
    },

    hero: { borderRadius: CompassRadius.hero, padding: CompassSpacing.s6 },
    heroEyebrow: { fontSize: CompassType.bodyS.size, fontWeight: '700', color: c.onHero, opacity: 0.9 },
    heroTotal: {
      fontFamily: CompassFonts.numeric,
      fontSize: 36,
      fontWeight: '800',
      color: c.onHero,
      marginVertical: 4,
      fontVariant: ['tabular-nums'],
    },
    heroSub: { fontSize: CompassType.bodyS.size, color: c.onHero, opacity: 0.9 },

    card: {
      backgroundColor: c.bgSurface,
      borderRadius: CompassRadius.card,
      padding: CompassSpacing.s4,
      borderWidth: 1,
      borderColor: c.borderDefault,
      gap: CompassSpacing.s3,
    },
    cardLabel: { fontSize: CompassType.labelL.size, fontWeight: '600', color: c.textPrimary },

    statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statName: { fontSize: CompassType.bodyM.size, color: c.textPrimary },
    statVal: { fontSize: CompassType.bodyM.size, fontWeight: '700', color: c.textPrimary },

    shareBtn: {
      marginTop: CompassSpacing.s2,
      minHeight: 48,
      borderRadius: CompassRadius.btn,
      backgroundColor: c.bgSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: CompassSpacing.s4,
    },
    shareBtnPressed: { opacity: 0.7 },
    shareBtnText: { fontSize: CompassType.labelL.size, fontWeight: '600', color: c.actionPrimary },

    histRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: CompassSpacing.s3,
      paddingVertical: CompassSpacing.s2,
    },
    histBody: { flex: 1 },
    histTitle: { fontSize: CompassType.labelM.size, fontWeight: '600', color: c.textPrimary },
    histWhen: { fontSize: CompassType.caption.size, color: c.textSecondary, marginTop: 2 },
    xpBadge: {
      paddingHorizontal: CompassSpacing.s3,
      paddingVertical: 4,
      borderRadius: CompassRadius.pill,
      backgroundColor: c.xpTint,
    },
    xpBadgeText: { fontSize: CompassType.caption.size, fontWeight: '700', color: c.xpText },
    emptyText: { fontSize: CompassType.bodyM.size, color: c.textSecondary },

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
    skelHero: { height: 120 },
    skelCard: { height: 160 },
  });
}

export type RewardsStyles = ReturnType<typeof makeStyles>;
