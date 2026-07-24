import { Platform, StyleSheet } from 'react-native';
import {
  CompassFonts,
  CompassRadius,
  CompassSpacing,
  CompassType,
  type CompassPalette,
} from '../../constants/compassDesign';

/** Theme-aware styles for the signup-prompt sheet (mockup 08 analog) —
 * migrated off the legacy `constants/design.ts` system so it participates in
 * the Appearance theme switch instead of staying light-only regardless of
 * preference. */
export function makeStyles(c: CompassPalette) {
  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    scrim: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: 'rgba(14, 14, 26, 0.55)',
    },
    backdropPressable: {
      flex: 1,
    },
    sheet: {
      backgroundColor: c.bgSurface,
      borderTopLeftRadius: CompassRadius.sheet,
      borderTopRightRadius: CompassRadius.sheet,
      maxHeight: '92%',
    },
    sheetContent: {
      paddingHorizontal: CompassSpacing.s6,
      paddingBottom: Platform.OS === 'ios' ? CompassSpacing.s9 : CompassSpacing.s6,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.borderDefault,
      alignSelf: 'center',
      marginTop: CompassSpacing.s3,
      marginBottom: CompassSpacing.s5,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: CompassRadius.card,
      backgroundColor: c.xpTint,
      borderWidth: 1.5,
      borderColor: c.xp,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: CompassSpacing.s4,
    },
    title: {
      fontFamily: CompassFonts.display,
      fontSize: CompassType.h2.size,
      lineHeight: CompassType.h2.lineHeight,
      color: c.textPrimary,
      letterSpacing: -0.4,
      marginBottom: CompassSpacing.s2,
    },
    body: {
      fontFamily: CompassFonts.body,
      fontSize: CompassType.bodyM.size,
      lineHeight: CompassType.bodyM.lineHeight,
      color: c.textSecondary,
      marginBottom: CompassSpacing.s4,
    },
    xpPill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: CompassSpacing.s1,
      paddingVertical: CompassSpacing.s1,
      paddingHorizontal: CompassSpacing.s2,
      borderRadius: CompassRadius.sm,
      backgroundColor: c.xpTint,
      marginBottom: CompassSpacing.s5,
    },
    xpPillText: {
      fontFamily: CompassFonts.bodySemiBold,
      fontSize: CompassType.caption.size,
      color: c.xpText,
    },
    benefits: {
      gap: CompassSpacing.s3,
      marginBottom: CompassSpacing.s6,
    },
    benefitItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: CompassSpacing.s3,
    },
    benefitDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: c.bgSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    benefitText: {
      flex: 1,
      fontFamily: CompassFonts.bodyMedium,
      fontSize: CompassType.bodyM.size,
      color: c.textPrimary,
    },
    form: {
      gap: CompassSpacing.s3,
      marginBottom: CompassSpacing.s4,
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
    error: {
      fontFamily: CompassFonts.bodyMedium,
      fontSize: CompassType.caption.size,
      lineHeight: CompassType.caption.lineHeight,
      color: c.statusError,
      marginBottom: CompassSpacing.s3,
    },
    primaryBtn: {
      height: 54,
      borderRadius: CompassRadius.btn,
      backgroundColor: c.actionPrimary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: CompassSpacing.s2,
      marginBottom: CompassSpacing.s2,
    },
    primaryBtnPressed: {
      backgroundColor: c.actionPressed,
    },
    primaryBtnSuccess: {
      backgroundColor: c.statusSuccess,
    },
    primaryBtnLabel: {
      fontFamily: CompassFonts.bodySemiBold,
      fontSize: CompassType.labelL.size,
      color: c.onPrimary,
      letterSpacing: 0.2,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: CompassSpacing.s3,
      marginVertical: CompassSpacing.s2,
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
      marginTop: CompassSpacing.s2,
      marginBottom: CompassSpacing.s2,
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
    googleBtnLabel: {
      fontFamily: CompassFonts.bodySemiBold,
      fontSize: CompassType.labelL.size,
      color: c.textPrimary,
      letterSpacing: 0.2,
    },
    guestBtn: {
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    guestBtnPressed: {
      opacity: 0.6,
    },
    guestBtnLabel: {
      fontFamily: CompassFonts.bodySemiBold,
      fontSize: CompassType.bodyM.size,
      color: c.textSecondary,
      textDecorationLine: 'underline',
    },
  });
}

export type SignupPromptStyles = ReturnType<typeof makeStyles>;
