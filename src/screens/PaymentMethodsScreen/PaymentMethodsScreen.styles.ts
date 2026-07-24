import { StyleSheet } from 'react-native';
import {
  CompassFonts,
  CompassRadius,
  CompassSpacing,
  CompassType,
  type CompassPalette,
} from '../../constants/compassDesign';

/**
 * Theme-aware styles for the payment-methods screen. Migrated from the legacy
 * light-only `design.ts` tokens onto the Halcyon+ (`compassDesign.ts`) system
 * via `useCompassTheme()` — the last live screen to move over. Card surfaces
 * use the sibling list-screen convention (flat `borderDefault` border, no
 * shadow) so this screen sits consistently alongside Rewards / Notifications.
 */
export function makeStyles(c: CompassPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bgCanvas },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: CompassSpacing.s3,
      paddingHorizontal: CompassSpacing.s3,
      paddingTop: CompassSpacing.s2,
      paddingBottom: CompassSpacing.s2,
    },
    backBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    backBtnPressed: { opacity: 0.5 },
    headerTitle: {
      fontFamily: CompassFonts.fallbackBold,
      fontSize: CompassType.h3.size,
      fontWeight: '700',
      color: c.textPrimary,
      letterSpacing: -0.2,
    },
    scrollArea: { flex: 1 },
    scrollContent: {
      paddingHorizontal: CompassSpacing.gutterPhone,
      paddingBottom: CompassSpacing.s7,
      gap: CompassSpacing.s5,
    },
    guestCenter: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: CompassSpacing.gutterPhone,
      gap: CompassSpacing.s2,
    },
    intro: {
      fontFamily: CompassFonts.body,
      fontSize: CompassType.bodyS.size,
      lineHeight: CompassType.bodyS.lineHeight,
      color: c.textSecondary,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: CompassSpacing.s3,
      padding: CompassSpacing.s4,
      borderWidth: 1,
      borderColor: c.borderDefault,
      borderRadius: CompassRadius.card,
      backgroundColor: c.bgSurface,
    },
    cardDefault: {
      borderColor: c.actionPrimary,
      backgroundColor: c.bgSubtle,
    },
    cardIcon: {
      width: 44,
      height: 44,
      borderRadius: CompassRadius.md,
      backgroundColor: c.bgSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardIconGlyph: { fontSize: 20 },
    cardInfo: { flex: 1 },
    cardBrandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: CompassSpacing.s2,
      marginBottom: 3,
    },
    cardBrand: {
      fontFamily: CompassFonts.bodySemiBold,
      fontSize: CompassType.bodyM.size,
      fontWeight: '600',
      color: c.textPrimary,
    },
    defaultBadge: {
      paddingVertical: 2,
      paddingHorizontal: CompassSpacing.s2,
      backgroundColor: c.communityTint,
      borderRadius: CompassRadius.xs,
    },
    defaultBadgeText: {
      fontFamily: CompassFonts.bodySemiBold,
      fontSize: 11,
      fontWeight: '700',
      color: c.communityText,
    },
    cardExpiry: {
      fontFamily: CompassFonts.body,
      fontSize: CompassType.caption.size,
      color: c.textSecondary,
    },
    cardActions: { flexDirection: 'row', gap: CompassSpacing.s2 },
    smallBtn: {
      width: 40,
      height: 40,
      borderRadius: CompassRadius.md,
      borderWidth: 1,
      borderColor: c.borderDefault,
      alignItems: 'center',
      justifyContent: 'center',
    },
    smallBtnPressed: {
      borderColor: c.actionPrimary,
      backgroundColor: c.bgSubtle,
    },
    smallBtnDestructivePressed: {
      borderColor: c.statusError,
      backgroundColor: c.statusErrorTint,
    },
    smallBtnDisabled: { opacity: 0.5 },
    smallBtnGlyph: { fontSize: 16, color: c.actionPrimary },
    smallBtnGlyphDestructive: { fontSize: 16, color: c.statusError },
    addBtn: {
      minHeight: 48,
      borderRadius: CompassRadius.btn,
      backgroundColor: c.actionPrimary,
      paddingVertical: CompassSpacing.s4,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: CompassSpacing.s2,
    },
    addBtnPressed: { backgroundColor: c.actionPressed },
    addBtnDisabled: { opacity: 0.7 },
    addBtnText: {
      fontFamily: CompassFonts.bodySemiBold,
      fontSize: CompassType.labelL.size,
      fontWeight: '600',
      color: c.onPrimary,
    },
    emptyWrap: {
      alignItems: 'center',
      gap: CompassSpacing.s2,
      paddingVertical: CompassSpacing.s7,
      paddingHorizontal: CompassSpacing.gutterPhone,
    },
    emptyGlyph: { fontSize: 40, marginBottom: CompassSpacing.s1 },
    emptyTitle: {
      fontFamily: CompassFonts.fallbackBold,
      fontSize: CompassType.labelL.size,
      fontWeight: '700',
      color: c.textPrimary,
      textAlign: 'center',
    },
    emptyBody: {
      fontFamily: CompassFonts.body,
      fontSize: CompassType.caption.size,
      lineHeight: CompassType.caption.lineHeight,
      color: c.textSecondary,
      textAlign: 'center',
    },
    inlineError: {
      borderWidth: 1,
      borderColor: c.borderDefault,
      borderRadius: CompassRadius.card,
      backgroundColor: c.bgSurface,
      paddingVertical: CompassSpacing.s6,
      paddingHorizontal: CompassSpacing.gutterPhone,
      alignItems: 'center',
      gap: CompassSpacing.s2,
    },
    errorHeading: {
      fontFamily: CompassFonts.fallbackBold,
      fontSize: CompassType.labelL.size,
      fontWeight: '700',
      color: c.textPrimary,
      textAlign: 'center',
    },
    errorBody: {
      fontFamily: CompassFonts.body,
      fontSize: CompassType.caption.size,
      lineHeight: CompassType.caption.lineHeight,
      color: c.textSecondary,
      textAlign: 'center',
    },
    fieldError: {
      fontFamily: CompassFonts.body,
      fontSize: CompassType.caption.size,
      lineHeight: CompassType.caption.lineHeight,
      color: c.statusError,
    },
    retryBtn: {
      marginTop: CompassSpacing.s2,
      minHeight: 48,
      borderRadius: CompassRadius.btn,
      borderWidth: 1,
      borderColor: c.actionPrimary,
      paddingVertical: CompassSpacing.s2,
      paddingHorizontal: CompassSpacing.gutterPhone,
      justifyContent: 'center',
    },
    retryBtnPressed: { backgroundColor: c.bgSubtle },
    retryBtnText: {
      fontFamily: CompassFonts.bodySemiBold,
      fontSize: CompassType.bodyM.size,
      fontWeight: '600',
      color: c.actionPrimary,
    },
    skeletonWrap: { gap: CompassSpacing.s4 },
    skel: {
      backgroundColor: c.skeletonBase,
      borderRadius: CompassRadius.card,
      height: 76,
    },
  });
}

export type PaymentMethodsStyles = ReturnType<typeof makeStyles>;
