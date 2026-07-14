import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleProp, Text, TextInput, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery } from '@tanstack/react-query';
import Animated, { FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { HomeResponse, InviteResponse, Task } from '../../types/api';
import { getHome } from '../../services/homeApi';
import { createTask, generateTaskInvite } from '../../services/tasksApi';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { CompassMotion } from '../../constants/compassDesign';
import {
  buildCreateRequest,
  canProceed,
  deadlineLabel,
  DEADLINE_OPTIONS,
  EMPTY_DRAFT,
  type ChallengeDraft,
  type DeadlineChoice,
} from './createUtils';
import { makeStyles, type CreateChallengeStyles } from './CreateChallengeScreen.styles';

/**
 * Create-challenge flow (mockup 28), implemented as a REAL 4-step state machine
 * (not the mockup's "all steps shown at once" static layout):
 *   1. Choose a mission  → prefill from the real daily mission, or write a custom one
 *   2. Invite            → link-based invite (the only real path; no friends backend)
 *   3. Deadline & details→ due date + require-review verification
 *   4. Review & send     → POST /tasks then POST /tasks/:id/invite
 *
 * Step transitions animate (reanimated) and fire haptics, per the board brief.
 */
export interface CreateChallengeScreenProps {
  onCancel?: () => void;
  /** Fired with the new task id after a successful send. */
  onCreated?: (taskId: string) => void;
  /** Hands the generated invite link to the OS share sheet once nav is wired. */
  onShareInvite?: (inviteUrl: string) => void;
}

export function whenPressed(pressed: boolean, style: StyleProp<ViewStyle>): StyleProp<ViewStyle> {
  return pressed ? style : null;
}

const TOTAL_STEPS = 4;
const STEP_LABELS = ['Choose a mission', 'Invite', 'Deadline & details', 'Review & send'];

interface StepIndicatorProps {
  step: number;
  styles: CreateChallengeStyles;
}

function StepIndicator({ step, styles }: StepIndicatorProps) {
  return (
    <View
      style={styles.stepsRow}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${step} of ${TOTAL_STEPS}: ${STEP_LABELS[step - 1]}`}
    >
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((n) => (
        <React.Fragment key={n}>
          <View style={[styles.node, n <= step ? styles.nodeActive : styles.nodeTodo]}>
            <Text style={[styles.nodeText, n <= step && styles.nodeTextActive]}>{n < step ? '✓' : n}</Text>
          </View>
          {n < TOTAL_STEPS ? <View style={[styles.seg, n < step && styles.segActive]} /> : null}
        </React.Fragment>
      ))}
    </View>
  );
}

export default function CreateChallengeScreen({
  onCancel,
  onCreated,
  onShareInvite,
}: CreateChallengeScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<ChallengeDraft>(EMPTY_DRAFT);

  const homeQuery = useQuery<HomeResponse>({ queryKey: ['home'], queryFn: getHome });
  const daily = homeQuery.data?.dailyMission ?? null;

  const sendMutation = useMutation({
    mutationFn: async (): Promise<{ task: Task; invite: InviteResponse }> => {
      const task = await createTask(buildCreateRequest(draft));
      const invite = await generateTaskInvite(task.id);
      return { task, invite };
    },
    onSuccess: ({ invite }) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onShareInvite?.(invite.inviteUrl);
    },
  });

  const update = useCallback((patch: Partial<ChallengeDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const goNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }, []);

  const goBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setStep((s) => s - 1);
  }, []);

  const handleHeaderBack = useCallback(() => {
    if (step === 1) onCancel?.();
    else goBack();
  }, [step, onCancel, goBack]);

  const selectDaily = useCallback(() => {
    if (!daily) return;
    update({
      source: 'daily',
      title: daily.title,
      description: daily.desc,
      rewardXp: parseInt(daily.xp, 10) || null,
    });
  }, [daily, update]);

  const selectCustom = useCallback(() => {
    update({ source: 'custom', title: '', description: '', rewardXp: null });
  }, [update]);

  const handleSend = useCallback(() => {
    sendMutation.mutate();
  }, [sendMutation]);

  const proceedable = canProceed(step, draft);
  const sent = sendMutation.isSuccess ? sendMutation.data : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={handleHeaderBack}
          accessibilityRole="button"
          accessibilityLabel={step === 1 ? 'Cancel and go back' : 'Previous step'}
          style={({ pressed }) => [styles.backBtn, whenPressed(pressed, styles.backBtnPressed)]}
        >
          <Text style={styles.backGlyph}>{step === 1 ? '✕' : '‹'}</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          Send a challenge
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {sent ? (
        <View style={styles.sentArea}>
          <Text style={styles.sentGlyph} accessibilityElementsHidden importantForAccessibility="no">
            {'🎉'}
          </Text>
          <Text accessibilityRole="header" style={styles.sentTitle}>
            Challenge created
          </Text>
          <Text style={styles.sentBody}>
            Share this link so your friend can accept — nobody is added without
            accepting first.
          </Text>
          <View style={styles.linkBox} accessible accessibilityRole="text" accessibilityLabel={`Invite link: ${sent.invite.inviteUrl}`}>
            <Text style={styles.linkText} numberOfLines={1}>
              {sent.invite.inviteUrl}
            </Text>
          </View>
          <Pressable
            onPress={() => onShareInvite?.(sent.invite.inviteUrl)}
            accessibilityRole="button"
            accessibilityLabel="Share invite link"
            style={({ pressed }) => [styles.primaryBtn, whenPressed(pressed, styles.btnPressed)]}
          >
            <Text style={styles.primaryBtnText}>Share invite link</Text>
          </Pressable>
          <Pressable
            onPress={() => onCreated?.(sent.task.id)}
            accessibilityRole="button"
            accessibilityLabel="Done"
            style={({ pressed }) => [styles.secondaryBtn, whenPressed(pressed, styles.btnPressed)]}
          >
            <Text style={styles.secondaryBtnText}>Done</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.indicatorWrap}>
            <StepIndicator step={step} styles={styles} />
            <Text style={styles.stepLabel}>{`Step ${step} of ${TOTAL_STEPS} · ${STEP_LABELS[step - 1]}`}</Text>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Animated.View key={step} entering={FadeInRight.duration(CompassMotion.durationStandard)} style={styles.stepBody}>
              {step === 1 ? (
                <View style={styles.stepGap}>
                  <Text style={styles.stepHeading}>Pick a mission to send</Text>
                  {daily ? (
                    <Pressable
                      onPress={selectDaily}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: draft.source === 'daily' }}
                      accessibilityLabel={`Use today's mission: ${daily.title}`}
                      style={[styles.selectCard, draft.source === 'daily' && styles.selectCardSelected]}
                    >
                      <Text style={styles.selectTitle}>{daily.title}</Text>
                      <Text style={styles.selectSub}>{`Today's daily mission · ${daily.xp} XP`}</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={selectCustom}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: draft.source === 'custom' }}
                    accessibilityLabel="Write a custom challenge"
                    style={[styles.selectCard, draft.source === 'custom' && styles.selectCardSelected]}
                  >
                    <Text style={styles.selectTitle}>Custom challenge</Text>
                    <Text style={styles.selectSub}>Write your own title and details</Text>
                  </Pressable>

                  {draft.source === 'custom' ? (
                    <View style={styles.stepGap}>
                      <Text style={styles.fieldLabel}>Title</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Hike three trails this month"
                        placeholderTextColor={colors.textTertiary}
                        value={draft.title}
                        onChangeText={(t) => update({ title: t })}
                        accessibilityLabel="Challenge title"
                        maxLength={200}
                      />
                      <Text style={styles.fieldLabel}>Details (optional)</Text>
                      <TextInput
                        style={[styles.input, styles.inputMultiline]}
                        placeholder="Add any specifics…"
                        placeholderTextColor={colors.textTertiary}
                        value={draft.description}
                        onChangeText={(t) => update({ description: t })}
                        accessibilityLabel="Challenge details"
                        multiline
                        maxLength={2000}
                      />
                    </View>
                  ) : null}
                </View>
              ) : null}

              {step === 2 ? (
                <View style={styles.stepGap}>
                  <Text style={styles.stepHeading}>{"Who's this for?"}</Text>
                  <Text style={styles.stepCaption}>
                    Invites are link-based — your friend gets a safe link and is
                    never auto-added. They join only by accepting.
                  </Text>
                  <View style={[styles.selectCard, styles.selectCardSelected]} accessible accessibilityLabel="Invite by link, selected">
                    <Text style={styles.selectTitle}>Invite by link</Text>
                    <Text style={styles.selectSub}>Anyone with the link can view and accept</Text>
                  </View>
                </View>
              ) : null}

              {step === 3 ? (
                <View style={styles.stepGap}>
                  <Text style={styles.stepHeading}>Add some details</Text>
                  <Text style={styles.fieldLabel}>End date</Text>
                  <View style={styles.chipRow} accessibilityRole="radiogroup" accessibilityLabel="Deadline">
                    {DEADLINE_OPTIONS.map((opt) => {
                      const selected = draft.deadline === opt.key;
                      return (
                        <Pressable
                          key={opt.key}
                          onPress={() => update({ deadline: opt.key as DeadlineChoice })}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: selected }}
                          accessibilityLabel={opt.label}
                          style={[styles.choiceChip, selected && styles.choiceChipSelected]}
                        >
                          <Text style={[styles.choiceChipText, selected && styles.choiceChipTextSelected]}>
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Pressable
                    onPress={() => update({ requireReview: !draft.requireReview })}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: draft.requireReview }}
                    accessibilityLabel="Require photo proof you review"
                    style={styles.toggleRow}
                  >
                    <View style={styles.toggleBody}>
                      <Text style={styles.toggleTitle}>Require photo proof you review</Text>
                      <Text style={styles.toggleSub}>
                        You approve or reject their evidence before it counts.
                      </Text>
                    </View>
                    <View style={[styles.toggle, draft.requireReview && styles.toggleOn]}>
                      <View style={[styles.toggleThumb, draft.requireReview && styles.toggleThumbOn]} />
                    </View>
                  </Pressable>
                </View>
              ) : null}

              {step === 4 ? (
                <View style={styles.stepGap}>
                  <Text style={styles.stepHeading}>Review before sending</Text>
                  <View style={styles.reviewCard}>
                    <ReviewRow k="Mission" v={draft.title.trim() || 'Untitled'} styles={styles} />
                    <ReviewRow k="Reward" v={draft.rewardXp != null ? `${draft.rewardXp} XP` : 'No XP reward'} styles={styles} />
                    <ReviewRow k="Sending via" v="Invite link" styles={styles} />
                    <ReviewRow k="Deadline" v={deadlineLabel(draft.deadline)} styles={styles} />
                    <ReviewRow
                      k="Verification"
                      v={draft.requireReview ? 'You review photo proof' : 'Self-verified'}
                      styles={styles}
                    />
                    <ReviewRow k="Who can see proof" v="You and your friend only" styles={styles} last />
                  </View>
                  {sendMutation.isError ? (
                    <Text style={styles.errorText} accessibilityRole="text">
                      Couldn&apos;t send the challenge. Check your connection and try again.
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </Animated.View>
          </ScrollView>

          <View style={styles.ctaBar}>
            {step < TOTAL_STEPS ? (
              <Pressable
                onPress={goNext}
                disabled={!proceedable}
                accessibilityRole="button"
                accessibilityLabel="Continue"
                accessibilityState={{ disabled: !proceedable }}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  !proceedable && styles.btnDisabled,
                  whenPressed(pressed, styles.btnPressed),
                ]}
              >
                <Text style={styles.primaryBtnText}>Continue</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleSend}
                disabled={sendMutation.isPending}
                accessibilityRole="button"
                accessibilityLabel="Send challenge"
                accessibilityState={{ disabled: sendMutation.isPending, busy: sendMutation.isPending }}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  sendMutation.isPending && styles.btnDisabled,
                  whenPressed(pressed, styles.btnPressed),
                ]}
              >
                <Text style={styles.primaryBtnText}>
                  {sendMutation.isPending ? 'Sending…' : 'Send challenge'}
                </Text>
              </Pressable>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

interface ReviewRowProps {
  k: string;
  v: string;
  styles: CreateChallengeStyles;
  last?: boolean;
}

function ReviewRow({ k, v, styles, last }: ReviewRowProps) {
  return (
    <View style={[styles.reviewRow, last && styles.reviewRowLast]} accessible accessibilityRole="text" accessibilityLabel={`${k}: ${v}`}>
      <Text style={styles.reviewK}>{k}</Text>
      <Text style={styles.reviewV}>{v}</Text>
    </View>
  );
}
