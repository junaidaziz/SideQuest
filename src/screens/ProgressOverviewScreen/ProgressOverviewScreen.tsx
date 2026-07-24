import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import type { HomeResponse } from '../../types/api';
import { getHome } from '../../services/homeApi';
import { getUnreadCount } from '../../services/notificationsApi';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { Icon } from '../../components/icons';
import ProgressRing from './ProgressRing';
import AnimatedBar from './AnimatedBar';
import { makeStyles, type ProgressStyles } from './ProgressOverviewScreen.styles';
import {
  buildStatTiles,
  completionFraction,
  deriveAchievements,
  formatXp,
  levelName,
  levelProgress,
  nextLevelName,
  streakLabel,
  tintColor,
  toPercentLabel,
  unlockedCount,
  type AchievementDef,
} from './progress';

export interface ProgressOverviewScreenProps {
  /** Level shield / header tap → level detail (screen 21). */
  onOpenLevelDetail?: () => void;
  /** XP bar tap → XP detail (screen 20). */
  onOpenXpDetail?: () => void;
  /** Streak tile tap → streak detail (screen 25). */
  onOpenStreakDetail?: () => void;
  /** "See all" achievements → achievements grid (screen 22). */
  onOpenAchievements?: () => void;
  /** Single achievement tap → achievement detail (screen 23). */
  onOpenAchievement?: (achievementId: string) => void;
  /** Stat tile / "Statistics" link → statistics (screen 24). */
  onOpenStatistics?: () => void;
  /** Bell → notifications (screen 32, not in this cluster). */
  onOpenNotifications?: () => void;
}

/** Returns `style` only while pressed — mirrors the shipped screens' helper so
 * the pressed branch is unit-testable (RTL doesn't flip Pressable's flag). */
export function whenPressed(pressed: boolean, style: StyleProp<ViewStyle>): StyleProp<ViewStyle> {
  return pressed ? style : null;
}

function Skeleton({ styles }: { styles: ProgressStyles }) {
  return (
    <View style={styles.skeletonWrap} accessibilityRole="progressbar" accessibilityLabel="Loading your progress">
      <View style={[styles.skel, styles.skelHero]} />
      <View style={[styles.skel, styles.skelBar]} />
      <View style={[styles.skel, styles.skelGrid]} />
    </View>
  );
}

