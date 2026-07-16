import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleProp, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import type { HomeResponse } from '../../types/api';
import { getHome } from '../../services/homeApi';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import AnimatedBar from '../ProgressOverviewScreen/AnimatedBar';
import {
  achievementStatus,
  deriveAchievements,
  filterAchievements,
  tintColor,
  unlockedCount,
  type AchievementDef,
  type AchievementFilter,
} from '../ProgressOverviewScreen/progress';
import { makeStyles, type AchievementsStyles } from './AchievementsScreen.styles';

export interface AchievementsScreenProps {
  onBack?: () => void;
  onOpenAchievement?: (achievementId: string) => void;
}

const FILTERS: { key: AchievementFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'earned', label: 'Earned' },
  { key: 'inProgress', label: 'In progress' },
  { key: 'locked', label: 'Locked' },
];

export function whenPressed(pressed: boolean, style: StyleProp<ViewStyle>): StyleProp<ViewStyle> {
  return pressed ? style : null;
}

interface CardProps {
  ach: AchievementDef;
  styles: AchievementsStyles;
  color: string;
  trackColor: string;
  onPress: (id: string) => void;
}

function AchievementCard({ ach, styles, color, trackColor, onPress }: CardProps) {
  const status = achievementStatus(ach);
  const stateLabel = status === 'earned' ? 'earned' : status === 'inProgress' ? `in progress, ${ach.progressLabel}` : 'locked';
  return (
    <Pressable
      onPress={() => onPress(ach.id)}
      accessibilityRole="button"
      accessibilityState={{ selected: ach.unlocked }}
      accessibilityLabel={`${ach.name}. ${ach.description} Status: ${stateLabel}`}
      style={({ pressed }) => [styles.achCard, whenPressed(pressed, styles.achCardPressed)]}
    >
      <View style={[styles.hexBadge, { backgroundColor: `${color}26` }, !ach.unlocked && styles.hexLocked]}>
        <Text style={styles.hexGlyph}>{ach.icon}</Text>
      </View>
      <Text style={[styles.achName, !ach.unlocked && styles.achNameLocked]}>{ach.name}</Text>
      <Text style={styles.achRule} numberOfLines={2}>
        {ach.description}
      </Text>
      {status === 'inProgress' ? (
        <View style={styles.progWrap}>
          <AnimatedBar
            progress={ach.progress}
            trackColor={trackColor}
            fillColor={color}
            height={6}
            accessibilityLabel={`Progress ${ach.progressLabel}`}
          />
          <Text style={styles.progLabel}>{ach.progressLabel}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function AchievementsScreen({ onBack, onOpenAchievement }: AchievementsScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [filter, setFilter] = useState<AchievementFilter>('all');
  const query = useQuery<HomeResponse>({ queryKey: ['home'], queryFn: getHome });
  const { data, isLoading, isError } = query;

  const handleRetry = useCallback(() => {
    query.refetch();
  }, [query]);

  const handleOpen = useCallback((id: string) => onOpenAchievement?.(id), [onOpenAchievement]);

  const all = useMemo(() => (data ? deriveAchievements(data) : []), [data]);
  const visible = useMemo(() => filterAchievements(all, filter), [all, filter]);
  const earned = unlockedCount(all);

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
          Achievements
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 20 }} accessibilityRole="progressbar" accessibilityLabel="Loading achievements">
          <View style={[styles.skel, styles.skelHero]} />
          <View style={[styles.skel, styles.skelCard]} />
        </View>
      ) : isError || !data ? (
        <View style={styles.stateArea} accessibilityLabel="Couldn't load achievements">
          <Text style={styles.stateHeading}>{"Couldn't load achievements"}</Text>
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
          <View style={styles.hero} accessible accessibilityRole="text" accessibilityLabel={`${earned} of ${all.length} achievements earned`}>
            <View style={styles.medal}>
              <Text style={styles.medalGlyph}>{'\u{2B50}'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroCount}>
                {earned}
                <Text style={styles.heroCountTotal}>{` / ${all.length}`}</Text>
              </Text>
              <Text style={styles.heroCap}>Achievements earned</Text>
              <AnimatedBar
                progress={all.length ? earned / all.length : 0}
                trackColor={colors.bgSubtle}
                fillColor={colors.rewardXp}
                height={8}
                accessibilityLabel={`${earned} of ${all.length} earned`}
              />
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            accessibilityRole="tablist"
            accessibilityLabel="Filter achievements"
          >
            {FILTERS.map((f) => {
              const selected = filter === f.key;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${f.label} filter`}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={1}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {visible.length > 0 ? (
            <View style={styles.grid}>
              {visible.map((ach) => (
                <AchievementCard
                  key={ach.id}
                  ach={ach}
                  styles={styles}
                  color={tintColor(ach.tint, colors)}
                  trackColor={colors.bgSubtle}
                  onPress={handleOpen}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText} accessibilityRole="text">
              No achievements in this filter yet — keep questing.
            </Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
