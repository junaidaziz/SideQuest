import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  findNodeHandle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { getHome } from '../../services/homeApi';
import type { LevelInfo } from '../../types/api';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { Icon } from '../../components/icons';
import { CompassHeader, textStyle, pressedStyle } from '../../components/compass';
import { LoadingState, ErrorState } from '../../components/states';
import { levelName, nextLevelName, formatXp } from '../ProgressOverviewScreen/progress';
import { createStyles } from './YouScreen.styles';

export interface YouScreenProps {
  /** Header gear → Settings. Wired by the route wrapper once nav is chosen. */
  onSettings?: () => void;
  /** "Edit profile" → EditProfileScreen. */
  onEditProfile?: () => void;
  /** Signed-in payment-methods entry point (preserved from ProfileScreen). */
  onPaymentMethods?: () => void;
  /** Guest CTAs. */
  onCreateAccount?: () => void;
  onLoginExisting?: () => void;
  /** Fired after logout resolves to a fresh guest session. */
  onLoggedOut?: () => void;
}

/** Two-letter initials from name → email local-part → neutral glyph. */
export function initialsFromName(name: string | null, email: string | null): string {
  const source = (name && name.trim()) || (email && email.trim()) || '';
  if (!source) return '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

/** Best display name with graceful fallbacks. */
export function displayNameOrFallback(name: string | null, email: string | null): string {
  return (name && name.trim()) || (email && email.trim()) || 'Explorer';
}

/** XP progress toward the next level as a 0–100 percentage, NaN-guarded. */
export function xpProgressPercent(level: LevelInfo): number {
  const total = level.xpIntoLevel + level.xpToNextLevel;
  if (total <= 0) return 0;
  return Math.round((level.xpIntoLevel / total) * 100);
}

export default function YouScreen({
  onSettings,
  onEditProfile,
  onPaymentMethods,
  onCreateAccount,
  onLoginExisting,
  onLoggedOut,
}: YouScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const homeQuery = useQuery({ queryKey: ['home'], queryFn: getHome });
  const { data, isLoading, isError } = homeQuery;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const cancelRef = useRef<View>(null);

  // Move accessibility focus onto the (non-destructive) cancel action when the
  // confirm dialog opens — the safe default for a destructive confirm,
  // mirroring the live ProfileScreen's pattern. A real <Modal> is natively
  // isolated on both platforms, so no manual sibling-hiding is needed.
  useEffect(() => {
    if (!confirmOpen) return;
    const handle = cancelRef.current ? findNodeHandle(cancelRef.current) : null;
    if (handle != null) {
      AccessibilityInfo.setAccessibilityFocus(handle);
    }
  }, [confirmOpen]);

  const handleConfirmLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await logout();
      setConfirmOpen(false);
      onLoggedOut?.();
    } catch {
      // authStore.logout swallows server revoke failures; only a local clear
      // failure lands here. Keep the dialog open so the user can retry.
    } finally {
      setLoggingOut(false);
    }
  }, [logout, onLoggedOut]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <CompassHeader title="You" large />
        <LoadingState label="Loading your profile" />
      </SafeAreaView>
    );
  }

  const isGuest = user.isGuest;
  const name = displayNameOrFallback(user.displayName, user.email);
  const gear = (
    <Pressable
      onPress={onSettings}
      accessibilityRole="button"
      accessibilityLabel="Settings"
      hitSlop={8}
      style={({ pressed }) => (pressedStyle(pressed, 0.6))}
    >
      <Icon name="settings" size={22} color={colors.textPrimary} testID="you-settings-icon" />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <CompassHeader title="You" large right={gear} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isGuest ? (
          <View
            style={styles.guestCard}
            accessible
            accessibilityLabel="You're browsing as a guest. Your progress is saved on this device. Create an account to keep it safe."
          >
            <View style={styles.guestAvatar} importantForAccessibility="no">
              <Icon name="you" size={26} color={colors.textTertiary} />
            </View>
            <View style={styles.identityCopy}>
              <Text style={[textStyle('labelL'), styles.guestTitle]}>
                You&apos;re browsing as a guest
              </Text>
              <Text style={[textStyle('bodyS'), styles.guestSub]}>
                Your XP and streak are real — saved on this device. Create an account to keep them safe.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.profileHead}>
            <LinearGradient
              colors={[colors.brandViolet, colors.brandVioletDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarLg}
              accessible
              accessibilityLabel={`Signed in as ${name}`}
            >
              {user.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={styles.avatarImage}
                  accessibilityIgnoresInvertColors
                  accessibilityLabel="Your profile photo"
                />
              ) : (
                <Text style={styles.avatarInitials}>
                  {initialsFromName(user.displayName, user.email)}
                </Text>
              )}
            </LinearGradient>
            <View style={styles.identityCopy}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              {data ? (
                <>
                  <Text style={styles.level}>{`Level ${data.level.level} · ${levelName(data.level.level)}`}</Text>
                  <View
                    style={styles.xpTrack}
                    accessibilityRole="progressbar"
                    accessibilityValue={{
                      min: 0,
                      max: 100,
                      now: xpProgressPercent(data.level),
                    }}
                    accessibilityLabel={`${data.level.xpIntoLevel} of ${data.level.xpIntoLevel + data.level.xpToNextLevel} XP toward ${nextLevelName(data.level.level)}`}
                  >
                    <View style={[styles.xpFill, { width: `${xpProgressPercent(data.level)}%` }]} />
                  </View>
                  <Text style={[textStyle('caption'), styles.xpLine]}>
                    {`${formatXp(data.level.xpIntoLevel)} / ${formatXp(data.level.xpIntoLevel + data.level.xpToNextLevel)} XP · ${formatXp(data.level.xpToNextLevel)} to ${nextLevelName(data.level.level)}`}
                  </Text>
                </>
              ) : user.email ? (
                <Text style={[textStyle('bodyS'), styles.email]} numberOfLines={1}>
                  {user.email}
                </Text>
              ) : null}
            </View>
          </View>
        )}

        <View>
          <Text style={[textStyle('labelM'), styles.sectionLabel]}>
            {isGuest ? 'This session in numbers' : 'Your quest story in numbers'}
          </Text>
          {isLoading ? (
            <LoadingState variant="list" count={1} label="Loading your stats" />
          ) : isError || !data ? (
            <ErrorState
              title="Couldn't load your progress"
              description="Check your connection and try again."
              onRetry={() => homeQuery.refetch()}
              retryLabel="Try again"
            />
          ) : (
            <>
              <View
                style={styles.metricRow}
                accessible
                accessibilityLabel={`${data.taskStats.approved} quests completed, best streak ${data.streak.longestStreak} days, ${data.savedPacks.length} saved packs`}
              >
                <MetricCard
                  icon={<Icon name="check" size={20} color={colors.statusSuccess} />}
                  value={data.taskStats.approved}
                  label="Quests completed"
                  styles={styles}
                />
                <MetricCard
                  icon={<Icon name="flame" size={20} color={colors.streak} />}
                  value={data.streak.longestStreak}
                  label="Best streak"
                  styles={styles}
                />
                <MetricCard
                  icon={<Icon name="bookmark" size={20} color={colors.actionPrimary} />}
                  value={data.savedPacks.length}
                  label="Saved packs"
                  styles={styles}
                />
              </View>
              <View
                style={[styles.streakCard, { marginTop: 16 }]}
                accessible
                accessibilityLabel={`Current streak ${data.streak.currentStreak} days. Complete a quest today to keep it going.`}
              >
                <Icon name="flame" size={28} color={colors.streak} testID="you-streak-flame" />
                <View style={styles.identityCopy}>
                  <Text style={[textStyle('labelL'), styles.streakValue]}>
                    {`${data.streak.currentStreak}-day streak`}
                  </Text>
                  <Text style={[textStyle('bodyS'), styles.streakSub]}>
                    Complete a quest today to keep it going
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* TODO(compass): achievements earned, stories unlocked, and favorite
            categories from the mockup await backend endpoints — they are not in
            HomeResponse yet, so they are intentionally omitted rather than
            hardcoded to fake counts. */}

        {isGuest ? (
          <View style={styles.actions}>
            <Pressable
              onPress={onCreateAccount}
              accessibilityRole="button"
              accessibilityLabel="Create an account"
              style={({ pressed }) => [styles.primaryBtn, pressedStyle(pressed)]}
            >
              <Text style={styles.primaryBtnText}>Create an account</Text>
            </Pressable>
            <Pressable
              onPress={onLoginExisting}
              accessibilityRole="button"
              accessibilityLabel="Log in to an existing account"
              style={({ pressed }) => [styles.secondaryBtn, pressedStyle(pressed)]}
            >
              <Text style={styles.secondaryBtnText}>Log in to an existing account</Text>
            </Pressable>
            <Text style={[textStyle('bodyS'), styles.footnote]}>
              Creating an account keeps this exact progress — nothing resets.
            </Text>
          </View>
        ) : (
          <View style={styles.actions}>
            <Pressable
              onPress={onEditProfile}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              style={({ pressed }) => [styles.secondaryBtn, pressedStyle(pressed)]}
            >
              <Text style={styles.secondaryBtnText}>Edit profile</Text>
            </Pressable>
            <Pressable
              onPress={onPaymentMethods}
              accessibilityRole="button"
              accessibilityLabel="Payment methods"
              accessibilityHint="Opens your saved cards"
              style={({ pressed }) => [styles.secondaryBtn, pressedStyle(pressed)]}
            >
              <Text style={styles.secondaryBtnText}>Payment methods</Text>
            </Pressable>
            <View style={styles.privacyNote}>
              <Icon name="lock" size={16} color={colors.textSecondary} />
              <Text style={[textStyle('bodyS'), styles.privacyText]}>
                Your profile is private. Only you can see your quest history.
              </Text>
            </View>
            <Pressable
              onPress={() => setConfirmOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Log out"
              accessibilityHint="Opens a confirmation dialog"
              style={({ pressed }) => [styles.dangerBtn, pressedStyle(pressed)]}
            >
              <Text style={styles.dangerBtnText}>Log out</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={confirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmOpen(false)}
        accessibilityViewIsModal
      >
        <View style={styles.overlay}>
          <Pressable
            testID="logout-backdrop"
            style={styles.backdrop}
            importantForAccessibility="no"
            accessibilityElementsHidden
            onPress={() => setConfirmOpen(false)}
          />
          <View style={styles.sheet} accessibilityViewIsModal accessibilityRole="alert">
            <Text accessibilityRole="header" style={[textStyle('h2'), styles.sheetTitle]}>
              Log out of this account?
            </Text>
            <Text style={[textStyle('bodyM'), styles.sheetBody]}>
              You&apos;ll go back to a fresh guest session on this device. Your account isn&apos;t deleted — {name} and all its progress stay safe.
            </Text>
            <View style={styles.sheetActions}>
              <Pressable
                onPress={handleConfirmLogout}
                disabled={loggingOut}
                accessibilityRole="button"
                accessibilityLabel="Log out of this account"
                accessibilityState={{ disabled: loggingOut }}
                style={({ pressed }) => [styles.dangerBtn, pressedStyle(pressed)]}
              >
                <Text style={styles.dangerBtnText}>
                  {loggingOut ? 'Logging out…' : 'Log out'}
                </Text>
              </Pressable>
              <Pressable
                ref={cancelRef}
                onPress={() => setConfirmOpen(false)}
                disabled={loggingOut}
                accessibilityRole="button"
                accessibilityLabel="Stay logged in"
                accessibilityState={{ disabled: loggingOut }}
                style={({ pressed }) => [styles.secondaryBtn, pressedStyle(pressed)]}
              >
                <Text style={styles.secondaryBtnText}>Stay logged in</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MetricCard({
  icon,
  value,
  label,
  styles,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.metricCard} importantForAccessibility="no-hide-descendants">
      <View style={styles.metricIconWrap}>{icon}</View>
      <Text style={styles.metricNum}>{value}</Text>
      <Text style={[textStyle('caption'), styles.metricCap]}>{label}</Text>
    </View>
  );
}
