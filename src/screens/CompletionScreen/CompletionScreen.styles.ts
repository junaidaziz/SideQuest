import { StyleSheet } from 'react-native';
import {
  Colors,
  Fonts,
  FontSize,
  LineHeight,
  Radius,
  Spacing,
} from '../../constants/design';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  // No backgroundColor — CompletionScreen.tsx renders this as a LinearGradient
  // (primary → primaryDark), not a plain View.
  hero: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxxl,
    alignItems: 'center',
  },
  trophy: {
    width: 84,
    height: 84,
    borderRadius: Radius.sheet,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  trophyGlyph: {
    fontSize: 40,
  },
  heroEyebrow: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1,
    // Colors.onPrimaryBorder (40% white) fails WCAG AA contrast on this
    // background — full white at this weight/size stays legible on Colors.primary.
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  heroTitle: {
    fontFamily: Fonts.displayExtraBold,
    fontSize: 28,
    color: Colors.white,
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  heroSub: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.body,
    color: Colors.white,
    textAlign: 'center',
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.base,
    backgroundColor: Colors.onPrimaryFill,
    borderWidth: 1,
    borderColor: Colors.onPrimaryBorder,
    borderRadius: 20,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  xpLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.caption,
    color: Colors.white,
  },
  xpValue: {
    fontFamily: Fonts.displayExtraBold,
    fontSize: FontSize.h2,
    color: Colors.accent,
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: Spacing.lg,
    gap: Spacing.base,
  },
  card: {
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    borderRadius: Radius.card,
    padding: Spacing.lg,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  cardBadge: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: 20,
    backgroundColor: Colors.primary,
  },
  cardBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.3,
    color: Colors.white,
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnPressed: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  shareGlyph: {
    fontSize: 16,
  },
  cardMissionName: {
    fontFamily: Fonts.displayExtraBold,
    fontSize: 18,
    color: Colors.ink,
    letterSpacing: -0.3,
    marginBottom: Spacing.xs,
  },
  cardCompletedAt: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  cardStatsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cardStat: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
  },
  cardStatValue: {
    fontFamily: Fonts.displayExtraBold,
    fontSize: 18,
    color: Colors.ink,
    marginBottom: 3,
  },
  cardStatAccent: {
    color: Colors.accentDark,
  },
  cardStatLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 0.5,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.accentLight,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    borderRadius: Radius.card,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  streakIcon: {
    fontSize: 28,
  },
  streakInfo: {
    flex: 1,
  },
  streakValue: {
    fontFamily: Fonts.displayExtraBold,
    fontSize: 20,
    color: Colors.accentDark,
    marginBottom: 2,
  },
  streakLabel: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
  },
  sectionHeading: {
    fontFamily: Fonts.displayBold,
    fontSize: FontSize.cardLabel,
    color: Colors.ink,
    letterSpacing: -0.2,
    marginBottom: Spacing.xs,
  },
  challengePrompt: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.body,
    lineHeight: LineHeight.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  challengeBtn: {
    borderRadius: Radius.btn,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeBtnPressed: {
    backgroundColor: Colors.primary,
  },
  challengeBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.body,
    color: Colors.primary,
  },
  // Applied only while pressed — challengeBtnPressed swaps the container
  // background to Colors.primary, so the label must flip to white or it's
  // unreadable against its own pressed background.
  challengeBtnTextPressed: {
    color: Colors.white,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  primaryBtn: {
    borderRadius: Radius.btn,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnPressed: {
    backgroundColor: Colors.primaryDark,
  },
  primaryBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.button,
    color: Colors.white,
  },
});
