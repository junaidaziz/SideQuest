import React, { useCallback, useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleProp, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { CompassMotion } from '../../constants/compassDesign';
import { Icon } from '../../components/icons';
import type { ProofSubmissionResponse } from '../../types/api';
import { makeStyles } from './CompletionScreenV2.styles';

export type { ProofSubmissionResponse } from '../../types/api';

// Confetti is coloured from the four gamification identities + the primary
// (design § 6 completion key frame) — resolved from the live theme at render,
// never hardcoded hex, so it survives the light/dark switch.
type ConfettiKey = 'actionPrimary' | 'streak' | 'community' | 'xp' | 'achievement';
const CONFETTI: readonly { left: `${number}%`; top: `${number}%`; key: ConfettiKey }[] = [
  { left: '14%', top: '10%', key: 'actionPrimary' },
  { left: '32%', top: '4%', key: 'streak' },
  { left: '54%', top: '8%', key: 'community' },
  { left: '74%', top: '5%', key: 'xp' },
  { left: '88%', top: '12%', key: 'achievement' },
];

/** Derived level from the flat 100-XP-per-level curve documented in types/api. */
export function computeLevel(totalXp: number): {
  level: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  progress: number;
} {
  const safe = Math.max(0, totalXp);
  const level = Math.floor(safe / 100) + 1;
  const xpIntoLevel = safe % 100;
  const xpToNextLevel = 100 - xpIntoLevel;
  return { level, xpIntoLevel, xpToNextLevel, progress: xpIntoLevel };
}

/** Streak label in compound-adjective form ("1-day streak"). */
export function formatStreak(days: number): string {
  return `${days}-day streak`;
}

function whenPressed(pressed: boolean, style: StyleProp<ViewStyle>): StyleProp<ViewStyle> {
  return pressed ? style : null;
}

/** Next-recommendation flavour. No recommendation endpoint exists yet, so this
 * is realistic placeholder content, not a fabricated API row. */
export interface NextIdea {
  title: string;
  meta: string;
  glyph: string;
}

const DEFAULT_NEXT: NextIdea = { title: 'Green Corner Hunt', meta: '25 min · free · nearby', glyph: '\u{1F333}' };

interface CompletionScreenV2Props {
  result: ProofSubmissionResponse;
  isGuest: boolean;
  onBackToToday?: () => void;
  onShare?: () => void;
  onCreateAccount?: () => void;
  onOpenNextIdea?: () => void;
  nextIdea?: NextIdea;
}

export default function CompletionScreenV2({
  result,
  isGuest,
  onBackToToday,
  onShare,
  onCreateAccount,
  onOpenNextIdea,
  nextIdea = DEFAULT_NEXT,
}: CompletionScreenV2Props) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const pop = useSharedValue(0.6);
  const xpStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }], opacity: pop.value }));

  useEffect(() => {
    // Celebratory scale+opacity pop on the XP number, and a success haptic —
    // this is the "proof accepted / quest complete" success moment. (A numeric
    // count-up was intentionally dropped in favour of this pop, which the
    // design brief explicitly allows, to keep the screen timer-free.)
    // eslint-disable-next-line react-hooks/immutability -- reanimated shared values are intentionally mutable
    pop.value = withSequence(
      withTiming(1.15, { duration: CompassMotion.durationFast }),
      withSpring(1, { damping: 12, stiffness: 260 }),
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [pop]);

  const level = computeLevel(result.totalXp);
  const streakLabel = formatStreak(result.currentStreak);

  const handleBack = useCallback(() => onBackToToday?.(), [onBackToToday]);
  const handleShare = useCallback(() => onShare?.(), [onShare]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Animated.View style={styles.scroll} entering={FadeInDown.duration(CompassMotion.durationStandard)}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.celebrate} accessibilityLiveRegion="polite">
            <View style={styles.confetti} accessibilityElementsHidden importantForAccessibility="no">
              {CONFETTI.map((piece, idx) => (
                <View
                  key={idx}
                  style={[styles.confettiPiece, { left: piece.left, top: piece.top, backgroundColor: colors[piece.key] }]}
                />
              ))}
            </View>
            <View style={styles.medal} accessibilityElementsHidden importantForAccessibility="no">
              <Icon name="spark" size={52} color={colors.onHero} />
            </View>
            <Text accessibilityRole="header" style={styles.title}>
              Quest complete
            </Text>
            <Animated.View style={xpStyle} accessibilityRole="text" accessibilityLabel={`${result.xpAwarded} XP earned`}>
              <Text style={styles.xpBig}>{`+${result.xpAwarded} XP`}</Text>
            </Animated.View>
            <Text style={styles.nice}>Nice work — you made an ordinary day count.</Text>
          </View>

          <View style={styles.body}>
            <View style={styles.card}>
              <View style={styles.proofRow}>
                <View style={styles.proofThumb}>
                  <Text style={styles.proofThumbGlyph} accessibilityElementsHidden importantForAccessibility="no">{'\u{1F4F7}'}</Text>
                </View>
                <View style={styles.proofBody}>
                  <Text style={styles.label}>Your proof</Text>
                  <Text style={styles.caption}>{result.missionTitle}</Text>
                </View>
                <View style={styles.badgePending}>
                  <Text style={styles.badgePendingText}>{`Pending · ${result.xpAwarded} XP`}</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.lcTop}>
                <Text style={styles.label}>{`Level ${level.level}`}</Text>
                <Text style={styles.caption}>{`${level.xpIntoLevel} / 100 XP`}</Text>
              </View>
              <View
                style={styles.track}
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: 100, now: level.progress }}
                accessibilityLabel={`${level.xpToNextLevel} XP to level ${level.level + 1}`}
              >
                <View style={[styles.fill, { width: `${level.progress}%` }]} />
              </View>
              <Text style={styles.lcHint}>{`${level.xpToNextLevel} XP to level ${level.level + 1} — once your proof is approved.`}</Text>
            </View>

            <View style={styles.card} accessibilityRole="text" accessibilityLabel={`${streakLabel}. Your longest yet.`}>
              <View style={styles.streakRow}>
                <Icon name="flame" size={24} color={colors.streak} />
                <View style={styles.proofBody}>
                  <Text style={[styles.label, { color: colors.streakText }]}>{streakLabel}</Text>
                  <Text style={styles.caption}>It stays whether or not tomorrow happens.</Text>
                </View>
              </View>
            </View>

            <View>
              <Text style={styles.sectionLabel}>One more idea</Text>
              <Pressable
                onPress={onOpenNextIdea}
                accessibilityRole="button"
                accessibilityLabel={`Next idea: ${nextIdea.title}, ${nextIdea.meta}`}
                style={styles.card}
              >
                <View style={styles.nextRec}>
                  <View style={styles.nextIcon}>
                    <Text style={styles.nextIconGlyph} accessibilityElementsHidden importantForAccessibility="no">{nextIdea.glyph}</Text>
                  </View>
                  <View style={styles.nextBody}>
                    <Text style={styles.label}>{nextIdea.title}</Text>
                    <Text style={styles.caption}>{nextIdea.meta}</Text>
                  </View>
                  <Icon name="chevronRight" size={18} color={colors.actionPrimary} />
                </View>
              </Pressable>
            </View>

            {isGuest ? (
              <View style={styles.guestCard} accessibilityRole="text">
                <Icon name="lock" size={20} color={colors.actionPrimary} />
                <View style={styles.guestBody}>
                  <Text style={styles.guestTitle}>Keep this progress</Text>
                  <Text style={styles.guestText}>
                    You&apos;re exploring as a guest. Save your streak and XP to any device in seconds.
                  </Text>
                  <Pressable onPress={onCreateAccount} accessibilityRole="button" accessibilityLabel="Create a free account">
                    <Text style={styles.link}>Create free account</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </Animated.View>

      <View style={styles.stickyCta}>
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Back to Today"
          style={({ pressed }) => [styles.primaryBtn, whenPressed(pressed, styles.primaryBtnPressed)]}
        >
          <Text style={styles.primaryBtnText}>Back to Today</Text>
        </Pressable>
        <Pressable
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Share this moment"
          style={styles.secondaryBtn}
        >
          <Text style={styles.secondaryBtnText}>Share this moment</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
