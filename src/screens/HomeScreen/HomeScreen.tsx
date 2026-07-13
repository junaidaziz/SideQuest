import React, { useCallback } from 'react';
import {
  FlatList,
  ListRenderItemInfo,
  Pressable,
  ScrollView,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import type { LevelInfo, Mission, SavedPack, TaskStats } from '../../types/api';
import { getHome } from '../../services/homeApi';
import { styles } from './HomeScreen.styles';

export type { HomeResponse } from '../../types/api';

interface HomeScreenProps {
  /** Header profile button — routed to /profile by app/home.tsx. */
  onOpenProfile?: () => void;
  /** Daily curated mission card tap — hands back the mission id. */
  onSelectDailyMission?: (missionId: string) => void;
  /** FAB "Start a new quest" — routed to /mode-select by app/home.tsx. */
  onStartNewQuest?: () => void;
  /** Saved-pack card tap — hands back the pack name (no detail screen yet). */
  onOpenPack?: (packName: string) => void;
}

/**
 * Per-category visual tokens for the daily mission badge, mirroring the same
 * mapping MissionResultsScreen uses so the two screens read consistently.
 * Maps to pre-declared StyleSheet entries (badgeBg-prefixed / badgeText-prefixed
 * keys) rather than building an inline `{ backgroundColor }` object per render.
 */
const CATEGORY_STYLES = {
  explore: { bgStyleKey: 'badgeBgExplore', textStyleKey: 'badgeTextExplore' },
  create: { bgStyleKey: 'badgeBgCreate', textStyleKey: 'badgeTextCreate' },
  discover: { bgStyleKey: 'badgeBgDiscover', textStyleKey: 'badgeTextDiscover' },
} as const;

/**
 * Returns `style` only while a Pressable is pressed, else `null`. Extracted so
 * the pressed-state branch is unit-testable — RTL's press helpers do not flip
 * Pressable's internal pressed flag. Mirrors the helper in the other screens.
 */
export function whenPressed(
  pressed: boolean,
  style: StyleProp<ViewStyle>,
): StyleProp<ViewStyle> {
  return pressed ? style : null;
}

/**
 * XP progress toward the next level as a 0–100 percentage. Derived from the
 * server-supplied split, never stored. Guards the empty-curve edge case
 * (both values 0) to avoid a NaN width.
 */
export function computeXpProgress(level: LevelInfo): number {
  const total = level.xpIntoLevel + level.xpToNextLevel;
  if (total <= 0) return 0;
  return (level.xpIntoLevel / total) * 100;
}

/** Streak label in compound-adjective form ("0-day streak", "3-day streak"). */
export function formatStreakLabel(days: number): string {
  return `${days}-day streak`;
}

/** "1 mission" vs "6 missions" — pluralised count for a saved pack. */
export function packCountLabel(count: number): string {
  return `${count} mission${count === 1 ? '' : 's'}`;
}

/**
 * Server sends completionRate as a 0–1 fraction (already guarded to 0, never
 * NaN, when total is 0). Rendered as a whole-number percentage, e.g. "60%".
 */
export function formatCompletionRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

/** Skeleton placeholder shown while the home aggregate is loading. */
function HomeSkeleton() {
  return (
    <View
      style={styles.skeletonWrap}
      accessibilityLabel="Loading your home feed"
      accessibilityRole="progressbar"
    >
      <View style={[styles.skel, styles.skelCard]} />
      <View style={[styles.skel, styles.skelBar]} />
      <View style={[styles.skel, styles.skelCard]} />
    </View>
  );
}

/** Shown when the home aggregate request failed. */
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.stateWrap} accessibilityLabel="Couldn't load your home feed">
      <Text style={styles.stateHeading}>{"Couldn't load home"}</Text>
      <Text style={styles.stateBody}>Check your connection and try again.</Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Try again"
        style={({ pressed }) => [styles.retryBtn, whenPressed(pressed, styles.retryBtnPressed)]}
      >
        <Text style={styles.retryBtnText}>Try again</Text>
      </Pressable>
    </View>
  );
}

/** Dashed-border empty state matching MissionResultsScreen's visual language. */
function EmptyCard({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <View
      style={styles.emptyState}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${title}. ${sub}`}
    >
      <Text style={styles.emptyIcon} importantForAccessibility="no" accessibilityElementsHidden>
        {icon}
      </Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
  );
}

interface DailyMissionCardProps {
  mission: Mission;
  onPress: (missionId: string) => void;
}

/** The single curated "today's pick" highlight — tappable, no gate attached. */
function DailyMissionCard({ mission, onPress }: DailyMissionCardProps) {
  const cat = CATEGORY_STYLES[mission.category];
  return (
    <Pressable
      onPress={() => onPress(mission.id)}
      accessibilityRole="button"
      accessibilityLabel={`View today's quest: ${mission.title}. ${mission.diff}, ${mission.time}, ${mission.xp}`}
      style={({ pressed }) => [styles.dailyCard, whenPressed(pressed, styles.dailyCardPressed)]}
    >
      <View style={styles.dailyStripe} />
      <View style={styles.dailyBody}>
        <View style={styles.dailyTopRow}>
          <View style={[styles.badge, styles[cat.bgStyleKey]]}>
            <Text style={[styles.badgeText, styles[cat.textStyleKey]]}>
              {mission.category.toUpperCase()}
            </Text>
          </View>
          <View style={styles.dailyXp}>
            <Text style={styles.dailyXpText}>{mission.xp}</Text>
          </View>
        </View>

        <Text style={styles.dailyTitle}>{mission.title}</Text>
        <Text style={styles.dailyDesc} numberOfLines={2}>
          {mission.desc}
        </Text>

        <View style={styles.dailyMeta}>
          <Text style={styles.metaPill}>{`⏱ ${mission.time}`}</Text>
          <Text style={styles.metaPill}>{mission.diff}</Text>
        </View>
      </View>
    </Pressable>
  );
}

