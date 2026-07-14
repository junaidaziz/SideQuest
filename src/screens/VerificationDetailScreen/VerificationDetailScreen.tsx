import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { CompassMotion } from '../../constants/compassDesign';
import { makeStyles } from './VerificationDetailScreen.styles';

type Styles = ReturnType<typeof makeStyles>;

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface ProofThumb {
  id: string;
  /** Single-glyph/letter label shown on the thumbnail placeholder. */
  label: string;
}

export interface VerificationDetail {
  missionTitle: string;
  submittedAt: string;
  status: VerificationStatus;
  xpPending: number;
  proofThumbs: ProofThumb[];
  /** Present only when status is 'rejected'. */
  rejectionReason?: string;
}

export interface HistoryEntry {
  id: string;
  missionTitle: string;
  when: string;
  xp: number;
  status: VerificationStatus;
  glyph: string;
}

const STATUS_LABEL: Record<VerificationStatus, string> = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export interface TimelineStep {
  id: string;
  title: string;
  time: string;
  state: 'done' | 'current' | 'rejected' | 'upcoming';
}

/**
 * Builds the three-node review timeline from the current status. There is no
 * verification-history endpoint yet, so this derives the visual states from the
 * single status field the caller supplies rather than a server timeline.
 */
export function buildTimeline(status: VerificationStatus): TimelineStep[] {
  return [
    { id: 'submitted', title: 'Submitted', time: 'Proof received', state: 'done' },
    {
      id: 'review',
      title: status === 'rejected' ? 'Rejected' : 'Pending review',
      time: status === 'pending' ? 'Usually within a day' : STATUS_LABEL[status],
      state: status === 'pending' ? 'current' : status === 'rejected' ? 'rejected' : 'done',
    },
    {
      id: 'approved',
      title: 'Approved',
      time: status === 'approved' ? 'XP settled' : 'XP will settle here',
      state: status === 'approved' ? 'done' : 'upcoming',
    },
  ];
}

interface VerificationDetailScreenProps {
  detail?: VerificationDetail;
  history?: HistoryEntry[];
  isLoading?: boolean;
  onBack?: () => void;
  onHelp?: () => void;
  onRequestUpdate?: () => void;
  onDelete?: () => void;
  onResubmit?: () => void;
  onRetry?: () => void;
}

function badgeStyles(status: VerificationStatus, styles: Styles) {
  if (status === 'approved') return { box: styles.badgeApproved, text: styles.badgeTextApproved };
  if (status === 'rejected') return { box: styles.badgeRejected, text: styles.badgeTextRejected };
  return { box: styles.badgePending, text: styles.badgeTextPending };
}

function TimelineRow({ step, isLast, styles }: { step: TimelineStep; isLast: boolean; styles: Styles }) {
  const nodeStyle =
    step.state === 'done'
      ? styles.tlNodeDone
      : step.state === 'current'
        ? styles.tlNodeCurrent
        : step.state === 'rejected'
          ? styles.tlNodeRejected
          : null;
  const glyph = step.state === 'done' ? '✓' : step.state === 'current' ? '⏳' : step.state === 'rejected' ? '✕' : '';
  return (
    <View style={styles.tlItem} accessible accessibilityLabel={`${step.title}. ${step.time}`}>
      <View style={styles.tlRail}>
        <View style={[styles.tlNode, nodeStyle]}>
          {glyph ? (
            <Text style={styles.tlNodeGlyph} accessibilityElementsHidden importantForAccessibility="no">
              {glyph}
            </Text>
          ) : null}
        </View>
        {isLast ? null : <View style={styles.tlLine} />}
      </View>
      <View style={styles.tlBody}>
        <Text style={[styles.tlTitle, step.state === 'upcoming' && styles.tlTitleMuted]}>{step.title}</Text>
        <Text style={styles.tlTime}>{step.time}</Text>
      </View>
    </View>
  );
}

function HistoryRow({ entry, styles }: { entry: HistoryEntry; styles: Styles }) {
  const badge = badgeStyles(entry.status, styles);
  return (
    <View style={styles.historyItem} accessible accessibilityLabel={`${entry.missionTitle}, ${entry.when}, ${entry.xp} XP, ${STATUS_LABEL[entry.status]}`}>
      <View style={styles.historyIcon}>
        <Text style={styles.historyIconGlyph} accessibilityElementsHidden importantForAccessibility="no">
          {entry.glyph}
        </Text>
      </View>
      <View style={styles.historyBody}>
        <Text style={styles.historyTitle}>{entry.missionTitle}</Text>
        <Text style={styles.historyCap}>{`${entry.when} · ${entry.xp} XP`}</Text>
      </View>
      <View style={[styles.badge, badge.box]}>
        <Text style={[styles.badgeText, badge.text]}>{STATUS_LABEL[entry.status]}</Text>
      </View>
    </View>
  );
}

