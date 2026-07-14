import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import {
  COMPASS_TOUCH_MIN,
  CompassRadius,
  CompassSpacing,
} from '../../constants/compassDesign';
import { textStyle } from '../compass/typography';

export interface PermissionPromptProps {
  visible: boolean;
  /** Leading glyph in the rounded icon tile. */
  icon?: string;
  title: string;
  /** The "why we need this" explanation shown before the OS prompt. */
  message: string;
  allowLabel?: string;
  onAllow: () => void;
  /** Optional non-blocking fallback (e.g. "Use text proof instead"). */
  fallbackLabel?: string;
  onFallback?: () => void;
  /** Reassurance line under the actions. */
  privacyNote?: string;
  onRequestClose?: () => void;
  testID?: string;
}

/**
 * Global permission pre-explanation pattern (mockup 45). A bottom sheet shown
 * *before* the OS permission dialog, explaining why access is needed and always
 * offering a fallback so a denial never dead-ends the flow. The same component
 * covers camera / photo-library / location. Kept motion-light and explicit —
 * it gates a real OS prompt, so clarity beats flourish.
 */
export function PermissionPrompt({
  visible,
  icon = '📸',
  title,
  message,
  allowLabel = 'Allow access',
  onAllow,
  fallbackLabel,
  onFallback,
  privacyNote,
  onRequestClose,
  testID,
}: PermissionPromptProps) {
  const { colors } = useCompassTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onRequestClose}
      testID={testID}
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        <Pressable
          testID="permission-scrim"
          style={styles.scrim}
          importantForAccessibility="no"
          accessibilityElementsHidden
          onPress={onRequestClose}
        />
        <View
          style={[styles.sheet, { backgroundColor: colors.bgSurface }]}
          accessibilityViewIsModal
          accessibilityRole="alert"
        >
          <View style={[styles.grip, { backgroundColor: colors.borderDefault }]} />
          <View
            style={[styles.iconTile, { backgroundColor: colors.actionPrimary }]}
            importantForAccessibility="no"
            accessibilityElementsHidden
          >
            <Text style={styles.icon}>{icon}</Text>
          </View>
          <Text
            accessibilityRole="header"
            style={[textStyle('h2'), styles.title, { color: colors.textPrimary }]}
          >
            {title}
          </Text>
          <Text style={[textStyle('bodyM'), styles.why, { color: colors.textSecondary }]}>
            {message}
          </Text>
          <View style={styles.actions}>
            <Pressable
              onPress={onAllow}
              accessibilityRole="button"
              accessibilityLabel={allowLabel}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: colors.actionPrimary },
                pressed ? { backgroundColor: colors.actionPressed } : null,
              ]}
            >
              <Text style={[textStyle('labelL'), styles.primaryText]}>{allowLabel}</Text>
            </Pressable>
            {fallbackLabel && onFallback ? (
              <Pressable
                onPress={onFallback}
                accessibilityRole="button"
                accessibilityLabel={fallbackLabel}
                style={({ pressed }) => [
                  styles.tertiaryBtn,
                  pressed ? { opacity: 0.6 } : null,
                ]}
              >
                <Text style={[textStyle('labelL'), { color: colors.actionPrimary }]}>
                  {fallbackLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>
          {privacyNote ? (
            <Text style={[textStyle('bodyS'), styles.privacy, { color: colors.textTertiary }]}>
              {`🔒 ${privacyNote}`}
            </Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
    backgroundColor: 'rgba(23,21,39,0.55)',
  },
  sheet: {
    borderTopLeftRadius: CompassRadius.sheet,
    borderTopRightRadius: CompassRadius.sheet,
    paddingHorizontal: CompassSpacing.gutterPhone,
    paddingTop: CompassSpacing.s4,
    paddingBottom: CompassSpacing.s7,
    gap: CompassSpacing.s3,
    alignItems: 'center',
  },
  grip: {
    width: 40,
    height: 4,
    borderRadius: CompassRadius.pill,
    marginBottom: CompassSpacing.s2,
  },
  iconTile: {
    width: 64,
    height: 64,
    borderRadius: CompassRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 30,
  },
  title: {
    textAlign: 'center',
  },
  why: {
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: CompassSpacing.s2,
    marginTop: CompassSpacing.s2,
  },
  primaryBtn: {
    minHeight: COMPASS_TOUCH_MIN + 4,
    borderRadius: CompassRadius.btn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  tertiaryBtn: {
    minHeight: COMPASS_TOUCH_MIN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacy: {
    textAlign: 'center',
  },
});
