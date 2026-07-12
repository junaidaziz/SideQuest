import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Colors,
  Duration,
  Fonts,
  FontSize,
  LineHeight,
  Radius,
  Spacing,
} from '../constants/design';

/** A single selectable answer within a step. */
interface OptionItem {
  emoji: string;
  label: string;
  value: string;
}

/** One question step of the onboarding flow. */
interface StepDef {
  key: string;
  heading: string;
  subtitle: string;
  cta: string;
  options: OptionItem[];
}

/** Map of step index → chosen value, e.g. `{ 0: 'Solo', 1: '30 min' }`. */
export type OnboardingSelections = Record<number, string>;

interface OnboardingScreenProps {
  /**
   * Called once the final step is confirmed and the loading beat completes.
   * Navigation wiring passes the selections through to MissionResultsScreen.
   */
  onComplete?: (selections: OnboardingSelections) => void;
}

const STEPS: StepDef[] = [
  {
    key: 'crew',
    heading: 'Who are you going with?',
    subtitle: 'Pick your crew for today',
    cta: 'Next',
    options: [
      { emoji: '\u{1F9CD}', label: 'Solo', value: 'Solo' },
      { emoji: '\u{1F491}', label: 'Partner', value: 'Partner' },
      { emoji: '\u{1F465}', label: 'Friends', value: 'Friends' },
      { emoji: '\u{1F468}‍\u{1F469}‍\u{1F467}', label: 'Family', value: 'Family' },
      { emoji: '\u{1F9F8}', label: 'Kids Mode', value: 'Kids Mode' },
    ],
  },
  {
    key: 'time',
    heading: 'How much time do you have?',
    subtitle: "We'll match missions to your window",
    cta: 'Next',
    options: [
      { emoji: '⚡', label: '15 minutes', value: '15 min' },
      { emoji: '\u{1F550}', label: '30 minutes', value: '30 min' },
      { emoji: '\u{1F551}', label: 'About an hour', value: '1 hour' },
      { emoji: '\u{1F305}', label: '2+ hours', value: '2+ hours' },
    ],
  },
  {
    key: 'setting',
    heading: "What's your setting?",
    subtitle: 'Where are you right now?',
    cta: 'Next',
    options: [
      { emoji: '\u{1F6CB}️', label: 'Indoors', value: 'Indoors' },
      { emoji: '\u{1F33F}', label: 'Outdoors', value: 'Outdoors' },
      { emoji: '\u{1F3D9}️', label: 'City', value: 'City' },
      { emoji: '\u{1F332}', label: 'Nature', value: 'Nature' },
      { emoji: '\u{1F30D}', label: 'Anywhere', value: 'Anywhere' },
    ],
  },
  {
    key: 'budget',
    heading: "What's your budget?",
    subtitle: 'Last one — almost there',
    cta: 'Find My Missions',
    options: [
      { emoji: '\u{1F193}', label: 'Free only', value: 'Free' },
      { emoji: '☕', label: 'Under $10', value: 'Under $10' },
      { emoji: '\u{1F39F}️', label: 'Under $30', value: 'Under $30' },
      { emoji: '\u{1F680}', label: 'No limit', value: 'No limit' },
    ],
  },
];

