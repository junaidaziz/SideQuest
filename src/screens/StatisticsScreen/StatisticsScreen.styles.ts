import { StyleSheet } from 'react-native';
import {
  CompassRadius,
  CompassSpacing,
  CompassType,
  type CompassPalette,
} from '../../constants/compassDesign';

/** Theme-aware styles for the statistics screen (mockup 24). */
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
    title: {
      flex: 1,
      textAlign: 'center',
      fontFamily: 'Syne_800ExtraBold',
      fontSize: CompassType.h2.size,
      fontWeight: '800',
      color: c.textPrimary,
    },
    headerSpacer: { width: 48 },

    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: CompassSpacing.gutterPhone,
      paddingBottom: CompassSpacing.s9,
      gap: CompassSpacing.s4,
    },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: CompassSpacing.s3 },
    metricCard: {
      flexBasis: '47%',
      flexGrow: 1,
      backgroundColor: c.bgSurface,
      borderRadius: CompassRadius.card,
      paddingVertical: CompassSpacing.s4,
      paddingHorizontal: CompassSpacing.s3,
      borderWidth: 1,
      borderColor: c.borderDefault,
      alignItems: 'center',
    },
    metricNum: {
      fontFamily: 'Syne_800ExtraBold',
      fontSize: 24,
      fontWeight: '800',
      color: c.textPrimary,
    },
    metricCap: { fontSize: CompassType.caption.size, color: c.textSecondary, marginTop: 2 },

    card: {
      backgroundColor: c.bgSurface,
      borderRadius: CompassRadius.card,
      padding: CompassSpacing.s4,
      borderWidth: 1,
      borderColor: c.borderDefault,
      gap: CompassSpacing.s3,
    },
    cardLabel: { fontSize: CompassType.labelL.size, fontWeight: '600', color: c.textPrimary },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    rowStrong: { fontSize: CompassType.labelM.size, fontWeight: '600', color: c.textPrimary },
    rowMuted: { fontSize: CompassType.caption.size, color: c.textSecondary },

    rateNum: {
      fontFamily: 'Syne_800ExtraBold',
      fontSize: 32,
      fontWeight: '800',
      color: c.textPrimary,
    },

    statusRow: { flexDirection: 'row', alignItems: 'center', gap: CompassSpacing.s3 },
    dot: { width: 12, height: 12, borderRadius: 4 },
    statusName: { flex: 1, fontSize: CompassType.bodyM.size, fontWeight: '600', color: c.textPrimary },
    statusVal: { fontSize: CompassType.bodyM.size, fontWeight: '700', color: c.textPrimary },

    footnote: {
      fontSize: CompassType.caption.size,
      color: c.textSecondary,
      textAlign: 'center',
      paddingHorizontal: CompassSpacing.s4,
      paddingTop: CompassSpacing.s2,
    },

    stateArea: {
      flex: 1,
      paddingHorizontal: CompassSpacing.gutterPhone,
      paddingTop: CompassSpacing.s4,
      justifyContent: 'center',
      gap: CompassSpacing.s4,
    },
    stateHeading: {
      fontFamily: 'Syne_700Bold',
      fontSize: CompassType.h3.size,
      fontWeight: '700',
      color: c.textPrimary,
      textAlign: 'center',
    },
    stateBody: { fontSize: CompassType.bodyM.size, color: c.textSecondary, textAlign: 'center' },
    retryBtn: {
      alignSelf: 'center',
      height: 48,
      paddingHorizontal: CompassSpacing.s6,
      borderRadius: CompassRadius.btn,
      backgroundColor: c.actionPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    retryBtnPressed: { backgroundColor: c.actionPressed },
    retryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: CompassType.labelL.size },
    skel: { backgroundColor: c.bgSubtle, borderRadius: CompassRadius.card },
    skelHero: { height: 120 },
    skelCard: { height: 160 },
  });
}

export type StatisticsStyles = ReturnType<typeof makeStyles>;
