import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleProp, Text, TextInput, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { InviteResponse, ReviewDecision, TaskDetail } from '../../types/api';
import { generateTaskInvite, getTask, reviewTaskSubmission } from '../../services/tasksApi';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { Icon } from '../../components/icons';
import { pickEmoji, statusLabel } from '../ChallengeFeedScreen/challengeUtils';
import {
  buildTimeline,
  latestPendingSubmission,
  relationship,
  type StatusTone,
  statusTone,
  verificationSummary,
} from './detailUtils';
import { makeStyles } from './ChallengeDetailScreen.styles';

/**
 * Challenge detail (mockup 27). Shows a real `UserTask` (`GET /tasks/:id`) with
 * a status timeline derived from its submission history, and role/status-aware
 * actions wired to the real endpoints.
 *
 * DATA HONESTY: the mockup's free-text "Jordan says …" message has no field in
 * the task model, so it is omitted rather than invented; participant names are
 * shown as role labels ("You" / "A friend") because the API returns only user
 * IDs, not display names, to a challenge participant.
 */
export interface ChallengeDetailScreenProps {
  taskId: string;
  /** Current user id, to resolve creator/assignee role (from authStore). */
  currentUserId?: string;
  onBack?: () => void;
  /** Opens the evidence-submission flow (needs a photo picker, out of scope here). */
  onSubmitEvidence?: (taskId: string) => void;
  /** Hands an invite link to the OS share sheet once nav is wired. */
  onShareInvite?: (inviteUrl: string) => void;
}

export function whenPressed(pressed: boolean, style: StyleProp<ViewStyle>): StyleProp<ViewStyle> {
  return pressed ? style : null;
}

/**
 * Resolves a {@link StatusTone} to a `{ bg, fg }` pair from the active palette.
 *
 * Every tone uses a *curated* opaque tint + text-safe token pair — never a
 * runtime `${status}1F` alpha blend. That blend was an AA failure for the 12px
 * badge label over the lavender canvas (success 3.90 / error 3.92 / info 4.35
 * : 1); the curated `status*Tint`/`status*Text` pairs all clear 4.5:1 with
 * margin (light 5.9–6.9:1, dark 7.1–7.7:1), the same fix pattern as the
 * gamification identity tint/text tokens.
 */
export function toneColors(tone: StatusTone, c: ReturnType<typeof useCompassTheme>['colors']): {
  bg: string;
  fg: string;
} {
  switch (tone) {
    case 'success':
      return { bg: c.statusSuccessTint, fg: c.statusSuccessText };
    case 'error':
      return { bg: c.statusErrorTint, fg: c.statusErrorText };
    case 'warning':
      return { bg: c.statusWarningTint, fg: c.statusWarningText };
    case 'info':
      return { bg: c.statusInfoTint, fg: c.statusInfoText };
    case 'community':
      return { bg: c.communityTint, fg: c.communityText };
    default:
      return { bg: c.bgSubtle, fg: c.textSecondary };
  }
}

