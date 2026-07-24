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
    avatarWrap: { width: 96, height: 96 },
    avatarLg: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImage: { width: 96, height: 96, borderRadius: 48 },
    // The tap target for changing the photo — kept visually compact to sit
    // as a badge on the avatar's corner; actual hit area is padded to
    // COMPASS_TOUCH_MIN via hitSlop at the call site, not by this size.
    camBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.actionPrimary,
      borderWidth: 3,
      borderColor: colors.bgCanvas,
      alignItems: 'center',
      justifyContent: 'center',
    },
    camGlyph: { fontSize: 15 },
    avatarInitials: {
      // Avatar gradient is brandViolet→brandVioletDark (= actionPrimary), so the
      // knockout ink is onPrimary (white in light, dark ink in dark), matching
      // YouScreen's avatar rather than a hardcoded white that fails in dark mode.
      color: colors.onPrimary,
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
    visBody: { flex: 1 },
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
    saveBtnText: { color: colors.onPrimary, fontWeight: '600', fontSize: 16 },
  });
}
