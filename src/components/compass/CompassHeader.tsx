import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import {
  COMPASS_TOUCH_MIN,
  CompassSpacing,
} from '../../constants/compassDesign';
import { textStyle } from './typography';

export interface CompassHeaderProps {
  title: string;
  /** When provided, renders a leading back button that calls this. */
  onBack?: () => void;
  backAccessibilityLabel?: string;
  /** Optional trailing element (e.g. a settings gear). */
  right?: ReactNode;
  /** Large left-aligned title (used on top-level tabs like "You"). */
  large?: boolean;
}

/**
 * Shared Compass top bar. A centered title with an optional back affordance is
 * the default; `large` switches to the left-aligned display title used by the
 * root tab screens. Navigation is delegated — the header never imports a router.
 */
export function CompassHeader({
  title,
  onBack,
  backAccessibilityLabel = 'Go back',
  right,
  large = false,
}: CompassHeaderProps) {
  const { colors } = useCompassTheme();

  return (
    <View style={styles.bar}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={backAccessibilityLabel}
          hitSlop={8}
          style={({ pressed }) => [
            styles.backBtn,
            pressed ? { opacity: 0.6 } : null,
          ]}
        >
          <Text style={[styles.backGlyph, { color: colors.textPrimary }]}>
            {'‹'}
          </Text>
        </Pressable>
      ) : (
        !large && <View style={styles.backBtn} />
      )}
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        style={[
          large ? textStyle('h1') : textStyle('h3'),
          large ? styles.largeTitle : styles.centerTitle,
          { color: colors.textPrimary },
        ]}
      >
        {title}
      </Text>
      {right ? (
        <View style={styles.right}>{right}</View>
      ) : (
        !large && <View style={styles.backBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CompassSpacing.s3,
    paddingHorizontal: CompassSpacing.gutterPhone,
    paddingTop: CompassSpacing.s4,
    paddingBottom: CompassSpacing.s3,
  },
  backBtn: {
    width: COMPASS_TOUCH_MIN,
    height: COMPASS_TOUCH_MIN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backGlyph: {
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 30,
  },
  centerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  largeTitle: {
    flex: 1,
    textAlign: 'left',
  },
  right: {
    minWidth: COMPASS_TOUCH_MIN,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
