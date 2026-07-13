import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  findNodeHandle,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { getHome } from '../services/homeApi';
import {
  Colors,
  Fonts,
  FontSize,
  LineHeight,
  Radius,
  Spacing,
} from '../constants/design';
// Reuse the exact same derivations Home uses so the shared level/streak UI
// reads identically in both contexts — no re-implementation, no drift.
import { computeXpProgress, formatStreakLabel, whenPressed } from './HomeScreen';

interface ProfileScreenProps {
  /** Header back button. Navigation placeholder until nav library is chosen. */
  onBack?: () => void;
  /** Guest state: "Create an account" CTA — routes into the signup flow. */
  onCreateAccount?: () => void;
  /** Guest state: "Log in to an existing account" CTA — routes to login. */
  onLoginExisting?: () => void;
  /** Fired after logout completes successfully (fresh guest session). */
  onLoggedOut?: () => void;
}

/**
 * Two-letter avatar initials derived from the display name, falling back to the
 * email local-part, then a neutral glyph. Keeps the signed-in identity card
 * populated even when the backend returns a null display name.
 */
export function initialsFromName(
  name: string | null,
  email: string | null,
): string {
  const source = (name && name.trim()) || (email && email.trim()) || '';
  if (!source) return '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

/** Best display name for the signed-in card, with graceful fallbacks. */
export function displayNameOrFallback(
  name: string | null,
  email: string | null,
): string {
  return (name && name.trim()) || (email && email.trim()) || 'Explorer';
}

/** Skeleton shown while a required data source is still loading. */
function ProfileSkeleton({ label }: { label: string }) {
  return (
    <View
      style={styles.skeletonWrap}
      accessibilityLabel={label}
      accessibilityRole="progressbar"
    >
      <View style={[styles.skel, styles.skelCard]} />
      <View style={[styles.skel, styles.skelBar]} />
      <View style={[styles.skel, styles.skelCard]} />
    </View>
  );
}

export default function ProfileScreen({
  onBack,
  onCreateAccount,
  onLoginExisting,
  onLoggedOut,
}: ProfileScreenProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // Shares the ['home'] cache with HomeScreen's own query — TanStack Query
  // dedupes, so opening Profile after Home does not trigger a second fetch.
  const homeQuery = useQuery({ queryKey: ['home'], queryFn: getHome });
  const { data, isLoading, isError } = homeQuery;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const cancelRef = useRef<View>(null);

  // Move accessibility focus onto the (non-destructive) cancel action when the
  // confirm dialog opens — the safe default for a destructive confirm, mirroring
  // the mockup's setTimeout(...cancel.focus()). A real <Modal> is natively
  // isolated on both platforms, so no manual sibling-hiding is needed.
  useEffect(() => {
    if (!confirmOpen) return;
    const handle = cancelRef.current ? findNodeHandle(cancelRef.current) : null;
    if (handle != null) {
      AccessibilityInfo.setAccessibilityFocus(handle);
    }
  }, [confirmOpen]);

  const handleBack = useCallback(() => {
    // TODO: replace with navigation call once nav library is chosen
    // Expo Router:       router.back()
    // React Navigation:  navigation.goBack()
    onBack?.();
  }, [onBack]);

  const handleCreateAccount = useCallback(() => {
    // TODO: replace with navigation call once nav library is chosen
    // Expo Router:       router.push('/signup')
    // React Navigation:  navigation.navigate('SignupPrompt')
    onCreateAccount?.();
  }, [onCreateAccount]);

  const handleLoginExisting = useCallback(() => {
    // TODO: replace with navigation call once nav library is chosen
    // Expo Router:       router.push('/login')
    // React Navigation:  navigation.navigate('Login')
    onLoginExisting?.();
  }, [onLoginExisting]);

  const handleRetry = useCallback(() => {
    homeQuery.refetch();
  }, [homeQuery]);

  const openConfirm = useCallback(() => setConfirmOpen(true), []);
  const closeConfirm = useCallback(() => setConfirmOpen(false), []);

  const handleConfirmLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await logout();
      setConfirmOpen(false);
      onLoggedOut?.();
    } catch {
      // authStore.logout() already swallows server-side revocation failures
      // (best-effort), so the only way this rejects is a local failure (e.g.
      // a secure-store clear error). Keep the dialog open so the user can
      // retry rather than being told they logged out when the session may
      // still be live. No unhandled rejection escapes the handler.
    } finally {
      setLoggingOut(false);
    }
  }, [logout, onLoggedOut]);

  // Auth is still hydrating — nothing meaningful to show yet.
  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.headerTitle}>
            Profile
          </Text>
        </View>
        <ProfileSkeleton label="Loading your profile" />
      </SafeAreaView>
    );
  }

  const isGuest = user.isGuest;
  const name = displayNameOrFallback(user.displayName, user.email);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Back to home"
          style={({ pressed }) => [
            styles.iconBtn,
            whenPressed(pressed, styles.iconBtnPressed),
          ]}
        >
          <Text style={styles.iconGlyph}>{'‹'}</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.headerTitle}>
          Profile
        </Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Identity — sourced from authStore, always available ── */}
        {isGuest ? (
          <View
            style={styles.guestBanner}
            accessible
            accessibilityRole="text"
            accessibilityLabel={
              "You're browsing as a guest. Your XP and streak are real — they're " +
              'just saved on this device. Create an account to keep them safe, or ' +
              'log in to one you already have.'
            }
          >
            <View
              style={styles.guestAvatar}
              importantForAccessibility="no"
              accessibilityElementsHidden
            >
              <Text style={styles.guestAvatarGlyph}>{'\u{1F464}'}</Text>
            </View>
            <View style={styles.identityCopy}>
              <Text style={styles.guestTitle}>{"You're browsing as a guest"}</Text>
              <Text style={styles.guestSub}>
                {"Your XP and streak are real — they're just saved on this device. "}
                Create an account to keep them safe, or log in to one you already have.
              </Text>
            </View>
          </View>
        ) : (
          <View
            style={styles.idCard}
            accessible
            accessibilityRole="text"
            accessibilityLabel={`Signed in as ${name}${user.email ? `, ${user.email}` : ''}. Progress synced.`}
          >
            <View
              style={styles.idAvatar}
              importantForAccessibility="no"
              accessibilityElementsHidden
            >
              <Text style={styles.idAvatarText}>
                {initialsFromName(user.displayName, user.email)}
              </Text>
            </View>
            <View style={styles.identityCopy}>
              <Text style={styles.idName} numberOfLines={1}>
                {name}
              </Text>
              {user.email ? (
                <Text style={styles.idEmail} numberOfLines={1}>
                  {user.email}
                </Text>
              ) : null}
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>{'✓ Progress synced'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Level / streak — from the /home query ── */}
        <View>
          <Text style={styles.sectionLabel}>
            {isGuest ? 'THIS SESSION' : 'YOUR PROGRESS'}
          </Text>

          {isLoading ? (
            <ProfileSkeleton label="Loading your level and streak" />
          ) : isError || !data ? (
            <View
              style={styles.inlineError}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              accessibilityLabel="Couldn't load your progress"
            >
              <Text style={styles.errorHeading}>{"Couldn't load progress"}</Text>
              <Text style={styles.errorBody}>
                Check your connection and try again.
              </Text>
              <Pressable
                onPress={handleRetry}
                accessibilityRole="button"
                accessibilityLabel="Try again"
                style={({ pressed }) => [
                  styles.retryBtn,
                  whenPressed(pressed, styles.retryBtnPressed),
                ]}
              >
                <Text style={styles.retryBtnText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.progressGroup}>
              {/* XP level card. TODO: install expo-linear-gradient for the
                  mockup's purple gradient — solid primary fill is the interim. */}
              <View style={styles.levelCard} accessibilityLabel="Your level and XP">
                <View style={styles.levelTop}>
                  <View>
                    <Text style={styles.levelEyebrow}>
                      {isGuest ? 'THIS SESSION' : 'YOUR LEVEL'}
                    </Text>
                    <Text style={styles.levelTitle}>{`Level ${data.level.level}`}</Text>
                  </View>
                  <View
                    style={styles.xpBadge}
                    accessible
                    accessibilityRole="text"
                    accessibilityLabel={`${data.level.totalXp} XP total`}
                  >
                    <Text style={styles.xpBadgeText}>{`${data.level.totalXp} XP`}</Text>
                  </View>
                </View>

                <View
                  style={styles.xpTrack}
                  accessibilityRole="progressbar"
                  accessibilityValue={{
                    min: 0,
                    max: 100,
                    now: Math.round(computeXpProgress(data.level)),
                    text: `${data.level.xpIntoLevel} XP earned, ${data.level.xpToNextLevel} to go`,
                  }}
                  accessibilityLabel={`${data.level.xpToNextLevel} XP to level ${data.level.level + 1}`}
                >
                  {/* Runtime-computed percentage width — no static StyleSheet
                      alternative exists (matches HomeScreen's xpFill). */}
                  <View
                    style={[styles.xpFill, { width: `${computeXpProgress(data.level)}%` }]}
                  />
                </View>
                <Text style={styles.xpProgressLabel}>
                  {`${data.level.xpToNextLevel} XP to Level ${data.level.level + 1}`}
                </Text>
              </View>

              {/* Streak card */}
              <View
                style={styles.streakCard}
                accessible
                accessibilityRole="text"
                accessibilityLabel={`${formatStreakLabel(data.streak.currentStreak)}. Complete a quest today to keep it going`}
              >
                <Text
                  style={styles.streakIcon}
                  importantForAccessibility="no"
                  accessibilityElementsHidden
                >
                  {'\u{1F525}'}
                </Text>
                <View style={styles.streakInfo}>
                  <Text style={styles.streakValue}>
                    {formatStreakLabel(data.streak.currentStreak)}
                  </Text>
                  <Text style={styles.streakLabel}>
                    Complete a quest today to keep it going
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ── Actions ── */}
        {isGuest ? (
          <View style={styles.ctaStack}>
            <Pressable
              onPress={handleCreateAccount}
              accessibilityRole="button"
              accessibilityLabel="Create an account"
              style={({ pressed }) => [
                styles.primaryBtn,
                whenPressed(pressed, styles.primaryBtnPressed),
              ]}
            >
              <Text style={styles.primaryBtnText}>Create an account</Text>
            </Pressable>
            <Pressable
              onPress={handleLoginExisting}
              accessibilityRole="button"
              accessibilityLabel="Log in to an existing account"
              style={({ pressed }) => [
                styles.secondaryBtn,
                whenPressed(pressed, styles.secondaryBtnPressed),
              ]}
            >
              <Text style={styles.secondaryBtnText}>
                Log in to an existing account
              </Text>
            </Pressable>
            <Text style={styles.footnote}>
              Creating an account keeps this exact progress — nothing resets.
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={openConfirm}
            accessibilityRole="button"
            accessibilityLabel="Log out"
            accessibilityHint="Opens a confirmation dialog"
            style={({ pressed }) => [
              styles.logoutBtn,
              whenPressed(pressed, styles.logoutBtnPressed),
            ]}
          >
            <Text style={styles.logoutBtnText}>Log out</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Logout confirm dialog. A real <Modal> is natively isolated on iOS and
          Android (this session's accessibility-parity work confirmed no manual
          Android sibling-hiding is needed), so accessibilityViewIsModal on the
          content root is sufficient to gate the background from assistive tech. */}
      <Modal
        visible={confirmOpen}
        transparent
        animationType="fade"
        onRequestClose={closeConfirm}
        accessibilityViewIsModal
      >
        <View style={styles.overlay}>
          {/* The sheet's accessibilityViewIsModal gates this backdrop from
              assistive tech (the in-sheet "Stay logged in" button is the AT
              dismiss path), so it carries a testID rather than an a11y label. */}
          <Pressable
            testID="logout-backdrop"
            style={styles.backdrop}
            importantForAccessibility="no"
            accessibilityElementsHidden
            onPress={closeConfirm}
          />
          <View
            style={styles.sheet}
            accessibilityViewIsModal
            accessibilityRole="alert"
          >
            <View style={styles.sheetHandle} />
            <Text accessibilityRole="header" style={styles.sheetTitle}>
              Log out of this account?
            </Text>
            <Text style={styles.sheetBody}>
              {"You'll go back to a fresh guest session on this device — new XP and "}
              streak start from zero here. Your account isn&apos;t deleted:{' '}
              <Text style={styles.sheetBodyStrong}>{name}</Text>
              {' and all its progress stay safe, and you can log back in anytime to '}
              pick up where you left off.
            </Text>
            <View style={styles.sheetActions}>
              <Pressable
                onPress={handleConfirmLogout}
                disabled={loggingOut}
                accessibilityRole="button"
                accessibilityLabel="Log out of this account"
                accessibilityState={{ disabled: loggingOut }}
                style={({ pressed }) => [
                  styles.confirmBtn,
                  whenPressed(pressed, styles.confirmBtnPressed),
                  loggingOut ? styles.confirmBtnDisabled : null,
                ]}
              >
                <Text style={styles.confirmBtnText}>
                  {loggingOut ? 'Logging out…' : 'Log out'}
                </Text>
              </Pressable>
              <Pressable
                ref={cancelRef}
                onPress={closeConfirm}
                disabled={loggingOut}
                accessibilityRole="button"
                accessibilityLabel="Stay logged in"
                accessibilityState={{ disabled: loggingOut }}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  whenPressed(pressed, styles.secondaryBtnPressed),
                ]}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.chip,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: {
    backgroundColor: Colors.surfaceMuted,
    borderColor: Colors.primary,
  },
  iconGlyph: {
    fontSize: 24,
    lineHeight: 26,
    color: Colors.ink,
  },
  headerTitle: {
    fontFamily: Fonts.displayBold,
    fontSize: 17,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  guestBanner: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
    padding: Spacing.base,
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.card,
  },
  guestAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestAvatarGlyph: {
    fontSize: 22,
  },
  identityCopy: {
    flex: 1,
  },
  guestTitle: {
    fontFamily: Fonts.displayBold,
    fontSize: 17,
    color: Colors.ink,
    letterSpacing: -0.2,
    marginBottom: Spacing.xs,
  },
  guestSub: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.caption,
    lineHeight: LineHeight.caption,
    color: Colors.textSecondary,
  },
  idCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
    padding: Spacing.base,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.card,
  },
  idAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idAvatarText: {
    fontFamily: Fonts.displayExtraBold,
    fontSize: 22,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  idName: {
    fontFamily: Fonts.displayExtraBold,
    fontSize: 19,
    color: Colors.ink,
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  idEmail: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
  },
  verifiedBadge: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.successLight,
    borderRadius: 6,
  },
  verifiedText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  sectionLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  progressGroup: {
    gap: Spacing.base,
  },
  levelCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.card,
    padding: Spacing.base,
  },
  levelTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  levelEyebrow: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.7,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  levelTitle: {
    fontFamily: Fonts.displayExtraBold,
    fontSize: 18,
    color: Colors.white,
    letterSpacing: -0.2,
  },
  xpBadge: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: 20,
  },
  xpBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.caption,
    fontWeight: '700',
    color: Colors.ink,
  },
  xpTrack: {
    height: 8,
    backgroundColor: Colors.onPrimaryFill,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  xpFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  xpProgressLabel: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.caption,
    color: Colors.white,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.accentLight,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    borderRadius: Radius.card,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  streakIcon: {
    fontSize: 32,
  },
  streakInfo: {
    flex: 1,
  },
  streakValue: {
    fontFamily: Fonts.displayExtraBold,
    fontSize: 20,
    color: Colors.accentDark,
    marginBottom: 3,
  },
  streakLabel: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
  },
  ctaStack: {
    gap: Spacing.md,
  },
  primaryBtn: {
    borderRadius: Radius.btn,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnPressed: {
    backgroundColor: Colors.primaryDark,
  },
  primaryBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.button,
    color: Colors.white,
  },
  secondaryBtn: {
    borderRadius: Radius.btn,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnPressed: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  secondaryBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.body,
    color: Colors.ink,
  },
  footnote: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.caption,
    lineHeight: LineHeight.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xs,
  },
  logoutBtn: {
    borderRadius: Radius.btn,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnPressed: {
    // No light-error token in the shared palette; a neutral muted fill plus the
    // error-coloured border reads as the destructive pressed state token-safely.
    borderColor: Colors.error,
    backgroundColor: Colors.surfaceMuted,
  },
  logoutBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.body,
    color: Colors.error,
  },
  inlineError: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.card,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  errorHeading: {
    fontFamily: Fonts.displayBold,
    fontSize: FontSize.cardLabel,
    color: Colors.ink,
    textAlign: 'center',
  },
  errorBody: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.caption,
    lineHeight: LineHeight.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: Spacing.sm,
    borderRadius: Radius.btn,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  retryBtnPressed: {
    backgroundColor: Colors.primaryLight,
  },
  retryBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.body,
    color: Colors.primary,
  },
  skeletonWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.base,
  },
  skel: {
    backgroundColor: Colors.border,
    borderRadius: Radius.card,
  },
  skelCard: {
    height: 108,
  },
  skelBar: {
    height: 72,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Colors.scrim,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sheetTitle: {
    fontFamily: Fonts.displayExtraBold,
    fontSize: 22,
    color: Colors.ink,
    letterSpacing: -0.3,
    marginBottom: Spacing.sm,
  },
  sheetBody: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.body,
    lineHeight: LineHeight.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  sheetBodyStrong: {
    fontFamily: Fonts.bodySemiBold,
    color: Colors.ink,
  },
  sheetActions: {
    gap: Spacing.md,
  },
  confirmBtn: {
    borderRadius: Radius.btn,
    backgroundColor: Colors.error,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnPressed: {
    // Darken the error fill on press without a new hex token — the shared
    // palette has no errorDark, so opacity is the token-safe pressed treatment.
    opacity: 0.85,
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.body,
    color: Colors.white,
  },
});
