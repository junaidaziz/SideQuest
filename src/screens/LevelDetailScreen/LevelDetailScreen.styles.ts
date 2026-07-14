import { StyleSheet } from 'react-native';
import {
  CompassRadius,
  CompassSpacing,
  CompassType,
  type CompassPalette,
} from '../../constants/compassDesign';

/** Theme-aware styles for the level detail screen (mockup 21). */
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

    hero: { borderRadius: CompassRadius.hero, padding: CompassSpacing.s6, backgroundColor: c.brandVioletDark, alignItems: 'center' },
    bigShield: {
      width: 96,
      height: 108,
      borderRadius: 26,
      backgroundColor: 'rgba(255,255,255,0.16)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: CompassSpacing.s3,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    bigShieldText: { fontFamily: 'Syne_800ExtraBold', fontWeight: '800', fontSize: 44, color: '#FFFFFF', letterSpacing: -0.66 },
    eyebrow: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: 0.5 },
    heroName: { fontFamily: 'Syne_800ExtraBold', fontWeight: '800', fontSize: 30, color: '#FFFFFF', letterSpacing: -0.45, marginVertical: 4 },
    heroBlurb: { fontSize: 14, color: 'rgba(255,255,255,0.92)', textAlign: 'center', marginBottom: CompassSpacing.s4 },
    heroXp: { fontSize: 12, color: 'rgba(255,255,255,0.92)', marginTop: 6 },
    heroBarWrap: { width: '100%' },

    card: { backgroundColor: c.bgSurface, borderRadius: CompassRadius.card, padding: CompassSpacing.s4, borderWidth: 1, borderColor: c.borderDefault },
    infoRow: { flexDirection: 'row', gap: CompassSpacing.s3 },
    infoIcon: { fontSize: 20 },
    infoBody: { flex: 1, fontSize: CompassType.bodyS.size, lineHeight: CompassType.bodyS.lineHeight, color: c.textSecondary },
    cardLabel: { fontSize: CompassType.labelL.size, fontWeight: '600', color: c.textPrimary, marginBottom: CompassSpacing.s2 },

    mapItem: { flexDirection: 'row', alignItems: 'center', gap: CompassSpacing.s3, paddingVertical: CompassSpacing.s2 },
    node: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    nodeText: { fontFamily: 'Syne_800ExtraBold', fontWeight: '800', fontSize: 16 },
    nodeDone: { backgroundColor: `${c.actionPrimary}24` },
    nodeDoneText: { color: c.actionPrimary },
    nodeCurrent: { backgroundColor: c.actionPrimary },
    nodeCurrentText: { color: '#FFFFFF' },
    nodeLocked: { backgroundColor: c.bgSubtle },
    nodeLockedText: { color: c.textTertiary },
    mapName: { fontSize: CompassType.labelM.size, fontWeight: '600', color: c.textPrimary },
    mapNameLocked: { color: c.textTertiary },
    mapMeta: { fontSize: CompassType.caption.size, color: c.textSecondary, marginTop: 1 },

    stateArea: { flex: 1, paddingHorizontal: CompassSpacing.gutterPhone, justifyContent: 'center' },
    stateHeading: { fontFamily: 'Syne_700Bold', fontSize: CompassType.h3.size, fontWeight: '700', color: c.textPrimary, textAlign: 'center', marginBottom: CompassSpacing.s2 },
    stateBody: { fontSize: CompassType.bodyM.size, color: c.textSecondary, textAlign: 'center', marginBottom: CompassSpacing.s5 },
    retryBtn: { alignSelf: 'center', height: 48, paddingHorizontal: CompassSpacing.s6, borderRadius: CompassRadius.btn, backgroundColor: c.actionPrimary, alignItems: 'center', justifyContent: 'center' },
    retryBtnPressed: { backgroundColor: c.actionPressed },
    retryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: CompassType.labelL.size },
    skel: { backgroundColor: c.bgSubtle, borderRadius: CompassRadius.card },
    skelHero: { height: 220 },
    skelCard: { height: 90 },
  });
}

export type LevelDetailStyles = ReturnType<typeof makeStyles>;
