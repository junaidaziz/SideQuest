import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleProp, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { CompassMotion, type CompassPalette } from '../../constants/compassDesign';
import { Icon } from '../../components/icons';
import { generateMissions, listSavedMissions } from '../../services/missionsApi';
import { enqueueSaveToggle } from '../../services/queuedActions';
import type { GenerateMissionsRequest, Mission, MissionCategory } from '../../types/api';
import { makeStyles } from './QuestResultsScreen.styles';

type Styles = ReturnType<typeof makeStyles>;

export type { GenerateMissionsRequest } from '../../types/api';

const CATEGORY_LABEL: Record<MissionCategory, string> = {
  explore: 'Get out',
  create: 'Make something',
  discover: 'Connect',
};

const CATEGORY_GLYPH: Record<MissionCategory, string> = {
  explore: '\u{1F9ED}',
  create: '\u{2702}\u{FE0F}',
  discover: '\u{1F44B}',
};

/** Human category label used on the card chip. */
export function categoryLabel(category: MissionCategory): string {
  return CATEGORY_LABEL[category];
}

/**
 * Placeholder "why this fits" copy. The backend does not (yet) return a
 * per-mission match reason, so this is derived client-side from the mission's
 * own difficulty/time rather than fabricated from a non-existent field.
 */
export function buildFitReason(mission: Mission): string {
  const ease = mission.diff === 'Easy' ? 'quick and low-effort' : 'a satisfying stretch';
  return `${ease}, fits your ${mission.time.toLowerCase()} window right now.`;
}

/** One emoji-prefixed chip per active filter, for the summary line. */
export function buildFilterChips(filters: GenerateMissionsRequest): string[] {
  return [filters.crew, filters.time, filters.setting, filters.budget];
}

/**
 * Thumbnail well tint for a card at a given index — rotates through the four
 * gamification identity tints (design § 5) so the results list visibly teaches
 * the identity palette rather than repeating one accent.
 */
function thumbTint(colors: CompassPalette, index: number): string {
  const tints = [colors.communityTint, colors.xpTint, colors.achievementTint, colors.streakTint];
  return tints[index % tints.length];
}

function whenPressed(pressed: boolean, style: StyleProp<ViewStyle>): StyleProp<ViewStyle> {
  return pressed ? style : null;
}

interface QuestResultsScreenProps {
  filters: GenerateMissionsRequest;
  onBack?: () => void;
  onEditContext?: () => void;
  onViewDetails?: (mission: Mission) => void;
}

interface ResultCardProps {
  mission: Mission;
  index: number;
  total: number;
  styles: Styles;
  colors: CompassPalette;
  saved: boolean;
  onToggleSave: (mission: Mission) => void;
  onViewDetails?: (mission: Mission) => void;
}

