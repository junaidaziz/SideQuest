import { StyleSheet } from 'react-native';
import {
  CompassFonts,
  CompassRadius,
  CompassSpacing,
  CompassType,
  type CompassPalette,
} from '../../constants/compassDesign';

/** Theme-aware styles for the create-challenge flow (mockup 28). */
export function makeStyles(c: CompassPalette) {
  // Shadow-first elevation (design § 3, `--shadow-1`) tinted with `shadowColor`.
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
    backBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    backBtnPressed: { opacity: 0.5 },
    headerSpacer: { width: 48 },
    title: {
      flex: 1,
      textAlign: 'center',
      fontFamily: CompassFonts.fallbackHeavy,
      fontSize: CompassType.h2.size,
      fontWeight: '800',
      color: c.textPrimary,
    },

    indicatorWrap: {
      paddingHorizontal: CompassSpacing.gutterPhone,
      paddingBottom: CompassSpacing.s3,
      gap: 6,
    },
    // Wizard stepper: reached steps carry the primary action colour; upcoming
    // steps use the disabled tokens so "not yet available" reads distinctly
    // without being mistaken for an error or an active step.
    stepsRow: { flexDirection: 'row', alignItems: 'center' },
    node: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    nodeActive: { backgroundColor: c.actionPrimary },
    nodeTodo: { backgroundColor: c.disabledBg },
    nodeText: { fontWeight: '700', fontSize: 13, color: c.disabledText },
    nodeTextActive: { color: c.onPrimary },
    seg: { flex: 1, height: 3, borderRadius: CompassRadius.pill, backgroundColor: c.disabledBg },
    segActive: { backgroundColor: c.actionPrimary },
    stepLabel: { fontSize: CompassType.caption.size, color: c.textSecondary, textAlign: 'center' },

    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: CompassSpacing.gutterPhone,
      paddingBottom: CompassSpacing.s6,
    },
    stepBody: { flex: 1 },
    stepGap: { gap: CompassSpacing.s3 },
    stepHeading: {
      fontFamily: CompassFonts.fallbackBold,
      fontSize: CompassType.h2.size,
      fontWeight: '700',
      color: c.textPrimary,
      marginBottom: CompassSpacing.s1,
    },
    stepCaption: { fontSize: CompassType.caption.size, color: c.textSecondary },

    selectCard: {
      backgroundColor: c.bgSurface,
      borderWidth: 1.5,
      borderColor: c.borderDefault,
      borderRadius: CompassRadius.card,
      padding: CompassSpacing.s4,
      minHeight: 48,
    },
    selectCardSelected: { borderColor: c.actionPrimary },
    selectTitle: { fontFamily: CompassFonts.fallbackBold, fontWeight: '700', fontSize: 17, color: c.textPrimary },
    selectSub: { fontSize: CompassType.bodyS.size, color: c.textSecondary, marginTop: 2 },

    fieldLabel: { fontSize: CompassType.labelM.size, fontWeight: '600', color: c.textPrimary },
    input: {
      minHeight: 56,
      borderWidth: 1.5,
      borderColor: c.borderDefault,
      borderRadius: CompassRadius.md,
      backgroundColor: c.bgSurface,
      paddingHorizontal: CompassSpacing.s4,
      paddingVertical: CompassSpacing.s3,
      fontSize: CompassType.bodyL.size,
      color: c.textPrimary,
    },
    inputMultiline: { minHeight: 88, textAlignVertical: 'top' },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: CompassSpacing.s2 },
    choiceChip: {
      minHeight: 48,
      paddingHorizontal: CompassSpacing.s4,
      borderRadius: CompassRadius.pill,
      backgroundColor: c.bgSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    choiceChipSelected: { backgroundColor: c.actionPrimary },
    choiceChipText: { fontSize: 14, fontWeight: '600', color: c.textSecondary },
    choiceChipTextSelected: { color: c.onPrimary },

    // Shadow-first elevation (design § 3): card separated by shadow, not outline.
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: CompassSpacing.s3,
      backgroundColor: c.bgSurface,
      borderRadius: CompassRadius.card,
      padding: CompassSpacing.s4,
      minHeight: 48,
      ...shadow1,
    },
    toggleBody: { flex: 1 },
    toggleTitle: { fontSize: CompassType.labelM.size, fontWeight: '600', color: c.textPrimary },
    toggleSub: { fontSize: CompassType.caption.size, color: c.textSecondary, marginTop: 2 },
    toggle: {
      width: 52,
      height: 32,
      borderRadius: CompassRadius.pill,
      backgroundColor: c.bgSubtle,
      borderWidth: 1.5,
      borderColor: c.borderDefault,
      justifyContent: 'center',
    },
    toggleOn: { backgroundColor: c.actionPrimary, borderColor: c.actionPrimary },
    // Switch thumb is a constant light disc in both themes — no theme-aware
    // token works (onPrimary/bgSurface both invert to a dark value in dark mode,
    // which would hide the thumb against the off-track), so it reads the
    // intentionally theme-invariant `alwaysWhite` token.
    toggleThumb: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: c.alwaysWhite,
      marginLeft: 2,
    },
    toggleThumbOn: { marginLeft: 22 },

    // Shadow-first elevation (design § 3); internal rows keep hairline dividers.
    reviewCard: {
      backgroundColor: c.bgSurface,
      borderRadius: CompassRadius.card,
      paddingHorizontal: CompassSpacing.s4,
      ...shadow1,
    },
    reviewRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: CompassSpacing.s3,
      paddingVertical: CompassSpacing.s3,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
    },
    reviewRowLast: { borderBottomWidth: 0 },
    reviewK: { fontSize: CompassType.bodyM.size, color: c.textSecondary },
    reviewV: { flex: 1, fontSize: CompassType.bodyM.size, fontWeight: '600', color: c.textPrimary, textAlign: 'right' },
    errorText: { fontSize: CompassType.bodyS.size, color: c.statusError, textAlign: 'center' },

    ctaBar: {
      paddingHorizontal: CompassSpacing.gutterPhone,
      paddingTop: CompassSpacing.s3,
      paddingBottom: CompassSpacing.s4,
      borderTopWidth: 1,
      borderTopColor: c.borderDefault,
      backgroundColor: c.bgCanvas,
    },
    primaryBtn: {
      height: 52,
      borderRadius: CompassRadius.btn,
      backgroundColor: c.actionPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryBtnText: { color: c.onPrimary, fontWeight: '600', fontSize: CompassType.labelL.size },
    secondaryBtn: {
      height: 52,
      borderRadius: CompassRadius.btn,
      backgroundColor: c.bgSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryBtnText: { color: c.actionPrimary, fontWeight: '600', fontSize: CompassType.labelL.size },
    btnDisabled: { opacity: 0.45 },
    btnPressed: { opacity: 0.85 },

    sentArea: {
      flex: 1,
      paddingHorizontal: CompassSpacing.gutterPhone,
      justifyContent: 'center',
      alignItems: 'center',
      gap: CompassSpacing.s3,
    },
    sentGlyph: { fontSize: 48 },
    sentTitle: {
      fontFamily: CompassFonts.fallbackBold,
      fontSize: CompassType.h1.size,
      fontWeight: '700',
      color: c.textPrimary,
      textAlign: 'center',
    },
    sentBody: {
      fontSize: CompassType.bodyM.size,
      color: c.textSecondary,
      textAlign: 'center',
      maxWidth: 300,
    },
    linkBox: {
      width: '100%',
      backgroundColor: c.bgSubtle,
      borderRadius: CompassRadius.md,
      paddingHorizontal: CompassSpacing.s4,
      paddingVertical: CompassSpacing.s3,
      marginVertical: CompassSpacing.s2,
    },
    linkText: { fontSize: CompassType.bodyS.size, color: c.textPrimary },
  });
}

export type CreateChallengeStyles = ReturnType<typeof makeStyles>;
