import { StyleSheet } from 'react-native';
import type { CompassPalette } from '../../constants/compassDesign';
import {
  COMPASS_TOUCH_MIN,
  CompassRadius,
  CompassSpacing,
} from '../../constants/compassDesign';

/**
 * Theme-aware stylesheet factory for YouScreen. Built per active palette by the
 * component via useMemo, so the same screen restyles cleanly between the
 * Compass light and dark schemes without duplicating layout values.
 */
export function createStyles(colors: CompassPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgCanvas,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: CompassSpacing.gutterPhone,
      paddingBottom: CompassSpacing.s9,
      gap: CompassSpacing.s6,
    },
    profileHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: CompassSpacing.s4,
      paddingTop: CompassSpacing.s2,
    },
    avatarLg: {
      width: 76,
      height: 76,
      borderRadius: 38,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      width: 76,
      height: 76,
      borderRadius: 38,
    },
    avatarInitials: {
      color: '#FFFFFF',
      fontSize: 30,
      fontWeight: '800',
      letterSpacing: -0.45,
    },
    identityCopy: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      color: colors.textPrimary,
      fontWeight: '800',
      fontSize: 22,
      letterSpacing: -0.33,
    },
    level: {
      color: colors.actionPrimary,
      fontWeight: '700',
      fontSize: 15,
      marginTop: 2,
      marginBottom: CompassSpacing.s2,
    },
    email: {
      color: colors.textSecondary,
      marginTop: 2,
    },
    xpTrack: {
      width: '100%',
      height: 10,
      borderRadius: CompassRadius.pill,
      backgroundColor: colors.bgSubtle,
      overflow: 'hidden',
    },
    xpFill: {
      height: '100%',
      borderRadius: CompassRadius.pill,
      backgroundColor: colors.actionPrimary,
    },
    xpLine: {
      color: colors.textSecondary,
      marginTop: 6,
    },
    metricRow: {
      flexDirection: 'row',
      gap: CompassSpacing.s3,
    },
    metricCard: {
      flex: 1,
      backgroundColor: colors.bgSurface,
      borderRadius: CompassRadius.card,
      paddingVertical: CompassSpacing.s4,
      paddingHorizontal: CompassSpacing.s3,
      alignItems: 'center',
    },
    metricIcon: {
      fontSize: 20,
      marginBottom: 4,
    },
    metricNum: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '800',
    },
    metricCap: {
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 2,
    },
    sectionLabel: {
      color: colors.textSecondary,
      marginBottom: CompassSpacing.s3,
    },
    streakCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: CompassSpacing.s3,
      backgroundColor: colors.bgSurface,
      borderRadius: CompassRadius.card,
      padding: CompassSpacing.s4,
    },
    streakIcon: {
      fontSize: 28,
    },
    streakValue: {
      color: colors.textPrimary,
      fontWeight: '700',
    },
    streakSub: {
      color: colors.textSecondary,
      marginTop: 2,
    },
    guestCard: {
      flexDirection: 'row',
      gap: CompassSpacing.s3,
      backgroundColor: colors.bgSurface,
      borderRadius: CompassRadius.card,
      padding: CompassSpacing.s4,
      alignItems: 'center',
    },
    guestAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.bgSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    guestGlyph: {
      fontSize: 26,
    },
    guestTitle: {
      color: colors.textPrimary,
      fontWeight: '700',
    },
    guestSub: {
      color: colors.textSecondary,
      marginTop: 2,
    },
    actions: {
      gap: CompassSpacing.s3,
    },
    primaryBtn: {
      minHeight: COMPASS_TOUCH_MIN + 4,
      borderRadius: CompassRadius.btn,
      backgroundColor: colors.actionPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryBtnText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 16,
    },
    secondaryBtn: {
      minHeight: COMPASS_TOUCH_MIN + 4,
      borderRadius: CompassRadius.btn,
      backgroundColor: colors.bgSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryBtnText: {
      color: colors.actionPrimary,
      fontWeight: '600',
      fontSize: 16,
    },
    dangerBtn: {
      minHeight: COMPASS_TOUCH_MIN + 4,
      borderRadius: CompassRadius.btn,
      backgroundColor: 'rgba(201,61,75,0.10)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    dangerBtnText: {
      color: colors.statusError,
      fontWeight: '600',
      fontSize: 16,
    },
    privacyNote: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: CompassSpacing.s2,
    },
    privacyText: {
      flex: 1,
      color: colors.textSecondary,
    },
    footnote: {
      color: colors.textTertiary,
      textAlign: 'center',
    },
    // Modal / logout confirm
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
      backgroundColor: 'rgba(23,21,39,0.55)',
    },
    sheet: {
      backgroundColor: colors.bgSurface,
      borderTopLeftRadius: CompassRadius.sheet,
      borderTopRightRadius: CompassRadius.sheet,
      padding: CompassSpacing.s6,
      gap: CompassSpacing.s3,
    },
    sheetTitle: {
      color: colors.textPrimary,
    },
    sheetBody: {
      color: colors.textSecondary,
    },
    sheetActions: {
      gap: CompassSpacing.s2,
      marginTop: CompassSpacing.s2,
    },
  });
}
