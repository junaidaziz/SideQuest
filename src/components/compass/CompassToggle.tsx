import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import {
  COMPASS_TOUCH_MIN,
  CompassMotion,
  CompassRadius,
} from '../../constants/compassDesign';

/** Horizontal distance the thumb travels between off and on. */
const THUMB_TRAVEL = 20;

export interface CompassToggleProps {
  value: boolean;
  onValueChange: (next: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
  /**
   * When true (default), flips a light selection haptic on toggle. The
   * Appearance screen's "Haptics" preference threads its own state through
   * here so turning haptics off silences the toggles themselves too.
   */
  hapticsEnabled?: boolean;
  testID?: string;
}

/**
 * Compass toggle switch — the shared control for every settings/preference row.
 * Renders as an accessibility `switch` (checked state announced), animates the
 * thumb with a standard-duration timing curve, and gives a subtle selection
 * haptic. Purely controlled: it never owns the value.
 */
export function CompassToggle({
  value,
  onValueChange,
  accessibilityLabel,
  disabled = false,
  hapticsEnabled = true,
  testID,
}: CompassToggleProps) {
  const { colors } = useCompassTheme();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, {
      duration: CompassMotion.durationStandard,
      easing: Easing.bezier(
        CompassMotion.easeStandard[0],
        CompassMotion.easeStandard[1],
        CompassMotion.easeStandard[2],
        CompassMotion.easeStandard[3],
      ),
    });
  }, [value, progress]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * THUMB_TRAVEL }],
  }));

  const handlePress = () => {
    if (disabled) return;
    if (hapticsEnabled) {
      void Haptics.selectionAsync();
    }
    onValueChange(!value);
  };

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      hitSlop={8}
      style={styles.hitArea}
    >
      <View
        style={[
          styles.track,
          {
            backgroundColor: value ? colors.actionPrimary : colors.bgSubtle,
            borderColor: value ? colors.actionPrimary : colors.borderDefault,
            opacity: disabled ? 0.4 : 1,
          },
        ]}
      >
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    minHeight: COMPASS_TOUCH_MIN,
    justifyContent: 'center',
  },
  track: {
    width: 52,
    height: 32,
    borderRadius: CompassRadius.pill,
    borderWidth: 1.5,
    padding: 3,
    justifyContent: 'center',
  },
  thumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    shadowColor: '#171527',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 2,
  },
});
