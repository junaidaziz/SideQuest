import { StyleSheet } from 'react-native';
import {
  CompassFonts,
  CompassRadius,
  CompassSpacing,
  CompassType,
  type CompassPalette,
} from '../../constants/compassDesign';

/** Theme-aware styles for the notifications inbox. */
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
      fontFamily: CompassFonts.display,
      fontSize: CompassType.h2.size,
      fontWeight: '800',
      color: c.textPrimary,
    },
    markAllBtn: { minWidth: 48, height: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: CompassSpacing.s2 },
    markAllBtnPressed: { opacity: 0.5 },
    markAllText: { color: c.actionPrimary, fontWeight: '600', fontSize: 13 },

    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: CompassSpacing.gutterPhone,
      paddingBottom: CompassSpacing.s9,
      gap: CompassSpacing.s3,
    },

    row: {
      flexDirection: 'row',
      gap: CompassSpacing.s3,
      backgroundColor: c.bgSurface,
      borderRadius: CompassRadius.card,
      padding: CompassSpacing.s4,
      borderWidth: 1,
      borderColor: c.borderDefault,
    },
    rowUnread: { borderColor: c.actionPrimary },
    rowPressed: { backgroundColor: c.bgSubtle },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: CompassRadius.md,
      backgroundColor: c.bgSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    icon: { fontSize: 20 },
    rowBody: { flex: 1, minWidth: 0 },
    rowTop: { flexDirection: 'row', alignItems: 'center', gap: CompassSpacing.s2 },
    rowTitle: { flex: 1, fontSize: CompassType.labelM.size, fontWeight: '700', color: c.textPrimary },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.actionPrimary },
    rowText: { fontSize: CompassType.bodyS.size, lineHeight: CompassType.bodyS.lineHeight, color: c.textSecondary, marginTop: 2 },
    rowTime: { fontSize: CompassType.caption.size, color: c.textTertiary, marginTop: 6 },

    // ── Beautiful empty state ──
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: CompassSpacing.s7,
      paddingTop: CompassSpacing.s9,
      gap: CompassSpacing.s2,
    },
    emptyBadge: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: c.bgSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: CompassSpacing.s4,
    },
    emptyTitle: {
      fontFamily: CompassFonts.display,
      fontSize: CompassType.h2.size,
      fontWeight: '800',
      color: c.textPrimary,
      textAlign: 'center',
    },
    emptyBody: {
      fontSize: CompassType.bodyM.size,
      color: c.textSecondary,
      textAlign: 'center',
      marginTop: 2,
    },
    emptyCta: {
      marginTop: CompassSpacing.s5,
      minHeight: 48,
      paddingHorizontal: CompassSpacing.s6,
      borderRadius: CompassRadius.btn,
      backgroundColor: c.actionPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyCtaPressed: { backgroundColor: c.actionPressed },
    emptyCtaText: { color: c.onPrimary, fontWeight: '600', fontSize: CompassType.labelL.size },

    // ── Loading / error ──
    stateArea: { flex: 1, paddingHorizontal: CompassSpacing.gutterPhone, justifyContent: 'center' },
    stateHeading: {
      fontFamily: CompassFonts.displayBold,
      fontSize: CompassType.h3.size,
      fontWeight: '700',
      color: c.textPrimary,
      textAlign: 'center',
      marginBottom: CompassSpacing.s2,
    },
    stateBody: { fontSize: CompassType.bodyM.size, color: c.textSecondary, textAlign: 'center', marginBottom: CompassSpacing.s5 },
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
    skelRow: { height: 80 },
    skeletonWrap: { paddingHorizontal: CompassSpacing.gutterPhone, paddingTop: CompassSpacing.s2, gap: CompassSpacing.s3 },
  });
}

export type NotificationsStyles = ReturnType<typeof makeStyles>;
