import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleProp, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import type { HomeResponse, PaginatedReferralHistory, ReferralMe } from '../../types/api';
import { getHome } from '../../services/homeApi';
import { getReferralHistory, getReferralMe } from '../../services/referralsApi';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { makeStyles } from './RewardsScreen.styles';

export interface RewardsScreenProps {
  onBack?: () => void;
  /** Share the referral link — routed to the OS share sheet once nav is wired. */
  onShareInvite?: (inviteUrl: string) => void;
}

export function whenPressed(pressed: boolean, style: StyleProp<ViewStyle>): StyleProp<ViewStyle> {
  return pressed ? style : null;
}

/**
 * DATA HONESTY: unlike the fully-conceptual 34-rewards.html mockup (which the
 * mockup itself flags "Future concept … no separate reward currency"), this
 * screen is wired to the REAL data that now exists:
 *   - Total XP earned            → `GET /home` (`level.totalXp`) — real.
 *   - Referral program stats     → `GET /referrals/me` — real.
 *   - Individual referral rewards → `GET /referrals/history` — real.
 * SideQuest genuinely has one currency (XP) and a real referral-reward path, so
 * we present those truthfully instead of the mockup's invented "profile frame"
 * / "extra sparks" entitlements, for which no backend exists.
 */
export interface ReferralReward {
  id: string;
  title: string;
  xp: number | null;
  when: string | null;
}

/** Short human date (e.g. "Jul 2") from an ISO string, or null when absent. */
export function formatShortDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Maps completed referral history rows into reward line items. */
export function toRewards(history: PaginatedReferralHistory | undefined): ReferralReward[] {
  if (!history) return [];
  return history.items
    .filter((item) => item.status === 'Completed')
    .map((item) => ({
      id: item.id,
      title: 'Referral reward earned',
      xp: item.rewardXp,
      when: formatShortDate(item.completedAt) ?? formatShortDate(item.createdAt),
    }));
}

interface HeroProps {
  me: ReferralMe;
  home: HomeResponse;
  colors: ReturnType<typeof useCompassTheme>['colors'];
  styles: ReturnType<typeof makeStyles>;
}

function RewardsHero({ me, home, colors, styles }: HeroProps) {
  return (
    <LinearGradient
      colors={[colors.brandGold, '#E08A1E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
      accessible
      accessibilityLabel={`${home.level.totalXp.toLocaleString()} total XP earned, ${me.rewardsEarnedXp.toLocaleString()} of it from referrals`}
    >
      <Text style={styles.heroEyebrow}>Total XP earned</Text>
      <Text style={styles.heroTotal}>{home.level.totalXp.toLocaleString()}</Text>
      <Text style={styles.heroSub}>
        {`${me.rewardsEarnedXp.toLocaleString()} XP earned from referrals · server-owned, no mystery boxes`}
      </Text>
    </LinearGradient>
  );
}

export default function RewardsScreen({ onBack, onShareInvite }: RewardsScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const homeQuery = useQuery<HomeResponse>({ queryKey: ['home'], queryFn: getHome });
  const meQuery = useQuery<ReferralMe>({ queryKey: ['referralMe'], queryFn: getReferralMe });
  const historyQuery = useQuery<PaginatedReferralHistory>({
    queryKey: ['referralHistory'],
    queryFn: () => getReferralHistory(),
  });

  const isLoading = homeQuery.isLoading || meQuery.isLoading || historyQuery.isLoading;
  const isError = homeQuery.isError || meQuery.isError || historyQuery.isError;
  const ready = homeQuery.data && meQuery.data;

  const handleRetry = useCallback(() => {
    homeQuery.refetch();
    meQuery.refetch();
    historyQuery.refetch();
  }, [homeQuery, meQuery, historyQuery]);

  const handleShare = useCallback(() => {
    if (meQuery.data) onShareInvite?.(meQuery.data.inviteUrl);
  }, [meQuery.data, onShareInvite]);

  const rewards = useMemo(() => toRewards(historyQuery.data), [historyQuery.data]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => onBack?.()}
          accessibilityRole="button"
          accessibilityLabel="Back to profile"
          style={({ pressed }) => [styles.backBtn, whenPressed(pressed, styles.backBtnPressed)]}
        >
          <Text style={styles.backGlyph}>{'‹'}</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          Rewards
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.stateArea} accessibilityRole="progressbar" accessibilityLabel="Loading rewards">
          <View style={[styles.skel, styles.skelHero]} />
          <View style={[styles.skel, styles.skelCard]} />
        </View>
      ) : isError || !ready ? (
        <View style={styles.stateArea} accessibilityLabel="Couldn't load rewards">
          <Text accessibilityRole="header" style={styles.stateHeading}>
            {"Couldn't load rewards"}
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
          <RewardsHero me={meQuery.data!} home={homeQuery.data!} colors={colors} styles={styles} />

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Referral program</Text>
            <View style={styles.statRow}>
              <Text style={styles.statName}>People referred</Text>
              <Text style={styles.statVal}>{meQuery.data!.totalReferrals}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statName}>Rewarded referrals</Text>
              <Text style={styles.statVal}>{meQuery.data!.completedReferrals}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statName}>Awaiting first completion</Text>
              <Text style={styles.statVal}>{meQuery.data!.pendingReferrals}</Text>
            </View>
            <Pressable
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel={`Share your invite link, code ${meQuery.data!.code}`}
              style={({ pressed }) => [styles.shareBtn, whenPressed(pressed, styles.shareBtnPressed)]}
            >
              <Text style={styles.shareBtnText}>{`Share invite · ${meQuery.data!.code}`}</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Reward history</Text>
            {rewards.length > 0 ? (
              rewards.map((r) => (
                <View
                  key={r.id}
                  style={styles.histRow}
                  accessible
                  accessibilityRole="text"
                  accessibilityLabel={`${r.title}${r.xp != null ? `, ${r.xp} XP` : ''}${r.when ? `, ${r.when}` : ''}`}
                >
                  <View style={styles.histBody}>
                    <Text style={styles.histTitle}>{r.title}</Text>
                    {r.when ? <Text style={styles.histWhen}>{r.when}</Text> : null}
                  </View>
                  {r.xp != null ? (
                    <View style={styles.xpBadge}>
                      <Text style={styles.xpBadgeText}>{`+${r.xp} XP`}</Text>
                    </View>
                  ) : null}
                </View>
              ))
            ) : (
              <Text style={styles.emptyText} accessibilityRole="text">
                No referral rewards yet — share your invite link to start earning XP.
              </Text>
            )}
          </View>

          <Text style={styles.footnote} accessibilityRole="text">
            SideQuest uses a single currency — XP. All rewards are granted by the
            server and reviewable anytime. No purchases, no loot boxes.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
