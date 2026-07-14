import { StyleSheet } from 'react-native';
import {
  CompassRadius,
  CompassSpacing,
  CompassType,
  type CompassPalette,
} from '../../constants/compassDesign';

/** Theme-aware styles for the achievement detail screen (mockup 23). */
export function makeStyles(c: CompassPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bgCanvas },
    topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: CompassSpacing.s3, paddingVertical: CompassSpacing.s2 },
    backBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    backBtnPressed: { opacity: 0.5 },
    backGlyph: { fontSize: 26, color: c.textPrimary },
    title: { flex: 1 },
    shareBtn: { width: 48, height: 48, borderRadius: CompassRadius.pill, backgroundColor: c.bgSubtle, alignItems: 'center', justifyContent: 'center' },
    shareBtnPressed: { backgroundColor: c.borderDefault },
    shareGlyph: { fontSize: 18, color: c.actionPrimary },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: CompassSpacing.gutterPhone, paddingBottom: CompassSpacing.s9, gap: CompassSpacing.s5 },

    hero: { alignItems: 'center', paddingTop: CompassSpacing.s4 },
    bigBadge: { width: 128, height: 128, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: CompassSpacing.s4 },
    bigBadgeLocked: { opacity: 0.5 },
    bigBadgeGlyph: { fontSize: 56 },
    name: { fontFamily: 'Syne_800ExtraBold', fontSize: CompassType.h1.size, fontWeight: '800', color: c.textPrimary, textAlign: 'center' },
    desc: { fontSize: CompassType.bodyM.size, lineHeight: CompassType.bodyM.lineHeight, color: c.textSecondary, textAlign: 'center', marginTop: 6, maxWidth: 320 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: CompassSpacing.s2, marginTop: CompassSpacing.s3 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: CompassRadius.pill },
    statusEarned: { backgroundColor: `${c.statusSuccess}1F` },
    statusLocked: { backgroundColor: c.bgSubtle },
    statusText: { fontSize: 12, fontWeight: '700' },
    statusTextEarned: { color: c.statusSuccess },
    statusTextLocked: { color: c.textSecondary },

    card: { backgroundColor: c.bgSurface, borderRadius: CompassRadius.card, padding: CompassSpacing.s4, borderWidth: 1, borderColor: c.borderDefault },
    ruleRow: { flexDirection: 'row', gap: CompassSpacing.s3, alignItems: 'flex-start' },
    ruleIcon: { fontSize: 20 },
    ruleTitle: { fontSize: CompassType.labelM.size, fontWeight: '600', color: c.textPrimary, marginBottom: 2 },
    ruleBody: { fontSize: CompassType.bodyS.size, lineHeight: CompassType.bodyS.lineHeight, color: c.textSecondary },

    progHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: CompassSpacing.s3 },
    progLabel: { fontSize: CompassType.labelL.size, fontWeight: '600', color: c.textPrimary },
    progSub: { fontSize: CompassType.caption.size, color: c.textSecondary, marginTop: 1 },

    sharePreview: {
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: c.borderDefault,
      borderRadius: CompassRadius.card,
      padding: CompassSpacing.s4,
      alignItems: 'center',
      backgroundColor: c.bgSubtle,
    },
    shareMini: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: CompassSpacing.s2 },
    shareMiniGlyph: { fontSize: 22 },
    shareTitle: { fontSize: CompassType.labelL.size, fontWeight: '600', color: c.textPrimary, textAlign: 'center' },
    shareTagline: { fontSize: CompassType.caption.size, color: c.textSecondary, marginTop: 2 },
    shareCta: { height: 52, borderRadius: CompassRadius.btn, backgroundColor: c.bgSubtle, alignItems: 'center', justifyContent: 'center', marginTop: CompassSpacing.s3 },
    shareCtaPressed: { backgroundColor: c.borderDefault },
    shareCtaText: { color: c.actionPrimary, fontWeight: '600', fontSize: CompassType.labelL.size },
    sectionLabel: { fontSize: CompassType.labelM.size, fontWeight: '600', color: c.textSecondary, marginBottom: CompassSpacing.s3 },

    stateArea: { flex: 1, paddingHorizontal: CompassSpacing.gutterPhone, justifyContent: 'center' },
    stateHeading: { fontFamily: 'Syne_700Bold', fontSize: CompassType.h3.size, fontWeight: '700', color: c.textPrimary, textAlign: 'center', marginBottom: CompassSpacing.s2 },
    stateBody: { fontSize: CompassType.bodyM.size, color: c.textSecondary, textAlign: 'center', marginBottom: CompassSpacing.s5 },
    retryBtn: { alignSelf: 'center', height: 48, paddingHorizontal: CompassSpacing.s6, borderRadius: CompassRadius.btn, backgroundColor: c.actionPrimary, alignItems: 'center', justifyContent: 'center' },
    retryBtnPressed: { backgroundColor: c.actionPressed },
    retryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: CompassType.labelL.size },
    skel: { backgroundColor: c.bgSubtle, borderRadius: CompassRadius.card },
    skelHero: { height: 200 },
    skelCard: { height: 90 },
  });
}

export type AchievementDetailStyles = ReturnType<typeof makeStyles>;