const LOADING_MS = 2800;

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { width } = useWindowDimensions();
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<OnboardingSelections>({});
  const [isLoading, setIsLoading] = useState(false);

  const trackAnim = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (completeTimer.current) {
        clearTimeout(completeTimer.current);
      }
    };
  }, []);

  const handleSelect = useCallback((stepIndex: number, value: string) => {
    setSelections((prev) => ({ ...prev, [stepIndex]: value }));
  }, []);

  const goToStep = useCallback(
    (stepIndex: number) => {
      setCurrentStep(stepIndex);
      Animated.timing(trackAnim, {
        toValue: -stepIndex * width,
        duration: Duration.screen,
        useNativeDriver: true,
      }).start();
    },
    [trackAnim, width],
  );

  const finish = useCallback(
    (finalSelections: OnboardingSelections) => {
      setIsLoading(true);
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: Duration.screen,
        useNativeDriver: true,
      }).start();
      completeTimer.current = setTimeout(() => {
        // TODO: replace with navigation call once nav library is chosen
        // Expo Router:       router.replace({ pathname: '/mission-results', params })
        // React Navigation:  navigation.replace('MissionResults', { selections })
        onComplete?.(finalSelections);
      }, LOADING_MS);
    },
    [onComplete, overlayAnim],
  );

  const handleNext = useCallback(
    (stepIndex: number) => {
      if (selections[stepIndex] == null) {
        return;
      }
      if (stepIndex < STEPS.length - 1) {
        goToStep(stepIndex + 1);
      } else {
        finish(selections);
      }
    },
    [finish, goToStep, selections],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Animated.View
        style={[
          styles.track,
          { width: width * STEPS.length, transform: [{ translateX: trackAnim }] },
        ]}
      >
        {STEPS.map((step, stepIndex) => {
          const selectedValue = selections[stepIndex];
          const hasSelection = selectedValue != null;
          const isLastStep = stepIndex === STEPS.length - 1;
          const isActive = stepIndex === currentStep;
          return (
            <View
              key={step.key}
              style={[styles.step, { width }]}
              pointerEvents={isActive ? 'auto' : 'none'}
              accessibilityElementsHidden={!isActive || isLoading}
              importantForAccessibility={isActive && !isLoading ? 'auto' : 'no-hide-descendants'}
            >
              <ProgressBar activeIndex={stepIndex} total={STEPS.length} />

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Text accessibilityRole="header" style={styles.heading}>
                  {step.heading}
                </Text>
                <Text style={styles.subtitle}>{step.subtitle}</Text>

                <View
                  accessibilityRole="radiogroup"
                  style={styles.options}
                >
                  {step.options.map((option) => {
                    const selected = selectedValue === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => handleSelect(stepIndex, option.value)}
                        accessibilityRole="radio"
                        accessibilityLabel={option.label}
                        accessibilityState={{ checked: selected }}
                        style={({ pressed }) => [
                          styles.option,
                          selected && styles.optionSelected,
                          pressed && styles.optionPressed,
                        ]}
                      >
                        <Text
                          style={styles.optionEmoji}
                          importantForAccessibility="no"
                          accessibilityElementsHidden
                        >
                          {option.emoji}
                        </Text>
                        <Text
                          style={[styles.optionLabel, selected && styles.optionLabelSelected]}
                        >
                          {option.label}
                        </Text>
                        <View
                          style={[styles.check, selected && styles.checkSelected]}
                          importantForAccessibility="no"
                          accessibilityElementsHidden
                        >
                          {selected ? <Text style={styles.checkMark}>{'✓'}</Text> : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>

              <View style={styles.ctaArea}>
                <Pressable
                  onPress={() => handleNext(stepIndex)}
                  disabled={!hasSelection}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isLastStep ? 'Find my missions' : `Next: continue to step ${stepIndex + 2}`
                  }
                  accessibilityState={{ disabled: !hasSelection }}
                  style={({ pressed }) => [
                    styles.nextButton,
                    !hasSelection && styles.nextButtonDisabled,
                    pressed && hasSelection && styles.nextButtonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.nextButtonLabel,
                      !hasSelection && styles.nextButtonLabelDisabled,
                    ]}
                  >
                    {step.cta}
                  </Text>
                  <Text
                    style={[
                      styles.nextButtonArrow,
                      !hasSelection && styles.nextButtonLabelDisabled,
                    ]}
                    importantForAccessibility="no"
                    accessibilityElementsHidden
                  >
                    {'→'}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </Animated.View>

      {isLoading ? (
        <Animated.View
          style={[styles.loading, { opacity: overlayAnim }]}
          accessibilityViewIsModal
          accessibilityLiveRegion="polite"
          accessibilityLabel="Finding your missions"
        >
          <View style={styles.orb} importantForAccessibility="no" accessibilityElementsHidden>
            <Text style={styles.orbEmoji}>{'⚡'}</Text>
          </View>
          <Text style={styles.loadingHeading}>Finding your missions…</Text>
          <Text style={styles.loadingBody}>Matching to your vibe</Text>
          <View style={styles.summary} accessibilityLabel="Your selections">
            {Object.values(selections).map((value) => (
              <View key={value} style={styles.chip}>
                <Text style={styles.chipLabel}>{value}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

interface ProgressBarProps {
  activeIndex: number;
  total: number;
}

function ProgressBar({ activeIndex, total }: ProgressBarProps) {
  return (
    <View
      style={styles.progress}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: activeIndex + 1 }}
    >
      {Array.from({ length: total }).map((_, index) => {
        const done = index < activeIndex;
        const active = index === activeIndex;
        return (
          <View
            key={index}
            style={[
              styles.progressSeg,
              done && styles.progressSegDone,
              active && styles.progressSegActive,
            ]}
          />
        );
      })}
      <Text style={styles.progressLabel}>{`${activeIndex + 1} of ${total}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
