import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useAuthStore } from '../../store/authStore';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { makeStyles } from './LoginScreen.styles';

/**
 * The returning-user log in screen. Like every other screen in this codebase
 * it is purely presentational: the caller in `app/` owns navigation and mounts
 * this component with `onSuccess` / `onBack` / `onGoToSignup` callbacks.
 *
 * Auth itself goes through `useAuthStore.login`, which persists tokens and
 * flips session state as a side effect — we never touch `authApi.login`
 * directly, so a resolved call leaves the user authenticated automatically.
 * `login` *throws* on failure (it does not return a boolean), so the call is
 * wrapped in try/catch and every rejection collapses to one generic message.
 */
export interface LoginScreenProps {
  /** Fired after a successful login (and the brief success beat). */
  onSuccess?: () => void;
  /** Fired when the header back button is pressed. */
  onBack?: () => void;
  /** Fired when the "Don't have an account? Sign up" link is pressed. */
  onGoToSignup?: () => void;
}

type SubmitStatus = 'idle' | 'submitting' | 'success';

export interface LoginFieldErrors {
  email: string | null;
  password: string | null;
}

// Intentionally a loose pre-filter, not a full RFC-5322 match — the backend's
// class-validator @IsEmail() is the source of truth and rejects anything this
// misses (e.g. consecutive dots, invalid TLDs), surfaced via the caught error.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUCCESS_BEAT_MS = 900;

/**
 * Deliberately generic and identical for "no such email" and "wrong password".
 * Distinguishing the two in the UI is a user-enumeration leak: the backend's
 * login endpoint already avoids it via timing-safe comparison, and the client
 * must not undo that protection by narrating which half was wrong.
 */
const GENERIC_CREDENTIAL_ERROR =
  "That email and password don't match. Try again, or reset your password.";

/**
 * Shown when the Google path fails for any reason other than the user backing
 * out (which is silent). Reuses the same `formError` banner state/styling as the
 * password path — only the copy differs, because reusing the "email and password
 * don't match" line here would be actively misleading for a user who never typed
 * a password.
 */
const GENERIC_GOOGLE_ERROR =
  "We couldn't sign you in with Google just now. Please try again.";

const NO_ERRORS: LoginFieldErrors = { email: null, password: null };

/** Per-field validation, or nulls when the field is acceptable to submit. */
export function validateLoginFields(
  email: string,
  password: string,
): LoginFieldErrors {
  const trimmed = email.trim();
  let emailError: string | null = null;
  if (!trimmed) {
    emailError = 'Enter your email';
  } else if (!EMAIL_RE.test(trimmed)) {
    emailError = "That email doesn't look right";
  }
  // Passwords may legitimately contain spaces, so the raw value is tested for
  // presence rather than a trimmed copy.
  const passwordError: string | null = password ? null : 'Enter your password';
  return { email: emailError, password: passwordError };
}

/**
 * Returns `style` only while a Pressable is pressed, else `null`. RTL's press
 * helpers don't flip Pressable's internal pressed flag, so exposing this keeps
 * the pressed-state branch reachable in tests.
 */
export function whenPressed(
  pressed: boolean,
  style: StyleProp<ViewStyle>,
): StyleProp<ViewStyle> {
  return pressed ? style : null;
}