function ErrorState({ styles, onRetry }: { styles: ProgressStyles; onRetry: () => void }) {
  return (
    <View style={styles.stateArea} accessibilityLabel="Couldn't load your progress">
      <Text style={styles.stateHeading}>{"Couldn't load progress"}</Text>
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

interface AchievementMiniProps {
  ach: AchievementDef;
  styles: ProgressStyles;
  color: string;
  onPress: (id: string) => void;
}

function AchievementMini({ ach, styles, color, onPress }: AchievementMiniProps) {
  return (
    <Pressable
      onPress={() => onPress(ach.id)}
      accessibilityRole="button"
      // Earned/locked state is already announced by the label below; `selected`
      // conventionally means "active choice in a group" and reads oddly here, so
      // it's intentionally omitted rather than overloaded.
      accessibilityLabel={`${ach.name} achievement, ${ach.unlocked ? 'unlocked' : `locked, ${ach.progressLabel}`}`}
      style={({ pressed }) => [styles.achMini, whenPressed(pressed, { transform: [{ scale: 0.96 }] })]}
    >
      <View
        style={[
          styles.achHex,
          { backgroundColor: `${color}26` },
          !ach.unlocked && styles.achHexLocked,
        ]}
      >
        <Text style={styles.achGlyph}>{ach.icon}</Text>
      </View>
      <Text style={[styles.achName, !ach.unlocked && styles.achNameLocked]} numberOfLines={2}>
        {ach.name}
      </Text>
    </Pressable>
  );
}

export default function ProgressOverviewScreen({
  onOpenLevelDetail,
  onOpenXpDetail,
  onOpenStreakDetail,
  onOpenAchievements,
  onOpenAchievement,
  onOpenStatistics,
  onOpenNotifications,
}: ProgressOverviewScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const query = useQuery<HomeResponse>({ queryKey: ['home'], queryFn: getHome });
  const { data, isLoading, isError } = query;
  const unreadQuery = useQuery({ queryKey: ['notifications', 'unread-count'], queryFn: getUnreadCount });
  const unreadCount = unreadQuery.data?.unreadCount ?? 0;

  const handleRetry = useCallback(() => {
    query.refetch();
  }, [query]);

  const handleOpenAchievement = useCallback(
    (id: string) => onOpenAchievement?.(id),
    [onOpenAchievement],
  );

  const achievements = useMemo(() => (data ? deriveAchievements(data) : []), [data]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Text accessibilityRole="header" style={styles.title}>
          Progress
        </Text>
        <Pressable
          onPress={() => onOpenNotifications?.()}
          accessibilityRole="button"
          accessibilityLabel={
            unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Open notifications'
          }
          style={({ pressed }) => [styles.iconBtn, whenPressed(pressed, styles.iconBtnPressed)]}
        >
          <Icon name="bell" size={20} color={colors.textPrimary} testID="progress-bell-icon" />
          {unreadCount > 0 ? (
            <View style={styles.unreadBadge} accessibilityElementsHidden importantForAccessibility="no">
              <Text style={styles.unreadBadgeText}>{unreadCount > 9 ? '9+' : String(unreadCount)}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingArea}>
          <Skeleton styles={styles} />
        </View>
      ) : isError || !data ? (
        <ErrorState styles={styles} onRetry={handleRetry} />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Level + XP (real /home data) */}
          <View>
            <Pressable
              onPress={() => onOpenLevelDetail?.()}
              accessibilityRole="button"
              accessibilityLabel={`Level ${data.level.level}, ${levelName(data.level.level)}. ${formatXp(data.level.xpToNextLevel)} XP to ${nextLevelName(data.level.level)}`}
              style={({ pressed }) => whenPressed(pressed, { opacity: 0.7 })}
            >
              <View style={styles.levelHead}>
                <View style={styles.shield}>
                  <Text style={styles.shieldText}>{data.level.level}</Text>
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.lvlLabel}>{`Level ${data.level.level}`}</Text>
                  <Text style={styles.lvlName}>{levelName(data.level.level)}</Text>
                  <Text style={styles.caption}>
                    {`${formatXp(data.level.xpToNextLevel)} XP to ${nextLevelName(data.level.level)}`}
                  </Text>
                </View>
                <Icon name="chevronRight" size={20} color={colors.textTertiary} testID="progress-level-chevron" />
              </View>
            </Pressable>

            <Pressable
              onPress={() => onOpenXpDetail?.()}
              accessibilityRole="button"
              accessibilityLabel={`Experience: ${formatXp(data.level.totalXp)} total XP. View XP detail`}
              style={({ pressed }) => whenPressed(pressed, { opacity: 0.7 })}
            >
              <View style={styles.xpRow}>
                <Text style={styles.xpLabel}>{`${formatXp(data.level.totalXp)} XP`}</Text>
                <Text style={styles.caption}>{`${data.level.xpIntoLevel + data.level.xpToNextLevel} XP / level`}</Text>
              </View>
              <AnimatedBar
                progress={levelProgress(data.level)}
                trackColor={colors.bgSubtle}
                fillColor={colors.xp}
                accessibilityLabel={`${data.level.xpIntoLevel} of ${data.level.xpIntoLevel + data.level.xpToNextLevel} XP toward level ${data.level.level + 1}`}
              />
            </Pressable>
          </View>

          {/* Weekly completion-rate ring + real stat tiles */}
          <View>
            <View style={[styles.tile, styles.ringTile]}>
              <View style={styles.tileTop}>
                <Text style={styles.tileIcon}>{'\u{1F3AF}'}</Text>
                <Text style={styles.tileCaption}>Completion rate</Text>
              </View>
              <View style={styles.ringRow}>
                <ProgressRing
                  size={64}
                  strokeWidth={7}
                  progress={completionFraction(data.taskStats)}
                  trackColor={colors.bgSubtle}
                  fillColor={colors.actionPrimary}
                  holeColor={colors.bgSurface}
                  label={toPercentLabel(completionFraction(data.taskStats))}
                  labelColor={colors.textPrimary}
                  accessibilityLabel={`Completion rate ${toPercentLabel(completionFraction(data.taskStats))}`}
                  testID="completion-ring"
                />
                <View style={styles.ringMeta}>
                  <Text style={styles.ringValue}>
                    {`${data.taskStats?.approved ?? 0} / ${data.taskStats?.total ?? 0}`}
                  </Text>
                  <Text style={styles.ringSub}>quests approved of all logged</Text>
                </View>
              </View>
            </View>

            <View style={[styles.grid, { marginTop: 12 }]}>
              {buildStatTiles(data.streak, data.taskStats).map((tile) => {
                const isStreak = tile.id === 'streak';
                const onPress = isStreak ? onOpenStreakDetail : onOpenStatistics;
                return (
                  <Pressable
                    key={tile.id}
                    onPress={() => onPress?.()}
                    accessibilityRole="button"
                    accessibilityLabel={`${tile.caption}: ${tile.value} ${tile.sub}`}
                    style={({ pressed }) => [styles.tile, whenPressed(pressed, styles.tilePressed)]}
                  >
                    <View style={styles.tileTop}>
                      {isStreak ? (
                        <Icon name="flame" size={18} color={colors.streak} testID="progress-streak-tile-flame" />
                      ) : (
                        <Text style={styles.tileIcon}>{tile.icon}</Text>
                      )}
                      <Text style={styles.tileCaption}>{tile.caption}</Text>
                    </View>
                    <Text style={[styles.tileBig, isStreak && styles.tileBigStreak]}>{tile.value}</Text>
                    <Text style={styles.tileSub}>{tile.sub}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Achievements (derived from real stats) */}
          <View>
            <View style={styles.rowHead}>
              <Text style={styles.sectionLabel}>Recent achievements</Text>
              <Pressable
                onPress={() => onOpenAchievements?.()}
                accessibilityRole="button"
                accessibilityLabel={`See all achievements, ${unlockedCount(achievements)} unlocked`}
              >
                <Text style={styles.seeAll}>{`See all (${achievements.length})`}</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.achStrip}
            >
              {achievements.slice(0, 6).map((ach) => (
                <AchievementMini
                  key={ach.id}
                  ach={ach}
                  styles={styles}
                  color={tintColor(ach.tint, colors)}
                  onPress={handleOpenAchievement}
                />
              ))}
            </ScrollView>
          </View>

          {/* Streak card (real) */}
          <Pressable
            onPress={() => onOpenStreakDetail?.()}
            accessibilityRole="button"
            accessibilityLabel={`${streakLabel(data.streak.currentStreak)}. Best ${data.streak.longestStreak} days. View streak detail`}
            style={({ pressed }) => [styles.card, whenPressed(pressed, styles.tilePressed)]}
          >
            <View style={styles.rowHead}>
              <Text style={styles.cardLabel}>Streak</Text>
              <Icon name="chevronRight" size={18} color={colors.actionPrimary} testID="progress-streak-card-chevron" />
            </View>
            <View style={styles.ringRow}>
              <Icon name="flame" size={34} color={colors.streak} testID="progress-streak-card-flame" />
              <View style={styles.ringMeta}>
                <Text style={[styles.ringValue, styles.ringValueStreak]}>{streakLabel(data.streak.currentStreak)}</Text>
                <Text style={styles.ringSub}>{`Best streak: ${data.streak.longestStreak} days`}</Text>
              </View>
            </View>
          </Pressable>

          {/* Verification breakdown (real taskStats, replaces the mock history list) */}
          <View>
            <View style={styles.rowHead}>
              <Text style={styles.sectionLabel}>Proof verification</Text>
              <Pressable
                onPress={() => onOpenStatistics?.()}
                accessibilityRole="button"
                accessibilityLabel="View full statistics"
              >
                <Text style={styles.seeAll}>Statistics</Text>
              </Pressable>
            </View>
            {data.taskStats && data.taskStats.total > 0 ? (
              <View style={styles.card}>
                {[
                  { icon: '✅', name: 'Approved', sub: 'Counted toward XP', value: data.taskStats.approved },
                  { icon: '⏳', name: 'Under review', sub: 'Awaiting proof check', value: data.taskStats.pending },
                  { icon: '⚠️', name: 'Rejected', sub: 'Proof did not pass', value: data.taskStats.rejected },
                ].map((row, i) => (
                  <View
                    key={row.name}
                    style={[styles.breakdownRow, i === 0 && styles.breakdownRowFirst]}
                    accessible
                    accessibilityRole="text"
                    accessibilityLabel={`${row.name}: ${row.value} quests. ${row.sub}`}
                  >
                    <View style={styles.breakdownIconWrap}>
                      <Text style={styles.breakdownIcon}>{row.icon}</Text>
                    </View>
                    <View style={styles.flex1}>
                      <Text style={styles.breakdownName}>{row.name}</Text>
                      <Text style={styles.breakdownSub}>{row.sub}</Text>
                    </View>
                    <Text style={styles.breakdownValue}>{row.value}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard} accessible accessibilityRole="text" accessibilityLabel="No completed quests yet. Finish a quest to see your verification breakdown.">
                <Text style={styles.emptyIcon}>{'\u{1F4CA}'}</Text>
                <Text style={styles.emptyTitle}>No quests logged yet</Text>
                <Text style={styles.emptySub}>Finish a quest and your progress will appear here.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
