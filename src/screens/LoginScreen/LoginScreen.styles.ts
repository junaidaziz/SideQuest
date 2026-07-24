import { StyleSheet } from 'react-native';
import {
  CompassFonts,
  CompassRadius,
  CompassSpacing,
  CompassType,
  type CompassPalette,
} from '../../constants/compassDesign';

/** Theme-aware styles for the login screen (mockup 07) — migrated off the
 * legacy `constants/design.ts` system so it participates in the Appearance
 * theme switch instead of staying light-only regardless of preference. */
export function makeStyles(c: CompassPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bgCanvas,
    },
    flex: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: CompassSpacing.s5,
      paddingTop: CompassSpacing.s5,
      paddingBottom: CompassSpacing.s3,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: CompassRadius.sm,
      borderWidth: 1.5,
      borderColor: c.borderDefault,
      backgroundColor: c.bgSurface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBtnPressed: {
      backgroundColor: c.bgSubtle,
      borderColor: c.actionPrimary,
    },
    headerSpacer: {
      width: 40,
      height: 40,
    },
    headerTitle: {
      fontFamily: CompassFonts.displayBold,
      fontSize: CompassType.labelL.size,
      color: c.textPrimary,
      letterSpacing: -0.2,
    },
    content: {
      paddingHorizontal: CompassSpacing.s6,
      paddingTop: CompassSpacing.s3,
      paddingBottom: CompassSpacing.s9,
    },
    lockup: {
      width: 56,
      height: 56,
      borderRadius: CompassRadius.card,
      backgroundColor: c.bgSubtle,
      borderWidth: 1.5,
      borderColor: c.actionPrimary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: CompassSpacing.s4,
    },
    leadTitle: {
      fontFamily: CompassFonts.display,
      fontSize: CompassType.h1.size,
      lineHeight: CompassType.h1.lineHeight,
      color: c.textPrimary,
      letterSpacing: -0.5,
      marginBottom: CompassSpacing.s2,
    },
    leadSub: {
      fontFamily: CompassFonts.body,
      fontSize: CompassType.bodyM.size,
      lineHeight: CompassType.bodyM.lineHeight,
      color: c.textSecondary,
      marginBottom: CompassSpacing.s6,
    },
    formError: {
      padding: CompassSpacing.s3,
      backgroundColor: c.statusErrorTint,
      borderWidth: 1.5,
      borderColor: c.statusError,
      borderRadius: CompassRadius.sm,
      marginBottom: CompassSpacing.s4,
    },
    formErrorText: {
      fontFamily: CompassFonts.bodyMedium,
      fontSize: CompassType.caption.size,
      lineHeight: CompassType.caption.lineHeight,
      color: c.statusErrorText,
    },
    field: {
      marginBottom: CompassSpacing.s4,
    },
    fieldLabel: {
      fontFamily: CompassFonts.bodySemiBold,
      fontSize: CompassType.caption.size,
      color: c.textPrimary,
      marginBottom: CompassSpacing.s2,
    },
    inputWrap: {
      position: 'relative',
      justifyContent: 'center',
    },
    input: {
      height: 52,
      borderRadius: CompassRadius.btn,
      borderWidth: 1.5,
      borderColor: c.borderDefault,
      backgroundColor: c.bgSurface,
      paddingHorizontal: CompassSpacing.s4,
      fontFamily: CompassFonts.bodyMedium,
      fontSize: CompassType.labelL.size,
      color: c.textPrimary,
    },
    inputWithToggle: {
      paddingRight: 72,
    },
    inputInvalid: {
      borderColor: c.statusError,
    },
    pwToggle: {
      position: 'absolute',
      right: CompassSpacing.s2,
      height: 36,
      paddingHorizontal: CompassSpacing.s3,
      borderRadius: CompassRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pwTogglePressed: {
      backgroundColor: c.bgSubtle,
    },
    pwToggleText: {
      fontFamily: CompassFonts.bodySemiBold,
      fontSize: CompassType.caption.size,
      color: c.actionPrimary,
    },
    fieldError: {
      fontFamily: CompassFonts.bodyMedium,
      fontSize: CompassType.caption.size,
      lineHeight: CompassType.caption.lineHeight,
      color: c.statusError,
      marginTop: CompassSpacing.s2,
    },
    forgotRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: CompassSpacing.s4,
    },
    linkBtn: {
      paddingVertical: CompassSpacing.s1,
      paddingHorizontal: CompassSpacing.s1,
      borderRadius: CompassRadius.sm,
    },
    linkBtnPressed: {
      opacity: 0.6,
    },
    linkBtnText: {
      fontFamily: CompassFonts.bodySemiBold,
      fontSize: CompassType.caption.size,
      color: c.actionPrimary,
      textDecorationLine: 'underline',
    },
    stubNote: {
      padding: CompassSpacing.s3,
      backgroundColor: c.bgSubtle,
      borderWidth: 1.5,
      borderColor: c.borderDefault,
      borderRadius: CompassRadius.sm,
      marginBottom: CompassSpacing.s4,
    },
    stubNoteText: {
      fontFamily: CompassFonts.body,
      fontSize: CompassType.caption.size,
      lineHeight: CompassType.caption.lineHeight,
      color: c.textSecondary,
    },
    primaryBtn: {
      height: 54,
      borderRadius: CompassRadius.btn,
      backgroundColor: c.actionPrimary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: CompassSpacing.s2,
    },
    primaryBtnPressed: {
      backgroundColor: c.actionPressed,
    },
    primaryBtnDisabled: {
      backgroundColor: c.borderDefault,
    },
    primaryBtnSuccess: {
      backgroundColor: c.statusSuccess,
    },
    primaryBtnText: {
      fontFamily: CompassFonts.bodySemiBold,
      fontSize: CompassType.labelL.size,
      color: c.onPrimary,
      letterSpacing: 0.2,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: CompassSpacing.s3,
      marginTop: CompassSpacing.s6,
    },
    dividerLine: {
      flex: 1,
      height: 1.5,
      backgroundColor: c.borderDefault,
    },
    dividerText: {
      fontFamily: CompassFonts.bodyMedium,
      fontSize: CompassType.caption.size,
      color: c.textSecondary,
    },
    googleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: CompassSpacing.s2,
      height: 54,
      borderRadius: CompassRadius.btn,
      borderWidth: 1.5,
      borderColor: c.borderDefault,
      backgroundColor: c.bgSurface,
      marginTop: CompassSpacing.s4,
    },
    googleBtnPressed: {
      backgroundColor: c.bgSubtle,
      borderColor: c.actionPrimary,
    },
    googleBtnDisabled: {
      backgroundColor: c.bgSubtle,
    },
    googleIcon: {
      fontFamily: CompassFonts.displayBold,
      fontSize: CompassType.labelL.size,
      color: c.actionPrimary,
    },
    googleBtnText: {
      fontFamily: CompassFonts.bodySemiBold,
      fontSize: CompassType.labelL.size,
      color: c.textPrimary,
      letterSpacing: 0.2,
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: CompassSpacing.s6,
    },
    switchText: {
      fontFamily: CompassFonts.body,
      fontSize: CompassType.bodyM.size,
      color: c.textSecondary,
    },
    switchLink: {
      fontFamily: CompassFonts.bodySemiBold,
      fontSize: CompassType.bodyM.size,
      color: c.actionPrimary,
      textDecorationLine: 'underline',
    },
  });
}

export type LoginStyles = ReturnType<typeof makeStyles>;
