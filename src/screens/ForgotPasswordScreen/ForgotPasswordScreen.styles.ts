import { StyleSheet } from 'react-native';
import {
  COMPASS_TOUCH_MIN,
  CompassFonts,
  CompassRadius,
  CompassSpacing,
  CompassType,
  type CompassPalette,
} from '../../constants/compassDesign';

/** Theme-aware styles for the forgot-password screen, on the Compass token
 * system (not the legacy `constants/design.ts`) so it participates in the
 * Appearance theme switch. Shares the visual language of LoginScreen. */
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
      width: COMPASS_TOUCH_MIN,
      height: COMPASS_TOUCH_MIN,
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
      width: COMPASS_TOUCH_MIN,
      height: COMPASS_TOUCH_MIN,
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
    confirmation: {
      padding: CompassSpacing.s4,
      backgroundColor: c.statusSuccessTint,
      borderWidth: 1.5,
      borderColor: c.statusSuccess,
      borderRadius: CompassRadius.sm,
      marginBottom: CompassSpacing.s6,
    },
    confirmationText: {
      fontFamily: CompassFonts.bodyMedium,
      fontSize: CompassType.bodyM.size,
      lineHeight: CompassType.bodyM.lineHeight,
      color: c.statusSuccessText,
    },
    field: {
      marginBottom: CompassSpacing.s5,
    },
    fieldLabel: {
      fontFamily: CompassFonts.bodySemiBold,
      fontSize: CompassType.caption.size,
      color: c.textPrimary,
      marginBottom: CompassSpacing.s2,
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
    inputInvalid: {
      borderColor: c.statusError,
    },
    fieldError: {
      fontFamily: CompassFonts.bodyMedium,
      fontSize: CompassType.caption.size,
      lineHeight: CompassType.caption.lineHeight,
      color: c.statusError,
      marginTop: CompassSpacing.s2,
    },
    primaryBtn: {
      minHeight: COMPASS_TOUCH_MIN,
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
    primaryBtnText: {
      fontFamily: CompassFonts.bodySemiBold,
      fontSize: CompassType.labelL.size,
      color: c.onPrimary,
      letterSpacing: 0.2,
    },
    linkBtnPressed: {
      opacity: 0.6,
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: COMPASS_TOUCH_MIN,
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

export type ForgotPasswordStyles = ReturnType<typeof makeStyles>;
