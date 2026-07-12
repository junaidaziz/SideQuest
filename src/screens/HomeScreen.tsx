import React, { useCallback } from 'react';
import {
  FlatList,
  ListRenderItemInfo,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  Colors,
  Fonts,
  FontSize,
  LineHeight,
  Radius,
  Spacing,
} from '../constants/design';
import { getHome } from '../services/homeApi';
import type { LevelInfo, Mission, SavedPack } from '../types/api';

export type { HomeResponse } from '../types/api';

interface HomeScreenProps {
  /** Header profile button. Navigation placeholder until nav library is chosen. */
  onOpenProfile?: () => void;
  /** Daily curated mission card tap — hands back the mission id. */
  onSelectDailyMission?: (missionId: string) => void;
  /** FAB "Start a new quest". Navigation placeholder to mode-select. */
  onStartNewQuest?: () => void;
  /** Saved-pack card tap — hands back the pack name (no detail screen yet). */
  onOpenPack?: (packName: string) => void;
}

/**
 * Per-category visual tokens for the daily mission badge, mirroring the same
 * mapping MissionResultsScreen uses so the two screens read consistently.
 */
const CATEGORY_STYLES = {
  explore: { badgeBg: Colors.primaryLight, badgeText: Colors.primary },
  create: { badgeBg: Colors.accentLight, badgeText: Colors.accentDark },
  discover: { badgeBg: Colors.tealLight, badgeText: Colors.teal },
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
    <View style={styles.emptyState} accessibilityRole="text" accessibilityLabel={`${title}. ${sub}`}>
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
          <View style={[styles.badge, { backgroundColor: cat.badgeBg }]}>
            <Text style={[styles.badgeText, { color: cat.badgeText }]}>
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
      <View style={styles.packThumb} importantForAccessibility="no" accessibilityElementsHidden>
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

export default function HomeScreen({
  onOpenProfile,
  onSelectDailyMission,
  onStartNewQuest,
  onOpenPack,
}: HomeScreenProps) {
  const homeQuery = useQuery({ queryKey: ['home'], queryFn: getHome });

  const handleOpenProfile = useCallback(() => {
    // TODO: replace with navigation call once nav library is chosen
    // Expo Router:       router.push('/profile')
    // React Navigation:  navigation.navigate('Profile')
    onOpenProfile?.();
  }, [onOpenProfile]);

  const handleSelectDaily = useCallback(
    (missionId: string) => {
      // TODO: replace with navigation call once nav library is chosen
      // Expo Router:       router.push({ pathname: '/mission-detail', params: { id } })
      // React Navigation:  navigation.navigate('MissionDetail', { missionId })
      onSelectDailyMission?.(missionId);
    },
    [onSelectDailyMission],
  );

  const handleStartNewQuest = useCallback(() => {
    // TODO: replace with navigation call once nav library is chosen
    // Expo Router:       router.push('/mode-select')
    // React Navigation:  navigation.navigate('ModeSelect')
    onStartNewQuest?.();
  }, [onStartNewQuest]);

  const handleOpenPack = useCallback(
    (packName: string) => {
      // TODO: replace with navigation call once nav library is chosen —
      // no mission-pack-detail screen exists yet.
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
              }}
              accessibilityLabel={`${data.level.xpToNextLevel} XP to level ${data.level.level + 1}`}
            >
              <View style={[styles.xpFill, { width: `${computeXpProgress(data.level)}%` }]} />
            </View>
            <Text style={styles.xpProgressLabel}>
              {`${data.level.xpToNextLevel} XP to Level ${data.level.level + 1}`}
            </Text>
          </View>

          {/* Streak card */}
          <View
            style={styles.streakCard}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  wordmark: {
    fontFamily: Fonts.displayExtraBold,
    fontSize: FontSize.h2,
    color: Colors.primary,
    letterSpacing: -0.4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.chip,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: {
    backgroundColor: Colors.surfaceMuted,
    borderColor: Colors.primary,
  },
  iconGlyph: {
    fontSize: 18,
  },
  stateArea: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.colossal,
    gap: Spacing.lg,
  },
  levelCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.card,
    padding: Spacing.base,
  },
  levelTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  levelEyebrow: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.7,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  levelTitle: {
    fontFamily: Fonts.displayExtraBold,
    fontSize: 18,
    color: Colors.white,
    letterSpacing: -0.2,
  },
  xpBadge: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: 20,
  },
  xpBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.caption,
    fontWeight: '700',
    color: Colors.ink,
  },
  xpTrack: {
    height: 8,
    backgroundColor: Colors.onPrimaryFill,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  xpFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  xpProgressLabel: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.caption,
    color: Colors.white,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.accentLight,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    borderRadius: Radius.card,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  streakIcon: {
    fontSize: 32,
  },
  streakInfo: {
    flex: 1,
  },
  streakValue: {
    fontFamily: Fonts.displayExtraBold,
    fontSize: 20,
    color: Colors.accentDark,
    marginBottom: 3,
  },
  streakLabel: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
  },
  sectionLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  dailyCard: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.card,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  dailyCardPressed: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceMuted,
  },
  dailyStripe: {
    width: 4,
    backgroundColor: Colors.accent,
  },
  dailyBody: {
    flex: 1,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  dailyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  dailyXp: {
    backgroundColor: Colors.accent,
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: 6,
  },
  dailyXpText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.ink,
  },
  dailyTitle: {
    fontFamily: Fonts.displayBold,
    fontSize: FontSize.cardLabel,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  dailyDesc: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.caption,
    lineHeight: LineHeight.caption,
    color: Colors.textSecondary,
  },
  dailyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  metaPill: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
  },
  emptyState: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    borderRadius: Radius.card,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.caption,
    color: Colors.ink,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.caption,
    lineHeight: LineHeight.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  packList: {
    gap: Spacing.md,
  },
  packCard: {
    width: 130,
    borderRadius: Radius.card,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceMuted,
  },
  packCardPressed: {
    borderColor: Colors.primary,
  },
  packThumb: {
    height: 84,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packThumbGlyph: {
    fontSize: 30,
  },
  packInfo: {
    padding: Spacing.md,
  },
  packName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.caption,
    color: Colors.ink,
    marginBottom: 2,
  },
  packCount: {
    fontFamily: Fonts.bodyRegular,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  skeletonWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.lg,
  },
  skel: {
    backgroundColor: Colors.border,
    borderRadius: Radius.card,
  },
  skelCard: {
    height: 108,
  },
  skelBar: {
    height: 72,
  },
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.sm,
  },
  stateHeading: {
    fontFamily: Fonts.displayBold,
    fontSize: FontSize.cardLabel,
    color: Colors.ink,
    textAlign: 'center',
  },
  stateBody: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.caption,
    lineHeight: LineHeight.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: Spacing.sm,
    borderRadius: Radius.btn,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  retryBtnPressed: {
    backgroundColor: Colors.primaryLight,
  },
  retryBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.body,
    color: Colors.primary,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    width: 54,
    height: 54,
    borderRadius: Radius.card,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 6,
  },
  fabPressed: {
    backgroundColor: Colors.primaryDark,
  },
  fabGlyph: {
    fontSize: 30,
    lineHeight: 34,
    color: Colors.white,
    fontWeight: '400',
  },
});
