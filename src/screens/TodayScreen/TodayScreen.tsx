import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleProp, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { CompassMotion } from '../../constants/compassDesign';
import { Icon } from '../../components/icons';
import { ResponsiveImage } from '../../components/media';
import { getHome } from '../../services/homeApi';
import { getUnreadCount } from '../../services/notificationsApi';
import { makeStyles } from './TodayScreen.styles';
import type { MediaVariant } from '../../types/api';

export type { HomeResponse } from '../../types/api';

/** Weekly-goal progress. No backend field exists for this yet — the caller
 * supplies it (or the realistic placeholder default below is used). */
export interface WeeklyGoal {
  completed: number;
  target: number;
}

interface TodayScreenProps {
  /** Bell tap — opens the notification inbox. */
  onOpenNotifications?: () => void;
  /** Avatar tap — routed to the profile/You tab once nav is wired. */
  onOpenProfile?: () => void;
  /** Hero "Get inspired" CTA — routed to Explore / quest generation. */
  onGetInspired?: () => void;
  /** "Explore more quests" row — routed to the Explore tab. */
  onOpenExplore?: () => void;
  /** "Continue your story" pending-proof card tap — opens verification detail. */
  onOpenPendingProof?: () => void;
  /** Placeholder until a weekly-goal backend contract exists. */
  weeklyGoal?: WeeklyGoal;
  /** Signed-in display name for the avatar chip (from authStore at the call site). */
  displayName?: string | null;
  /** Signed-in profile photo for the avatar chip (from authStore at the call
   * site) — shown instead of the initial when present, so the same photo
   * set in Edit Profile is reflected here too. */
  avatarUrl?: string | null;
  /** Responsive sizes of the same photo, when uploaded via the media pipeline — see `ResponsiveImage`. */
  avatarVariants?: readonly MediaVariant[] | null;
}

const DEFAULT_GOAL: WeeklyGoal = { completed: 3, target: 5 };

/** Logical (point) size of the header avatar chip — matches `avatarImage` in TodayScreen.styles.ts. */
const AVATAR_SIZE = 48;

/** 0–100 progress toward the weekly goal, guarding a zero/oversized target. */
export function computeGoalProgress(goal: WeeklyGoal): number {
  if (goal.target <= 0) return 0;
  return Math.min(100, (goal.completed / goal.target) * 100);
}

/** First initial for the avatar chip, falling back to a neutral glyph. */
export function avatarInitial(displayName?: string | null): string {
  const trimmed = displayName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed[0].toUpperCase() : '★';
}

/** Press-scale feedback shared by Compass CTAs (spring to 0.97 on press-in). */
export function usePressScale() {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability -- reanimated shared values are intentionally mutable
    scale.value = withSpring(0.97, { damping: 18, stiffness: 320 });
  }, [scale]);
  const onPressOut = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability -- reanimated shared values are intentionally mutable
    scale.value = withSpring(1, { damping: 18, stiffness: 320 });
  }, [scale]);
  return { style, onPressIn, onPressOut };
}

function whenPressed(pressed: boolean, style: StyleProp<ViewStyle>): StyleProp<ViewStyle> {
  return pressed ? style : null;
}

