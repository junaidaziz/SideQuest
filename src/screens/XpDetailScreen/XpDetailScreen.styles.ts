import { StyleSheet } from 'react-native';
import {
  CompassRadius,
  CompassSpacing,
  CompassType,
  type CompassPalette,
} from '../../constants/compassDesign';

/** Theme-aware styles for the XP detail screen (mockup 20). */
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
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: CompassType.h2.size,
      fontWeight: '800',
      color: c.textPrimary,
    },
    headerSpacer: { width: 48 },

    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: CompassSpacing.gutterPhone,
      paddingBottom: CompassSpacing.s9,
      gap: CompassSpacing.s5,
    },

    hero: {
      borderRadius: CompassRadius.hero,
      padding: CompassSpacing.s6,
      backgroundColor: c.brandVioletDark,
    },
    heroTotal: {
      fontFamily: 'Inter_800ExtraBold',
      fontWeight: '800',
      fontSize: 40,
      color: '#FFFFFF',
      letterSpacing: -0.6,
    },
    heroSub: { color: 'rgba(255,255,255,0.92)', fontSize: 14, marginTop: 4, marginBottom: CompassSpacing.s4 },
    heroLevels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 6,
    },
    heroLevelText: { color: 'rgba(255,255,255,0.92)', fontSize: 12 },

    card: {
      backgroundColor: c.bgSurface,
      borderRadius: CompassRadius.card,
      padding: CompassSpacing.s4,
      borderWidth: 1,
      borderColor: c.borderDefault,
    },
    infoRow: { flexDirection: 'row', gap: CompassSpacing.s3 },
    infoIcon: { fontSize: 20 },
    infoTitle: { fontSize: CompassType.labelM.size, fontWeight: '600', color: c.textPrimary, marginBottom: 2 },
    infoBody: { fontSize: CompassType.bodyS.size, lineHeight: CompassType.bodyS.lineHeight, color: c.textSecondary },

    cardLabel: { fontSize: CompassType.labelL.size, fontWeight: '600', color: c.textPrimary, marginBottom: CompassSpacing.s2 },
    msRow: { flexDirection: 'row', alignItems: 'center', gap: CompassSpacing.s3, paddingVertical: CompassSpacing.s3 },
    dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: c.borderDefault },
    dotDone: { backgroundColor: c.actionPrimary, borderColor: c.actionPrimary },
    dotNext: { borderColor: c.actionPrimary },
    msName: { flex: 1, fontSize: CompassType.labelM.size, fontWeight: '600', color: c.textPrimary },
    msMeta: { fontSize: CompassType.caption.size, color: c.textSecondary },

    // states
    stateArea: { flex: 1, paddingHorizontal: CompassSpacing.gutterPhone, justifyContent: 'center' },
    stateHeading: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: CompassType.h3.size, fontWeight: '700', color: c.textPrimary, textAlign: 'center', marginBottom: CompassSpacing.s2 },
    stateBody: { fontSize: CompassType.bodyM.size, color: c.textSecondary, textAlign: 'center', marginBottom: CompassSpacing.s5 },
    retryBtn: { alignSelf: 'center', height: 48, paddingHorizontal: CompassSpacing.s6, borderRadius: CompassRadius.btn, backgroundColor: c.actionPrimary, alignItems: 'center', justifyContent: 'center' },
    retryBtnPressed: { backgroundColor: c.actionPressed },
    retryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: CompassType.labelL.size },
    skel: { backgroundColor: c.bgSubtle, borderRadius: CompassRadius.card },
    skelHero: { height: 150 },
    skelCard: { height: 90 },
  });
}

export type XpDetailStyles = ReturnType<typeof makeStyles>;
