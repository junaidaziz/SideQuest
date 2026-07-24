import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { CompassMotion } from '../../constants/compassDesign';
import { Icon } from '../../components/icons';
import type { Mission } from '../../types/api';
import { makeStyles } from './ActiveQuestScreen.styles';

export type { Mission } from '../../types/api';

/** A single tracked step within an active quest. */
export interface QuestStep {
  id: string;
  label: string;
  done: boolean;
}

const DEFAULT_STEPS: QuestStep[] = [
  { id: 's1', label: 'Letter one — captured', done: true },
  { id: 's2', label: 'Letter two — captured', done: true },
  { id: 's3', label: 'Letter three — still out there', done: false },
];

/** 0–100 completion from the done/total step split (guards an empty list). */
export function stepProgress(steps: QuestStep[]): number {
  if (steps.length === 0) return 0;
  return (steps.filter((s) => s.done).length / steps.length) * 100;
}

/** "2 / 3" captured-count label. */
export function stepCountLabel(steps: QuestStep[]): string {
  return `${steps.filter((s) => s.done).length} / ${steps.length}`;
}

export interface ActiveQuestScreenProps {
  mission?: Mission;
  isLoading?: boolean;
  /** Steps for this quest. Client-tracked — there is no per-step backend yet. */
  steps?: QuestStep[];
  /** Elapsed-time label ("18:24"). No countdown — SideQuest is pressure-free. */
  elapsedLabel?: string;
  onBack?: () => void;
  onOptions?: () => void;
  onReadyToFinish?: (mission: Mission) => void;
  onRetry?: () => void;
}

export default function ActiveQuestScreen({
  mission,
  isLoading = false,
  steps = DEFAULT_STEPS,
  elapsedLabel = '00:00',
  onBack,
  onOptions,
  onReadyToFinish,
  onRetry,
}: ActiveQuestScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [finishing, setFinishing] = useState(false);

  const scale = useSharedValue(1);
  const ctaStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability -- reanimated shared values are intentionally mutable
    scale.value = withSpring(0.97, { damping: 18, stiffness: 320 });
  }, [scale]);
  const onPressOut = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability -- reanimated shared values are intentionally mutable
    scale.value = withSpring(1, { damping: 18, stiffness: 320 });
  }, [scale]);

  const handleFinish = useCallback(() => {
    if (!mission || finishing) return;
    setFinishing(true);
    onReadyToFinish?.(mission);
  }, [mission, finishing, onReadyToFinish]);

  const remaining = steps.find((s) => !s.done);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back to Today" style={styles.iconBtn}>
          <Icon name="back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          {mission ? mission.title : 'Active quest'}
        </Text>
        <Pressable onPress={onOptions} accessibilityRole="button" accessibilityLabel="Quest options: pause or abandon" style={styles.iconBtn}>
          <Text style={styles.iconGlyph}>{'⋯'}</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.stateArea} accessibilityRole="progressbar" accessibilityLabel="Loading active quest">
          <View style={[styles.skel, styles.skelBar]} />
          <View style={[styles.skel, styles.skelBlock]} />
        </View>
      ) : !mission ? (
        <View style={styles.stateArea}>
          <Text accessibilityRole="header" style={styles.stateTitle}>
            No active quest
          </Text>
          <Text style={styles.stateBody}>Accept a quest to start tracking your progress here.</Text>
          <Pressable onPress={onRetry ?? onBack} accessibilityRole="button" accessibilityLabel="Go back to Today" style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Back to Today</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.progressRow}>
            <View
              style={styles.stepTrack}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: 100, now: Math.round(stepProgress(steps)) }}
              accessibilityLabel={`${stepCountLabel(steps)} steps done`}
            >
              <View style={[styles.stepFill, { width: `${stepProgress(steps)}%` }]} />
            </View>
            <Text style={styles.count}>{stepCountLabel(steps)}</Text>
          </View>

          <Animated.View style={styles.scroll} entering={FadeInDown.duration(CompassMotion.durationStandard)}>
            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
              <View style={styles.statusLine} accessibilityRole="text" accessibilityLabel="Status: in progress">
                <View style={styles.statusDot} accessibilityElementsHidden importantForAccessibility="no" />
                <Text style={styles.statusText}>In progress</Text>
              </View>

              <View
                style={styles.elapsed}
                accessibilityRole="text"
                accessibilityLabel={`Elapsed time ${elapsedLabel}. There is no countdown.`}
              >
                <Text accessibilityElementsHidden importantForAccessibility="no">{'⏱'}</Text>
                <Text style={styles.elapsedTime}>{elapsedLabel}</Text>
                <Text style={styles.elapsedHint}>No timer pressure — finish when you&apos;re ready</Text>
              </View>

              <Text style={styles.instruction}>
                {remaining
                  ? `Next up: ${remaining.label.toLowerCase()}. Capture it when you find it.`
                  : "You've done everything — ready to submit your proof."}
              </Text>

              <View style={styles.checklist} accessibilityLabel="Your progress checklist">
                {steps.map((step) => (
                  <View key={step.id} style={styles.checkItem} accessible accessibilityLabel={`${step.label}${step.done ? ', done' : ''}`}>
                    <View style={[styles.checkBox, step.done && styles.checkBoxDone]}>
                      {step.done ? <Icon name="check" size={16} color={colors.onPrimary} /> : null}
                    </View>
                    <Text style={[styles.checkLabel, step.done && styles.checkLabelDone]}>{step.label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.proofReq}>
                <View style={styles.proofIcon}>
                  <Text style={styles.proofIconGlyph} accessibilityElementsHidden importantForAccessibility="no">{'\u{1F4F7}'}</Text>
                </View>
                <View style={styles.proofBody}>
                  <Text style={styles.proofLabel}>Photo proof needed</Text>
                  <Text style={styles.proofCap}>{mission.proof}</Text>
                </View>
              </View>
            </ScrollView>
          </Animated.View>

          <View style={styles.stickyCta}>
            <Animated.View style={ctaStyle}>
              <Pressable
                onPress={handleFinish}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                accessibilityRole="button"
                accessibilityLabel="I'm ready to finish"
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>I&apos;m ready to finish</Text>
              </Pressable>
            </Animated.View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