export default function TodayScreen({
  onOpenNotifications,
  onOpenProfile,
  onGetInspired,
  onOpenExplore,
  onOpenPendingProof,
  weeklyGoal = DEFAULT_GOAL,
  displayName,
  avatarUrl,
  avatarVariants,
}: TodayScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const heroCta = usePressScale();

  const homeQuery = useQuery({ queryKey: ['home'], queryFn: getHome });
  const { data, isLoading, isError } = homeQuery;
  const unreadQuery = useQuery({ queryKey: ['notifications', 'unread-count'], queryFn: getUnreadCount });
  const unreadCount = unreadQuery.data?.unreadCount ?? 0;

  const handleGetInspired = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onGetInspired?.();
  }, [onGetInspired]);

  const handleRetry = useCallback(() => {
    homeQuery.refetch();
  }, [homeQuery]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.greeting}>
          Today
        </Text>
        <View style={styles.headerRight}>
          <Pressable
            onPress={onOpenNotifications}
            accessibilityRole="button"
            accessibilityLabel={
              unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
            }
            style={({ pressed }) => [styles.iconBtn, whenPressed(pressed, styles.iconBtnPressed)]}
          >
            <Icon name="bell" size={20} color={colors.textPrimary} testID="today-bell-icon" />
            {unreadCount > 0 ? (
              <View style={styles.unreadBadge} accessibilityElementsHidden importantForAccessibility="no">
                <Text style={styles.unreadBadgeText}>{unreadCount > 9 ? '9+' : String(unreadCount)}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            onPress={onOpenProfile}
            accessibilityRole="button"
            accessibilityLabel="Open your profile"
            style={styles.avatar}
          >
            {avatarUrl || (avatarVariants && avatarVariants.length > 0) ? (
              <ResponsiveImage
                testID="today-avatar-image"
                variants={avatarVariants}
                fallbackUrl={avatarUrl}
                width={AVATAR_SIZE}
                style={styles.avatarImage}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            ) : (
              <Text style={styles.avatarText}>{avatarInitial(displayName)}</Text>
            )}
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.stateArea}>
          <View
            style={styles.skeletonWrap}
            accessibilityRole="progressbar"
            accessibilityLabel="Loading your day"
          >
            <View style={[styles.skel, styles.skelHero]} />
            <View style={[styles.skel, styles.skelBar]} />
            <View style={[styles.skel, styles.skelRow]} />
          </View>
        </View>
      ) : isError || !data ? (
        <View style={styles.stateArea}>
          <Text accessibilityRole="header" style={styles.stateTitle}>
            {"Couldn't load Today"}
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
        <Animated.View style={styles.scroll} entering={FadeInDown.duration(CompassMotion.durationStandard)}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <LinearGradient
              colors={[colors.heroGradStart, colors.heroGradEnd]}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.hero}
              accessible
              accessibilityLabel="Daily spark"
            >
              <View style={styles.heroEyebrowRow}>
                <Icon name="spark" size={14} color={colors.onHero} testID="today-spark-icon" />
                <Text style={styles.heroEyebrow}>Daily spark</Text>
              </View>
              <Text style={styles.heroTitle}>
                {data.dailyMission ? data.dailyMission.title : 'One small step.\nBig ripple.'}
              </Text>
              <Text style={styles.heroSub}>
                {data.dailyMission
                  ? data.dailyMission.desc
                  : 'A 15-minute quest picked for your usual evening rhythm.'}
              </Text>
              <Animated.View style={heroCta.style}>
                <Pressable
                  onPress={handleGetInspired}
                  onPressIn={heroCta.onPressIn}
                  onPressOut={heroCta.onPressOut}
                  accessibilityRole="button"
                  accessibilityLabel="Get inspired"
                  style={styles.heroCta}
                >
                  <Text style={styles.heroCtaText}>Get inspired</Text>
                </Pressable>
              </Animated.View>
            </LinearGradient>

            <View style={styles.secondaryRow}>
              <View style={[styles.card, styles.goalCard]}>
                <Text style={styles.label} numberOfLines={1}>
                  {"This week's goal"}
                </Text>
                <View
                  style={styles.track}
                  accessibilityRole="progressbar"
                  accessibilityValue={{ min: 0, max: 100, now: Math.round(computeGoalProgress(weeklyGoal)) }}
                  accessibilityLabel={`${weeklyGoal.completed} of ${weeklyGoal.target} weekly quests complete`}
                >
                  <View style={[styles.fill, { width: `${computeGoalProgress(weeklyGoal)}%` }]} />
                </View>
                <Text style={styles.caption}>
                  {`${weeklyGoal.completed} of ${weeklyGoal.target} quests`}
                </Text>
              </View>
              <View
                style={[styles.card, styles.streakCard]}
                accessible
                accessibilityRole="text"
                accessibilityLabel={`${data.streak.currentStreak} day streak. Complete a quest today to keep it going`}
              >
                <Icon name="flame" size={22} color={colors.streak} testID="today-streak-flame" />
                <Text style={styles.streakNum}>{data.streak.currentStreak}</Text>
                <Text style={styles.caption}>day streak</Text>
              </View>
            </View>

            {data.taskStats && data.taskStats.pending > 0 ? (
              <View>
                <Text style={styles.sectionLabel}>Continue your story</Text>
                <Pressable
                  onPress={onOpenPendingProof}
                  accessibilityRole="button"
                  accessibilityLabel={`${data.taskStats.pending} proof awaiting review. Open verification detail`}
                  style={styles.card}
                >
                  <View style={styles.storyRow}>
                    <View style={styles.storyIconWrap}>
                      <Text style={styles.storyIcon} accessibilityElementsHidden importantForAccessibility="no">
                        {'\u{23F3}'}
                      </Text>
                    </View>
                    <View style={styles.storyBody}>
                      <Text style={styles.storyTitle}>Proof under review</Text>
                      <Text style={styles.caption}>
                        {`${data.taskStats.pending} awaiting review · XP pending`}
                      </Text>
                    </View>
                    <View style={styles.badgePending}>
                      <Text style={styles.badgePendingText}>Pending</Text>
                    </View>
                  </View>
                </Pressable>
              </View>
            ) : null}

            <Pressable
              onPress={onOpenExplore}
              accessibilityRole="button"
              accessibilityLabel="Not feeling this? Explore more quests"
              style={styles.exploreLink}
            >
              <Text style={styles.exploreLinkText}>Not feeling this? Explore more quests</Text>
              <Icon name="chevronRight" size={18} color={colors.actionPrimary} testID="today-explore-chevron" />
            </Pressable>
          </ScrollView>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
