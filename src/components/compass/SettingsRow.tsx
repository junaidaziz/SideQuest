import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import {
  COMPASS_TOUCH_MIN,
  CompassRadius,
  CompassSpacing,
} from '../../constants/compassDesign';
import { textStyle } from './typography';

export interface SettingsRowProps {
  /** Leading glyph (emoji or symbol). Decorative — hidden from assistive tech. */
  icon?: string;
  label: string;
  sub?: string;
  /** Right-aligned value text, e.g. "Dark" on the Appearance row. */
  value?: string;
  /** Right-aligned custom accessory, e.g. a CompassToggle. Wins over `value`. */
  accessory?: ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  destructive?: boolean;
  disabled?: boolean;
  testID?: string;
  /** First row in a list omits its top divider. */
  isFirst?: boolean;
}

/**
 * A single grouped settings row. Renders as an accessible `button` when
 * `onPress` is supplied, otherwise as a static container that still exposes a
 * label to screen readers. The row never owns any toggle state — an accessory
 * (e.g. CompassToggle) is passed in fully controlled.
 */
export function SettingsRow({
  icon,
  label,
  sub,
  value,
  accessory,
  onPress,
  showChevron = false,
  accessibilityLabel,
  accessibilityHint,
  destructive = false,
  disabled = false,
  testID,
  isFirst = false,
}: SettingsRowProps) {
  const { colors } = useCompassTheme();
  const labelColor = destructive ? colors.statusError : colors.textPrimary;

  const inner = (
    <>
      {icon ? (
        <View
          style={[styles.iconWrap, { backgroundColor: colors.bgSubtle }]}
          importantForAccessibility="no"
          accessibilityElementsHidden
        >
          <Text style={styles.iconGlyph}>{icon}</Text>
        </View>
      ) : null}
      <View style={styles.body}>
        <Text style={[textStyle('labelL'), { color: labelColor }]} numberOfLines={1}>
          {label}
        </Text>
        {sub ? (
          <Text
            style={[textStyle('bodyS'), styles.sub, { color: colors.textSecondary }]}
          >
            {sub}
          </Text>
        ) : null}
      </View>
      {accessory ? (
        <View style={styles.accessory}>{accessory}</View>
      ) : value ? (
        <Text
          style={[textStyle('bodyM'), { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {value}
        </Text>
      ) : null}
      {showChevron ? (
        <Text
          style={[styles.chevron, { color: colors.textTertiary }]}
          importantForAccessibility="no"
          accessibilityElementsHidden
        >
          {'›'}
        </Text>
      ) : null}
    </>
  );

  const rowStyle = [
    styles.row,
    { borderTopColor: colors.borderDefault },
    isFirst ? styles.firstRow : null,
  ];

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        style={({ pressed }) => [
          ...rowStyle,
          pressed ? { backgroundColor: colors.bgSubtle } : null,
          disabled ? styles.disabled : null,
        ]}
      >
        {inner}
      </Pressable>
    );
  }

  // When the row hosts an interactive accessory (e.g. a toggle), that control
  // owns the accessibility label; grouping the row would swallow it and read a
  // duplicate. Such rows expose their label as plain text instead.
  if (accessory) {
    return (
      <View testID={testID} style={rowStyle}>
        {inner}
      </View>
    );
  }

  return (
    <View
      testID={testID}
      style={rowStyle}
      accessible
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CompassSpacing.s3,
    minHeight: COMPASS_TOUCH_MIN + 8,
    paddingVertical: CompassSpacing.s3,
    paddingHorizontal: CompassSpacing.s4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  firstRow: {
    borderTopWidth: 0,
  },
  disabled: {
    opacity: 0.5,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: CompassRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    fontSize: 18,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  sub: {
    marginTop: 2,
  },
  accessory: {
    marginLeft: CompassSpacing.s2,
  },
  chevron: {
    fontSize: 20,
    marginLeft: CompassSpacing.s1,
  },
});
