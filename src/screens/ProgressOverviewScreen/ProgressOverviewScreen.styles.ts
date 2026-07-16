import { StyleSheet } from 'react-native';
import {
  CompassRadius,
  CompassSpacing,
  CompassType,
  type CompassPalette,
} from '../../constants/compassDesign';

/**
 * Theme-aware StyleSheet factory. Compass screens resolve colours per active
 * OS scheme via `useCompassTheme()`, so styles are built from the live palette
 * (memoised in the component) rather than a single static Colors import.
 */
export function makeStyles(c: CompassPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bgCanvas },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: CompassSpacing.gutterPhone,
      paddingTop: CompassSpacing.s4,
      paddingBottom: CompassSpacing.s3,
    },
    title: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: CompassType.h2.size,
      lineHeight: CompassType.h2.lineHeight,
      fontWeight: CompassType.h2.weight,
      letterSpacing: CompassType.h2.letterSpacing,
      color: c.textPrimary,
    },
    iconBtn: {
      width: 48,
      height: 48,
      borderRadius: CompassRadius.pill,
      backgroundColor: c.bgSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBtnPressed: { backgroundColor: c.borderDefault },
    iconGlyph: { fontSize: 20 },
    unreadDot: {
      position: 'absolute',
      top: 11,
      right: 11,
      width: 9,
      height: 9,
      borderRadius: CompassRadius.pill,
      backgroundColor: c.socialCoral,
    },

    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: CompassSpacing.gutterPhone,
      paddingBottom: CompassSpacing.s9,
      gap: CompassSpacing.s6,
    },

    // ── State areas ──
    stateArea: { flex: 1, paddingHorizontal: CompassSpacing.gutterPhone, justifyContent: 'center' },
    stateHeading: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: CompassType.h3.size,
      fontWeight: '700',
      color: c.textPrimary,
      textAlign: 'center',
      marginBottom: CompassSpacing.s2,
    },
    stateBody: {
      fontSize: CompassType.bodyM.size,
      lineHeight: CompassType.bodyM.lineHeight,
      color: c.textSecondary,
      textAlign: 'center',
      marginBottom: CompassSpacing.s5,
    },
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
    retryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: CompassType.labelL.size },

    skeletonWrap: { gap: CompassSpacing.s4, paddingTop: CompassSpacing.s4 },
    skel: { backgroundColor: c.bgSubtle, borderRadius: CompassRadius.card },
    skelHero: { height: 96 },
    skelBar: { height: 44 },
    skelGrid: { height: 150 },

    // ── Level header ──
    levelHead: { flexDirection: 'row', alignItems: 'center', gap: CompassSpacing.s4 },
    shield: {
      width: 68,
      height: 76,
      borderRadius: 18,
      backgroundColor: c.brandViolet,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shieldText: {
      fontFamily: 'Inter_800ExtraBold',
      fontWeight: '800',
      fontSize: 30,
      letterSpacing: -0.45,
      color: '#FFFFFF',
    },
    lvlLabel: { fontSize: 13, color: c.actionPrimary, fontWeight: '700' },
    lvlName: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontWeight: '800',
      fontSize: CompassType.h2.size,
      letterSpacing: -0.33,
      color: c.textPrimary,
      marginTop: 2,
    },
    caption: { fontSize: CompassType.caption.size, color: c.textSecondary, marginTop: 2 },
    chevron: { color: c.textTertiary, fontSize: 20 },

    xpRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginTop: CompassSpacing.s3,
      marginBottom: CompassSpacing.s2,
    },
    xpLabel: { fontSize: CompassType.labelM.size, fontWeight: '600', color: c.textPrimary },

    // ── Section headers ──
    rowHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: CompassSpacing.s3,
    },
    sectionLabel: { fontSize: CompassType.labelM.size, fontWeight: '600', color: c.textSecondary },
    seeAll: { color: c.actionPrimary, fontWeight: '600', fontSize: 13 },

    // ── Stat grid ──
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: CompassSpacing.s3 },
    tile: {
      flexBasis: '47%',
      flexGrow: 1,
      backgroundColor: c.bgSurface,
      borderRadius: CompassRadius.card,
      padding: CompassSpacing.s4,
      borderWidth: 1,
      borderColor: c.borderDefault,
    },
    tilePressed: { backgroundColor: c.bgSubtle, transform: [{ scale: 0.98 }] },
    tileTop: { flexDirection: 'row', alignItems: 'center', gap: CompassSpacing.s2 },
    tileIcon: { fontSize: 18 },
    tileCaption: { fontSize: CompassType.caption.size, color: c.textSecondary, fontWeight: '500' },
    tileBig: {
      fontFamily: 'Inter_800ExtraBold',
      fontWeight: '800',
      fontSize: 24,
      letterSpacing: -0.36,
      color: c.textPrimary,
      marginTop: CompassSpacing.s2,
    },
    tileSub: { fontSize: CompassType.caption.size, color: c.textTertiary, marginTop: 2 },

    ringTile: { flexBasis: '100%' },
    ringRow: { flexDirection: 'row', alignItems: 'center', gap: CompassSpacing.s4, marginTop: CompassSpacing.s3 },
    ringMeta: { flex: 1 },
    ringValue: {
      fontFamily: 'Inter_800ExtraBold',
      fontWeight: '800',
      fontSize: 24,
      color: c.textPrimary,
    },
    ringSub: { fontSize: CompassType.caption.size, color: c.textSecondary, marginTop: 2 },

    // ── Achievements strip ──
    achStrip: { gap: CompassSpacing.s3, paddingRight: CompassSpacing.s4 },
    achMini: { width: 92, alignItems: 'center' },
    achHex: {
      width: 56,
      height: 56,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    achHexLocked: { opacity: 0.4 },
    achGlyph: { fontSize: 24 },
    achName: { fontSize: 11, fontWeight: '600', lineHeight: 15, textAlign: 'center', color: c.textPrimary },
    achNameLocked: { color: c.textTertiary },

    // ── Card + verification breakdown ──
    card: {
      backgroundColor: c.bgSurface,
      borderRadius: CompassRadius.card,
      padding: CompassSpacing.s4,
      borderWidth: 1,
      borderColor: c.borderDefault,
    },
    cardLabel: { fontSize: CompassType.labelL.size, fontWeight: '600', color: c.textPrimary },
    breakdownRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: CompassSpacing.s3,
      paddingVertical: CompassSpacing.s3,
      borderTopWidth: 1,
      borderTopColor: c.borderDefault,
    },
    breakdownRowFirst: { borderTopWidth: 0 },
    breakdownIconWrap: {
      width: 40,
      height: 40,
      borderRadius: CompassRadius.md,
      backgroundColor: c.bgSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    breakdownIcon: { fontSize: 18 },
    breakdownName: { fontSize: CompassType.labelM.size, fontWeight: '600', color: c.textPrimary },
    breakdownSub: { fontSize: CompassType.caption.size, color: c.textSecondary, marginTop: 1 },
    breakdownValue: {
      fontFamily: 'Inter_800ExtraBold',
      fontWeight: '800',
      fontSize: 18,
      color: c.textPrimary,
    },

    // ── Empty ──
    emptyCard: {
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: c.borderDefault,
      borderRadius: CompassRadius.card,
      padding: CompassSpacing.s6,
      alignItems: 'center',
      gap: CompassSpacing.s2,
    },
    emptyIcon: { fontSize: 30 },
    emptyTitle: { fontSize: CompassType.labelL.size, fontWeight: '600', color: c.textPrimary, textAlign: 'center' },
    emptySub: { fontSize: CompassType.bodyS.size, color: c.textSecondary, textAlign: 'center' },
  });
}

export type ProgressStyles = ReturnType<typeof makeStyles>;
