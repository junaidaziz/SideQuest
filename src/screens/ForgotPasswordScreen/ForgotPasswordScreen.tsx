import React, { useCallback, useMemo, useState } from 'react';
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
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { Icon } from '../../components/icons';
import { makeStyles } from './ForgotPasswordScreen.styles';

/**
 * The "request a password-reset email" screen. Like every other screen in this
 * codebase it is purely presentational: the caller in `app/` owns navigation
 * and the actual network call, mounting this with `onSubmit` / `onBack`.
 *
 * `onSubmit` wraps `authApi.forgotPassword`, which hits an endpoint that
 * *always* resolves with the same generic success response whether or not the
 * email maps to an account — a deliberate no-user-enumeration design. This
 * screen therefore shows one identical confirmation for every accepted submit
 * and must never say "email sent" vs "no such account" differently.
 *
 * Note: the reset link the backend emails points at a WEB page
 * (`{WEB_APP_URL}/reset-password?token=...`), not a mobile deep link — opening
 * it lands in a browser, by design. Mobile's job ends at requesting the email;
 * `POST /auth/reset-password` (token consumption) is the web side's concern.
 */
export interface ForgotPasswordScreenProps {
  /**
   * Sends the reset-email request for `email`. Resolves on acceptance, throws
   * on a transport/server failure. The generic-success contract means a
   * resolution never confirms the address is registered.
   */
  onSubmit?: (email: string) => Promise<void>;
  /** Fired when the header back button (or post-success "Back to log in") is pressed. */
  onBack?: () => void;
}

type SubmitStatus = 'idle' | 'submitting' | 'success';

// Same loose pre-filter LoginScreen uses — the backend's @IsEmail() is the
// source of truth; this only catches the obviously-empty/malformed case client
// side so we don't fire a pointless request.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Deliberately does not distinguish "sent" from "no account found" — saying
 * either specifically would turn this screen into a user-enumeration oracle,
 * undoing the backend's own generic-response protection.
 */
const CONFIRMATION_MESSAGE =
  "If an account exists for that email, we've sent a link to reset your password. Check your inbox — and your spam folder, just in case.";

const GENERIC_SUBMIT_ERROR =
  "We couldn't send that reset email just now. Please try again.";

/** Validation for the single email field, or null when acceptable to submit. */
export function validateForgotEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return 'Enter your email';
  }
  if (!EMAIL_RE.test(trimmed)) {
    return "That email doesn't look right";
  }
  return null;
}

/**
 * Returns `style` only while a Pressable is pressed, else `null`. RTL's press
 * helpers don't flip Pressable's internal pressed flag, so exposing this keeps
 * the pressed-state branch reachable in tests. (Mirrors LoginScreen's helper.)
 */
export function whenPressed(
  pressed: boolean,
  style: StyleProp<ViewStyle>,
): StyleProp<ViewStyle> {
  return pressed ? style : null;
}

export default function ForgotPasswordScreen({
  onSubmit,
  onBack,
}: ForgotPasswordScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<SubmitStatus>('idle');

  const isSubmitting = status === 'submitting';
  const isSuccess = status === 'success';

  const handleBack = useCallback(() => {
    if (isSubmitting) {
      return;
    }
    // Nav-agnostic by design: this screen never calls a navigation library
    // directly. app/forgot-password.tsx's onBack callback runs router.back().
    onBack?.();
  }, [isSubmitting, onBack]);

  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    // Clear this field's error and any stale form-level error as the user
    // corrects their input.
    setFieldError((prev) => (prev ? null : prev));
    setFormError((prev) => (prev ? null : prev));
  }, []);

  const handleSubmit = useCallback(async () => {
    // Once we've shown the confirmation, the submit is inert — the only action
    // left is going back. Re-submitting would also risk enumeration timing.
    if (status !== 'idle') {
      return;
    }
    const error = validateForgotEmail(email);
    if (error) {
      setFieldError(error);
      return;
    }
    setFieldError(null);
    setFormError(null);
    setStatus('submitting');
    try {
      await onSubmit?.(email.trim());
      // Success is shown for *any* accepted submit — never conditioned on
      // whether the backend actually found an account (it won't tell us).
      setStatus('success');
    } catch {
      // A thrown error here is a transport/server fault, not "no such account"
      // (that path resolves successfully). Surface a generic retry banner.
      setStatus('idle');
      setFormError(GENERIC_SUBMIT_ERROR);
    }
  }, [email, onSubmit, status]);

  const submitLabel = isSubmitting ? 'Sending…' : 'Send reset link';
  const submitAccessibilityLabel = isSubmitting ? 'Sending' : 'Send reset link';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityState={{ disabled: isSubmitting }}
          style={({ pressed }) => [
            styles.iconBtn,
            whenPressed(pressed, styles.iconBtnPressed),
          ]}
        >
          <Icon name="back" size={20} color={colors.textPrimary} />
        </Pressable>

        <Text accessibilityRole="header" style={styles.headerTitle}>
          Reset password
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
            <Icon name="lock" size={26} color={colors.actionPrimary} />
          </View>

          {isSuccess ? (
            <>
              <Text accessibilityRole="header" style={styles.leadTitle}>
                Check your email
              </Text>
              <View
                style={styles.confirmation}
                accessible
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                <Text style={styles.confirmationText}>
                  {CONFIRMATION_MESSAGE}
                </Text>
              </View>
              <Pressable
                onPress={handleBack}
                accessibilityRole="button"
                accessibilityLabel="Back to log in"
                style={({ pressed }) => [
                  styles.primaryBtn,
                  whenPressed(pressed, styles.primaryBtnPressed),
                ]}
              >
                <Text style={styles.primaryBtnText}>Back to log in</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text accessibilityRole="header" style={styles.leadTitle}>
                Forgot your password?
              </Text>
              <Text style={styles.leadSub}>
                Enter the email for your account and we&apos;ll send a link to
                set a new password.
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
                  style={[styles.input, fieldError ? styles.inputInvalid : null]}
                  value={email}
                  onChangeText={handleEmailChange}
                  editable={!isSubmitting}
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
                {fieldError ? (
                  <Text
                    style={styles.fieldError}
                    accessibilityRole="alert"
                    accessibilityLiveRegion="polite"
                  >
                    {fieldError}
                  </Text>
                ) : null}
              </View>

              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel={submitAccessibilityLabel}
                accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  isSubmitting && styles.primaryBtnDisabled,
                  whenPressed(pressed, !isSubmitting ? styles.primaryBtnPressed : null),
                ]}
              >
                <Text style={styles.primaryBtnText}>{submitLabel}</Text>
              </Pressable>

              <View style={styles.switchRow}>
                <Text style={styles.switchText}>Remembered it? </Text>
                <Pressable
                  onPress={handleBack}
                  disabled={isSubmitting}
                  accessibilityRole="button"
                  accessibilityLabel="Back to log in"
                  accessibilityState={{ disabled: isSubmitting }}
                  style={({ pressed }) => [
                    whenPressed(pressed, styles.linkBtnPressed),
                  ]}
                >
                  <Text style={styles.switchLink}>Log in</Text>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
