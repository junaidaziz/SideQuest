import { StyleSheet } from 'react-native';
import {
  COMPASS_TOUCH_MIN,
  CompassFonts,
  CompassRadius,
  CompassSpacing,
  CompassType,
  type CompassPalette,
} from '../../constants/compassDesign';

/** Theme-aware styles for the challenge invite landing screen. */
export function makeStyles(c: CompassPalette) {
  const shadow1 = {
    shadowColor: c.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
  } as const;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bgCanvas },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: CompassSpacing.s3,
      paddingVertical: CompassSpacing.s2,
    },
    backBtn: {
      width: COMPASS_TOUCH_MIN,
      height: COMPASS_TOUCH_MIN,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backBtnPressed: { opacity: 0.5 },

    content: {
      flex: 1,
      paddingHorizontal: CompassSpacing.gutterPhone,
      justifyContent: 'center',
      gap: CompassSpacing.s4,
    },
    hero: { alignItems: 'center', gap: CompassSpacing.s3 },
    hex: {
      width: 88,
      height: 88,
      borderRadius: 26,
      backgroundColor: c.communityTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontFamily: CompassFonts.fallbackHeavy,
      fontSize: CompassType.h1.size,
      fontWeight: '800',
      color: c.textPrimary,
      textAlign: 'center',
    },
    body: {
      fontFamily: CompassFonts.body,
      fontSize: CompassType.bodyM.size,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    card: {
      backgroundColor: c.bgSubtle,
      borderRadius: CompassRadius.lg,
      padding: CompassSpacing.s4,
      gap: CompassSpacing.s2,
      ...shadow1,
    },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: CompassSpacing.s3 },
    cardText: {
      flex: 1,
      fontFamily: CompassFonts.body,
      fontSize: CompassType.caption.size,
      color: c.textSecondary,
      lineHeight: 20,
    },

    errorText: {
      color: c.statusErrorText,
      fontFamily: CompassFonts.body,
      fontSize: CompassType.caption.size,
      textAlign: 'center',
    },

    ctaBar: {
      paddingHorizontal: CompassSpacing.gutterPhone,
      paddingBottom: CompassSpacing.s4,
      gap: CompassSpacing.s3,
    },
    primaryBtn: {
      minHeight: COMPASS_TOUCH_MIN,
      borderRadius: CompassRadius.pill,
      backgroundColor: c.actionPrimary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: CompassSpacing.s4,
    },
    primaryBtnPressed: { opacity: 0.85 },
    primaryBtnText: {
      fontFamily: CompassFonts.fallbackBold,
      fontSize: CompassType.bodyM.size,
      fontWeight: '700',
      color: c.onPrimary,
    },
    secondaryBtn: {
      minHeight: COMPASS_TOUCH_MIN,
      borderRadius: CompassRadius.pill,
      borderWidth: 1,
      borderColor: c.borderDefault,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: CompassSpacing.s4,
    },
    secondaryBtnPressed: { opacity: 0.6 },
    secondaryBtnText: {
      fontFamily: CompassFonts.fallbackBold,
      fontSize: CompassType.bodyM.size,
      fontWeight: '700',
      color: c.textPrimary,
    },
    btnDisabled: { opacity: 0.5 },
    signInLink: {
      fontFamily: CompassFonts.fallbackBold,
      fontSize: CompassType.caption.size,
      fontWeight: '700',
      color: c.actionPrimary,
      textAlign: 'center',
      paddingVertical: CompassSpacing.s2,
    },
  });
}
