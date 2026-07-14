import { StyleSheet } from 'react-native';
import {
  CompassRadius,
  CompassSpacing,
  CompassType,
  type CompassPalette,
} from '../../constants/compassDesign';

/** Theme-aware styles for the achievements grid (mockup 22). */
export function makeStyles(c: CompassPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bgCanvas },
    topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: CompassSpacing.s3, paddingVertical: CompassSpacing.s2 },
    backBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    backBtnPressed: { opacity: 0.5 },
    backGlyph: { fontSize: 26, color: c.textPrimary },
    title: { flex: 1, textAlign: 'center', fontFamily: 'Syne_800ExtraBold', fontSize: CompassType.h2.size, fontWeight: '800', color: c.textPrimary },
    headerSpacer: { width: 48 },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: CompassSpacing.gutterPhone, paddingBottom: CompassSpacing.s9, gap: CompassSpacing.s5 },

    hero: { flexDirection: 'row', alignItems: 'center', gap: CompassSpacing.s4, backgroundColor: c.bgSurface, borderRadius: CompassRadius.card, padding: CompassSpacing.s4, borderWidth: 1, borderColor: c.borderDefault },
    medal: { width: 60, height: 60, borderRadius: 30, backgroundColor: c.brandVioletDark, alignItems: 'center', justifyContent: 'center' },
    medalGlyph: { fontSize: 28 },
    heroCount: { fontFamily: 'Syne_800ExtraBold', fontWeight: '800', fontSize: 22, color: c.textPrimary },
    heroCountTotal: { fontSize: 16, color: c.textTertiary, fontWeight: '600' },
    heroCap: { fontSize: CompassType.caption.size, color: c.textSecondary, marginBottom: CompassSpacing.s2 },

    filterRow: { flexDirection: 'row', gap: CompassSpacing.s2 },
    chip: { paddingHorizontal: CompassSpacing.s4, minHeight: 48, borderRadius: CompassRadius.pill, backgroundColor: c.bgSubtle, alignItems: 'center', justifyContent: 'center' },
    chipSelected: { backgroundColor: c.actionPrimary },
    chipText: { fontSize: 13, fontWeight: '600', color: c.textSecondary },
    chipTextSelected: { color: '#FFFFFF' },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: CompassSpacing.s3 },
    achCard: { flexBasis: '47%', flexGrow: 1, backgroundColor: c.bgSurface, borderRadius: CompassRadius.card, padding: CompassSpacing.s4, borderWidth: 1, borderColor: c.borderDefault, alignItems: 'center' },
    achCardPressed: { backgroundColor: c.bgSubtle, transform: [{ scale: 0.98 }] },
    hexBadge: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: CompassSpacing.s2 },
    hexLocked: { opacity: 0.45 },
    hexGlyph: { fontSize: 26 },
    achName: { fontSize: CompassType.labelM.size, fontWeight: '600', color: c.textPrimary, textAlign: 'center' },
    achNameLocked: { color: c.textTertiary },
    achRule: { fontSize: CompassType.caption.size, color: c.textSecondary, textAlign: 'center', marginTop: 2 },
    progWrap: { width: '100%', marginTop: CompassSpacing.s2 },
    progLabel: { fontSize: CompassType.caption.size, color: c.textSecondary, marginTop: 6, textAlign: 'center' },

    sectionLabel: { fontSize: CompassType.labelM.size, fontWeight: '600', color: c.textSecondary, marginBottom: CompassSpacing.s3 },
    emptyText: { fontSize: CompassType.bodyM.size, color: c.textSecondary, textAlign: 'center', paddingVertical: CompassSpacing.s5 },

    stateArea: { flex: 1, paddingHorizontal: CompassSpacing.gutterPhone, justifyContent: 'center' },
    stateHeading: { fontFamily: 'Syne_700Bold', fontSize: CompassType.h3.size, fontWeight: '700', color: c.textPrimary, textAlign: 'center', marginBottom: CompassSpacing.s2 },
    stateBody: { fontSize: CompassType.bodyM.size, color: c.textSecondary, textAlign: 'center', marginBottom: CompassSpacing.s5 },
    retryBtn: { alignSelf: 'center', height: 48, paddingHorizontal: CompassSpacing.s6, borderRadius: CompassRadius.btn, backgroundColor: c.actionPrimary, alignItems: 'center', justifyContent: 'center' },
    retryBtnPressed: { backgroundColor: c.actionPressed },
    retryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: CompassType.labelL.size },
    skel: { backgroundColor: c.bgSubtle, borderRadius: CompassRadius.card },
    skelHero: { height: 92 },
    skelCard: { height: 150 },
  });
}

export type AchievementsStyles = ReturnType<typeof makeStyles>;
