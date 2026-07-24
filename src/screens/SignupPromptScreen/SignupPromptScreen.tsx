import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useAuthStore } from '../../store/authStore';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { CompassMotion } from '../../constants/compassDesign';
import { Icon } from '../../components/icons';
import { makeStyles } from './SignupPromptScreen.styles';

/**
 * The guest-to-account gate. Per `sidequest.md` this appears *contextually* at
 * save-progress / earn-XP / send-challenge moments and never upfront — so the
 * trigger logic lives in whichever screen fires it, not here. This component is
 * purely presentational: the caller mounts it (bottom sheet or route) and
 * supplies `onSuccess` / `onDismiss`, plus the contextual XP/streak numbers.
 *
 * Signup itself goes through `useAuthStore.signup`, which persists tokens and
 * updates session state as a side effect — we never touch `authApi.signup`
 * directly, so a successful call leaves the user authenticated automatically.
 */
interface SignupPromptScreenProps {
  /** Fired after a successful signup (and the brief success beat). */
  onSuccess: () => void;
  /** Fired when the user taps "Continue as guest" or the backdrop. */
  onDismiss: () => void;
  /** XP earned this session that would be lost as a guest. Defaults to 40. */
  xpAtRisk?: number;
  /** Current streak length in days. Defaults to 3. */
  streakDays?: number;
}

type SubmitStatus = 'idle' | 'submitting' | 'success';

const BENEFITS = [
  'Save XP and level progress permanently',
  'Maintain your streak across devices',
  'Challenge friends and track results',
] as const;

// Intentionally a loose pre-filter, not a full RFC-5322 match — the backend's
// class-validator @IsEmail() is the source of truth and rejects anything this
// misses (e.g. consecutive dots, invalid TLDs), surfaced via the caught error.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const SHEET_SLIDE = 520;
const SUCCESS_BEAT_MS = 900;

/**
 * Shown when the Google path fails for any reason other than the user backing
 * out (which is silent). Reuses the same `error` banner state/styling as the
 * password path.
 */
const GENERIC_GOOGLE_ERROR =
  "We couldn't sign you in with Google just now. Please try again.";