function ResultCard({ mission, index, total, styles, colors, saved, onToggleSave, onViewDetails }: ResultCardProps) {
  return (
    <View style={styles.card} accessibilityLabel={`Quest ${index + 1} of ${total}, ${mission.title}`}>
      <View style={styles.rcTop}>
        <View style={[styles.thumb, { backgroundColor: thumbTint(colors, index) }]}>
          <Text style={styles.thumbGlyph} accessibilityElementsHidden importantForAccessibility="no">
            {CATEGORY_GLYPH[mission.category]}
          </Text>
        </View>
        <View style={styles.rcBody}>
          <View style={styles.catChip}>
            <Text style={styles.catChipText}>{categoryLabel(mission.category)}</Text>
          </View>
          <Text style={styles.rcTitle}>{mission.title}</Text>
          <Text style={styles.rcBrief} numberOfLines={3}>
            {mission.desc}
          </Text>
        </View>
      </View>

      <View style={styles.fitReason}>
        <Icon name="spark" size={16} color={colors.communityText} />
        <Text style={styles.fitReasonText}>
          <Text style={styles.fitReasonBold}>Why this fits: </Text>
          {buildFitReason(mission)}
        </Text>
      </View>

      <View style={styles.rcMeta}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{`⏱ ${mission.time}`}</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{mission.diff}</Text>
        </View>
        <View style={styles.xpBadge}>
          <Text style={styles.xpBadgeText}>{mission.xp}</Text>
        </View>
      </View>

      <View style={styles.rcActions}>
        <Pressable
          onPress={() => onViewDetails?.(mission)}
          accessibilityRole="button"
          accessibilityLabel={`View details for ${mission.title}`}
          style={({ pressed }) => [styles.primaryBtn, whenPressed(pressed, styles.primaryBtnPressed)]}
        >
          <Text style={styles.primaryBtnText}>View details</Text>
        </Pressable>
        <Pressable
          onPress={() => onToggleSave(mission)}
          accessibilityRole="button"
          accessibilityState={{ selected: saved }}
          accessibilityLabel={saved ? `Saved ${mission.title}` : `Save ${mission.title}`}
          style={[styles.saveBtn, saved && styles.saveBtnActive]}
        >
          <Icon name="bookmark" size={20} color={saved ? colors.onPrimary : colors.actionPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

export default function QuestResultsScreen({
  filters,
  onBack,
  onEditContext,
  onViewDetails,
}: QuestResultsScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  // Only holds *this session's* toggles — see savedMissionIds below for why
  // an empty entry here does not mean "not saved".
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});

  const query = useQuery({
    queryKey: ['quest-results', filters],
    queryFn: () => generateMissions(filters),
  });
  const { data, isLoading, isError, isFetching } = query;
  const missions = data?.missions ?? [];

  // /missions/generate never returns per-mission saved status, so without
  // this a freshly (re-)mounted screen showed every card as unsaved even for
  // missions the user had already bookmarked — indistinguishable from "not
  // saved yet" and prone to redundant re-taps (harmless server-side, since
  // saveMission is an idempotent upsert, but confusing). Shares its query key
  // with SavedQuestsScreen so both stay in sync off one cache entry.
  const savedQuery = useQuery({
    queryKey: ['saved-missions'],
    queryFn: () => listSavedMissions({ limit: 100 }),
  });
  const savedMissionIds = useMemo(
    () => new Set((savedQuery.data?.items ?? []).map((m) => m.id)),
    [savedQuery.data],
  );
  const isSaved = useCallback(
    (missionId: string) => savedIds[missionId] ?? savedMissionIds.has(missionId),
    [savedIds, savedMissionIds],
  );

  const saveMutation = useMutation({
    // Queue-and-retry (M23.3): the toggle is durably enqueued and drained on
    // reconnect/foreground rather than lost on a failed request. enqueue
    // resolves immediately, so the optimistic toggle only reverts if the
    // enqueue itself fails (e.g. AsyncStorage write error), not on a transient
    // network failure — that's the queue's job to retry now.
    mutationFn: (input: { mission: Mission; nextSaved: boolean }) =>
      enqueueSaveToggle(input.mission.id, input.nextSaved),
    onError: (_e, input) => {
      setSavedIds((prev) => ({ ...prev, [input.mission.id]: !input.nextSaved }));
    },
  });

  const handleToggleSave = useCallback(
    (mission: Mission) => {
      const nextSaved = !isSaved(mission.id);
      setSavedIds((prev) => ({ ...prev, [mission.id]: nextSaved }));
      saveMutation.mutate({ mission, nextSaved });
    },
    [isSaved, saveMutation],
  );

  const handleReroll = useCallback(() => {
    if (isFetching) return;
    query.refetch();
  }, [isFetching, query]);

  const handleRetry = useCallback(() => {
    query.refetch();
  }, [query]);

  const chips = buildFilterChips(filters).join(' · ');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back to explore"
          style={styles.backBtn}
        >
          <Icon name="back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Pressable
          onPress={handleReroll}
          accessibilityRole="button"
          accessibilityState={{ busy: isFetching, disabled: isFetching }}
          accessibilityLabel="Reroll quests"
          style={styles.rerollTop}
        >
          <Text style={styles.rerollTopText}>Reroll</Text>
        </Pressable>
      </View>

      <View style={styles.head}>
        <Text accessibilityRole="header" style={styles.headTitle}>
          {missions.length > 0 ? `${missions.length} quests fit your moment` : 'Your matches'}
        </Text>
        <View style={styles.filterSummary}>
          <Text style={styles.filterText}>
            Based on <Text style={styles.filterBold}>{chips}</Text>
          </Text>
          <Pressable
            onPress={onEditContext}
            accessibilityRole="button"
            accessibilityLabel="Edit your moment"
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Text style={styles.link}>Edit</Text>
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.stateArea}>
          <View style={styles.skeletonWrap} accessibilityRole="progressbar" accessibilityLabel="Finding your quests">
            <View style={[styles.skel, styles.skelCard]} />
            <View style={[styles.skel, styles.skelCard]} />
          </View>
        </View>
      ) : isError ? (
        <View style={styles.stateArea}>
          <Text accessibilityRole="header" style={styles.stateTitle}>
            {"Couldn't load quests"}
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
      ) : missions.length === 0 ? (
        <View style={styles.stateArea}>
          <View style={styles.emptyState} accessible accessibilityRole="text" accessibilityLabel="No quests found. Try widening your moment and reroll.">
            <Icon name="search" size={40} color={colors.textTertiary} />
            <Text style={styles.stateTitle}>No quests found</Text>
            <Text style={styles.stateBody}>Try widening your moment, then reroll for a fresh set.</Text>
          </View>
        </View>
      ) : (
        <Animated.View style={styles.scroll} entering={FadeInDown.duration(CompassMotion.durationStandard)}>
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {missions.map((mission, index) => (
              <ResultCard
                key={mission.id}
                mission={mission}
                index={index}
                total={missions.length}
                styles={styles}
                colors={colors}
                saved={isSaved(mission.id)}
                onToggleSave={handleToggleSave}
                onViewDetails={onViewDetails}
              />
            ))}
            <Pressable
              onPress={handleReroll}
              accessibilityRole="button"
              accessibilityState={{ busy: isFetching, disabled: isFetching }}
              accessibilityLabel="Reroll these quests"
              style={({ pressed }) => [styles.rerollBtn, whenPressed(pressed, styles.rerollBtnPressed)]}
            >
              <Text style={styles.rerollBtnText}>{isFetching ? 'Rerolling…' : 'Reroll these quests'}</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
