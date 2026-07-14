import { StyleSheet } from 'react-native';
import type { CompassPalette } from '../../constants/compassDesign';
import {
  COMPASS_TOUCH_MIN,
  CompassRadius,
  CompassSpacing,
} from '../../constants/compassDesign';

/** Theme-aware stylesheet factory for EditProfileScreen. */
export function createStyles(colors: CompassPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgCanvas },
    scroll: { flex: 1 },
    content: {
      paddingHorizontal: CompassSpacing.gutterPhone,
      paddingBottom: CompassSpacing.s9,
      gap: CompassSpacing.s5,
    },
    avatarEdit: {
      alignItems: 'center',
      gap: CompassSpacing.s3,
      paddingTop: CompassSpacing.s2,
    },
    avatarLg: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImage: { width: 96, height: 96, borderRadius: 48 },
    avatarInitials: {
      color: '#FFFFFF',
      fontSize: 38,
      fontWeight: '800',
      letterSpacing: -0.57,
    },
    avatarBusy: {
      position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    avatarActions: {
      flexDirection: 'row',
      gap: CompassSpacing.s3,
    },
    smallBtn: {
      minHeight: COMPASS_TOUCH_MIN,
      borderRadius: CompassRadius.btn,
      paddingHorizontal: CompassSpacing.s5,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgSubtle,
    },
    smallBtnText: { color: colors.actionPrimary, fontWeight: '600' },
    tertiaryBtn: {
      minHeight: COMPASS_TOUCH_MIN,
      paddingHorizontal: CompassSpacing.s3,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tertiaryBtnText: { color: colors.actionPrimary, fontWeight: '600' },
    uploadNote: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: CompassSpacing.s2,
      justifyContent: 'center',
    },
    uploadNoteText: { color: colors.textSecondary },
    field: { gap: CompassSpacing.s2 },
    label: { color: colors.textPrimary, fontWeight: '600' },
    optional: { color: colors.textTertiary, fontWeight: '400' },
    input: {
      minHeight: 56,
      borderRadius: CompassRadius.md,
      borderWidth: 1.5,
      borderColor: colors.borderDefault,
      backgroundColor: colors.bgSurface,
      paddingHorizontal: CompassSpacing.s4,
      color: colors.textPrimary,
      fontSize: 17,
    },
    inputInvalid: { borderColor: colors.statusError },
    textarea: {
      minHeight: 96,
      textAlignVertical: 'top',
      paddingVertical: CompassSpacing.s4,
    },
    helper: { color: colors.textSecondary },
    helperError: { color: colors.statusError },
    count: { color: colors.textTertiary, alignSelf: 'flex-end' },
    visCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: CompassSpacing.s3,
      backgroundColor: colors.bgSurface,
      borderRadius: CompassRadius.card,
      padding: CompassSpacing.s4,
    },
    visIcon: {
      width: 36,
      height: 36,
      borderRadius: CompassRadius.sm,
      backgroundColor: colors.bgSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    visTitle: { color: colors.textPrimary, fontWeight: '600' },
    visSub: { color: colors.textSecondary, marginTop: 2 },
    sectionLabel: { color: colors.textSecondary, marginBottom: CompassSpacing.s3 },
    stickyCta: {
      paddingHorizontal: CompassSpacing.gutterPhone,
      paddingTop: CompassSpacing.s3,
      paddingBottom: CompassSpacing.s4,
      backgroundColor: colors.bgCanvas,
    },
    saveBtn: {
      minHeight: COMPASS_TOUCH_MIN + 4,
      borderRadius: CompassRadius.btn,
      backgroundColor: colors.actionPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  });
}
