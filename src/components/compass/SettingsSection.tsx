import React, {
  Children,
  cloneElement,
  isValidElement,
  type ReactNode,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { CompassMotion, CompassRadius, CompassSpacing } from '../../constants/compassDesign';
import { textStyle } from './typography';

export interface SettingsSectionProps {
  /** Uppercase group label above the card (e.g. "ACCOUNT"). Optional. */
  title?: string;
  children: ReactNode;
  /** Section ordinal — shifts the row entrance stagger so later sections
   * animate in after earlier ones. */
  index?: number;
  /** Disable entrance animation (e.g. under reduce-motion). */
  animate?: boolean;
  testID?: string;
}

/** Per-row entrance stagger step, in ms. */
const ROW_STAGGER = 45;

/**
 * Grouped settings card with an optional uppercase title and a subtle
 * staggered fade-in as each row mounts. Injects `isFirst` into the first row
 * so the shared row divider rule stays centralised here rather than at each
 * call site.
 */
export function SettingsSection({
  title,
  children,
  index = 0,
  animate = true,
  testID,
}: SettingsSectionProps) {
  const { colors } = useCompassTheme();
  const rows = Children.toArray(children).filter(isValidElement);
  const baseDelay = index * (rows.length * ROW_STAGGER);

  return (
    <View style={styles.section} testID={testID}>
      {title ? (
        <Text
          style={[textStyle('caption'), styles.groupLabel, { color: colors.textTertiary }]}
          accessibilityRole="header"
        >
          {title.toUpperCase()}
        </Text>
      ) : null}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.bgSurface },
        ]}
      >
        {rows.map((child, i) => {
          const injected = isValidElement<{ isFirst?: boolean }>(child)
            ? cloneElement(child, { isFirst: i === 0 })
            : child;
          if (!animate) {
            return <View key={i}>{injected}</View>;
          }
          return (
            <Animated.View
              key={i}
              entering={FadeInDown.duration(CompassMotion.durationStandard).delay(
                baseDelay + i * ROW_STAGGER,
              )}
            >
              {injected}
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: CompassSpacing.s2,
  },
  groupLabel: {
    letterSpacing: 0.5,
    marginLeft: CompassSpacing.s1,
    fontWeight: '700',
  },
  card: {
    borderRadius: CompassRadius.card,
    overflow: 'hidden',
    shadowColor: '#171527',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
  },
});