/** Returns a human-readable validation message, or null when the form is valid. */
export function validateSignup(email: string, password: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return 'Enter your email address.';
  }
  if (!EMAIL_RE.test(trimmed)) {
    return 'Enter a valid email address.';
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export default function SignupPromptScreen({
  onSuccess,
  onDismiss,
  xpAtRisk = 40,
  streakDays = 3,
}: SignupPromptScreenProps) {
  const signup = useAuthStore((s) => s.signup);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const anim = useRef(new Animated.Value(0)).current;
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSubmitting = status === 'submitting';
  const isSuccess = status === 'success';
  const locked = isSubmitting || isSuccess;

  // Slide the sheet up and fade the backdrop in on mount.
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: CompassMotion.durationExpressive,
      useNativeDriver: true,
    }).start();
  }, [anim]);

  // Clear the pending success callback if we unmount mid-beat.
  useEffect(
    () => () => {
      if (successTimer.current) {
        clearTimeout(successTimer.current);
      }
    },
    [],
  );

  const handleDismiss = useCallback(() => {
    if (locked) {
      return;
    }
    onDismiss();
  }, [locked, onDismiss]);

  // Android hardware back mirrors the backdrop tap, but is swallowed while a
  // request is in flight so the user can't abandon a half-created account.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!locked) {
        onDismiss();
      }
      return true;
    });
    return () => sub.remove();
  }, [locked, onDismiss]);

  const clearError = useCallback(() => {
    setError((prev) => (prev ? null : prev));
  }, []);

  const handleEmailChange = useCallback(
    (value: string) => {
      setEmail(value);
      clearError();
    },
    [clearError],
  );

  const handlePasswordChange = useCallback(
    (value: string) => {
      setPassword(value);
      clearError();
    },
    [clearError],
  );

  const handleSubmit = useCallback(async () => {
    if (status !== 'idle') {
      return;
    }
    const validationError = validateSignup(email, password);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStatus('submitting');
    try {
      await signup({
        email: email.trim(),
        password,
        displayName: displayName.trim() || undefined,
      });
      setStatus('success');
      successTimer.current = setTimeout(onSuccess, SUCCESS_BEAT_MS);
    } catch (err) {
      setStatus('idle');
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Could not create your account. Please try again.',
      );
    }
  }, [displayName, email, onSuccess, password, signup, status]);

  const handleGoogleSignIn = useCallback(async () => {
    if (status !== 'idle') {
      return;
    }
    // Shares `status` with the password path, so starting Google sign-in locks
    // the whole sheet (fields, create-account, continue-as-guest) identically.
    setError(null);
    setStatus('submitting');
    try {
      await loginWithGoogle();
      setStatus('success');
      successTimer.current = setTimeout(onSuccess, SUCCESS_BEAT_MS);
    } catch (err) {
      setStatus('idle');
      // Backing out of the Google picker is not a failure — silent reset.
      if (isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }
      setError(GENERIC_GOOGLE_ERROR);
    }
  }, [loginWithGoogle, onSuccess, status]);

  const submitLabel = isSuccess
    ? 'Account created ✓'
    : isSubmitting
      ? 'Creating account…'
      : 'Create free account';

  // AT reads the button's accessibilityLabel, not its visible text, so the
  // success/loading states must be reflected there too or a screen reader
  // user hears "Create a free account" throughout, including after success.
  const submitAccessibilityLabel = isSuccess
    ? 'Account created'
    : isSubmitting
      ? 'Creating account'
      : 'Create a free account';

  // Memoized: an inline interpolation/style object would be reallocated every
  // render, defeating StyleSheet-level style identity for no visual benefit.
  const animatedSheetStyle = useMemo(() => {
    const translateY = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [SHEET_SLIDE, 0],
    });
    return { transform: [{ translateY }] };
  }, [anim]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[styles.scrim, { opacity: anim }]}
          pointerEvents="none"
          importantForAccessibility="no"
          accessibilityElementsHidden
        />
        <Pressable
          style={styles.backdropPressable}
          onPress={handleDismiss}
          disabled={locked}
          accessibilityRole="button"
          accessibilityLabel="Dismiss and continue as guest"
          accessibilityState={{ disabled: locked }}
        />
      </View>

      <Animated.View style={[styles.sheet, animatedSheetStyle]} accessibilityViewIsModal>
        <ScrollView
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={styles.handle}
            importantForAccessibility="no"
            accessibilityElementsHidden
          />

          <View
            style={styles.iconWrap}
            importantForAccessibility="no"
            accessibilityElementsHidden
          >
            <Icon name="lock" size={28} color={colors.xp} />
          </View>

          <Text accessibilityRole="header" style={styles.title}>
            Keep your XP and streak
          </Text>

          <Text style={styles.body}>
            {`You've earned ${xpAtRisk} XP and are on a ${streakDays}-day streak. Create a free account to make sure they're not lost.`}
          </Text>

          <View
            style={styles.xpPill}
            accessibilityRole="text"
            accessibilityLabel={`${xpAtRisk} XP at risk if you continue as guest`}
          >
            <Icon name="spark" size={13} color={colors.xpText} />
            <Text style={styles.xpPillText}>
              {`${xpAtRisk} XP at risk if you continue as guest`}
            </Text>
          </View>

          <View style={styles.benefits} accessibilityRole="list">
            {BENEFITS.map((benefit) => (
              <View key={benefit} style={styles.benefitItem}>
                <View
                  style={styles.benefitDot}
                  importantForAccessibility="no"
                  accessibilityElementsHidden
                >
                  <Icon name="check" size={13} color={colors.actionPrimary} />
                </View>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={handleEmailChange}
              editable={!locked}
              placeholder="Email address"
              placeholderTextColor={colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              accessibilityLabel="Email address"
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={handlePasswordChange}
              editable={!locked}
              placeholder="Password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              textContentType="newPassword"
              accessibilityLabel="Password"
            />
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              editable={!locked}
              placeholder="Display name (optional)"
              placeholderTextColor={colors.textTertiary}
              autoComplete="name"
              textContentType="name"
              accessibilityLabel="Display name, optional"
            />
          </View>

          {error ? (
            <Text
              style={styles.error}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              {error}
            </Text>
          ) : null}

          <Pressable
            onPress={handleSubmit}
            disabled={locked}
            accessibilityRole="button"
            accessibilityLabel={submitAccessibilityLabel}
            accessibilityState={{ disabled: locked, busy: isSubmitting }}
            style={({ pressed }) => [
              styles.primaryBtn,
              isSuccess && styles.primaryBtnSuccess,
              pressed && !locked && styles.primaryBtnPressed,
            ]}
          >
            <Text style={styles.primaryBtnLabel}>{submitLabel}</Text>
          </Pressable>

          <View style={styles.divider} importantForAccessibility="no">
            <View style={styles.dividerLine} accessibilityElementsHidden />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} accessibilityElementsHidden />
          </View>

          <Pressable
            onPress={handleGoogleSignIn}
            disabled={locked}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            accessibilityState={{ disabled: locked, busy: isSubmitting }}
            style={({ pressed }) => [
              styles.googleBtn,
              locked && styles.googleBtnDisabled,
              pressed && !locked && styles.googleBtnPressed,
            ]}
          >
            <Text
              style={styles.googleIcon}
              importantForAccessibility="no"
              accessibilityElementsHidden
            >
              G
            </Text>
            <Text style={styles.googleBtnLabel}>Continue with Google</Text>
          </Pressable>

          <Pressable
            onPress={handleDismiss}
            disabled={locked}
            accessibilityRole="button"
            accessibilityLabel="Continue as guest and risk losing progress"
            accessibilityState={{ disabled: locked }}
            style={({ pressed }) => [
              styles.guestBtn,
              pressed && !locked && styles.guestBtnPressed,
            ]}
          >
            <Text style={styles.guestBtnLabel}>Continue as guest</Text>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}
