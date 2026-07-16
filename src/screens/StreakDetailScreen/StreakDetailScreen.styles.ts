import { StyleSheet } from 'react-native';
import {
  CompassRadius,
  CompassSpacing,
  CompassType,
  type CompassPalette,
} from '../../constants/compassDesign';

/** Theme-aware styles for the streak detail screen (mockup 25). */
export function makeStyles(c: CompassPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bgCanvas },
    topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: CompassSpacing.s3, paddingVertical: CompassSpacing.s2 },
    backBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    backBtnPressed: { opacity: 0.5 },
    backGlyph: { fontSize: 26, color: c.textPrimary },
    title: { flex: 1, textAlign: 'center', fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: CompassType.h2.size, fontWeight: '800', color: c.textPrimary },
    headerSpacer: { width: 48 },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: CompassSpacing.gutterPhone, paddingBottom: CompassSpacing.s9, gap: CompassSpacing.s5 },

    hero: { borderRadius: CompassRadius.hero, padding: CompassSpacing.s6, backgroundColor: c.brandCoral, alignItems: 'center' },
    heroNum: { fontFamily: 'Inter_800ExtraBold', fontWeight: '800', fontSize: 52, color: '#FFFFFF', letterSpacing: -0.78, marginVertical: 4 },
    heroSub: { fontSize: 15, color: 'rgba(255,255,255,0.95)', textAlign: 'center' },

    twin: { flexDirection: 'row', gap: CompassSpacing.s3 },
    metricCard: { flex: 1, backgroundColor: c.bgSurface, borderRadius: CompassRadius.card, padding: CompassSpacing.s4, borderWidth: 1, borderColor: c.borderDefault, alignItems: 'center' },
    metricNum: { fontFamily: 'Inter_800ExtraBold', fontWeight: '800', fontSize: 28, color: c.textPrimary },
    metricCap: { fontSize: CompassType.caption.size, color: c.textSecondary, marginTop: 2 },

    card: { backgroundColor: c.bgSurface, borderRadius: CompassRadius.card, padding: CompassSpacing.s4, borderWidth: 1, borderColor: c.borderDefault },
    graceRow: { flexDirection: 'row', gap: CompassSpacing.s3, alignItems: 'center' },
    graceShield: { width: 44, height: 44, borderRadius: 12, backgroundColor: `${c.actionPrimary}24`, alignItems: 'center', justifyContent: 'center' },
    graceShieldText: { fontSize: 22 },
    graceTitle: { fontSize: CompassType.labelM.size, fontWeight: '600', color: c.textPrimary },
    graceBody: { fontSize: CompassType.bodyS.size, lineHeight: CompassType.bodyS.lineHeight, color: c.textSecondary, marginTop: 2 },

    cardLabel: { fontSize: CompassType.labelL.size, fontWeight: '600', color: c.textPrimary, marginBottom: CompassSpacing.s3 },
    // Rendered as explicit 7-wide rows (see chunkIntoWeeks) rather than relying
    // on flexWrap to guess a column count from a fixed cell width — that
    // wrapped 9+5 instead of a calendar-correct 7+7 on a standard phone width.
    strip: { gap: 6 },
    stripRow: { flexDirection: 'row', gap: 6 },
    dayCell: { flex: 1, aspectRatio: 1, borderRadius: 8, backgroundColor: c.bgSubtle, alignItems: 'center', justifyContent: 'center' },
    dayCellDone: { backgroundColor: c.actionPrimary },
    dayCellToday: { borderWidth: 2, borderColor: c.brandCoral },
    dayGlyph: { fontSize: 12, fontWeight: '600', color: c.textTertiary },
    dayGlyphDone: { color: '#FFFFFF' },

    ruleRow: { flexDirection: 'row', gap: CompassSpacing.s3, paddingVertical: CompassSpacing.s2 },
    ruleIcon: { fontSize: 16 },
    ruleBody: { flex: 1, fontSize: CompassType.bodyS.size, lineHeight: CompassType.bodyS.lineHeight, color: c.textSecondary },

    cta: { height: 52, borderRadius: CompassRadius.btn, backgroundColor: c.actionPrimary, alignItems: 'center', justifyContent: 'center' },
    ctaPressed: { backgroundColor: c.actionPressed },
    ctaText: { color: '#FFFFFF', fontWeight: '600', fontSize: CompassType.labelL.size },

    stateArea: { flex: 1, paddingHorizontal: CompassSpacing.gutterPhone, justifyContent: 'center' },
    stateHeading: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: CompassType.h3.size, fontWeight: '700', color: c.textPrimary, textAlign: 'center', marginBottom: CompassSpacing.s2 },
    stateBody: { fontSize: CompassType.bodyM.size, color: c.textSecondary, textAlign: 'center', marginBottom: CompassSpacing.s5 },
    retryBtn: { alignSelf: 'center', height: 48, paddingHorizontal: CompassSpacing.s6, borderRadius: CompassRadius.btn, backgroundColor: c.actionPrimary, alignItems: 'center', justifyContent: 'center' },
    retryBtnPressed: { backgroundColor: c.actionPressed },
    retryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: CompassType.labelL.size },
    skel: { backgroundColor: c.bgSubtle, borderRadius: CompassRadius.card },
    skelHero: { height: 170 },
    skelCard: { height: 80 },
    skeletonWrap: { paddingHorizontal: CompassSpacing.gutterPhone, paddingTop: CompassSpacing.s2, gap: CompassSpacing.s5 },
  });
}

export type StreakDetailStyles = ReturnType<typeof makeStyles>;
