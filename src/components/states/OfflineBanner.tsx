import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { CompassColorsLight , CompassSpacing } from '../../constants/compassDesign';
import { textStyle } from '../compass/typography';

export interface OfflineBannerProps {
  /** Show the banner. Typically fed from `useOfflineStatus()`. */
  visible: boolean;
  title?: string;
  description?: string;
  /** Optional retry affordance. */
  onRetry?: () => void;
  retryLabel?: string;
  testID?: string;
}

/**
 * Global offline pattern (mockup 44). A persistent coral banner that gently
 * pulses while offline to stay noticeable without being alarming. Uses the
 * fixed brand-coral background with dark text in both themes (per base.css:
 * white text fails contrast on the light-mode coral). Announced politely so a
 * screen reader hears the state change once.
 */
export function OfflineBanner({
  visible,
  title = "You're offline",
  description = 'Some features are unavailable until you reconnect.',
  onRetry,
  retryLabel = 'Retry connection',
  testID,
}: OfflineBannerProps) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      pulse.value = withRepeat(
        withTiming(0.82, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      pulse.value = withTiming(1, { duration: 120 });
    }
  }, [visible, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  if (!visible) return null;

  return (
    <Animated.View
      testID={testID}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.banner, animatedStyle]}
    >
      <Text style={styles.icon} importantForAccessibility="no" accessibilityElementsHidden>
        {'📡'}
      </Text>
      <View style={styles.body}>
        <Text style={[textStyle('labelM'), styles.title]}>{title}</Text>
        <Text style={[textStyle('caption'), styles.sub]}>{description}</Text>
      </View>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
          hitSlop={8}
          style={({ pressed }) => [styles.retry, pressed ? { opacity: 0.6 } : null]}
        >
          <Text style={[textStyle('labelM'), styles.retryText]}>Retry</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

/** Dark text reads on brand-coral in both themes — see base.css `.banner.offline`. */
const ON_CORAL_TEXT = CompassColorsLight.textPrimary;

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CompassSpacing.s3,
    backgroundColor: CompassColorsLight.brandCoral,
    paddingVertical: CompassSpacing.s3,
    paddingHorizontal: CompassSpacing.gutterPhone,
  },
  icon: {
    fontSize: 20,
  },
  body: {
    flex: 1,
  },
  title: {
    color: ON_CORAL_TEXT,
    fontWeight: '700',
  },
  sub: {
    color: ON_CORAL_TEXT,
    opacity: 0.92,
  },
  retry: {
    paddingVertical: CompassSpacing.s1,
    paddingHorizontal: CompassSpacing.s2,
  },
  retryText: {
    color: ON_CORAL_TEXT,
    fontWeight: '700',
  },
});
