import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { CompassMotion } from '../../constants/compassDesign';
import type { Mission, MissionCategory } from '../../types/api';
import { makeStyles } from './QuestDetailScreen.styles';

export type { Mission } from '../../types/api';

const CATEGORY_LABEL: Record<MissionCategory, string> = {
  explore: 'Get out',
  create: 'Make something',
  discover: 'Connect',
};

/** Two-letter hero glyph from the mission title initials (SideQuest "SQ" look). */
export function heroGlyph(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'SQ';
  const first = words[0][0] ?? '';
  const second = words.length > 1 ? words[words.length - 1][0] : (words[0][1] ?? '');
  return (first + second).toUpperCase() || 'SQ';
}

/**
 * "What counts" criteria. The backend gives a single free-text `proof`
 * requirement, not a structured checklist, so we surface that line plus two
 * generic guardrails — realistic, not fabricated from a non-existent field.
 */
export function buildCriteria(mission: Mission): string[] {
  return [
    mission.proof,
    'Capture it yourself, in the real world — no stock or reused shots',
    'Keep it safe and legal wherever you are',
  ];
}

export interface QuestDetailScreenProps {
  /** The mission to show. Undefined models a failed/absent lookup — there is
   * no single-mission GET endpoint, so callers pass the object they already hold. */
  mission?: Mission;
  /** Skeleton while a caller is resolving the mission. */
  isLoading?: boolean;
  onBack?: () => void;
  onShare?: () => void;
  onAccept?: (mission: Mission) => void;
  /** Retry hook for the unavailable state. */
  onRetry?: () => void;
}

export default function QuestDetailScreen({
  mission,
  isLoading = false,
  onBack,
  onShare,
  onAccept,
  onRetry,
}: QuestDetailScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [accepted, setAccepted] = useState(false);

  const scale = useSharedValue(1);
  const ctaStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability -- reanimated shared values are intentionally mutable
    scale.value = withSpring(0.97, { damping: 18, stiffness: 320 });
  }, [scale]);
  const onPressOut = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability -- reanimated shared values are intentionally mutable
    scale.value = withSpring(1, { damping: 18, stiffness: 320 });
  }, [scale]);

  const handleAccept = useCallback(() => {
    if (!mission || accepted) return;
    setAccepted(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onAccept?.(mission);
  }, [mission, accepted, onAccept]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back to results" style={styles.iconBtn}>
          <Text style={styles.iconGlyph}>{'‹'}</Text>
        </Pressable>
        <View style={styles.spacer} />
        <Pressable onPress={onShare} accessibilityRole="button" accessibilityLabel="Share quest link" style={styles.iconBtn}>
          <Text style={styles.iconGlyph}>{'↗'}</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.stateArea} accessibilityRole="progressbar" accessibilityLabel="Loading quest">
          <View style={[styles.skel, styles.skelHero]} />
          <View style={[styles.skel, styles.skelLine]} />
          <View style={[styles.skel, styles.skelBlock]} />
        </View>
      ) : !mission ? (
        <View style={styles.stateArea}>
          <Text accessibilityRole="header" style={styles.stateTitle}>
            Quest unavailable
          </Text>
          <Text style={styles.stateBody}>We couldn&apos;t open this quest. Head back and pick another.</Text>
          <Pressable onPress={onRetry ?? onBack} accessibilityRole="button" accessibilityLabel="Try again" style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Animated.View style={styles.scroll} entering={FadeInDown.duration(CompassMotion.durationStandard)}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <LinearGradient
                colors={['#18A999', '#1A4E9B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.hero}
                accessible
                accessibilityRole="image"
                accessibilityLabel={`${mission.title} artwork`}
              >
                <Text style={styles.heroGlyph} accessibilityElementsHidden importantForAccessibility="no">
                  {heroGlyph(mission.title)}
                </Text>
                <View style={styles.xpTag}>
                  <Text style={styles.xpTagText}>{mission.xp}</Text>
                </View>
              </LinearGradient>

              <View style={styles.body}>
                <View>
                  <Text accessibilityRole="header" style={styles.title}>
                    {mission.title}
                  </Text>
                  <View style={styles.subRow}>
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>{CATEGORY_LABEL[mission.category]}</Text>
                    </View>
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>{mission.diff}</Text>
                    </View>
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>{`⏱ ${mission.time}`}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.brief}>{mission.full}</Text>

                <View style={styles.statRow} accessibilityRole="summary" accessibilityLabel="Quest at a glance">
                  <View style={styles.stat}>
                    <Text style={styles.statIcon} accessibilityElementsHidden importantForAccessibility="no">{'⏱'}</Text>
                    <Text style={styles.statVal}>{mission.time}</Text>
                    <Text style={styles.statCap}>Time</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statIcon} accessibilityElementsHidden importantForAccessibility="no">{'\u{1F4AA}'}</Text>
                    <Text style={styles.statVal}>{mission.diff}</Text>
                    <Text style={styles.statCap}>Effort</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statIcon} accessibilityElementsHidden importantForAccessibility="no">{'\u{2728}'}</Text>
                    <Text style={styles.statVal}>{mission.xp}</Text>
                    <Text style={styles.statCap}>Reward</Text>
                  </View>
                </View>

                <View>
                  <Text accessibilityRole="header" style={styles.secTitle}>
                    What counts
                  </Text>
                  <View style={styles.checklist}>
                    {buildCriteria(mission).map((item) => (
                      <View key={item} style={styles.checkItem} accessible accessibilityLabel={item}>
                        <View style={styles.checkBox} accessibilityElementsHidden importantForAccessibility="no" />
                        <Text style={styles.checkLabel}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View>
                  <Text accessibilityRole="header" style={styles.secTitle}>
                    To finish
                  </Text>
                  <View style={styles.proofReq}>
                    <View style={styles.proofIcon}>
                      <Text style={styles.proofIconGlyph} accessibilityElementsHidden importantForAccessibility="no">{'\u{1F4F7}'}</Text>
                    </View>
                    <View style={styles.proofBody}>
                      <Text style={styles.proofLabel}>Photo proof</Text>
                      <Text style={styles.proofCap}>Submit your proof. Reviewed within a day.</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.note} accessibilityRole="text">
                  <Text accessibilityElementsHidden importantForAccessibility="no">{'\u{1F6DF}'}</Text>
                  <Text style={styles.noteText}>
                    <Text style={styles.noteBold}>Stay aware: </Text>
                    mind your surroundings and skip anything that feels unsafe. No quest is worth a risk.
                  </Text>
                </View>
              </View>
            </ScrollView>
          </Animated.View>

          <View style={styles.stickyCta}>
            <Animated.View style={ctaStyle}>
              <Pressable
                onPress={handleAccept}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                accessibilityRole="button"
                accessibilityState={{ disabled: accepted }}
                accessibilityLabel={accepted ? 'Quest accepted' : 'Accept quest'}
                style={[styles.acceptBtn, accepted && styles.acceptedBtn]}
              >
                <Text style={styles.acceptBtnText}>{accepted ? 'Quest accepted' : 'Accept quest'}</Text>
              </Pressable>
            </Animated.View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
