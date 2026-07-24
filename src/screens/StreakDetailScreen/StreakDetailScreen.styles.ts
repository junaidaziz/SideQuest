import { StyleSheet } from 'react-native';
import {
  CompassFonts,
  CompassRadius,
  CompassSpacing,
  CompassType,
  type CompassPalette,
} from '../../constants/compassDesign';

/** Theme-aware styles for the streak detail screen (mockup 25). */
export function makeStyles(c: CompassPalette) {
  // Shadow-first elevation (design § 3, `--shadow-1`) — see XpDetailScreen note.
  const shadow1 = {
    shadowColor: c.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
  } as const;
  // Ember glow (design § 5.2 `--shadow-glow`) tinted with the Streak identity —
  // the mockup's ember-hero glow, theme-resolved so dark mode gets its lighter
  // Streak hue. Android ignores shadowColor and uses `elevation`.
  const streakGlow = {
    shadowColor: c.streak,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 6,
  } as const;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bgCanvas },
    topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: CompassSpacing.s3, paddingVertical: CompassSpacing.s2 },
    backBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    backBtnPressed: { opacity: 0.5 },
    title: { flex: 1, textAlign: 'center', fontFamily: CompassFonts.fallbackHeavy, fontSize: CompassType.h2.size, fontWeight: '800', color: c.textPrimary },
    headerSpacer: { width: 48 },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: CompassSpacing.gutterPhone, paddingBottom: CompassSpacing.s9, gap: CompassSpacing.s5 },
    flex1: { flex: 1 },

    // Streak-identity tint well with an ember glow. A full-saturation ember
    // background would fail AA for the hero number (white ~3.05:1); the curated
    // `streakTint`/`streakText` pair is computed-AA (4.9:1 light) — the same
    // discipline the design doc uses for its "dark ink on the vivid gradient".
    hero: { borderRadius: CompassRadius.hero, padding: CompassSpacing.s6, backgroundColor: c.streakTint, alignItems: 'center', ...streakGlow },
    heroNum: { fontFamily: CompassFonts.numeric, fontWeight: '800', fontSize: 52, color: c.streakText, letterSpacing: -0.78, marginVertical: 4 },
    heroSub: { fontSize: 15, color: c.streakText, textAlign: 'center' },

    twin: { flexDirection: 'row', gap: CompassSpacing.s3 },
    metricCard: { flex: 1, backgroundColor: c.bgSurface, borderRadius: CompassRadius.card, padding: CompassSpacing.s4, borderWidth: 1, borderColor: c.borderSubtle, alignItems: 'center', ...shadow1 },
    metricNum: { fontFamily: CompassFonts.numeric, fontWeight: '800', fontSize: 28, color: c.textPrimary },
    metricCap: { fontSize: CompassType.caption.size, color: c.textSecondary, marginTop: 2 },

    card: { backgroundColor: c.bgSurface, borderRadius: CompassRadius.card, padding: CompassSpacing.s4, borderWidth: 1, borderColor: c.borderSubtle, ...shadow1 },
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
    dayCellToday: { borderWidth: 2, borderColor: c.streak },

    ruleRow: { flexDirection: 'row', gap: CompassSpacing.s3, paddingVertical: CompassSpacing.s2 },
    ruleIcon: { fontSize: 16 },
    ruleBody: { flex: 1, fontSize: CompassType.bodyS.size, lineHeight: CompassType.bodyS.lineHeight, color: c.textSecondary },

    cta: { height: 52, borderRadius: CompassRadius.btn, backgroundColor: c.actionPrimary, alignItems: 'center', justifyContent: 'center' },
    ctaPressed: { backgroundColor: c.actionPressed },
    ctaText: { color: c.onPrimary, fontWeight: '600', fontSize: CompassType.labelL.size },

    stateArea: { flex: 1, paddingHorizontal: CompassSpacing.gutterPhone, justifyContent: 'center' },
    stateHeading: { fontFamily: CompassFonts.fallbackBold, fontSize: CompassType.h3.size, fontWeight: '700', color: c.textPrimary, textAlign: 'center', marginBottom: CompassSpacing.s2 },
    stateBody: { fontSize: CompassType.bodyM.size, color: c.textSecondary, textAlign: 'center', marginBottom: CompassSpacing.s5 },
    retryBtn: { alignSelf: 'center', height: 48, paddingHorizontal: CompassSpacing.s6, borderRadius: CompassRadius.btn, backgroundColor: c.actionPrimary, alignItems: 'center', justifyContent: 'center' },
    retryBtnPressed: { backgroundColor: c.actionPressed },
    retryBtnText: { color: c.onPrimary, fontWeight: '600', fontSize: CompassType.labelL.size },
    skel: { backgroundColor: c.bgSubtle, borderRadius: CompassRadius.card },
    skelHero: { height: 170 },
    skelCard: { height: 80 },
    skeletonWrap: { paddingHorizontal: CompassSpacing.gutterPhone, paddingTop: CompassSpacing.s2, gap: CompassSpacing.s5 },
  });
}

export type StreakDetailStyles = ReturnType<typeof makeStyles>;