interface PackCardProps {
  pack: SavedPack;
  onPress: (packName: string) => void;
}

/** A single saved-mission-pack card in the horizontal shelf. */
function PackCard({ pack, onPress }: PackCardProps) {
  return (
    <Pressable
      onPress={() => onPress(pack.name)}
      accessibilityRole="button"
      accessibilityLabel={`${pack.name} pack, ${packCountLabel(pack.missionCount)}`}
      style={({ pressed }) => [styles.packCard, whenPressed(pressed, styles.packCardPressed)]}
    >
      <View
        style={styles.packThumb}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        <Text style={styles.packThumbGlyph}>{'\u{1F9ED}'}</Text>
      </View>
      <View style={styles.packInfo}>
        <Text style={styles.packName} numberOfLines={2}>
          {pack.name}
        </Text>
        <Text style={styles.packCount}>{packCountLabel(pack.missionCount)}</Text>
      </View>
    </Pressable>
  );
}

/** One value/label cell inside the progress stats grid. Presentational only —
 * the parent card owns the single combined accessibility label. */
function StatCell({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/**
 * "Your progress" strip: total / completed / under-review / rejected counts plus
 * a headline completion percentage. Shows a contextual empty card (not a row of
 * zeros) for a brand-new user with no completions, matching the screen's other
 * empty states. Exposed as a single accessible summary so a screen reader reads
 * the whole picture in one pass rather than four disconnected numbers.
 */
function TaskStatsRow({ stats }: { stats: TaskStats }) {
  if (stats.total === 0) {
    return (
      <EmptyCard
        icon={'\u{1F4CA}'}
        title="No missions completed yet"
        sub="Finish a quest and your progress stats will appear here"
      />
    );
  }
  const pct = formatCompletionRate(stats.completionRate);
  return (
    <View
      style={styles.statsCard}
      accessible
      accessibilityRole="text"
      accessibilityLabel={
        `Your progress: ${stats.total} total, ${stats.approved} completed, ` +
        `${stats.pending} under review, ${stats.rejected} rejected. ` +
        `${pct} completion rate`
      }
    >
      <View style={styles.statsHeaderRow}>
        <Text style={styles.statsHeading}>Completion rate</Text>
        <Text style={styles.statsPct}>{pct}</Text>
      </View>
      <View style={styles.statsGrid}>
        <StatCell value={stats.total} label="Total" />
        <StatCell value={stats.approved} label="Completed" />
        <StatCell value={stats.pending} label="Under review" />
        <StatCell value={stats.rejected} label="Rejected" />
      </View>
    </View>
  );
}

export default function HomeScreen({
  onOpenProfile,
  onSelectDailyMission,
  onStartNewQuest,
  onOpenPack,
}: HomeScreenProps) {
  const homeQuery = useQuery({ queryKey: ['home'], queryFn: getHome });

  const handleOpenProfile = useCallback(() => {
    // Nav-agnostic by design: this screen never calls a navigation library
    // directly. app/home.tsx's onOpenProfile callback is what actually runs
    // router.push('/profile').
    onOpenProfile?.();
  }, [onOpenProfile]);

  const handleSelectDaily = useCallback(
    (missionId: string) => {
      // Nav-agnostic by design: app/home.tsx's onSelectDailyMission callback
      // is what actually runs router.push('/mode-select') — this is a
      // "start fresh" fallback, not a deep link into this specific mission
      // (no single-mission-lookup endpoint exists).
      onSelectDailyMission?.(missionId);
    },
    [onSelectDailyMission],
  );

  const handleStartNewQuest = useCallback(() => {
    // Nav-agnostic by design: app/home.tsx's onStartNewQuest callback is
    // what actually runs router.push('/mode-select').
    onStartNewQuest?.();
  }, [onStartNewQuest]);

  const handleOpenPack = useCallback(
    (packName: string) => {
      // Permanent no-op, not a TODO: no pack-detail screen was ever
      // designed, so app/home.tsx passes no onOpenPack callback at all.
      onOpenPack?.(packName);
    },
    [onOpenPack],
  );

  const handleRetry = useCallback(() => {
    homeQuery.refetch();
  }, [homeQuery]);

  const renderPack = useCallback(
    ({ item }: ListRenderItemInfo<SavedPack>) => (
      <PackCard pack={item} onPress={handleOpenPack} />
    ),
    [handleOpenPack],
  );

  const { data, isLoading, isError } = homeQuery;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.wordmark}>
          SideQuest
        </Text>
        <Pressable
          onPress={handleOpenProfile}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          style={({ pressed }) => [styles.iconBtn, whenPressed(pressed, styles.iconBtnPressed)]}
        >
          <Text style={styles.iconGlyph}>{'\u{1F464}'}</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.stateArea}>
          <HomeSkeleton />
        </View>
      ) : isError || !data ? (
        <View style={styles.stateArea}>
          <ErrorState onRetry={handleRetry} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* XP level card. TODO: install expo-linear-gradient for the mockup's
              purple gradient — a solid primary fill is the interim treatment. */}
          <View style={styles.levelCard} accessibilityLabel="Your level and XP">
            <View style={styles.levelTop}>
              <View>
                <Text style={styles.levelEyebrow}>YOUR LEVEL</Text>
                <Text style={styles.levelTitle}>{`Level ${data.level.level}`}</Text>
              </View>
              <View
                style={styles.xpBadge}
                accessible
                accessibilityRole="text"
                accessibilityLabel={`${data.level.totalXp} XP total`}
              >
                <Text style={styles.xpBadgeText}>{`${data.level.totalXp} XP`}</Text>
              </View>
            </View>

            <View
              style={styles.xpTrack}
              accessibilityRole="progressbar"
              accessibilityValue={{
                min: 0,
                max: 100,
                now: Math.round(computeXpProgress(data.level)),
                text: `${data.level.xpIntoLevel} XP earned, ${data.level.xpToNextLevel} to go`,
              }}
              accessibilityLabel={`${data.level.xpToNextLevel} XP to level ${data.level.level + 1}`}
            >
              {/* Width is an unavoidable runtime-computed percentage — no static
                  StyleSheet alternative exists (matches ModeSelectScreen's cardStyle). */}
              <View style={[styles.xpFill, { width: `${computeXpProgress(data.level)}%` }]} />
            </View>
            <Text style={styles.xpProgressLabel}>
              {`${data.level.xpToNextLevel} XP to Level ${data.level.level + 1}`}
            </Text>
          </View>

          {/* Streak card */}
          <View
            style={styles.streakCard}
            accessible
            accessibilityRole="text"
            accessibilityLabel={`${formatStreakLabel(data.streak.currentStreak)}. Complete a quest today to keep it going`}
          >
            <Text
              style={styles.streakIcon}
              importantForAccessibility="no"
              accessibilityElementsHidden
            >
              {'\u{1F525}'}
            </Text>
            <View style={styles.streakInfo}>
              <Text style={styles.streakValue}>{formatStreakLabel(data.streak.currentStreak)}</Text>
              <Text style={styles.streakLabel}>Complete a quest today to keep it going</Text>
            </View>
          </View>

          {/* Proof-verification progress strip */}
          <View>
            <Text style={styles.sectionLabel}>Your progress</Text>
            <TaskStatsRow stats={data.taskStats} />
          </View>

          {/* Daily free mission — hidden entirely when the curated pool is empty. */}
          {data.dailyMission ? (
            <View>
              <Text style={styles.sectionLabel}>{"Today's free mission"}</Text>
              <DailyMissionCard mission={data.dailyMission} onPress={handleSelectDaily} />
            </View>
          ) : null}

          {/* Pending challenges — always empty in v1 (no challenge backend yet). */}
          <View>
            <Text style={styles.sectionLabel}>Pending challenges</Text>
            {/* TODO: replace hardcoded empty state with data.pendingChallenges when challenge backend ships */}
            <EmptyCard
              icon={'\u{1F3AF}'}
              title="No challenges yet"
              sub="Complete a quest and dare a friend to beat your time"
            />
          </View>

          {/* Saved mission packs */}
          <View>
            <Text style={styles.sectionLabel}>Saved mission packs</Text>
            {data.savedPacks.length > 0 ? (
              <FlatList
                horizontal
                data={data.savedPacks}
                keyExtractor={(item) => item.name}
                renderItem={renderPack}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.packList}
                accessibilityLabel="Saved mission packs"
              />
            ) : (
              <EmptyCard
                icon={'\u{1F4E6}'}
                title="No saved packs yet"
                sub="Save quests you love and we'll group them into packs here"
              />
            )}
          </View>
        </ScrollView>
      )}

      <Pressable
        onPress={handleStartNewQuest}
        accessibilityRole="button"
        accessibilityLabel="Start a new quest"
        style={({ pressed }) => [styles.fab, whenPressed(pressed, styles.fabPressed)]}
      >
        <Text style={styles.fabGlyph}>{'+'}</Text>
      </Pressable>
    </SafeAreaView>
  );
}
