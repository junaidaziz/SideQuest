import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleProp, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import type { HomeResponse } from '../../types/api';
import { getHome } from '../../services/homeApi';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import AnimatedBar from '../ProgressOverviewScreen/AnimatedBar';
import { makeStyles } from './StatisticsScreen.styles';

export interface StatisticsScreenProps {
  onBack?: () => void;
}

export function whenPressed(pressed: boolean, style: StyleProp<ViewStyle>): StyleProp<ViewStyle> {
  return pressed ? style : null;
}

/**
 * DATA HONESTY (mirrors AchievementsScreen's client-side derivation approach):
 * every number on this screen comes from real `GET /home` data —
 * `level`, `streak`, and `taskStats`. There is deliberately NO dedicated
 * statistics endpoint yet.
 *
 * The mockup (24-statistics.html) also shows a per-week bar chart, a
 * by-category donut, and a time-of-day heatmap. `/home` provides NONE of that
 * (no per-week completion history, no category tallies, no timestamps), so
 * those sections are intentionally omitted rather than filled with fabricated
 * plausible-looking numbers — the exact class of dishonesty two prior board
 * reviews flagged elsewhere in this app. A short, truthful note stands in for
 * them.
 */
export interface Stat {
  key: string;
  value: string;
  label: string;
}

/** Builds the real metric tiles from the home payload. */
export function buildStats(data: HomeResponse): Stat[] {
  const { level, streak, taskStats } = data;
  return [
    { key: 'xp', value: level.totalXp.toLocaleString(), label: 'Total XP' },
    { key: 'level', value: String(level.level), label: 'Level' },
    { key: 'streak', value: String(streak.currentStreak), label: 'Day streak' },
    { key: 'best', value: String(streak.longestStreak), label: 'Best streak' },
    { key: 'approved', value: String(taskStats.approved), label: 'Approved quests' },
    { key: 'total', value: String(taskStats.total), label: 'Total completed' },
  ];
}

/** Completion rate as a whole-number percentage (0 when nothing completed). */
export function completionPercent(data: HomeResponse): number {
  return Math.round(data.taskStats.completionRate * 100);
}

/** Fraction 0–1 of progress through the current level. */
export function levelProgress(data: HomeResponse): number {
  const { xpIntoLevel, xpToNextLevel } = data.level;
  const span = xpIntoLevel + xpToNextLevel;
  return span > 0 ? xpIntoLevel / span : 0;
}

export default function StatisticsScreen({ onBack }: StatisticsScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const query = useQuery<HomeResponse>({ queryKey: ['home'], queryFn: getHome });
  const { data, isLoading, isError } = query;

  const handleRetry = useCallback(() => {
    query.refetch();
  }, [query]);

  const stats = useMemo(() => (data ? buildStats(data) : []), [data]);

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
          Statistics
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.stateArea} accessibilityRole="progressbar" accessibilityLabel="Loading statistics">
          <View style={[styles.skel, styles.skelHero]} />
          <View style={[styles.skel, styles.skelCard]} />
        </View>
      ) : isError || !data ? (
        <View style={styles.stateArea} accessibilityLabel="Couldn't load statistics">
          <Text accessibilityRole="header" style={styles.stateHeading}>
            {"Couldn't load statistics"}
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
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {stats.map((s) => (
              <View
                key={s.key}
                style={styles.metricCard}
                accessible
                accessibilityRole="text"
                accessibilityLabel={`${s.value} ${s.label}`}
              >
                <Text style={styles.metricNum}>{s.value}</Text>
                <Text style={styles.metricCap}>{s.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Level progress</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.rowStrong}>{`Level ${data.level.level}`}</Text>
              <Text style={styles.rowMuted}>{`${data.level.xpToNextLevel} XP to next`}</Text>
            </View>
            <AnimatedBar
              progress={levelProgress(data)}
              trackColor={colors.bgSubtle}
              fillColor={colors.actionPrimary}
              height={10}
              accessibilityLabel={`Level ${data.level.level}, ${data.level.xpIntoLevel} of ${
                data.level.xpIntoLevel + data.level.xpToNextLevel
              } XP into this level`}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Completion rate</Text>
            <Text
              style={styles.rateNum}
              accessibilityRole="text"
              accessibilityLabel={`Completion rate ${completionPercent(data)} percent`}
            >
              {`${completionPercent(data)}%`}
            </Text>
            <AnimatedBar
              progress={data.taskStats.completionRate}
              trackColor={colors.bgSubtle}
              fillColor={colors.statusSuccess}
              height={10}
              accessibilityLabel={`${data.taskStats.approved} of ${data.taskStats.total} completions approved`}
            />
            <Text style={styles.rowMuted}>
              {`${data.taskStats.approved} of ${data.taskStats.total} completions approved`}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Proof review status</Text>
            <View
              style={styles.statusRow}
              accessible
              accessibilityRole="text"
              accessibilityLabel={`Approved: ${data.taskStats.approved}`}
            >
              <View style={[styles.dot, { backgroundColor: colors.statusSuccess }]} />
              <Text style={styles.statusName}>Approved</Text>
              <Text style={styles.statusVal}>{data.taskStats.approved}</Text>
            </View>
            <View
              style={styles.statusRow}
              accessible
              accessibilityRole="text"
              accessibilityLabel={`Pending review: ${data.taskStats.pending}`}
            >
              <View style={[styles.dot, { backgroundColor: colors.statusWarning }]} />
              <Text style={styles.statusName}>Pending review</Text>
              <Text style={styles.statusVal}>{data.taskStats.pending}</Text>
            </View>
            <View
              style={styles.statusRow}
              accessible
              accessibilityRole="text"
              accessibilityLabel={`Rejected: ${data.taskStats.rejected}`}
            >
              <View style={[styles.dot, { backgroundColor: colors.statusError }]} />
              <Text style={styles.statusName}>Rejected</Text>
              <Text style={styles.statusVal}>{data.taskStats.rejected}</Text>
            </View>
          </View>

          <Text style={styles.footnote} accessibilityRole="text">
            Weekly, by-category, and time-of-day breakdowns arrive once SideQuest
            records richer quest history — they are not shown here rather than
            estimated from data we do not yet have.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
