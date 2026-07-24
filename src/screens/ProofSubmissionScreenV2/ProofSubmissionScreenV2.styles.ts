import { StyleSheet } from 'react-native';
import { CompassRadius, CompassSpacing, type CompassPalette } from '../../constants/compassDesign';

/**
 * Intentional theme-invariant exceptions: the remove-photo control floats over
 * an arbitrary user photo, not a themed surface, so its scrim + glyph must stay
 * fixed and legible in both light and dark. Named here (rather than left as a
 * bare hex in the stylesheet) so they read as a deliberate exception, not a
 * missed token.
 */
const PHOTO_OVERLAY_SCRIM = 'rgba(0,0,0,0.55)' as const;
const PHOTO_OVERLAY_GLYPH_COLOR = '#FFFFFF' as const;

export function makeStyles(c: CompassPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bgCanvas },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: CompassSpacing.s2,
      paddingTop: CompassSpacing.s2,
      gap: CompassSpacing.s2,
    },
    iconBtn: { width: 48, height: 48, borderRadius: CompassRadius.pill, alignItems: 'center', justifyContent: 'center' },
    iconGlyph: { fontSize: 20, color: c.textPrimary },
    topTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: c.textPrimary, letterSpacing: -0.18 },
    scroll: { flex: 1 },
    body: { paddingHorizontal: CompassSpacing.gutterPhone, paddingTop: CompassSpacing.s4, gap: CompassSpacing.s5, paddingBottom: CompassSpacing.s7 },
    heading: { fontSize: 22, fontWeight: '700', color: c.textPrimary, letterSpacing: -0.22, marginBottom: 6 },
    subhead: { fontSize: 15, color: c.textSecondary },
    reqBanner: {
      flexDirection: 'row',
      gap: 10,
      backgroundColor: c.bgSubtle,
      borderRadius: CompassRadius.md,
      paddingVertical: CompassSpacing.s3,
      paddingHorizontal: CompassSpacing.s4,
    },
    reqText: { fontSize: 14, lineHeight: 20, color: c.textPrimary, flex: 1 },
    segmented: { flexDirection: 'row', backgroundColor: c.bgSubtle, borderRadius: CompassRadius.md, padding: 4, gap: 4 },
    seg: { flex: 1, height: 48, borderRadius: CompassRadius.sm, alignItems: 'center', justifyContent: 'center' },
    // Selected segment = surface pill lifted on shadow-1 (design § 5 segmented).
    segActive: {
      backgroundColor: c.bgSurface,
      shadowColor: c.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 2,
    },
    segText: { fontSize: 14, fontWeight: '600', color: c.textSecondary },
    segTextActive: { color: c.textPrimary },
    // Single-slot layout (MAX_PHOTOS = 1, see the screen component). A square
    // ratio (not the old grid's 4:3) keeps this from dominating the form —
    // the box kept its old full-width-landscape sizing from a 3-photo grid
    // after the slot count dropped to 1, leaving a large near-empty area.
    photoGrid: { gap: CompassSpacing.s2 },
    photoTile: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: CompassRadius.md,
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: c.bgSubtle,
    },
    photoImage: { width: '100%', height: '100%' },
    // See PHOTO_OVERLAY_* above — intentional theme-invariant photo overlay.
    removeBtn: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: PHOTO_OVERLAY_SCRIM,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeGlyph: { color: PHOTO_OVERLAY_GLYPH_COLOR, fontSize: 13 },
    addTile: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: CompassRadius.md,
      borderWidth: 2,
      borderColor: c.borderDefault,
      borderStyle: 'dashed',
      backgroundColor: c.bgSurface,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    addIcon: { fontSize: 28, color: c.actionPrimary },
    addLabel: { fontSize: 14, fontWeight: '600', color: c.actionPrimary },
    textInput: {
      minHeight: 120,
      borderWidth: 1.5,
      borderColor: c.borderDefault,
      borderRadius: CompassRadius.md,
      backgroundColor: c.bgSurface,
      padding: CompassSpacing.s4,
      fontSize: 17,
      color: c.textPrimary,
      textAlignVertical: 'top',
    },
    charCount: { fontSize: 12, color: c.textSecondary, textAlign: 'right' },
    tip: {
      flexDirection: 'row',
      gap: 10,
      backgroundColor: c.xpTint,
      borderRadius: CompassRadius.md,
      padding: CompassSpacing.s3,
    },
    tipText: { fontSize: 13, lineHeight: 19, color: c.textPrimary, flex: 1 },
    tipBold: { fontWeight: '700' },
    errorText: { color: c.statusError, fontSize: 14, fontWeight: '600', textAlign: 'center' },
    stickyCta: {
      paddingHorizontal: CompassSpacing.gutterPhone,
      paddingTop: CompassSpacing.s3,
      paddingBottom: CompassSpacing.s4,
      gap: CompassSpacing.s2,
      backgroundColor: c.bgCanvas,
      borderTopWidth: 1,
      borderTopColor: c.borderDefault,
    },
    primaryBtn: { height: 52, borderRadius: CompassRadius.btn, backgroundColor: c.actionPrimary, alignItems: 'center', justifyContent: 'center' },
    primaryBtnDisabled: { opacity: 0.45 },
    primaryBtnText: { color: c.onPrimary, fontWeight: '600', fontSize: 16 },
    draftNote: { textAlign: 'center', fontSize: 12, color: c.textTertiary },
  });
}
