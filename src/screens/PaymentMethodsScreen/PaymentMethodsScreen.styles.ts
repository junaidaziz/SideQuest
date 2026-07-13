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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.chip,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: {
    backgroundColor: Colors.surfaceMuted,
    borderColor: Colors.primary,
  },
  iconGlyph: {
    fontSize: 24,
    lineHeight: 26,
    color: Colors.ink,
  },
  headerTitle: {
    fontFamily: Fonts.displayBold,
    fontSize: 17,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.base,
  },
  intro: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.caption,
    lineHeight: LineHeight.caption,
    color: Colors.textSecondary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.base,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.card,
  },
  cardDefault: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceMuted,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.chip,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconGlyph: {
    fontSize: 20,
  },
  cardInfo: {
    flex: 1,
  },
  cardBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 3,
  },
  cardBrand: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.body,
    color: Colors.ink,
  },
  defaultBadge: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  cardExpiry: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  smallBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.chip,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBtnPressed: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  smallBtnDestructivePressed: {
    borderColor: Colors.error,
    backgroundColor: Colors.surfaceMuted,
  },
  smallBtnDisabled: {
    opacity: 0.5,
  },
  smallBtnGlyph: {
    fontSize: 16,
    color: Colors.primary,
  },
  smallBtnGlyphDestructive: {
    fontSize: 16,
    color: Colors.error,
  },
  addBtn: {
    borderRadius: Radius.btn,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  addBtnPressed: {
    backgroundColor: Colors.primaryDark,
  },
  addBtnDisabled: {
    opacity: 0.7,
  },
  addBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.button,
    color: Colors.white,
  },
  emptyWrap: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyGlyph: {
    fontSize: 40,
    marginBottom: Spacing.xs,
  },
  emptyTitle: {
    fontFamily: Fonts.displayBold,
    fontSize: FontSize.cardLabel,
    color: Colors.ink,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.caption,
    lineHeight: LineHeight.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  inlineError: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.card,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  errorHeading: {
    fontFamily: Fonts.displayBold,
    fontSize: FontSize.cardLabel,
    color: Colors.ink,
    textAlign: 'center',
  },
  errorBody: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.caption,
    lineHeight: LineHeight.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  fieldError: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.caption,
    lineHeight: LineHeight.caption,
    color: Colors.error,
  },
  retryBtn: {
    marginTop: Spacing.sm,
    borderRadius: Radius.btn,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  retryBtnPressed: {
    backgroundColor: Colors.primaryLight,
  },
  retryBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.body,
    color: Colors.primary,
  },
  skeletonWrap: {
    gap: Spacing.base,
  },
  skel: {
    backgroundColor: Colors.border,
    borderRadius: Radius.card,
    height: 76,
  },
});
