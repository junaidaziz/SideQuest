import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleProp, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { listSavedMissions } from '../../services/missionsApi';
import { enqueueSaveToggle } from '../../services/queuedActions';
import type { MissionCategory, PaginatedSavedMissions, SavedMission } from '../../types/api';
import { makeStyles, type SavedQuestsStyles } from './SavedQuestsScreen.styles';

const QUERY_KEY = ['saved-missions'] as const;

/** Mirrors QuestResultsScreen's category labels/glyphs — kept as a small local
 * copy rather than importing from that screen, which would drag in its
 * react-native-reanimated dependency for a 3-entry lookup. */
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

interface SavedQuestsScreenProps {
  onBack?: () => void;
  /** Empty-state CTA — sends the user to find something worth saving. */
  onExplore?: () => void;
  onViewDetails?: (mission: SavedMission) => void;
}

function whenPressed(pressed: boolean, style: StyleProp<ViewStyle>): StyleProp<ViewStyle> {
  return pressed ? style : null;
}

function Skeleton({ styles }: { styles: SavedQuestsStyles }) {
  return (
    <View style={styles.skeletonWrap} accessibilityRole="progressbar" accessibilityLabel="Loading saved quests">
      <View style={[styles.skel, styles.skelCard]} />
      <View style={[styles.skel, styles.skelCard]} />
      <View style={[styles.skel, styles.skelCard]} />
    </View>
  );
}

interface SavedQuestCardProps {
  mission: SavedMission;
  styles: SavedQuestsStyles;
  onPress: (mission: SavedMission) => void;
  onUnsave: (mission: SavedMission) => void;
}

function SavedQuestCard({ mission, styles, onPress, onUnsave }: SavedQuestCardProps) {
  return (
    <Pressable
      onPress={() => onPress(mission)}
      accessibilityRole="button"
      accessibilityLabel={`View quest: ${mission.title}, ${mission.time}, ${mission.xp}`}
      style={({ pressed }) => [styles.card, whenPressed(pressed, styles.cardPressed)]}
    >
      <View style={styles.thumb} importantForAccessibility="no">
        <Text style={styles.thumbGlyph}>{CATEGORY_GLYPH[mission.category]}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.catChip}>
          <Text style={styles.catChipText}>{CATEGORY_LABEL[mission.category]}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {mission.title}
        </Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardMetaText}>{`⏱ ${mission.time}`}</Text>
          <Text style={styles.cardMetaText}>·</Text>
          <Text style={styles.xpText}>{mission.xp}</Text>
        </View>
      </View>
      <Pressable
        onPress={() => onUnsave(mission)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${mission.title} from saved quests`}
        style={({ pressed }) => [styles.unsaveBtn, whenPressed(pressed, styles.unsaveBtnPressed)]}
      >
        <Text style={styles.unsaveGlyph}>{'\u{1F516}'}</Text>
      </Pressable>
    </Pressable>
  );
}

export default function SavedQuestsScreen({ onBack, onExplore, onViewDetails }: SavedQuestsScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const queryClient = useQueryClient();

  const listQuery = useQuery({ queryKey: QUERY_KEY, queryFn: () => listSavedMissions() });

  const unsaveMutation = useMutation({
    // Queue-and-retry (matches QuestResultsScreen/MissionResultsScreen's save
    // toggle): durably enqueued so a flaky connection doesn't silently lose
    // the unsave, drained on reconnect/foreground.
    mutationFn: (missionId: string) => enqueueSaveToggle(missionId, false),
    onMutate: async (missionId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<PaginatedSavedMissions>(QUERY_KEY);
      if (previous) {
        queryClient.setQueryData<PaginatedSavedMissions>(QUERY_KEY, {
          ...previous,
          items: previous.items.filter((m) => m.id !== missionId),
          total: Math.max(0, previous.total - 1),
        });
      }
      return { previous };
    },
    onError: (_err, _missionId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
  });

  const handleRetry = useCallback(() => {
    listQuery.refetch();
  }, [listQuery]);

  const handleUnsave = useCallback(
    (mission: SavedMission) => {
      unsaveMutation.mutate(mission.id);
    },
    [unsaveMutation],
  );

  const { data, isLoading, isError } = listQuery;
  const items = data?.items ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={({ pressed }) => [styles.backBtn, whenPressed(pressed, styles.backBtnPressed)]}
        >
          <Text style={styles.backGlyph}>{'‹'}</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          Saved quests
        </Text>
        {!isLoading && !isError && items.length > 0 ? (
          <View style={styles.countBadge} importantForAccessibility="no">
            <Text style={styles.countBadgeText}>{data?.total ?? items.length}</Text>
          </View>
        ) : (
          <View style={styles.backBtn} importantForAccessibility="no" />
        )}
      </View>

      {isLoading ? (
        <Skeleton styles={styles} />
      ) : isError ? (
        <View style={styles.stateArea}>
          <Text accessibilityRole="header" style={styles.stateHeading}>
            {"Couldn't load saved quests"}
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
      ) : items.length === 0 ? (
        <View style={[styles.stateArea, styles.empty]}>
          <View style={styles.emptyBadge} importantForAccessibility="no">
            <Text style={styles.emptyGlyph}>{'\u{1F516}'}</Text>
          </View>
          <Text accessibilityRole="header" style={styles.emptyTitle}>
            Nothing saved yet
          </Text>
          <Text style={styles.emptyBody}>
            Quests you save for later will show up here so you can come back to them anytime.
          </Text>
          {onExplore ? (
            <Pressable
              onPress={onExplore}
              accessibilityRole="button"
              accessibilityLabel="Explore quests"
              style={({ pressed }) => [styles.emptyCta, whenPressed(pressed, styles.emptyCtaPressed)]}
            >
              <Text style={styles.emptyCtaText}>Explore quests</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {items.map((mission) => (
            <SavedQuestCard
              key={mission.id}
              mission={mission}
              styles={styles}
              onPress={(m) => onViewDetails?.(m)}
              onUnsave={handleUnsave}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
