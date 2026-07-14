import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CompassRadius, CompassSpacing, type CompassPalette } from '../../constants/compassDesign';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { textStyle } from '../compass/typography';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';

export type SyncTone = 'muted' | 'info' | 'success' | 'error';

export interface SyncState {
  text: string;
  tone: SyncTone;
  /** Whether tapping should trigger a retry (only the failed state). */
  actionable: boolean;
}

export interface SyncStateInput {
  offline: boolean;
  isSyncing: boolean;
  /** Items not yet synced and not permanently failed (includes in-flight). */
  pending: number;
  failed: number;
  /** True briefly after the queue drains to empty. */
  justSynced: boolean;
}

/**
 * Pure state machine for the indicator (M23.5), extracted so its precedence is
 * unit-testable without rendering. Returns null when there's nothing worth
 * showing (idle + empty + online) so the indicator stays unobtrusive. A bare
 * offline state with nothing queued also returns null — the global
 * `OfflineBanner` already communicates that, no need to double up.
 */
export function computeSyncState(input: SyncStateInput): SyncState | null {
  const { offline, isSyncing, pending, failed, justSynced } = input;
  if (failed > 0) {
    return {
      text: `${failed} didn't sync · tap to retry`,
      tone: 'error',
      actionable: true,
    };
  }
  if (isSyncing) {
    return { text: 'Syncing…', tone: 'info', actionable: false };
  }
  if (offline && pending > 0) {
    return { text: `${pending} waiting for connection`, tone: 'muted', actionable: false };
  }
  if (pending > 0) {
    return { text: `${pending} pending`, tone: 'muted', actionable: false };
  }
  if (justSynced) {
    return { text: 'All synced', tone: 'success', actionable: false };
  }
  return null;
}

/** How long the transient "All synced" confirmation stays up. */
export const SYNCED_VISIBLE_MS = 2500;

export interface SyncIndicatorProps {
  testID?: string;
}

/**
 * Small, unobtrusive pill sourced from the offline write-queue's current state:
 * offline / N pending / syncing / all-synced / N-didn't-sync-tap-to-retry.
 * Floats above content; tapping the failed state retries the queue.
 */
export function SyncIndicator({ testID }: SyncIndicatorProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { offline, isSyncing, pending, failed, retryAll } = useOfflineQueue();

  const active = pending + failed;
  const prevActive = useRef(active);
  const [justSynced, setJustSynced] = useState(false);

  useEffect(() => {
    const wasActive = prevActive.current;
    prevActive.current = active;
    if (wasActive > 0 && active === 0) {
      setJustSynced(true);
      const timer = setTimeout(() => setJustSynced(false), SYNCED_VISIBLE_MS);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [active]);

  const state = computeSyncState({ offline, isSyncing, pending, failed, justSynced });
  if (!state) return null;

  const toneColor = TONE_COLOR(colors)[state.tone];

  const content = (
    <View style={[styles.pill, { borderColor: toneColor }]}>
      <View style={[styles.dot, { backgroundColor: toneColor }]} />
      <Text style={[textStyle('caption'), styles.label]}>{state.text}</Text>
    </View>
  );

  if (state.actionable) {
    return (
      <View style={styles.wrap} pointerEvents="box-none">
        <Pressable
          testID={testID}
          onPress={retryAll}
          accessibilityRole="button"
          accessibilityLabel={`${failed} changes didn't sync. Tap to retry.`}
          style={({ pressed }) => [pressed ? styles.pressed : null]}
        >
          {content}
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View
        testID={testID}
        accessibilityRole="text"
        accessibilityLabel={state.text}
        accessibilityLiveRegion="polite"
      >
        {content}
      </View>
    </View>
  );
}

function TONE_COLOR(colors: CompassPalette): Record<SyncTone, string> {
  return {
    muted: colors.textSecondary,
    info: colors.actionPrimary,
    success: colors.statusSuccess,
    error: colors.statusError,
  };
}

function makeStyles(colors: CompassPalette) {
  return StyleSheet.create({
    wrap: {
      position: 'absolute',
      bottom: CompassSpacing.s6,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: CompassSpacing.s2,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderRadius: CompassRadius.pill,
      paddingVertical: CompassSpacing.s2,
      paddingHorizontal: CompassSpacing.s4,
      // Soft lift so it reads as floating chrome, not part of the page.
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    label: {
      color: colors.textPrimary,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