export default function VerificationDetailScreen({
  detail,
  history = [],
  isLoading = false,
  onBack,
  onHelp,
  onRequestUpdate,
  onDelete,
  onResubmit,
  onRetry,
}: VerificationDetailScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handleRetry = useCallback(() => (onRetry ?? onBack)?.(), [onRetry, onBack]);

  const badge = detail ? badgeStyles(detail.status, styles) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back to progress" style={styles.iconBtn}>
          <Text style={styles.iconGlyph}>{'‹'}</Text>
        </Pressable>
        <Text style={styles.topTitle}>Verification</Text>
        <Pressable onPress={onHelp} accessibilityRole="button" accessibilityLabel="Help with verification" style={styles.iconBtn}>
          <Text style={styles.iconGlyph}>{'?'}</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.stateArea} accessibilityRole="progressbar" accessibilityLabel="Loading verification">
          <View style={[styles.skel, styles.skelLine]} />
          <View style={[styles.skel, styles.skelBlock]} />
        </View>
      ) : !detail ? (
        <View style={styles.stateArea}>
          <Text style={styles.emptyIcon} accessibilityElementsHidden importantForAccessibility="no">{'\u{1F4ED}'}</Text>
          <Text accessibilityRole="header" style={styles.stateTitle}>
            Nothing to verify yet
          </Text>
          <Text style={styles.stateBody}>Submit a quest&apos;s proof and its review status will appear here.</Text>
          <Pressable onPress={handleRetry} accessibilityRole="button" accessibilityLabel="Back to progress from empty state" style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Back to progress</Text>
          </Pressable>
        </View>
      ) : (
        <Animated.View style={styles.scroll} entering={FadeInDown.duration(CompassMotion.durationStandard)}>
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <View>
              <View style={[styles.badge, badge!.box]}>
                <Text style={[styles.badgeText, badge!.text]}>{STATUS_LABEL[detail.status]}</Text>
              </View>
              <Text accessibilityRole="header" style={styles.title}>
                {detail.missionTitle}
              </Text>
              <Text style={styles.date}>{`Submitted ${detail.submittedAt}`}</Text>
            </View>

            <View>
              <View style={styles.proofPreview} accessibilityLabel={`${detail.proofThumbs.length} submitted proof items`}>
                {detail.proofThumbs.map((thumb) => (
                  <View key={thumb.id} style={styles.pp} accessibilityLabel={`Proof ${thumb.label}`}>
                    <Text style={styles.ppText} accessibilityElementsHidden importantForAccessibility="no">
                      {thumb.label}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.audienceNote}>
                <Text accessibilityElementsHidden importantForAccessibility="no">{'\u{1F512}'}</Text>
                <Text style={styles.audienceText}>Visible to you and reviewers only. Media links refresh each time you open this.</Text>
              </View>
            </View>

            <View>
              <Text accessibilityRole="header" style={styles.secTitle}>
                Status
              </Text>
              {buildTimeline(detail.status).map((step, idx, arr) => (
                <TimelineRow key={step.id} step={step} isLast={idx === arr.length - 1} styles={styles} />
              ))}
            </View>

            <View style={styles.xpImpact}>
              <Text style={styles.xpImpactLabel}>{detail.status === 'approved' ? 'XP earned' : 'XP on approval'}</Text>
              <View style={styles.xpBadge}>
                <Text style={styles.xpBadgeText}>{`${detail.xpPending} XP ${detail.status === 'approved' ? 'earned' : 'pending'}`}</Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <Pressable onPress={onRequestUpdate} accessibilityRole="button" accessibilityLabel="Request review update" style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Request review update</Text>
              </Pressable>
              <Pressable onPress={onDelete} accessibilityRole="button" accessibilityLabel="Delete this proof" style={styles.deleteBtn}>
                <Text style={styles.deleteGlyph} accessibilityElementsHidden importantForAccessibility="no">{'\u{1F5D1}\u{FE0F}'}</Text>
              </Pressable>
            </View>

            {detail.status === 'rejected' && detail.rejectionReason ? (
              <View style={styles.rejectReason} accessibilityRole="text">
                <Text accessibilityElementsHidden importantForAccessibility="no">{'\u{21BA}'}</Text>
                <Text style={styles.rejectText}>
                  <Text style={styles.rejectBold}>Why it bounced: </Text>
                  {detail.rejectionReason}{' '}
                </Text>
                <Pressable onPress={onResubmit} accessibilityRole="button" accessibilityLabel="Resubmit proof">
                  <Text style={styles.link}>Resubmit</Text>
                </Pressable>
              </View>
            ) : null}

            {history.length > 0 ? (
              <View>
                <Text accessibilityRole="header" style={styles.secTitle}>
                  Earlier
                </Text>
                {history.map((entry) => (
                  <HistoryRow key={entry.id} entry={entry} styles={styles} />
                ))}
              </View>
            ) : null}
          </ScrollView>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
