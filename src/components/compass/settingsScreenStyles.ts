import { StyleSheet } from 'react-native';
import type { CompassPalette } from '../../constants/compassDesign';
import { COMPASS_TOUCH_MIN, CompassRadius, CompassSpacing } from '../../constants/compassDesign';

/**
 * Shared theme-aware layout scaffolding for the Compass settings-family screens
 * (Settings, Account & security, Appearance, Notifications). Keeps the canvas,
 * scroll padding, group spacing and the common secondary/destructive buttons
 * consistent across all four without each redefining the same values.
 */
export function createSettingsScreenStyles(colors: CompassPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgCanvas },
    scroll: { flex: 1 },
    content: {
      paddingHorizontal: CompassSpacing.gutterPhone,
      paddingTop: CompassSpacing.s2,
      paddingBottom: CompassSpacing.s9,
      gap: CompassSpacing.s5,
    },
    note: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: CompassSpacing.s2,
    },
    noteText: { flex: 1, color: colors.textSecondary },
    caption: { color: colors.textTertiary },
    secondaryBtn: {
      minHeight: COMPASS_TOUCH_MIN + 4,
      borderRadius: CompassRadius.btn,
      backgroundColor: colors.bgSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: CompassSpacing.s6,
    },
    secondaryBtnText: { color: colors.actionPrimary, fontWeight: '600', fontSize: 16 },
    destructiveBtn: {
      minHeight: COMPASS_TOUCH_MIN + 4,
      borderRadius: CompassRadius.btn,
      backgroundColor: 'rgba(201,61,75,0.10)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    destructiveBtnText: { color: colors.statusError, fontWeight: '600', fontSize: 16 },
    appMeta: {
      textAlign: 'center',
      color: colors.textTertiary,
      paddingVertical: CompassSpacing.s2,
    },
  });
}
