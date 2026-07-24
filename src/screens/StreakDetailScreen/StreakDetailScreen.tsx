import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleProp, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import type { HomeResponse } from '../../types/api';
import { getHome } from '../../services/homeApi';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { Icon, type IconName } from '../../components/icons';
import StreakFlame from './StreakFlame';
import { buildDayStrip, chunkIntoWeeks, streakHeadline } from './streak';
import { makeStyles, type StreakDetailStyles } from './StreakDetailScreen.styles';

export interface StreakDetailScreenProps {
  onBack?: () => void;
  /** Primary CTA — routed to Explore/quest generation by the nav layer. */
  onFindQuest?: () => void;
}

/** A streak rule row. `iconName` renders a Halcyon+ glyph where one exists;
 * the shield/moon concepts have no glyph in the set, so they keep an emoji. */
const RULES: { iconName?: IconName; icon?: string; text: string }[] = [
  { iconName: 'check', text: 'One approved quest per local day keeps your streak alive.' },
  { icon: '🛡️', text: 'A monthly grace token covers a single missed day once you have a habit.' },
  { icon: '🌙', text: 'Your streak can rest. Your progress always stays — nothing is ever lost.' },
];

export function whenPressed(pressed: boolean, style: StyleProp<ViewStyle>): StyleProp<ViewStyle> {
  return pressed ? style : null;
}

function Skeleton({ styles }: { styles: StreakDetailStyles }) {
  return (
    <View style={styles.skeletonWrap} accessibilityRole="progressbar" accessibilityLabel="Loading streak">
      <View style={[styles.skel, styles.skelHero]} />
      <View style={[styles.skel, styles.skelCard]} />
    </View>
  );
}

export default function StreakDetailScreen({ onBack, onFindQuest }: StreakDetailScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const query = useQuery<HomeResponse>({ queryKey: ['home'], queryFn: getHome });
  const { data, isLoading, isError } = query;

  const handleRetry = useCallback(() => {
    query.refetch();
  }, [query]);

  const strip = useMemo(() => (data ? buildDayStrip(data.streak.currentStreak) : []), [data]);
  const weeks = useMemo(() => chunkIntoWeeks(strip), [strip]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => onBack?.()}
          accessibilityRole="button"
          accessibilityLabel="Back to progress"
          style={({ pressed }) => [styles.backBtn, whenPressed(pressed, styles.backBtnPressed)]}
        >
          <Icon name="back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          Streak
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <Skeleton styles={styles} />
      ) : isError || !data ? (
        <View style={styles.stateArea} accessibilityLabel="Couldn't load streak">
          <Text style={styles.stateHeading}>{"Couldn't load streak"}</Text>
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
          <View
            style={styles.hero}
            accessible
            accessibilityLabel={`${streakHeadline(data.streak.currentStreak)}. Keep it going with one quest today.`}
          >
            <StreakFlame />
            <Text style={styles.heroNum}>{data.streak.currentStreak}</Text>
            <Text style={styles.heroSub}>day streak — keep it going with one quest today</Text>
          </View>

          <View style={styles.twin}>
            <View style={styles.metricCard} accessible accessibilityRole="text" accessibilityLabel={`Current streak: ${data.streak.currentStreak} days`}>
              <Text style={styles.metricNum}>{data.streak.currentStreak}</Text>
              <Text style={styles.metricCap}>Current streak</Text>
            </View>
            <View style={styles.metricCard} accessible accessibilityRole="text" accessibilityLabel={`Longest streak: ${data.streak.longestStreak} days`}>
              <Text style={styles.metricNum}>{data.streak.longestStreak}</Text>
              <Text style={styles.metricCap}>Longest streak</Text>
            </View>
          </View>

          <View style={[styles.card, styles.graceRow]} accessible accessibilityRole="text" accessibilityLabel="Grace token ready. Miss one day this month and your streak holds automatically.">
            <View style={styles.graceShield}>
              <Text style={styles.graceShieldText}>{'\u{1F6E1}'}</Text>
            </View>
            <View style={styles.flex1}>
              <Text style={styles.graceTitle}>Grace token ready</Text>
              <Text style={styles.graceBody}>
                Miss one day this month and your streak holds automatically.
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Last 14 days</Text>
            <View
              style={styles.strip}
              accessible
              accessibilityRole="image"
              accessibilityLabel={`Activity for the last 14 days. ${Math.min(data.streak.currentStreak, 14)} of the most recent days completed.`}
            >
              {weeks.map((week, rowIndex) => (
                <View key={rowIndex} style={styles.stripRow}>
                  {week.map((d) => (
                    <View
                      key={d.index}
                      style={[styles.dayCell, d.done && styles.dayCellDone, d.isToday && styles.dayCellToday]}
                    >
                      {d.done ? <Icon name="check" size={12} color={colors.onPrimary} /> : null}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>How your streak works</Text>
            {RULES.map((r) => (
              <View key={r.text} style={styles.ruleRow} accessible accessibilityRole="text" accessibilityLabel={r.text}>
                {r.iconName ? (
                  <Icon name={r.iconName} size={16} color={colors.streak} />
                ) : (
                  <Text style={styles.ruleIcon}>{r.icon}</Text>
                )}
                <Text style={styles.ruleBody}>{r.text}</Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => onFindQuest?.()}
            accessibilityRole="button"
            accessibilityLabel="Find a quick quest for today"
            style={({ pressed }) => [styles.cta, whenPressed(pressed, styles.ctaPressed)]}
          >
            <Text style={styles.ctaText}>Find a quick quest for today</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
