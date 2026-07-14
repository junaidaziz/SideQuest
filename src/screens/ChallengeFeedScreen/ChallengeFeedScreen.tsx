import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleProp, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { Task } from '../../types/api';
import { listTasks } from '../../services/tasksApi';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { CompassMotion } from '../../constants/compassDesign';
import {
  bucketTasks,
  formatDeadline,
  isDeadlineSoon,
  pickEmoji,
  statusLabel,
  type FeedBucket,
} from './challengeUtils';
import { makeStyles, type ChallengeFeedStyles } from './ChallengeFeedScreen.styles';

/**
 * Challenge feed (mockup 26). A "challenge" is a real backend `UserTask`; this
 * lists tasks where the caller is creator or assignee (`GET /tasks`) and
 * buckets them by lifecycle status into the mockup's three tabs.
 *
 * DATA HONESTY: the mockup's per-card "2 / 3 trails" progress bars have no
 * backing in the task model (a task has no sub-step counter), so they are
 * replaced with the real, meaningful lifecycle status + reward XP + deadline
 * rather than a fabricated fraction.
 */
export interface ChallengeFeedScreenProps {
  onBack?: () => void;
  onCreateChallenge?: () => void;
  onOpenChallenge?: (taskId: string) => void;
}

export function whenPressed(pressed: boolean, style: StyleProp<ViewStyle>): StyleProp<ViewStyle> {
  return pressed ? style : null;
}

const TABS: { key: FeedBucket; label: string }[] = [
  { key: 'incoming', label: 'Incoming' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

interface CardProps {
  task: Task;
  styles: ChallengeFeedStyles;
  soonColor: string;
  dueColor: string;
  onPress: (id: string) => void;
}

function ChallengeCard({ task, styles, soonColor, dueColor, onPress }: CardProps) {
  const deadline = formatDeadline(task.dueAt);
  const soon = isDeadlineSoon(task.dueAt);
  return (
    <Pressable
      onPress={() => onPress(task.id)}
      accessibilityRole="button"
      accessibilityLabel={`${task.title}. Status: ${statusLabel(task.status)}.${
        deadline ? ` ${deadline}.` : ''
      }${task.rewardXp != null ? ` ${task.rewardXp} XP.` : ''}`}
      style={({ pressed }) => [styles.card, whenPressed(pressed, styles.cardPressed)]}
    >
      <View style={styles.hex}>
        <Text style={styles.hexGlyph} accessibilityElementsHidden importantForAccessibility="no">
          {pickEmoji(task.id)}
        </Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {task.title}
          </Text>
          {deadline ? (
            <Text style={[styles.deadline, { color: soon ? soonColor : dueColor }]}>{deadline}</Text>
          ) : null}
        </View>
        {task.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {task.description}
          </Text>
        ) : null}
        <View style={styles.cardMeta}>
          <View style={styles.statusChip}>
            <Text style={styles.statusChipText}>{statusLabel(task.status)}</Text>
          </View>
          {task.rewardXp != null ? (
            <View style={styles.xpChip}>
              <Text style={styles.xpChipText}>{`${task.rewardXp} XP`}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function ChallengeFeedScreen({
  onBack,
  onCreateChallenge,
  onOpenChallenge,
}: ChallengeFeedScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [tab, setTab] = useState<FeedBucket>('active');
  const query = useQuery<Task[]>({ queryKey: ['tasks'], queryFn: () => listTasks() });
  const { data, isLoading, isError } = query;

  const handleRetry = useCallback(() => {
    query.refetch();
  }, [query]);

  const handleOpen = useCallback((id: string) => onOpenChallenge?.(id), [onOpenChallenge]);

  const groups = useMemo(() => bucketTasks(data ?? []), [data]);
  const visible = groups[tab];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => onBack?.()}
          accessibilityRole="button"
          accessibilityLabel="Back to progress"
          style={({ pressed }) => [styles.backBtn, whenPressed(pressed, styles.backBtnPressed)]}
        >
          <Text style={styles.backGlyph}>{'‹'}</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          Challenges
        </Text>
        <Pressable
          onPress={() => onCreateChallenge?.()}
          accessibilityRole="button"
          accessibilityLabel="Send a challenge"
          style={({ pressed }) => [styles.iconBtn, whenPressed(pressed, styles.backBtnPressed)]}
        >
          <Text style={styles.iconGlyph}>{'＋'}</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.stateArea} accessibilityRole="progressbar" accessibilityLabel="Loading challenges">
          <View style={[styles.skel, styles.skelCard]} />
          <View style={[styles.skel, styles.skelCard]} />
        </View>
      ) : isError || !data ? (
        <View style={styles.stateArea} accessibilityLabel="Couldn't load challenges">
          <Text accessibilityRole="header" style={styles.stateHeading}>
            {"Couldn't load challenges"}
          </Text>
          <Text style={styles.stateBody}>Check your connection and try again.</Text>
          <Pressable
            onPress={handleRetry}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            style={({ pressed }) => [styles.retryBtn, whenPressed(pressed, styles.retryBtnPressed)]}
          >
            <Text style={styles.retryBtnText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.segmentedWrap}>
            <View style={styles.segmented} accessibilityRole="tablist" accessibilityLabel="Challenge status">
              {TABS.map((t) => {
                const selected = tab === t.key;
                const count = groups[t.key].length;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => setTab(t.key)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${t.label}, ${count} ${count === 1 ? 'challenge' : 'challenges'}`}
                    style={[styles.seg, selected && styles.segSelected]}
                  >
                    <Text style={[styles.segText, selected && styles.segTextSelected]}>{t.label}</Text>
                    {count > 0 ? (
                      <View style={styles.count}>
                        <Text style={styles.countText}>{count}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {visible.length > 0 ? (
              <Animated.View entering={FadeInDown.duration(CompassMotion.durationStandard)} style={styles.list}>
                {visible.map((task) => (
                  <ChallengeCard
                    key={task.id}
                    task={task}
                    styles={styles}
                    soonColor={colors.statusWarning}
                    dueColor={colors.statusError}
                    onPress={handleOpen}
                  />
                ))}
              </Animated.View>
            ) : (
              <View style={styles.empty} accessibilityLabel="No challenges in this tab">
                <Text style={styles.emptyGlyph} accessibilityElementsHidden importantForAccessibility="no">
                  {'🤝'}
                </Text>
                <Text style={styles.emptyTitle}>Nothing here yet</Text>
                <Text style={styles.emptyBody}>
                  Send a challenge to a friend and it will show up here.
                </Text>
                <Pressable
                  onPress={() => onCreateChallenge?.()}
                  accessibilityRole="button"
                  accessibilityLabel="Send a new challenge"
                  style={({ pressed }) => [styles.emptyCta, whenPressed(pressed, styles.emptyCtaPressed)]}
                >
                  <Text style={styles.emptyCtaText}>Send challenge</Text>
                </Pressable>
              </View>
            )}

            <Text style={styles.footnote} accessibilityRole="text">
              Challenges are consent-based. Evidence stays private to the people
              in each challenge.
            </Text>
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}