export default function LoginScreen({
  onSuccess,
  onBack,
  onGoToSignup,
}: LoginScreenProps) {
  const login = useAuthStore((s) => s.login);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showResetNote, setShowResetNote] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>(NO_ERRORS);
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<SubmitStatus>('idle');

  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSubmitting = status === 'submitting';
  const isSuccess = status === 'success';
  const locked = isSubmitting || isSuccess;

  // Clear the pending success callback if we unmount mid-beat.
  useEffect(
    () => () => {
      if (successTimer.current) {
        clearTimeout(successTimer.current);
      }
    },
    [],
  );

  const handleBack = useCallback(() => {
    if (locked) {
      return;
    }
    // Nav-agnostic by design: this screen never calls a navigation library
    // directly. app/login.tsx's onBack callback is what actually runs
    // router.back().
    onBack?.();
  }, [locked, onBack]);

  const handleGoToSignup = useCallback(() => {
    if (locked) {
      return;
    }
    onGoToSignup?.();
  }, [locked, onGoToSignup]);

  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    // Clear this field's error and any stale form-level error as the user
    // corrects their input, mirroring the mockup's input-listener behaviour.
    setFieldErrors((prev) => (prev.email ? { ...prev, email: null } : prev));
    setFormError((prev) => (prev ? null : prev));
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
    setFieldErrors((prev) =>
      prev.password ? { ...prev, password: null } : prev,
    );
    setFormError((prev) => (prev ? null : prev));
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const revealResetNote = useCallback(() => {
    setShowResetNote(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (status !== 'idle') {
      return;
    }
    const errors = validateLoginFields(email, password);
    if (errors.email || errors.password) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors(NO_ERRORS);
    setFormError(null);
    setStatus('submitting');
    try {
      await login({ email: email.trim(), password });
      setStatus('success');
      successTimer.current = setTimeout(() => onSuccess?.(), SUCCESS_BEAT_MS);
    } catch {
      // The rejection reason is intentionally discarded: whether the backend
      // said "no account" or "bad password", the user sees one generic line so
      // the UI can't be used to enumerate which emails have accounts.
      setStatus('idle');
      setFormError(GENERIC_CREDENTIAL_ERROR);
    }
  }, [email, login, onSuccess, password, status]);

  const handleGoogleSignIn = useCallback(async () => {
    if (status !== 'idle') {
      return;
    }
    // Google sign-in and password sign-in share the same `status`, so kicking
    // one off locks the whole form (fields, submit, and the other path) exactly
    // as the password flow does — no parallel in-flight state to reconcile.
    setFieldErrors(NO_ERRORS);
    setFormError(null);
    setStatus('submitting');
    try {
      await loginWithGoogle();
      setStatus('success');
      successTimer.current = setTimeout(() => onSuccess?.(), SUCCESS_BEAT_MS);
    } catch (err) {
      setStatus('idle');
      // Backing out of the Google account picker is not a failure — reset to
      // idle with no banner. Everything else surfaces the generic banner.
      if (isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }
      setFormError(GENERIC_GOOGLE_ERROR);
    }
  }, [loginWithGoogle, onSuccess, status]);

  const submitLabel = isSuccess
    ? 'Logged in ✓'
    : isSubmitting
      ? 'Logging in…'
      : 'Log in';

  // AT reads the button's accessibilityLabel, not its visible text, so the
  // loading/success states must be reflected there too or a screen reader user
  // hears "Log in" throughout, including after a successful sign-in.
  const submitAccessibilityLabel = isSuccess
    ? 'Logged in'
    : isSubmitting
      ? 'Logging in'
      : 'Log in';

  const passwordToggleLabel = showPassword ? 'Hide password' : 'Show password';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          disabled={locked}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityState={{ disabled: locked }}
          style={({ pressed }) => [
            styles.iconBtn,
            whenPressed(pressed, styles.iconBtnPressed),
          ]}
        >
          <Text style={styles.iconGlyph}>{'‹'}</Text>
        </Pressable>

        <Text accessibilityRole="header" style={styles.headerTitle}>
          Log in
        </Text>

        <View style={styles.headerSpacer} importantForAccessibility="no" />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={styles.lockup}
            importantForAccessibility="no"
            accessibilityElementsHidden
          >
            <Text style={styles.lockupGlyph}>{'\u{1F512}'}</Text>
          </View>

          <Text accessibilityRole="header" style={styles.leadTitle}>
            Welcome back
          </Text>
          <Text style={styles.leadSub}>
            Log in to pick up your XP, streak, and saved quests on any device.
          </Text>

          {formError ? (
            <View
              style={styles.formError}
              accessible
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              <Text style={styles.formErrorText}>{formError}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={[styles.input, fieldErrors.email ? styles.inputInvalid : null]}
              value={email}
              onChangeText={handleEmailChange}
              editable={!locked}
              placeholder="you@example.com"
              placeholderTextColor={colors.textTertiary}
              keyboardType="email-address"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              accessibilityLabel="Email"
            />
            {fieldErrors.email ? (
              <Text
                style={styles.fieldError}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                {fieldErrors.email}
              </Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[
                  styles.input,
                  styles.inputWithToggle,
                  fieldErrors.password ? styles.inputInvalid : null,
                ]}
                value={password}
                onChangeText={handlePasswordChange}
                editable={!locked}
                placeholder="Your password"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                accessibilityLabel="Password"
              />
              <Pressable
                onPress={togglePasswordVisibilityGuard(locked, togglePasswordVisibility)}
                disabled={locked}
                accessibilityRole="button"
                accessibilityLabel={passwordToggleLabel}
                accessibilityState={{ disabled: locked, checked: showPassword }}
                style={({ pressed }) => [
                  styles.pwToggle,
                  whenPressed(pressed, styles.pwTogglePressed),
                ]}
              >
                <Text style={styles.pwToggleText}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </Pressable>
            </View>
            {fieldErrors.password ? (
              <Text
                style={styles.fieldError}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                {fieldErrors.password}
              </Text>
            ) : null}
          </View>

          <View style={styles.forgotRow}>
            <Pressable
              onPress={revealResetNote}
              accessibilityRole="button"
              accessibilityLabel="Forgot password?"
              style={({ pressed }) => [
                styles.linkBtn,
                whenPressed(pressed, styles.linkBtnPressed),
              ]}
            >
              <Text style={styles.linkBtnText}>Forgot password?</Text>
            </Pressable>
          </View>

          {showResetNote ? (
            <View
              style={styles.stubNote}
              accessibilityRole="text"
              accessibilityLiveRegion="polite"
            >
              <Text style={styles.stubNoteText}>
                Password reset isn&apos;t available in this build yet. For now,
                reach out from Settings and we&apos;ll help you back in.
              </Text>
            </View>
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
              locked && !isSuccess && styles.primaryBtnDisabled,
              whenPressed(pressed, !locked ? styles.primaryBtnPressed : null),
            ]}
          >
            <Text style={styles.primaryBtnText}>{submitLabel}</Text>
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
              whenPressed(pressed, !locked ? styles.googleBtnPressed : null),
            ]}
          >
            <Text
              style={styles.googleIcon}
              importantForAccessibility="no"
              accessibilityElementsHidden
            >
              G
            </Text>
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </Pressable>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Don&apos;t have an account? </Text>
            <Pressable
              onPress={handleGoToSignup}
              disabled={locked}
              accessibilityRole="button"
              accessibilityLabel="Sign up for a new account"
              accessibilityState={{ disabled: locked }}
              style={({ pressed }) => [
                whenPressed(pressed, styles.linkBtnPressed),
              ]}
            >
              <Text style={styles.switchLink}>Sign up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * The password toggle must be inert while the form is locked. Extracted so the
 * guard is a named, testable value rather than an inline arrow allocated in the
 * middle of JSX every render.
 */
function togglePasswordVisibilityGuard(
  locked: boolean,
  toggle: () => void,
): () => void {
  return locked ? noop : toggle;
}

function noop(): void {
  // Intentionally empty — used when the toggle is disabled.
}
