import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleProp, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import type { HomeResponse } from '../../types/api';
import { getHome } from '../../services/homeApi';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { Icon } from '../../components/icons';
import AnimatedBar from '../ProgressOverviewScreen/AnimatedBar';
import {
  formatXp,
  levelName,
  levelProgress,
  nextLevelName,
} from '../ProgressOverviewScreen/progress';
import { buildMilestones } from '../ProgressOverviewScreen/levels';
import { makeStyles, type XpDetailStyles } from './XpDetailScreen.styles';

export interface XpDetailScreenProps {
  /** Back-header tap — routed to the previous screen by the nav layer. */
  onBack?: () => void;
}

/** Pressed-only style helper (see the other Compass screens). */
export function whenPressed(pressed: boolean, style: StyleProp<ViewStyle>): StyleProp<ViewStyle> {
  return pressed ? style : null;
}

function StateSkeleton({ styles }: { styles: XpDetailStyles }) {
  return (
    <View style={styles.skelWrap} accessibilityRole="progressbar" accessibilityLabel="Loading experience">
      <View style={[styles.skel, styles.skelHero]} />
      <View style={[styles.skel, styles.skelCard]} />
    </View>
  );
}

export default function XpDetailScreen({ onBack }: XpDetailScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const query = useQuery<HomeResponse>({ queryKey: ['home'], queryFn: getHome });
  const { data, isLoading, isError } = query;

  const handleRetry = useCallback(() => {
    query.refetch();
  }, [query]);

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
          Experience
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <StateSkeleton styles={styles} />
      ) : isError || !data ? (
        <View style={styles.stateArea} accessibilityLabel="Couldn't load experience">
          <Text style={styles.stateHeading}>{"Couldn't load XP"}</Text>
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
            accessibilityLabel={`${formatXp(data.level.totalXp)} total XP. Level ${data.level.level} ${levelName(data.level.level)}. ${formatXp(data.level.xpToNextLevel)} XP to ${nextLevelName(data.level.level)}`}
          >
            <Text style={styles.heroTotal}>{formatXp(data.level.totalXp)}</Text>
            <Text style={styles.heroSub}>
              {`Total XP · Level ${data.level.level} ${levelName(data.level.level)}`}
            </Text>
            <AnimatedBar
              progress={levelProgress(data.level)}
              trackColor={`${colors.onPrimary}47`}
              fillColor={colors.xp}
              accessibilityLabel={`${data.level.xpIntoLevel} of ${data.level.xpIntoLevel + data.level.xpToNextLevel} XP to level ${data.level.level + 1}`}
            />
            <View style={styles.heroLevels}>
              <Text style={styles.heroLevelText}>{`Lvl ${data.level.level}`}</Text>
              <Text style={styles.heroLevelText}>
                {`${formatXp(data.level.xpToNextLevel)} XP to Lvl ${data.level.level + 1}`}
              </Text>
            </View>
          </View>

          <View style={[styles.card, styles.infoRow]} accessible accessibilityRole="text" accessibilityLabel="How XP works. You earn XP when a quest proof is approved. Submitting shows XP as pending; it settles once verified.">
            <Text style={styles.infoIcon}>{'\u{1F4A1}'}</Text>
            <View style={styles.flex1}>
              <Text style={styles.infoTitle}>How XP works</Text>
              <Text style={styles.infoBody}>
                You earn XP when a quest proof is approved. Submitting shows XP as pending; it
                settles once verified. XP is never removed as punishment.
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Next milestones</Text>
            {buildMilestones(data.level.level).map((m, i) => (
              <View
                key={m.level}
                style={styles.msRow}
                accessible
                accessibilityRole="text"
                accessibilityLabel={`Level ${m.level}, ${m.name}. ${m.reached ? 'Reached' : `${formatXp(m.xp)} XP`}`}
              >
                <View style={[styles.dot, m.reached ? styles.dotDone : i === 1 ? styles.dotNext : null]} />
                <Text style={styles.msName}>{`Level ${m.level} · ${m.name}`}</Text>
                <Text style={styles.msMeta}>{m.reached ? 'Reached' : `${formatXp(m.xp)} XP`}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
