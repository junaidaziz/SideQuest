import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  findNodeHandle,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { AlertButton } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { getHome } from '../../services/homeApi';
import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_MIN_LENGTH,
  updateDisplayName,
} from '../../services/profileApi';
import { removeAvatar, uploadAvatar } from '../../services/avatarApi';
import { Colors } from '../../constants/design';
// Reuse the exact same derivations Home uses so the shared level/streak UI
// reads identically in both contexts — no re-implementation, no drift.
import { computeXpProgress, formatStreakLabel, whenPressed } from '../HomeScreen';
import { styles } from './ProfileScreen.styles';

interface ProfileScreenProps {
  /** Header back button — routed via router.back() by app/profile.tsx. */
  onBack?: () => void;
  /** Guest state: "Create an account" CTA — routes into the signup flow. */
  onCreateAccount?: () => void;
  /** Guest state: "Log in to an existing account" CTA — routes to login. */
  onLoginExisting?: () => void;
  /** Fired after logout completes successfully (fresh guest session). */
  onLoggedOut?: () => void;
  /** Signed-in only: opens the saved-cards screen (routes to /payment-methods). */
  onPaymentMethods?: () => void;
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

/**
 * Validates a candidate display name against the same 1-50 char bounds the
 * backend enforces (`UpdateProfileDto`). Returns an error message, or null when
 * the trimmed value is acceptable to submit. Trims first so a whitespace-only
 * entry is rejected client-side rather than sent and 400'd.
 */
export function validateDisplayName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < DISPLAY_NAME_MIN_LENGTH) {
    return 'Enter a display name';
  }
  if (trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
    return `Keep it to ${DISPLAY_NAME_MAX_LENGTH} characters or fewer`;
  }
  return null;
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
  onPaymentMethods,
}: ProfileScreenProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  // Shares the ['home'] cache with HomeScreen's own query — TanStack Query
  // dedupes, so opening Profile after Home does not trigger a second fetch.
  const homeQuery = useQuery({ queryKey: ['home'], queryFn: getHome });
  const { data, isLoading, isError } = homeQuery;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const cancelRef = useRef<View>(null);

  // ── Inline display-name editing ──
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  // ── Avatar upload / removal ──
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const nameMutation = useMutation({
    mutationFn: (name: string) => updateDisplayName(name),
    onSuccess: (updated) => {
      updateProfile(updated);
      setEditingName(false);
      setNameError(null);
    },
    onError: () => {
      setNameError("Couldn't save your name. Please try again.");
    },
  });

  const avatarMutation = useMutation({
    mutationFn: (uri: string) => uploadAvatar(uri),
    onSuccess: (updated) => {
      updateProfile(updated);
      setAvatarError(null);
    },
    onError: () => {
      setAvatarError("Couldn't update your photo. Please try again.");
    },
  });

  const removeAvatarMutation = useMutation({
    mutationFn: () => removeAvatar(),
    onSuccess: (updated) => {
      updateProfile(updated);
      setAvatarError(null);
    },
    onError: () => {
      setAvatarError("Couldn't remove your photo. Please try again.");
    },
  });

  const savingName = nameMutation.isPending;
  const avatarBusy = avatarMutation.isPending || removeAvatarMutation.isPending;

  const handleStartEdit = useCallback(() => {
    setDraftName(user?.displayName ?? '');
    setNameError(null);
    setEditingName(true);
  }, [user?.displayName]);

  const handleDraftNameChange = useCallback((value: string) => {
    setDraftName(value);
    // Clear a stale validation/save error as the user corrects their input,
    // matching LoginScreen's field-error clearing behaviour.
    setNameError((prev) => (prev ? null : prev));
  }, []);

  const handleCancelEdit = useCallback(() => {
    if (savingName) return;
    setEditingName(false);
    setNameError(null);
  }, [savingName]);

  const handleSaveName = useCallback(() => {
    if (savingName) return;
    const error = validateDisplayName(draftName);
    if (error) {
      setNameError(error);
      return;
    }
    nameMutation.mutate(draftName.trim());
  }, [draftName, nameMutation, savingName]);

  const applyPickerResult = useCallback(
    (result: ImagePicker.ImagePickerResult) => {
      if (result.canceled) return;
      const uri = result.assets?.[0]?.uri;
      if (uri) {
        setAvatarError(null);
        avatarMutation.mutate(uri);
      }
    },
    [avatarMutation],
  );

  const launchCamera = useCallback(async () => {
    setAvatarError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setAvatarError(
        'Camera access is off. Enable it in Settings to take a photo.',
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    applyPickerResult(result);
  }, [applyPickerResult]);

  const launchLibrary = useCallback(async () => {
    setAvatarError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setAvatarError(
        'Photo access is off. Enable it in Settings to choose a photo.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    applyPickerResult(result);
  }, [applyPickerResult]);

  const hasAvatar = Boolean(user?.avatarUrl);

  const presentAvatarOptions = useCallback(() => {
    if (avatarBusy) return;
    const options: AlertButton[] = [
      { text: 'Take Photo', onPress: () => void launchCamera() },
      { text: 'Choose from Library', onPress: () => void launchLibrary() },
    ];
    if (hasAvatar) {
      options.push({
        text: 'Remove Current Photo',
        style: 'destructive',
        onPress: () => removeAvatarMutation.mutate(),
      });
    }
    options.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Profile photo', 'Update or remove your profile photo.', options);
  }, [avatarBusy, hasAvatar, launchCamera, launchLibrary, removeAvatarMutation]);

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
    // Nav-agnostic by design: this screen never calls a navigation library
    // directly. app/profile.tsx's onBack callback is what actually runs
    // router.back().
    onBack?.();
  }, [onBack]);

  const handleCreateAccount = useCallback(() => {
    // Nav-agnostic by design: app/profile.tsx's onCreateAccount callback is
    // what actually runs router.push('/signup-prompt').
    onCreateAccount?.();
  }, [onCreateAccount]);

  const handleLoginExisting = useCallback(() => {
    // Nav-agnostic by design: app/profile.tsx's onLoginExisting callback is
    // what actually runs router.push('/login').
    onLoginExisting?.();
  }, [onLoginExisting]);

  const handlePaymentMethods = useCallback(() => {
    // Nav-agnostic by design: app/profile.tsx's onPaymentMethods callback is
    // what actually runs router.push('/payment-methods').
    onPaymentMethods?.();
  }, [onPaymentMethods]);

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
          <View style={styles.idCard}>
            <Pressable
              onPress={presentAvatarOptions}
              disabled={avatarBusy}
              accessibilityRole="button"
              accessibilityLabel={
                avatarBusy
                  ? 'Updating profile photo'
                  : hasAvatar
                    ? 'Change or remove profile photo'
                    : 'Add a profile photo'
              }
              accessibilityState={{ disabled: avatarBusy, busy: avatarBusy }}
              style={({ pressed }) => [
                styles.idAvatar,
                whenPressed(pressed, styles.idAvatarPressed),
              ]}
            >
              {user.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={styles.idAvatarImage}
                  accessibilityIgnoresInvertColors
                  accessibilityLabel="Your profile photo"
                />
              ) : (
                <Text style={styles.idAvatarText}>
                  {initialsFromName(user.displayName, user.email)}
                </Text>
              )}
              {avatarBusy ? (
                <View
                  style={styles.avatarBusyOverlay}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                >
                  <ActivityIndicator color={Colors.white} />
                </View>
              ) : (
                <View
                  style={styles.avatarEditBadge}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                >
                  <Text style={styles.avatarEditGlyph}>{'\u{1F4F7}'}</Text>
                </View>
              )}
            </Pressable>

            <View style={styles.identityCopy}>
              {editingName ? (
                <View style={styles.nameEditWrap}>
                  <TextInput
                    value={draftName}
                    onChangeText={handleDraftNameChange}
                    editable={!savingName}
                    maxLength={DISPLAY_NAME_MAX_LENGTH}
                    placeholder="Your display name"
                    placeholderTextColor={Colors.textSecondary}
                    autoFocus
                    style={[
                      styles.nameInput,
                      nameError ? styles.nameInputInvalid : null,
                    ]}
                    accessibilityLabel="Display name"
                  />
                  {nameError ? (
                    <Text
                      style={styles.fieldError}
                      accessibilityRole="alert"
                      accessibilityLiveRegion="polite"
                    >
                      {nameError}
                    </Text>
                  ) : null}
                  <View style={styles.nameEditActions}>
                    <Pressable
                      onPress={handleSaveName}
                      disabled={savingName}
                      accessibilityRole="button"
                      accessibilityLabel="Save display name"
                      accessibilityState={{ disabled: savingName, busy: savingName }}
                      style={({ pressed }) => [
                        styles.nameSaveBtn,
                        whenPressed(pressed, styles.nameSaveBtnPressed),
                        savingName ? styles.nameSaveBtnDisabled : null,
                      ]}
                    >
                      <Text style={styles.nameSaveBtnText}>
                        {savingName ? 'Saving…' : 'Save'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleCancelEdit}
                      disabled={savingName}
                      accessibilityRole="button"
                      accessibilityLabel="Cancel editing display name"
                      accessibilityState={{ disabled: savingName }}
                      style={({ pressed }) => [
                        styles.nameCancelBtn,
                        whenPressed(pressed, styles.nameCancelBtnPressed),
                      ]}
                    >
                      <Text style={styles.nameCancelBtnText}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={styles.nameRow}>
                  <Text style={styles.idName} numberOfLines={1}>
                    {name}
                  </Text>
                  <Pressable
                    onPress={handleStartEdit}
                    accessibilityRole="button"
                    accessibilityLabel="Edit display name"
                    style={({ pressed }) => [
                      styles.nameEditBtn,
                      whenPressed(pressed, styles.nameEditBtnPressed),
                    ]}
                  >
                    <Text style={styles.nameEditGlyph}>{'✎'}</Text>
                  </Pressable>
                </View>
              )}
              {user.email ? (
                <Text style={styles.idEmail} numberOfLines={1}>
                  {user.email}
                </Text>
              ) : null}
              {avatarError ? (
                <Text
                  style={styles.fieldError}
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                >
                  {avatarError}
                </Text>
              ) : null}
              {!editingName ? (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>{'✓ Progress synced'}</Text>
                </View>
              ) : null}
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
              accessible
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
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.levelCard}
                accessible
                accessibilityLabel="Your level and XP"
              >
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
              </LinearGradient>

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
          <View style={styles.ctaStack}>
            <Pressable
              onPress={handlePaymentMethods}
              accessibilityRole="button"
              accessibilityLabel="Payment methods"
              accessibilityHint="Opens your saved cards"
              style={({ pressed }) => [
                styles.settingsRow,
                whenPressed(pressed, styles.secondaryBtnPressed),
              ]}
            >
              <Text style={styles.settingsRowText}>Payment methods</Text>
              <Text
                style={styles.settingsRowChevron}
                accessibilityElementsHidden
                importantForAccessibility="no"
              >
                {'›'}
              </Text>
            </Pressable>
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
          </View>
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
