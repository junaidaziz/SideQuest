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
    overflow: 'hidden',
  },
  track: {
    flex: 1,
    flexDirection: 'row',
  },
  step: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.base,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xxxl,
  },
  progressSeg: {
    height: 4,
    borderRadius: 2,
    flex: 1,
    backgroundColor: Colors.border,
  },
  progressSegDone: {
    backgroundColor: Colors.primary,
    opacity: 0.45,
  },
  progressSegActive: {
    backgroundColor: Colors.primary,
  },
  progressLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  heading: {
    fontFamily: Fonts.displayExtraBold,
    fontSize: FontSize.h1,
    lineHeight: LineHeight.h1,
    color: Colors.ink,
    letterSpacing: -0.6,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.body,
    lineHeight: LineHeight.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  options: {
    gap: Spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.card,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  optionPressed: {
    backgroundColor: Colors.surfaceMuted,
    borderColor: Colors.primary,
  },
  optionEmoji: {
    fontSize: 21,
    width: 30,
    textAlign: 'center',
  },
  optionLabel: {
    flex: 1,
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.cardLabel,
    lineHeight: LineHeight.cardLabel,
    color: Colors.ink,
  },
  optionLabelSelected: {
    color: Colors.white,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: {
    borderColor: Colors.onPrimaryBorder,
    backgroundColor: Colors.onPrimaryFill,
  },
  checkMark: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  ctaArea: {
    paddingTop: Spacing.base,
  },
  nextButton: {
    height: 54,
    borderRadius: Radius.btn,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  nextButtonPressed: {
    backgroundColor: Colors.primaryDark,
  },
  nextButtonDisabled: {
    backgroundColor: Colors.border,
  },
  nextButtonLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.button,
    color: Colors.white,
    letterSpacing: 0.2,
  },
  nextButtonLabelDisabled: {
    color: Colors.textSecondary,
  },
  nextButtonArrow: {
    fontSize: FontSize.button,
    color: Colors.white,
  },
  loading: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.huge,
  },
  orb: {
    width: 80,
    height: 80,
    borderRadius: Radius.sheet,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  orbEmoji: {
    fontSize: 36,
  },
  loadingHeading: {
    fontFamily: Fonts.displayExtraBold,
    fontSize: FontSize.h2,
    color: Colors.ink,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: Spacing.sm,
  },
  loadingBody: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  chip: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
  },
  chipLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.caption,
    color: Colors.primary,
  },
});
