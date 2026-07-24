import { StyleSheet } from 'react-native';
import type { CompassPalette } from '../../constants/compassDesign';
import { COMPASS_TOUCH_MIN, CompassRadius, CompassSpacing } from '../../constants/compassDesign';

/** Local theme-aware styles for AccountSecurityScreen (change-password modal +
 * delete-account danger card). */
export function createStyles(colors: CompassPalette) {
  return StyleSheet.create({
    groupLabel: {
      color: colors.textTertiary,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginLeft: CompassSpacing.s1,
      marginBottom: CompassSpacing.s2,
    },
    linkText: { color: colors.actionPrimary, fontWeight: '600' },
    connectedText: { color: colors.statusSuccess, fontWeight: '700' },
    reauthNote: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: CompassSpacing.s2,
      marginTop: CompassSpacing.s3,
    },
    reauthText: { flex: 1, color: colors.textSecondary },
    // Danger card
    dangerCard: {
      borderWidth: 1.5,
      borderColor: colors.statusError,
      borderRadius: CompassRadius.card,
      backgroundColor: colors.bgSurface,
      padding: CompassSpacing.s4,
      gap: CompassSpacing.s2,
    },
    dangerTitle: { color: colors.statusError, fontWeight: '600', fontSize: 16 },
    dangerBody: { color: colors.textSecondary },
    consequence: { color: colors.textSecondary },
    checkRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: CompassSpacing.s2,
      marginTop: CompassSpacing.s2,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: CompassRadius.xs,
      borderWidth: 2,
      borderColor: colors.borderDefault,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    checkboxChecked: { backgroundColor: colors.statusErrorTint, borderColor: colors.statusError },
    checkLabel: { flex: 1, color: colors.textPrimary },
    input: {
      minHeight: 52,
      borderRadius: CompassRadius.md,
      borderWidth: 1.5,
      borderColor: colors.borderDefault,
      backgroundColor: colors.bgSurface,
      paddingHorizontal: CompassSpacing.s4,
      color: colors.textPrimary,
      fontSize: 16,
      marginTop: CompassSpacing.s2,
    },
    inputInvalid: { borderColor: colors.statusError },
    fieldError: { color: colors.statusError, marginTop: CompassSpacing.s2 },
    deleteBtn: {
      minHeight: COMPASS_TOUCH_MIN + 4,
      borderRadius: CompassRadius.btn,
      backgroundColor: colors.statusErrorTint,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: CompassSpacing.s3,
    },
    deleteBtnDisabled: { opacity: 0.45 },
    deleteBtnText: { color: colors.statusErrorText, fontWeight: '700', fontSize: 16 },
    // Modal
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(23,21,39,0.55)' },
    sheet: {
      backgroundColor: colors.bgSurface,
      borderTopLeftRadius: CompassRadius.sheet,
      borderTopRightRadius: CompassRadius.sheet,
      padding: CompassSpacing.s6,
      gap: CompassSpacing.s2,
    },
    sheetTitle: { color: colors.textPrimary, marginBottom: CompassSpacing.s2 },
    label: { color: colors.textPrimary, fontWeight: '600', marginTop: CompassSpacing.s3 },
    modalActions: { gap: CompassSpacing.s2, marginTop: CompassSpacing.s4 },
    primaryBtn: {
      minHeight: COMPASS_TOUCH_MIN + 4,
      borderRadius: CompassRadius.btn,
      backgroundColor: colors.actionPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryBtnDisabled: { opacity: 0.5 },
    primaryBtnText: { color: colors.onPrimary, fontWeight: '600', fontSize: 16 },
    cancelBtn: {
      minHeight: COMPASS_TOUCH_MIN,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelBtnText: { color: colors.actionPrimary, fontWeight: '600', fontSize: 16 },
  });
}