export default function ChallengeDetailScreen({
  taskId,
  currentUserId,
  onBack,
  onSubmitEvidence,
  onShareInvite,
}: ChallengeDetailScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const reasonInputRef = useRef<TextInput>(null);

  // The reject-reason TextInput mounts only when `rejecting` becomes true —
  // move focus onto it directly (which VoiceOver/TalkBack follow for a real
  // text input) so screen-reader users get a signal a new field appeared,
  // rather than focus staying on the now-gone "Reject" button.
  useEffect(() => {
    if (rejecting) {
      reasonInputRef.current?.focus();
    }
  }, [rejecting]);

  const query = useQuery<TaskDetail>({ queryKey: ['task', taskId], queryFn: () => getTask(taskId) });
  const { data, isLoading, isError } = query;

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }, [queryClient, taskId]);

  const reviewMutation = useMutation({
    mutationFn: (vars: { submissionId: string; decision: ReviewDecision; rejectionReason?: string }) =>
      reviewTaskSubmission(taskId, vars.submissionId, {
        decision: vars.decision,
        rejectionReason: vars.rejectionReason,
      }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setRejecting(false);
      setReason('');
      invalidate();
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (): Promise<InviteResponse> => generateTaskInvite(taskId),
    onSuccess: (res) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onShareInvite?.(res.inviteUrl);
      invalidate();
    },
  });

  const handleRetry = useCallback(() => query.refetch(), [query]);
  const handleSubmit = useCallback(() => onSubmitEvidence?.(taskId), [onSubmitEvidence, taskId]);

  const pending = data ? latestPendingSubmission(data.submissions) : null;
  const role = data ? relationship(data, currentUserId) : 'observer';
  const timeline = useMemo(() => (data ? buildTimeline(data) : []), [data]);

  const handleApprove = useCallback(() => {
    if (pending) reviewMutation.mutate({ submissionId: pending.id, decision: 'Approve' });
  }, [pending, reviewMutation]);

  const handleConfirmReject = useCallback(() => {
    if (pending && reason.trim().length > 0) {
      reviewMutation.mutate({ submissionId: pending.id, decision: 'Reject', rejectionReason: reason.trim() });
    }
  }, [pending, reason, reviewMutation]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => onBack?.()}
          accessibilityRole="button"
          accessibilityLabel="Back to challenges"
          style={({ pressed }) => [styles.backBtn, whenPressed(pressed, styles.backBtnPressed)]}
        >
          <Icon name="back" size={24} color={colors.textPrimary} testID="detail-back-icon" />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          Challenge
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.stateArea} accessibilityRole="progressbar" accessibilityLabel="Loading challenge">
          <View style={[styles.skel, styles.skelHero]} />
          <View style={[styles.skel, styles.skelCard]} />
        </View>
      ) : isError || !data ? (
        <View style={styles.stateArea} accessibilityLabel="Couldn't load challenge">
          <Text accessibilityRole="header" style={styles.stateHeading}>
            {"Couldn't load challenge"}
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
        <>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.hero} accessible accessibilityLabel={`${data.title}. Status: ${statusLabel(data.status)}`}>
              <View style={styles.hex}>
                <Text style={styles.hexGlyph} accessibilityElementsHidden importantForAccessibility="no">
                  {pickEmoji(data.id)}
                </Text>
              </View>
              <View style={styles.heroBody}>
                <Text style={styles.heroTitle}>{data.title}</Text>
                {data.description ? <Text style={styles.heroDesc}>{data.description}</Text> : null}
                {(() => {
                  const badge = toneColors(statusTone(data.status), colors);
                  return (
                    <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: badge.fg }]}>
                        {statusLabel(data.status)}
                      </Text>
                    </View>
                  );
                })()}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>Who&apos;s in this challenge</Text>
              <View style={styles.partRow}>
                <Text style={styles.partName}>
                  {role === 'creator' ? 'Created by you' : 'From a friend'}
                </Text>
                <Icon name="chevronRight" size={16} color={colors.textTertiary} />

                <Text style={styles.partName}>
                  {role === 'assignee'
                    ? 'You'
                    : data.assigneeId
                      ? 'A friend'
                      : 'Awaiting a friend'}
                </Text>
              </View>
              <Text style={styles.cardSub}>{verificationSummary(data)}</Text>
              {data.rewardXp != null ? (
                <Text style={styles.cardSub}>{`Reward: ${data.rewardXp} XP on approval`}</Text>
              ) : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>Status</Text>
              {timeline.map((ev) => (
                <View
                  key={ev.id}
                  style={styles.tlRow}
                  accessible
                  accessibilityRole="text"
                  accessibilityLabel={`${ev.title}${ev.detail ? `, ${ev.detail}` : ''}`}
                >
                  <View
                    style={[
                      styles.tlNode,
                      ev.state === 'done' && styles.tlNodeDone,
                      ev.state === 'rejected' && styles.tlNodeRejected,
                    ]}
                  />
                  <View style={styles.tlBody}>
                    <Text style={styles.tlTitle}>{ev.title}</Text>
                    {ev.detail ? <Text style={styles.tlDetail}>{ev.detail}</Text> : null}
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.privacyCard}>
              <Icon name="lock" size={20} color={colors.communityText} />
              <Text style={styles.privacyText}>
                Only the people in this challenge can see its progress and
                evidence.
              </Text>
            </View>
          </ScrollView>

          {(() => {
            // Creator review actions for a pending CREATOR_APPROVAL submission.
            if (role === 'creator' && pending) {
              return (
                <View style={styles.ctaBar}>
                  {rejecting ? (
                    <View style={styles.rejectWrap}>
                      <TextInput
                        ref={reasonInputRef}
                        style={styles.reasonInput}
                        placeholder="Reason for rejection"
                        placeholderTextColor={colors.textTertiary}
                        value={reason}
                        onChangeText={setReason}
                        accessibilityLabel="Reason for rejection"
                        multiline
                      />
                      <View style={styles.ctaRow}>
                        <Pressable
                          onPress={() => setRejecting(false)}
                          accessibilityRole="button"
                          accessibilityLabel="Cancel rejection"
                          style={({ pressed }) => [styles.secondaryBtn, whenPressed(pressed, styles.btnPressed)]}
                        >
                          <Text style={styles.secondaryBtnText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                          onPress={handleConfirmReject}
                          disabled={reason.trim().length === 0 || reviewMutation.isPending}
                          accessibilityRole="button"
                          accessibilityLabel="Confirm rejection"
                          accessibilityState={{ disabled: reason.trim().length === 0 || reviewMutation.isPending }}
                          style={({ pressed }) => [
                            styles.destructiveBtn,
                            (reason.trim().length === 0 || reviewMutation.isPending) && styles.btnDisabled,
                            whenPressed(pressed, styles.btnPressed),
                          ]}
                        >
                          <Text style={styles.destructiveBtnText}>Confirm</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.ctaRow}>
                      <Pressable
                        onPress={() => setRejecting(true)}
                        accessibilityRole="button"
                        accessibilityLabel="Reject this proof"
                        style={({ pressed }) => [styles.secondaryBtn, whenPressed(pressed, styles.btnPressed)]}
                      >
                        <Text style={styles.secondaryBtnText}>Reject</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleApprove}
                        disabled={reviewMutation.isPending}
                        accessibilityRole="button"
                        accessibilityLabel="Approve this proof"
                        accessibilityState={{ disabled: reviewMutation.isPending }}
                        style={({ pressed }) => [styles.primaryBtn, whenPressed(pressed, styles.btnPressed)]}
                      >
                        <Text style={styles.primaryBtnText}>Approve</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            }
            // Assignee submit / resubmit actions.
            if (role === 'assignee' && (data.status === 'Accepted' || data.status === 'Rejected')) {
              return (
                <View style={styles.ctaBar}>
                  <Pressable
                    onPress={handleSubmit}
                    accessibilityRole="button"
                    accessibilityLabel={data.status === 'Rejected' ? 'Resubmit proof' : 'Submit proof'}
                    style={({ pressed }) => [styles.primaryBtnFull, whenPressed(pressed, styles.btnPressed)]}
                  >
                    <Text style={styles.primaryBtnText}>
                      {data.status === 'Rejected' ? 'Resubmit proof' : 'Submit proof'}
                    </Text>
                  </Pressable>
                </View>
              );
            }
            // Creator invite sharing for a not-yet-accepted task.
            if (role === 'creator' && (data.status === 'Open' || data.status === 'Invited')) {
              return (
                <View style={styles.ctaBar}>
                  <Pressable
                    onPress={() =>
                      data.inviteToken ? onShareInvite?.(`sidequest://tasks/invite/${data.inviteToken}`) : inviteMutation.mutate()
                    }
                    disabled={inviteMutation.isPending}
                    accessibilityRole="button"
                    accessibilityLabel={data.inviteToken ? 'Share invite link' : 'Create an invite link'}
                    style={({ pressed }) => [styles.primaryBtnFull, whenPressed(pressed, styles.btnPressed)]}
                  >
                    <Text style={styles.primaryBtnText}>
                      {data.inviteToken ? 'Share invite link' : 'Create invite link'}
                    </Text>
                  </Pressable>
                </View>
              );
            }
            return null;
          })()}
        </>
      )}
    </SafeAreaView>
  );
}
