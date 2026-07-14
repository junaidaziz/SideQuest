import { StyleSheet } from 'react-native';
import {
  CompassRadius,
  CompassSpacing,
  CompassType,
  type CompassPalette,
} from '../../constants/compassDesign';

/** Theme-aware styles for the community preview screen (mockup 31). */
export function makeStyles(c: CompassPalette) {
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
    backGlyph: { fontSize: 26, color: c.textPrimary },
    iconBtn: {
      width: 48,
      height: 48,
      borderRadius: CompassRadius.pill,
      backgroundColor: c.bgSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconGlyph: { fontSize: 18 },
    title: {
      flex: 1,
      textAlign: 'center',
      fontFamily: 'Syne_800ExtraBold',
      fontSize: CompassType.h2.size,
      fontWeight: '800',
      color: c.textPrimary,
    },

    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: CompassSpacing.gutterPhone,
      paddingBottom: CompassSpacing.s9,
      gap: CompassSpacing.s4,
    },

    conceptNote: {
      flexDirection: 'row',
      gap: CompassSpacing.s3,
      alignItems: 'flex-start',
      backgroundColor: `${c.brandViolet}1F`,
      borderWidth: 1,
      borderColor: `${c.brandViolet}59`,
      borderRadius: CompassRadius.md,
      padding: CompassSpacing.s3,
    },
    conceptIcon: { fontSize: 18 },
    conceptText: { flex: 1, fontSize: CompassType.bodyS.size, color: c.textPrimary, lineHeight: 19 },
    conceptStrong: { fontWeight: '700' },

    segmented: {
      flexDirection: 'row',
      gap: 6,
      backgroundColor: c.bgSubtle,
      padding: 4,
      borderRadius: CompassRadius.pill,
    },
    seg: {
      flex: 1,
      minHeight: 48,
      borderRadius: CompassRadius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segSelected: { backgroundColor: c.bgSurface },
    segDisabled: { opacity: 0.55 },
    segText: { fontSize: 13, fontWeight: '600', color: c.textSecondary },
    segTextSelected: { color: c.textPrimary },
    segTextDisabled: { fontSize: 13, fontWeight: '600', color: c.textTertiary },
    hint: { fontSize: CompassType.caption.size, color: c.textSecondary, textAlign: 'center' },

    curateHero: { borderRadius: CompassRadius.hero, padding: CompassSpacing.s6 },
    curateEyebrow: { fontSize: CompassType.caption.size, fontWeight: '700', color: '#FFFFFF', opacity: 0.9 },
    curateTitle: {
      fontFamily: 'Syne_800ExtraBold',
      fontSize: 24,
      fontWeight: '800',
      color: '#FFFFFF',
      marginVertical: 4,
    },
    curateSub: { fontSize: CompassType.bodyS.size, color: '#FFFFFF', opacity: 0.95 },

    sectionLabel: { fontSize: CompassType.labelM.size, fontWeight: '600', color: c.textSecondary },
    discCard: {
      backgroundColor: c.bgSurface,
      borderRadius: CompassRadius.card,
      padding: CompassSpacing.s4,
      borderWidth: 1,
      borderColor: c.borderDefault,
    },
    discBanner: {
      height: 96,
      borderRadius: CompassRadius.md,
      backgroundColor: c.bgSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: CompassSpacing.s3,
    },
    discBannerIcon: { fontSize: 40 },
    discTitle: { fontSize: CompassType.labelL.size, fontWeight: '600', color: c.textPrimary },
    discMeta: { fontSize: CompassType.bodyS.size, color: c.textSecondary, marginTop: 2 },
    discFoot: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: CompassSpacing.s3,
    },
    discSampleTag: {
      fontSize: CompassType.caption.size,
      fontWeight: '700',
      color: c.textTertiary,
      textTransform: 'uppercase',
    },
    tryBtn: {
      minHeight: 48,
      paddingHorizontal: CompassSpacing.s4,
      borderRadius: CompassRadius.btn,
      backgroundColor: c.bgSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tryBtnPressed: { opacity: 0.7 },
    tryBtnText: { fontSize: CompassType.labelM.size, fontWeight: '600', color: c.actionPrimary },

    footnote: {
      fontSize: CompassType.caption.size,
      color: c.textSecondary,
      textAlign: 'center',
      paddingHorizontal: CompassSpacing.s4,
      paddingTop: CompassSpacing.s2,
    },
  });
}

export type CommunityStyles = ReturnType<typeof makeStyles>;
