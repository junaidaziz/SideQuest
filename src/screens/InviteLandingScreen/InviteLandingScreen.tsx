import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { Task } from '../../types/api';
import { acceptTaskInvite, declineTaskInvite } from '../../services/tasksApi';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { Icon } from '../../components/icons';
import { makeStyles } from './InviteLandingScreen.styles';

/**
 * Challenge-invite landing (the live target of a `sidequest://tasks/invite/<token>`
 * deep link). This is the app's only UI path to `acceptTaskInvite` /
 * `declineTaskInvite`; previously those were reachable only via offline-queue replay.
 *
 * WHY A DEDICATED SCREEN, NOT `ChallengeDetailScreen`: the detail screen is driven
 * entirely by `GET /tasks/:id`, which the backend gates with `assertParticipant`
 * (403 for anyone who isn't already the creator or the *bound* assignee). A
 * not-yet-accepted recipient is not a participant, so they cannot load the detail
 * before accepting. The invite flow is therefore token-keyed, not id-keyed.
 *
 * DATA HONESTY: there is no `GET /tasks/invites/:token` endpoint — the backend
 * exposes no task metadata for an unaccepted invite — so this screen shows a
 * generic, honest "you've been invited" framing rather than fabricating a title,
 * creator name, or reward. The real challenge detail opens on `onAccepted`, once
 * the caller is a bound participant.
 */
export interface InviteLandingScreenProps {
  /** The opaque invite token parsed from the deep link. */
  token: string;
  /** Whether the current session is an anonymous guest (offers the sign-in detour). */
  isGuest?: boolean;
  /** Called with the now-bound task's id once the invite is accepted. */
  onAccepted?: (taskId: string) => void;
  /** Called after the invite is declined. */
  onDeclined?: () => void;
  /** Stash the token and route to Login/Signup, resuming here after auth. */
  onSignInFirst?: () => void;
  onBack?: () => void;
}

export default function InviteLandingScreen({
  token,
  isGuest = true,
  onAccepted,
  onDeclined,
  onSignInFirst,
  onBack,
}: InviteLandingScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const acceptMutation = useMutation({
    mutationFn: (): Promise<Task> => acceptTaskInvite(token),
    onSuccess: (task) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onAccepted?.(task.id);
    },
  });

  const declineMutation = useMutation({
    mutationFn: (): Promise<Task> => declineTaskInvite(token),
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onDeclined?.();
    },
  });

  const busy = acceptMutation.isPending || declineMutation.isPending;
  const showError = acceptMutation.isError || declineMutation.isError;

  const handleAccept = useCallback(() => {
    if (!busy) acceptMutation.mutate();
  }, [busy, acceptMutation]);

  const handleDecline = useCallback(() => {
    if (!busy) declineMutation.mutate();
  }, [busy, declineMutation]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => onBack?.()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
        >
          <Icon name="back" size={24} color={colors.textPrimary} testID="invite-back-icon" />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.hex}>
            <Icon name="spark" size={40} color={colors.communityText} />
          </View>
          <Text accessibilityRole="header" style={styles.title}>
            You&apos;re invited to a challenge
          </Text>
          <Text style={styles.body}>
            A friend wants to take one on with you. Accept to see the details and get
            started, or decline if now isn&apos;t the time.
          </Text>
        </View>

        <View style={styles.card} accessibilityRole="text">
          <View style={styles.cardRow}>
            <Icon name="lock" size={20} color={colors.communityText} />
            <Text style={styles.cardText}>
              Only the people in this challenge can see its progress and evidence.
            </Text>
          </View>
        </View>

        {showError ? (
          <Text style={styles.errorText} accessibilityLiveRegion="polite">
            {acceptMutation.isError
              ? "Couldn't accept this invite. It may have expired, or check your connection and try again."
              : "Couldn't decline this invite. Check your connection and try again."}
          </Text>
        ) : null}
      </View>

      <View style={styles.ctaBar}>
        <Pressable
          onPress={handleAccept}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={acceptMutation.isPending ? 'Accepting invite' : 'Accept challenge'}
          accessibilityState={{ disabled: busy, busy: acceptMutation.isPending }}
          style={({ pressed }) => [
            styles.primaryBtn,
            busy && styles.btnDisabled,
            pressed && styles.primaryBtnPressed,
          ]}
        >
          {acceptMutation.isPending ? (
            <ActivityIndicator color={colors.onPrimary} testID="invite-accept-spinner" />
          ) : (
            <Text style={styles.primaryBtnText}>Accept challenge</Text>
          )}
        </Pressable>

        <Pressable
          onPress={handleDecline}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={declineMutation.isPending ? 'Declining invite' : 'Decline'}
          accessibilityState={{ disabled: busy, busy: declineMutation.isPending }}
          style={({ pressed }) => [
            styles.secondaryBtn,
            busy && styles.btnDisabled,
            pressed && styles.secondaryBtnPressed,
          ]}
        >
          {declineMutation.isPending ? (
            <ActivityIndicator color={colors.textPrimary} testID="invite-decline-spinner" />
          ) : (
            <Text style={styles.secondaryBtnText}>Decline</Text>
          )}
        </Pressable>

        {isGuest ? (
          <Pressable
            onPress={() => onSignInFirst?.()}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Sign in before accepting"
            accessibilityState={{ disabled: busy }}
            style={({ pressed }) => [pressed && styles.backBtnPressed]}
          >
            <Text style={styles.signInLink}>Prefer to use your account? Sign in first</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
