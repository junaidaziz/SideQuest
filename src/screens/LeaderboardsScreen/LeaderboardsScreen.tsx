import React, { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleProp, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import type { HomeResponse } from '../../types/api';
import { getHome } from '../../services/homeApi';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { Icon } from '../../components/icons';
import { makeStyles } from './LeaderboardsScreen.styles';

/**
 * DATA HONESTY: this is a UI-ONLY preview screen. SideQuest has NO
 * cross-user/leaderboard backend — there is no endpoint that exposes another
 * user's XP (confirmed: no community/leaderboard module in `backend/src/`).
 *
 * The ONLY real value shown is the current user's own approved XP, which we
 * pull from `GET /home` (`level.totalXp`) and place in the pinned "You" row so
 * that at least the user's own number is truthful. Every OTHER row is
 * illustrative placeholder content, explicitly framed "Preview" and given a
 * fixed sample XP — never presented as a real friend's live score. When a real
 * opt-in leaderboard endpoint exists it should replace `PREVIEW_FRIENDS`.
 */

export interface LeaderboardsScreenProps {
  onBack?: () => void;
  onOpenWeekPicker?: () => void;
  /** Signed-in display name for the "You" row initial (from authStore). */
  displayName?: string | null;
  /** Signed-in profile photo for the "You" row avatar (from authStore) —
   * shown instead of the initial when present. */
  avatarUrl?: string | null;
}

export function whenPressed(pressed: boolean, style: StyleProp<ViewStyle>): StyleProp<ViewStyle> {
  return pressed ? style : null;
}

export type LeaderboardScope = 'friends' | 'group';

export interface LeaderRow {
  id: string;
  name: string;
  initial: string;
  xp: number;
  isMe: boolean;
  /** Only ever set on the "me" row — sample rows have no real photo. */
  avatarUrl?: string | null;
}

/** Illustrative sample opponents — NOT live data. See the file-level note. */
export const PREVIEW_FRIENDS: Omit<LeaderRow, 'isMe'>[] = [
  { id: 'f1', name: 'Jordan', initial: 'J', xp: 2950 },
  { id: 'f2', name: 'Taylor', initial: 'T', xp: 2450 },
  { id: 'f3', name: 'Avery', initial: 'A', xp: 2150 },
  { id: 'f4', name: 'Casey', initial: 'C', xp: 1840 },
  { id: 'f5', name: 'Maya', initial: 'M', xp: 1610 },
];

/**
 * Builds the ranked list: the sample friends plus a real "You" row seeded with
 * the user's actual total XP, sorted descending. Rank is derived from position.
 */
export function buildRows(
  myXp: number,
  myInitial: string,
  myAvatarUrl?: string | null,
): LeaderRow[] {
  const me: LeaderRow = {
    id: 'me',
    name: 'You',
    initial: myInitial,
    xp: myXp,
    isMe: true,
    avatarUrl: myAvatarUrl,
  };
  const rows: LeaderRow[] = [...PREVIEW_FRIENDS.map((f) => ({ ...f, isMe: false })), me];
  return rows.sort((a, b) => b.xp - a.xp);
}

/** First initial for the "You" row, falling back to a neutral glyph. */
export function meInitial(displayName?: string | null): string {
  const trimmed = displayName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed[0].toUpperCase() : '★';
}

export default function LeaderboardsScreen({
  onBack,
  onOpenWeekPicker,
  displayName,
  avatarUrl,
}: LeaderboardsScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [scope, setScope] = useState<LeaderboardScope>('friends');
  const query = useQuery<HomeResponse>({ queryKey: ['home'], queryFn: getHome });
  const { data, isLoading, isError } = query;

  const handleRetry = useCallback(() => {
    query.refetch();
  }, [query]);

  const rows = useMemo(
    () => (data ? buildRows(data.level.totalXp, meInitial(displayName), avatarUrl) : []),
    [data, displayName, avatarUrl],
  );

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
          Leaderboards
        </Text>
        <Pressable
          onPress={() => onOpenWeekPicker?.()}
          accessibilityRole="button"
          accessibilityLabel="Choose week"
          style={({ pressed }) => [styles.iconBtn, whenPressed(pressed, styles.backBtnPressed)]}
        >
          <Text style={styles.iconGlyph}>{'📅'}</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.stateArea} accessibilityRole="progressbar" accessibilityLabel="Loading leaderboards">
          <View style={[styles.skel, styles.skelCard]} />
        </View>
      ) : isError || !data ? (
        <View style={styles.stateArea} accessibilityLabel="Couldn't load leaderboards">
          <Text accessibilityRole="header" style={styles.stateHeading}>
            {"Couldn't load leaderboards"}
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
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.conceptNote} accessibilityRole="text" accessibilityLabel="Preview. Leaderboards are a design preview. Only your own XP is real; other rows are samples.">
            <Text style={styles.conceptIcon} accessibilityElementsHidden importantForAccessibility="no">
              {'🧭'}
            </Text>
            <Text style={styles.conceptText}>
              <Text style={styles.conceptStrong}>Preview. </Text>
              There&apos;s no opt-in leaderboard backend yet. Only the highlighted
              &quot;You&quot; row shows your real XP — the other rows are samples.
            </Text>
          </View>

          <View style={styles.segmented} accessibilityRole="tablist" accessibilityLabel="Leaderboard scope">
            <Pressable
              onPress={() => setScope('friends')}
              accessibilityRole="tab"
              accessibilityState={{ selected: scope === 'friends' }}
              accessibilityLabel="Friends"
              style={[styles.seg, scope === 'friends' && styles.segSelected]}
            >
              <Text style={[styles.segText, scope === 'friends' && styles.segTextSelected]}>Friends</Text>
            </Pressable>
            <Pressable
              onPress={() => setScope('group')}
              accessibilityRole="tab"
              accessibilityState={{ selected: scope === 'group' }}
              accessibilityLabel="Group"
              style={[styles.seg, scope === 'group' && styles.segSelected]}
            >
              <Text style={[styles.segText, scope === 'group' && styles.segTextSelected]}>Group</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            {rows.map((row, index) => {
              const rank = index + 1;
              return (
                <View
                  key={row.id}
                  style={[styles.row, row.isMe && styles.rowMe]}
                  accessible
                  accessibilityRole="text"
                  accessibilityLabel={
                    row.isMe
                      ? `You, rank ${rank}, ${row.xp.toLocaleString()} approved XP (your real total)`
                      : `${row.name}, rank ${rank}, ${row.xp.toLocaleString()} XP, sample`
                  }
                >
                  <View style={[styles.rank, rank <= 3 && styles.rankTop, row.isMe && styles.rankMe]}>
                    <Text style={[styles.rankText, row.isMe && styles.rankTextMe]}>{rank}</Text>
                  </View>
                  <View style={styles.avatar}>
                    {row.avatarUrl ? (
                      <Image
                        testID={`leaderboard-avatar-${row.id}`}
                        source={{ uri: row.avatarUrl }}
                        style={styles.avatarImage}
                        accessibilityIgnoresInvertColors
                        accessibilityElementsHidden
                        importantForAccessibility="no"
                      />
                    ) : (
                      <Text style={styles.avatarText}>{row.initial}</Text>
                    )}
                  </View>
                  <Text style={[styles.rowName, row.isMe && styles.rowNameMe]}>{row.name}</Text>
                  <Text style={[styles.rowXp, row.isMe && styles.rowNameMe]}>{`${row.xp.toLocaleString()} ⭐`}</Text>
                </View>
              );
            })}
          </View>

          <Text style={styles.footnote} accessibilityRole="text">
            When a real leaderboard exists it will be opt-in only — no global
            board, only people you choose to connect with. Only approved quest XP
            would count, and rankings would reset weekly in your local time.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
