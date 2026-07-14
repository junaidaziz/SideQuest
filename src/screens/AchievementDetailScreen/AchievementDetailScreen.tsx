import React, { useCallback, useMemo } from 'react';
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
  tintColor,
  type AchievementDef,
} from '../ProgressOverviewScreen/progress';
import { makeStyles } from './AchievementDetailScreen.styles';

export interface AchievementDetailScreenProps {
  /** Which achievement to show — the id from `deriveAchievements`. */
  achievementId: string;
  onBack?: () => void;
  /** Share CTA — hands the achievement id back for the share sheet. */
  onShare?: (achievementId: string) => void;
}

export function whenPressed(pressed: boolean, style: StyleProp<ViewStyle>): StyleProp<ViewStyle> {
  return pressed ? style : null;
}

/** Status pill copy for an achievement. */
export function statusCopy(ach: AchievementDef): string {
  const s = achievementStatus(ach);
  if (s === 'earned') return 'Earned';
  if (s === 'inProgress') return 'In progress';
  return 'Locked';
}

export default function AchievementDetailScreen({
  achievementId,
  onBack,
  onShare,
}: AchievementDetailScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const query = useQuery<HomeResponse>({ queryKey: ['home'], queryFn: getHome });
  const { data, isLoading, isError } = query;

  const handleRetry = useCallback(() => {
    query.refetch();
  }, [query]);

  const ach = useMemo(() => {
    if (!data) return undefined;
    return deriveAchievements(data).find((d) => d.id === achievementId);
  }, [data, achievementId]);

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 20 }} accessibilityRole="progressbar" accessibilityLabel="Loading achievement">
          <View style={[styles.skel, styles.skelHero]} />
          <View style={[styles.skel, styles.skelCard]} />
        </View>
      );
    }
    if (isError || !data) {
      return (
        <View style={styles.stateArea} accessibilityLabel="Couldn't load achievement">
          <Text style={styles.stateHeading}>{"Couldn't load achievement"}</Text>
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
      );
    }
    if (!ach) {
      return (
        <View style={styles.stateArea} accessibilityLabel="Achievement not found">
          <Text style={styles.stateHeading}>Achievement not found</Text>
          <Text style={styles.stateBody}>This achievement is no longer available.</Text>
        </View>
      );
    }

    const color = tintColor(ach.tint, colors);
    const earned = ach.unlocked;
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero} accessible accessibilityRole="text" accessibilityLabel={`${ach.name}. ${ach.description} ${statusCopy(ach)}.`}>
          <View style={[styles.bigBadge, { backgroundColor: `${color}26` }, !earned && styles.bigBadgeLocked]}>
            <Text style={styles.bigBadgeGlyph}>{ach.icon}</Text>
          </View>
          <Text style={styles.name}>{ach.name}</Text>
          <Text style={styles.desc}>{ach.description}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, earned ? styles.statusEarned : styles.statusLocked]}>
              <Text style={[styles.statusText, earned ? styles.statusTextEarned : styles.statusTextLocked]}>
                {statusCopy(ach)}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, styles.ruleRow]} accessible accessibilityRole="text" accessibilityLabel={`How to unlock. ${ach.description}`}>
          <Text style={styles.ruleIcon}>{'\u{1F3AF}'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.ruleTitle}>How to unlock</Text>
            <Text style={styles.ruleBody}>{ach.description}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.progHeader}>
            <View>
              <Text style={styles.progLabel}>Progress</Text>
              <Text style={styles.progSub}>{`${ach.progressLabel}${earned ? ' · Completed' : ''}`}</Text>
            </View>
          </View>
          <AnimatedBar
            progress={ach.progress}
            trackColor={colors.bgSubtle}
            fillColor={color}
            height={10}
            accessibilityLabel={`Progress ${ach.progressLabel}`}
          />
        </View>

        <View>
          <Text style={styles.sectionLabel}>Share card preview</Text>
          <View style={styles.sharePreview} accessible accessibilityRole="text" accessibilityLabel={`Share preview: I earned ${ach.name} on SideQuest`}>
            <View style={[styles.shareMini, { backgroundColor: `${color}26` }]}>
              <Text style={styles.shareMiniGlyph}>{ach.icon}</Text>
            </View>
            <Text style={styles.shareTitle}>{`I earned ${ach.name} on SideQuest`}</Text>
            <Text style={styles.shareTagline}>Make today less ordinary.</Text>
          </View>
          <Pressable
            onPress={() => onShare?.(ach.id)}
            accessibilityRole="button"
            accessibilityState={{ disabled: !earned }}
            disabled={!earned}
            accessibilityLabel={earned ? `Share ${ach.name}` : `${ach.name} not earned yet`}
            style={({ pressed }) => [styles.shareCta, whenPressed(pressed, styles.shareCtaPressed), !earned && { opacity: 0.45 }]}
          >
            <Text style={styles.shareCtaText}>{earned ? 'Share achievement' : 'Earn it to share'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => onBack?.()}
          accessibilityRole="button"
          accessibilityLabel="Back to achievements"
          style={({ pressed }) => [styles.backBtn, whenPressed(pressed, styles.backBtnPressed)]}
        >
          <Text style={styles.backGlyph}>{'‹'}</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          Achievement
        </Text>
        <Pressable
          onPress={() => ach && onShare?.(ach.id)}
          accessibilityRole="button"
          accessibilityLabel="Share achievement"
          style={({ pressed }) => [styles.shareBtn, whenPressed(pressed, styles.shareBtnPressed)]}
        >
          <Text style={styles.shareGlyph}>{'↗'}</Text>
        </Pressable>
      </View>
      {renderBody()}
    </SafeAreaView>
  );
}
