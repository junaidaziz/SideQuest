import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import {
  COMPASS_TOUCH_MIN,
  CompassRadius,
  CompassSpacing,
} from '../../constants/compassDesign';
import { textStyle } from '../compass/typography';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  /** Primary retry action. */
  onRetry?: () => void;
  retryLabel?: string;
  /** Optional secondary action (e.g. "Back to Today"). */
  onSecondary?: () => void;
  secondaryLabel?: string;
  /** Support reference shown under an expandable "Details" row, copyable. */
  errorReference?: string;
  icon?: string;
  testID?: string;
}

/**
 * Global error pattern (mockup 43). Copy says what happened, reassures that
 * saved data is safe, and offers a clear retry. A support reference can be
 * revealed and copied to the clipboard for a bug report. Presentational only —
 * `onRetry` is wired to a real refetch by the host screen.
 */
export function ErrorState({
  title = "This trail's washed out",
  description = "We couldn't load this right now. Nothing you've saved was lost — let's try that path again.",
  onRetry,
  retryLabel = 'Try again',
  onSecondary,
  secondaryLabel,
  errorReference,
  icon = '🧭',
  testID,
}: ErrorStateProps) {
  const { colors } = useCompassTheme();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!errorReference) return;
    await Clipboard.setStringAsync(errorReference);
    setCopied(true);
  };

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
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${title}. ${description}`}
      >
        <Text style={[textStyle('h2'), styles.center, { color: colors.textPrimary }]}>
          {title}
        </Text>
        <Text
          style={[textStyle('bodyM'), styles.description, { color: colors.textSecondary }]}
        >
          {description}
        </Text>
      </View>

      <View style={styles.actions}>
        {onRetry ? (
          <Pressable
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel={retryLabel}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: colors.actionPrimary },
              pressed ? { backgroundColor: colors.actionPressed } : null,
            ]}
          >
            <Text style={[textStyle('labelL'), styles.primaryText]}>{retryLabel}</Text>
          </Pressable>
        ) : null}
        {onSecondary && secondaryLabel ? (
          <Pressable
            onPress={onSecondary}
            accessibilityRole="button"
            accessibilityLabel={secondaryLabel}
            style={({ pressed }) => [styles.tertiaryBtn, pressed ? { opacity: 0.6 } : null]}
          >
            <Text style={[textStyle('labelL'), { color: colors.actionPrimary }]}>
              {secondaryLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {errorReference ? (
        <View style={styles.details}>
          <Pressable
            onPress={() => setDetailsOpen((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="Show error details"
            accessibilityState={{ expanded: detailsOpen }}
            style={styles.detailsSummary}
          >
            <Text style={[textStyle('bodyS'), { color: colors.textSecondary }]}>
              Details
            </Text>
          </Pressable>
          {detailsOpen ? (
            <View style={[styles.idRow, { backgroundColor: colors.bgSubtle }]}>
              <Text style={[styles.code, { color: colors.textSecondary }]}>
                {errorReference}
              </Text>
              <Pressable
                onPress={handleCopy}
                accessibilityRole="button"
                accessibilityLabel="Copy error reference"
              >
                <Text style={[textStyle('labelM'), { color: colors.actionPrimary }]}>
                  {copied ? 'Copied' : 'Copy'}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: CompassSpacing.gutterPhone,
    paddingVertical: CompassSpacing.s6,
    gap: CompassSpacing.s4,
  },
  illustration: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 40 },
  center: { textAlign: 'center' },
  description: {
    textAlign: 'center',
    marginTop: CompassSpacing.s2,
    maxWidth: 290,
  },
  actions: {
    width: '100%',
    maxWidth: 300,
    gap: CompassSpacing.s2,
  },
  primaryBtn: {
    minHeight: COMPASS_TOUCH_MIN,
    borderRadius: CompassRadius.btn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#FFFFFF' },
  tertiaryBtn: {
    minHeight: COMPASS_TOUCH_MIN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    width: '100%',
    maxWidth: 300,
  },
  detailsSummary: {
    alignItems: 'center',
    paddingVertical: CompassSpacing.s2,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: CompassRadius.sm,
    paddingVertical: CompassSpacing.s2,
    paddingHorizontal: CompassSpacing.s3,
    marginTop: CompassSpacing.s2,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});
