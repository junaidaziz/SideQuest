import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleProp, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import type { HomeResponse } from '../../types/api';
import { getHome } from '../../services/homeApi';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import AnimatedBar from '../ProgressOverviewScreen/AnimatedBar';
import { formatXp, levelName, levelProgress, nextLevelName } from '../ProgressOverviewScreen/progress';
import { buildLevelMap, levelBlurb, type LevelNode } from '../ProgressOverviewScreen/levels';
import { makeStyles, type LevelDetailStyles } from './LevelDetailScreen.styles';

export interface LevelDetailScreenProps {
  onBack?: () => void;
}

export function whenPressed(pressed: boolean, style: StyleProp<ViewStyle>): StyleProp<ViewStyle> {
  return pressed ? style : null;
}

function nodeStyles(node: LevelNode, styles: LevelDetailStyles) {
  if (node.status === 'done') return { box: styles.nodeDone, text: styles.nodeDoneText };
  if (node.status === 'current') return { box: styles.nodeCurrent, text: styles.nodeCurrentText };
  return { box: styles.nodeLocked, text: styles.nodeLockedText };
}

function nodeMeta(node: LevelNode): string {
  if (node.status === 'done') return `Reached · ${formatXp(node.xp)} XP`;
  if (node.status === 'current') return `You are here · ${formatXp(node.xp)} XP`;
  return `${formatXp(node.xp)} XP`;
}

export default function LevelDetailScreen({ onBack }: LevelDetailScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const query = useQuery<HomeResponse>({ queryKey: ['home'], queryFn: getHome });
  const { data, isLoading, isError } = query;

  const handleRetry = useCallback(() => {
    query.refetch();
  }, [query]);

  const map = useMemo(() => (data ? buildLevelMap(data.level.level) : []), [data]);

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
          Level
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 20 }} accessibilityRole="progressbar" accessibilityLabel="Loading level">
          <View style={[styles.skel, styles.skelHero]} />
          <View style={[styles.skel, styles.skelCard]} />
        </View>
      ) : isError || !data ? (
        <View style={styles.stateArea} accessibilityLabel="Couldn't load level">
          <Text style={styles.stateHeading}>{"Couldn't load level"}</Text>
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
            accessibilityLabel={`Level ${data.level.level}, ${levelName(data.level.level)}. ${levelBlurb(data.level.level)}. ${formatXp(data.level.xpToNextLevel)} XP to ${nextLevelName(data.level.level)}`}
          >
            <View style={styles.bigShield}>
              <Text style={styles.bigShieldText}>{data.level.level}</Text>
            </View>
            <Text style={styles.eyebrow}>{`LEVEL ${data.level.level}`}</Text>
            <Text style={styles.heroName}>{levelName(data.level.level)}</Text>
            <Text style={styles.heroBlurb}>{levelBlurb(data.level.level)}</Text>
            <View style={styles.heroBarWrap}>
              <AnimatedBar
                progress={levelProgress(data.level)}
                trackColor="rgba(255,255,255,0.28)"
                fillColor={colors.brandGold}
                accessibilityLabel={`${Math.round(levelProgress(data.level) * 100)} percent to level ${data.level.level + 1}`}
              />
            </View>
            <Text style={styles.heroXp}>
              {`${formatXp(data.level.xpIntoLevel)} / ${formatXp(data.level.xpIntoLevel + data.level.xpToNextLevel)} XP · ${formatXp(data.level.xpToNextLevel)} to ${nextLevelName(data.level.level)}`}
            </Text>
          </View>

          <View style={[styles.card, styles.infoRow]} accessible accessibilityRole="text" accessibilityLabel="Levels track how much of the world you've explored, never what you've paid. Every quest, category and companion is always free.">
            <Text style={styles.infoIcon}>{'\u{1F9ED}'}</Text>
            <Text style={styles.infoBody}>
              Levels track how much of the world you have explored — never what you have paid.
              Every quest, category and companion is always free.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Level map</Text>
            {map.map((node) => {
              const ns = nodeStyles(node, styles);
              return (
                <View
                  key={node.level}
                  style={styles.mapItem}
                  accessible
                  accessibilityRole="text"
                  accessibilityLabel={`Level ${node.level}, ${node.name}. ${nodeMeta(node)}`}
                >
                  <View style={[styles.node, ns.box]}>
                    <Text style={[styles.nodeText, ns.text]}>{node.level}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.mapName, node.status === 'locked' && styles.mapNameLocked]}>
                      {node.name}
                    </Text>
                    <Text style={styles.mapMeta}>{nodeMeta(node)}</Text>
                  </View>
                  <Text style={styles.mapMeta}>
                    {node.status === 'done' ? '✓' : node.status === 'locked' ? '🔒' : ''}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
