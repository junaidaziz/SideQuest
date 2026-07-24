import { StyleSheet } from 'react-native';
import {
  CompassFonts,
  CompassRadius,
  CompassSpacing,
  CompassType,
  type CompassPalette,
} from '../../constants/compassDesign';

/** Theme-aware styles for the onboarding flow (mockups 02-04) — migrated off
 * the legacy `constants/design.ts` system so it participates in the
 * Appearance theme switch instead of staying light-only regardless of
 * preference. */
export function makeStyles(c: CompassPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bgCanvas,
      overflow: 'hidden',
    },
    track: {
      flex: 1,
      flexDirection: 'row',
    },
    step: {
      flex: 1,
      flexDirection: 'column',
      paddingHorizontal: CompassSpacing.s6,
      paddingTop: CompassSpacing.s6,
      paddingBottom: CompassSpacing.s7,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: CompassSpacing.s4,
    },
    progress: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: CompassSpacing.s2,
      marginBottom: CompassSpacing.s8,
    },
    progressSeg: {
      height: 4,
      borderRadius: 2,
      flex: 1,
      backgroundColor: c.borderDefault,
    },
    progressSegDone: {
      backgroundColor: c.actionPrimary,
      opacity: 0.45,
    },
    progressSegActive: {
      backgroundColor: c.actionPrimary,
    },
    progressLabel: {
      fontFamily: CompassFonts.bodyMedium,
      fontSize: CompassType.caption.size,
      color: c.textSecondary,
      marginLeft: CompassSpacing.s1,
    },
    heading: {
      fontFamily: CompassFonts.display,
      fontSize: CompassType.h1.size,
      lineHeight: CompassType.h1.lineHeight,
      color: c.textPrimary,
      letterSpacing: -0.6,
      marginBottom: CompassSpacing.s1,
    },
    subtitle: {
      fontFamily: CompassFonts.body,
      fontSize: CompassType.bodyM.size,
      lineHeight: CompassType.bodyM.lineHeight,
      color: c.textSecondary,
      marginBottom: CompassSpacing.s6,
    },
    options: {
      gap: CompassSpacing.s2,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: CompassSpacing.s3,
      paddingVertical: CompassSpacing.s4,
      paddingHorizontal: CompassSpacing.s4,
      borderRadius: CompassRadius.card,
      borderWidth: 2,
      borderColor: c.borderDefault,
      backgroundColor: c.bgSurface,
    },
    optionSelected: {
      borderColor: c.actionPrimary,
      backgroundColor: c.actionPrimary,
    },
    optionPressed: {
      backgroundColor: c.bgSubtle,
      borderColor: c.actionPrimary,
    },
    optionEmoji: {
      fontSize: 21,
      width: 30,
      textAlign: 'center',
    },
    optionLabel: {
      flex: 1,
      fontFamily: CompassFonts.bodySemiBold,
      fontSize: CompassType.labelL.size,
      lineHeight: CompassType.labelL.lineHeight,
      color: c.textPrimary,
    },
    optionLabelSelected: {
      color: c.onPrimary,
    },
    check: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: c.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkSelected: {
      // Derived from the on-primary ink (translucent) so the circle stays
      // legible on the actionPrimary fill in BOTH themes — in dark mode
      // actionPrimary is a light powder-blue, so a fixed translucent *white*
      // (the old value) vanished. on-primary flips with the theme.
      borderColor: `${c.onPrimary}66`,
      backgroundColor: `${c.onPrimary}2E`,
    },
    ctaArea: {
      paddingTop: CompassSpacing.s4,
    },
    nextButton: {
      height: 54,
      borderRadius: CompassRadius.btn,
      backgroundColor: c.actionPrimary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: CompassSpacing.s2,
    },
    nextButtonPressed: {
      backgroundColor: c.actionPressed,
    },
    nextButtonDisabled: {
      backgroundColor: c.disabledBg,
    },
    nextButtonLabel: {
      fontFamily: CompassFonts.bodySemiBold,
      fontSize: CompassType.labelL.size,
      color: c.onPrimary,
      letterSpacing: 0.2,
    },
    nextButtonLabelDisabled: {
      color: c.disabledText,
    },
    loading: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: c.bgCanvas,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: CompassSpacing.s8,
    },
    orb: {
      width: 80,
      height: 80,
      borderRadius: CompassRadius.sheet,
      backgroundColor: c.actionPrimary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: CompassSpacing.s7,
    },
    orbEmoji: {
      fontSize: 36,
    },
    loadingHeading: {
      fontFamily: CompassFonts.display,
      fontSize: CompassType.h2.size,
      color: c.textPrimary,
      textAlign: 'center',
      letterSpacing: -0.4,
      marginBottom: CompassSpacing.s2,
    },
    loadingBody: {
      fontFamily: CompassFonts.body,
      fontSize: CompassType.bodyM.size,
      color: c.textSecondary,
      textAlign: 'center',
    },
    summary: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: CompassSpacing.s2,
      marginTop: CompassSpacing.s6,
    },
    chip: {
      paddingVertical: CompassSpacing.s1,
      paddingHorizontal: CompassSpacing.s3,
      borderRadius: 20,
      backgroundColor: `${c.actionPrimary}1F`,
    },
    chipLabel: {
      fontFamily: CompassFonts.bodySemiBold,
      fontSize: CompassType.caption.size,
      color: c.actionPrimary,
    },
  });
}

export type OnboardingStyles = ReturnType<typeof makeStyles>;
