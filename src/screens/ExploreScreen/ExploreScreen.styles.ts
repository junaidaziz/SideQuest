import { StyleSheet } from 'react-native';
import { CompassRadius, CompassSpacing, type CompassPalette } from '../../constants/compassDesign';

/** Theme-independent statics (no palette needed) — kept out of the per-theme
 * `makeStyles` so they aren't rebuilt on every theme change. */
export const exploreStatics = StyleSheet.create({
  pressableInner: { flex: 1 },
});

export function makeStyles(c: CompassPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bgCanvas },
    topBar: {
      paddingHorizontal: CompassSpacing.gutterPhone,
      paddingTop: CompassSpacing.s4,
      paddingBottom: CompassSpacing.s3,
    },
    title: { fontSize: 22, lineHeight: 28, fontWeight: '700', color: c.textPrimary, letterSpacing: -0.22 },
    scroll: { flex: 1 },
    content: {
      paddingHorizontal: CompassSpacing.gutterPhone,
      paddingBottom: CompassSpacing.s9,
      gap: CompassSpacing.s6,
    },
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: CompassSpacing.s2,
      height: 48,
      backgroundColor: c.bgSurface,
      borderWidth: 1.5,
      borderColor: c.borderDefault,
      borderRadius: CompassRadius.pill,
      paddingHorizontal: CompassSpacing.s4,
    },
    searchText: { color: c.textTertiary, fontSize: 15 },
    ctxSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: CompassSpacing.s3,
      backgroundColor: c.bgSubtle,
      borderRadius: CompassRadius.card,
      paddingVertical: CompassSpacing.s3,
      paddingHorizontal: CompassSpacing.s4,
    },
    ctxText: { fontSize: 14, color: c.textSecondary, flex: 1 },
    ctxBold: { fontWeight: '600', color: c.textPrimary },
    link: { color: c.actionPrimary, fontWeight: '600', fontSize: 14 },
    sectionHead: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: CompassSpacing.s3,
    },
    h3: { fontSize: 18, lineHeight: 24, fontWeight: '600', color: c.textPrimary },
    modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: CompassSpacing.s3 },
    // Sizing lives on the outer (actual flex-item) wrapper; modeTileFill below
    // is the LinearGradient's own style and must not repeat the percentage
    // width — nesting the same percentage twice inside an unsized animated
    // wrapper collapsed the tiles to slivers (width resolving against an
    // undefined parent width).
    modeTile: {
      width: '47.5%',
      flexGrow: 1,
      borderRadius: CompassRadius.card,
      overflow: 'hidden',
    },
    modeTileFill: {
      flex: 1,
      padding: CompassSpacing.s4,
      minHeight: 92,
      gap: 6,
    },
    modeIcon: { fontSize: 22 },
    // Colour is applied inline from the tile's identity-text token (design § 5),
    // so the label stays AA on its identity tint in both themes.
    modeName: { fontFamily: undefined, fontWeight: '700', fontSize: 16, letterSpacing: -0.24 },
    hScroll: { gap: CompassSpacing.s3, paddingBottom: 4 },
    miniCard: {
      width: 200,
      backgroundColor: c.bgSurface,
      borderRadius: CompassRadius.card,
      overflow: 'hidden',
    },
    miniArt: { height: 96, alignItems: 'center', justifyContent: 'center' },
    miniArtGlyph: { fontSize: 34 },
    miniBody: { padding: CompassSpacing.s3 },
    miniTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary, letterSpacing: -0.22 },
    miniMeta: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
    chip: {
      paddingHorizontal: CompassSpacing.s3,
      paddingVertical: 6,
      borderRadius: CompassRadius.pill,
      backgroundColor: c.bgSubtle,
    },
    chipText: { fontSize: 13, fontWeight: '600', color: c.textSecondary },
    xpBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: CompassRadius.pill,
      backgroundColor: c.xpTint,
    },
    xpBadgeText: { fontSize: 12, fontWeight: '700', color: c.xpText },
    savedLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: CompassSpacing.s3,
      backgroundColor: c.bgSurface,
      borderRadius: CompassRadius.card,
      padding: CompassSpacing.s4,
    },
    savedIcon: {
      width: 44,
      height: 44,
      borderRadius: CompassRadius.md,
      backgroundColor: `${c.actionPrimary}1F`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    savedBody: { flex: 1 },
    savedTitle: { fontSize: 16, fontWeight: '600', color: c.textPrimary },
    caption: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    // States
    stateArea: { flex: 1, justifyContent: 'center', paddingHorizontal: CompassSpacing.gutterPhone },
    skeletonWrap: { gap: CompassSpacing.s4 },
    skel: { backgroundColor: c.bgSubtle, borderRadius: CompassRadius.card },
    skelSearch: { height: 48, borderRadius: CompassRadius.pill },
    skelGrid: { height: 200 },
    skelRow: { height: 140 },
    stateTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: c.textPrimary,
      textAlign: 'center',
      marginBottom: CompassSpacing.s2,
    },
    stateBody: { fontSize: 14, color: c.textSecondary, textAlign: 'center', marginBottom: CompassSpacing.s5 },
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
    retryBtnText: { color: c.onPrimary, fontWeight: '600', fontSize: 16 },
  });
}
