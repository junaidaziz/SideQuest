import React, { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SignupPromptScreen from '../SignupPromptScreen';
import type { ProofSubmissionResponse } from '../../types/api';
import { styles } from './CompletionScreen.styles';

/**
 * The post-completion celebration screen (mockup `05-completion.html`).
 *
 * This screen is *pure display plus two local interactions*: the completion
 * result was already fetched on the Proof Submission screen and is handed in
 * via `result`, so nothing here calls an API. The only stateful moment is the
 * guest auth-gate, which is the shared `SignupPromptScreen` component — we
 * mount and trigger it, we do not reimplement it.
 */
interface CompletionScreenProps {
  /** The completion payload returned by proof submission. Drives every value
   * shown on the screen (mission title, XP earned, current streak). */
  result: ProofSubmissionResponse;
  /** Whether the current session is an anonymous guest. Gates the challenge
   * flow behind the signup sheet when true. */
  isGuest: boolean;
  /** Invoked by the footer "Find Another Quest" button. Navigation placeholder
   * until the nav library is chosen. */
  onFindAnotherQuest?: () => void;
  /** Invoked once a challenge intent is satisfied — either the native share
   * sheet was invoked (signed-in user) or the guest completed signup. Actual
   * challenge delivery is a future milestone and is not built here. */
  onChallengeSent?: () => void;
}

/**
 * Returns `style` only while a Pressable is pressed, else `null`. Extracted so
 * the pressed-state branch is unit-testable — RTL's press helpers do not flip
 * Pressable's internal pressed flag, so this decision cannot be reached through
 * fired events alone. Mirrors the same helper in `MissionResultsScreen`.
 */
export function whenPressed(
  pressed: boolean,
  style: StyleProp<ViewStyle>,
): StyleProp<ViewStyle> {
  return pressed ? style : null;
}

/** Celebratory copy for the "Share this achievement" native share sheet. */
export function buildShareMessage(result: ProofSubmissionResponse): string {
  return `I just completed '${result.missionTitle}' and earned ${result.xpAwarded} XP on SideQuest!`;
}

/** Challenge-flavoured copy for the signed-in "Challenge a Friend" share sheet. */
export function buildChallengeMessage(result: ProofSubmissionResponse): string {
  return `I dare you to beat my time on '${result.missionTitle}' — join me on SideQuest!`;
}

/**
 * Streak label in compound-adjective form ("1-day streak", "3-day streak").
 * "day" stays singular in the compound regardless of count, matching the
 * mockup copy; the count is the only variable part.
 */
export function formatStreak(days: number): string {
  return `${days}-day streak`;
}

/** Whether the streak section's "keep it going" framing makes sense — a
 * streak of 0 has nothing to continue, so it's hidden rather than shown with
 * misleading fire-emoji continuation copy. */
export function hasActiveStreak(days: number): boolean {
  return days > 0;
}

export default function CompletionScreen({
  result,
  isGuest,
  onFindAnotherQuest,
  onChallengeSent,
}: CompletionScreenProps) {
  const [gateOpen, setGateOpen] = useState(false);

  const streakLabel = formatStreak(result.currentStreak);

  const handleShare = useCallback(async () => {
    try {
      // Share.share() resolves (never throws) when the user simply dismisses
      // the sheet without picking a target — there is nothing to recover from
      // either way here, so the result isn't inspected. The catch only
      // handles a genuine platform-level failure.
      await Share.share({ message: buildShareMessage(result) });
    } catch {
      // Genuine system error invoking the share sheet — nothing to recover.
    }
  }, [result]);

  const handleChallenge = useCallback(async () => {
    // Guests must create an account before challenging — open the shared gate
    // rather than invoking the native share sheet.
    if (isGuest) {
      setGateOpen(true);
      return;
    }
    try {
      // Share.share() resolves with { action: 'dismissedAction' } — not a
      // rejection — when the user cancels without picking a share target.
      // onChallengeSent must only fire on an actual share, or cancelling the
      // sheet would falsely report the challenge as sent.
      const shareResult = await Share.share({ message: buildChallengeMessage(result) });
      if (shareResult.action === Share.sharedAction) {
        onChallengeSent?.();
      }
    } catch {
      // Genuine system error invoking the share sheet — challenge unfulfilled.
    }
  }, [isGuest, onChallengeSent, result]);

  const handleGateDismiss = useCallback(() => {
    // Stay on the completion screen; the user declined to sign up.
    setGateOpen(false);
  }, []);

  const handleGateSuccess = useCallback(() => {
    // The now-signed-up user's challenge intent is satisfied by having an
    // account; real challenge-sending is a future milestone.
    setGateOpen(false);
    onChallengeSent?.();
  }, [onChallengeSent]);

  const handleFindAnother = useCallback(() => {
    // TODO: replace with navigation call once nav library is chosen
    // Expo Router:       router.push('/mode-select')
    // React Navigation:  navigation.navigate('ModeSelect')
    onFindAnotherQuest?.();
  }, [onFindAnotherQuest]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Celebration hero. TODO: install expo-linear-gradient for the mockup's
          purple gradient — a solid primary fill is the interim treatment. */}
      <View style={styles.hero} accessibilityLabel="Quest complete">
        <View
          style={styles.trophy}
          importantForAccessibility="no"
          accessibilityElementsHidden
        >
          <Text style={styles.trophyGlyph}>{'\u{1F3C6}'}</Text>
        </View>

        <Text style={styles.heroEyebrow}>QUEST COMPLETE</Text>
        <Text accessibilityRole="header" style={styles.heroTitle}>
          You did it!
        </Text>
        <Text style={styles.heroSub}>{result.missionTitle}</Text>

        <View
          style={styles.xpRow}
          accessibilityRole="text"
          accessibilityLabel={`${result.xpAwarded} XP earned`}
        >
          <Text style={styles.xpLabel}>XP earned</Text>
          <Text style={styles.xpValue}>{`+${result.xpAwarded} XP`}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Shareable achievement card */}
        <View style={styles.card} accessibilityLabel="Shareable achievement card">
          <View style={styles.cardTopRow}>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>COMPLETE</Text>
            </View>
            <Pressable
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel="Share this achievement"
              style={({ pressed }) => [
                styles.shareBtn,
                whenPressed(pressed, styles.shareBtnPressed),
              ]}
            >
              <Text style={styles.shareGlyph}>{'\u{1F517}'}</Text>
            </Pressable>
          </View>

          <Text style={styles.cardMissionName}>{result.missionTitle}</Text>
          <Text style={styles.cardCompletedAt}>Completed today</Text>

          <View style={styles.cardStatsRow}>
            <View style={styles.cardStat}>
              <Text style={[styles.cardStatValue, styles.cardStatAccent]}>
                {`+${result.xpAwarded}`}
              </Text>
              <Text style={styles.cardStatLabel}>XP</Text>
            </View>
            <View style={styles.cardStat}>
              <Text style={styles.cardStatValue}>{result.totalXp}</Text>
              <Text style={styles.cardStatLabel}>Total XP</Text>
            </View>
            <View style={styles.cardStat}>
              <Text style={styles.cardStatValue}>{result.currentStreak}</Text>
              <Text style={styles.cardStatLabel}>Day Streak</Text>
            </View>
          </View>
        </View>

        {/* Streak indicator — hidden at 0 rather than showing misleading
            "keep it going" copy for a streak that doesn't exist yet. */}
        {hasActiveStreak(result.currentStreak) ? (
          <View
            style={styles.streakRow}
            accessibilityRole="text"
            accessibilityLabel={`${streakLabel} active`}
          >
            <Text
              style={styles.streakIcon}
              importantForAccessibility="no"
              accessibilityElementsHidden
            >
              {'\u{1F525}'}
            </Text>
            <View style={styles.streakInfo}>
              <Text style={styles.streakValue}>{`${streakLabel}!`}</Text>
              <Text style={styles.streakLabel}>
                Complete a quest tomorrow to keep it going
              </Text>
            </View>
          </View>
        ) : null}

        {/* Challenge a friend */}
        <Text accessibilityRole="header" style={styles.sectionHeading}>
          Challenge a friend
        </Text>
        <Text style={styles.challengePrompt}>
          Dare someone to beat your time on this quest. They&apos;ll get a
          notification with a link.
        </Text>
        <Pressable
          onPress={handleChallenge}
          accessibilityRole="button"
          accessibilityLabel="Challenge a friend to this quest"
          style={({ pressed }) => [
            styles.challengeBtn,
            whenPressed(pressed, styles.challengeBtnPressed),
          ]}
        >
          <Text style={styles.challengeBtnText}>Challenge a Friend</Text>
        </Pressable>
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <Pressable
          onPress={handleFindAnother}
          accessibilityRole="button"
          accessibilityLabel="Find another quest"
          style={({ pressed }) => [
            styles.primaryBtn,
            whenPressed(pressed, styles.primaryBtnPressed),
          ]}
        >
          <Text style={styles.primaryBtnText}>Find Another Quest</Text>
        </Pressable>
      </View>

      {/* Guest auth-gate — the shared SignupPromptScreen, mounted only when a
          guest taps "Challenge a Friend".
          Known tradeoff: SignupPromptScreen's own sheet also carries
          accessibilityViewIsModal (correct for its standalone usage), so
          nested here it over-restricts VoiceOver to the sheet subtree and the
          outer backdrop's dismiss becomes unreachable by swipe — the in-sheet
          "Continue as guest" button remains the AT-accessible dismiss path.
          Similarly SignupPromptScreen's BackHandler consumes the Android back
          event first, so this Modal's onRequestClose is effectively a no-op
          fallback rather than the primary dismiss path on Android. */}
      <Modal
        visible={gateOpen}
        transparent
        animationType="none"
        onRequestClose={handleGateDismiss}
        accessibilityViewIsModal
      >
        <SignupPromptScreen
          onSuccess={handleGateSuccess}
          onDismiss={handleGateDismiss}
          xpAtRisk={result.xpAwarded}
          streakDays={result.currentStreak}
        />
      </Modal>
    </SafeAreaView>
  );
}
