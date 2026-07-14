import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import {
  COMPASS_TOUCH_MIN,
  CompassRadius,
  CompassSpacing,
} from '../../constants/compassDesign';
import { textStyle } from '../compass/typography';

export interface EmptyStateProps {
  /** Large decorative glyph shown in the illustration circle. */
  icon?: string;
  title: string;
  /** One supporting sentence. */
  description?: string;
  /** Primary action label. When omitted, no button renders (e.g. empty
   * notifications: "quiet bell, no CTA" per the mockup notes). */
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

/**
 * Global empty pattern (mockup 42): one illustration, one sentence, one action.
 * Reusable across "no saved quests", "no history", "no notifications", etc.
 * The whole block is grouped so a screen reader reads title + description as a
 * single announcement, with the action exposed as its own button.
 */
export function EmptyState({
  icon = '🧭',
  title,
  description,
  actionLabel,
  onAction,
  testID,
}: EmptyStateProps) {
  const { colors } = useCompassTheme();

  return (
    <View style={styles.wrap} testID={testID}>
      <View
        style={[styles.illustration, { backgroundColor: colors.bgSubtle }]}
        importantForAccessibility="no"
        accessibilityElementsHidden
      >
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={description ? `${title}. ${description}` : title}
      >
        <Text style={[textStyle('h2'), styles.title, { color: colors.textPrimary }]}>
          {title}
        </Text>
        {description ? (
          <Text
            style={[textStyle('bodyM'), styles.description, { color: colors.textSecondary }]}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.actionPrimary },
            pressed ? { backgroundColor: colors.actionPressed } : null,
          ]}
        >
          <Text style={[textStyle('labelL'), styles.buttonText]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    paddingHorizontal: CompassSpacing.gutterPhone,
    paddingVertical: CompassSpacing.s9,
    gap: CompassSpacing.s4,
  },
  illustration: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 40,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginTop: CompassSpacing.s2,
    maxWidth: 280,
  },
  button: {
    minHeight: COMPASS_TOUCH_MIN,
    borderRadius: CompassRadius.btn,
    paddingHorizontal: CompassSpacing.s6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  buttonText: {
    color: '#FFFFFF',
  },
});
