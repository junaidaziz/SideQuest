import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import {
  Colors,
  Duration,
  Fonts,
  FontSize,
  LineHeight,
  Radius,
  Spacing,
} from '../constants/design';

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
      duration: Duration.screen,
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
            <Text style={styles.icon}>{'\u{1F512}'}</Text>
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
            <Text
              style={styles.xpPillIcon}
              importantForAccessibility="no"
              accessibilityElementsHidden
            >
              {'⚡'}
            </Text>
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
                  <Text style={styles.benefitCheck}>{'✓'}</Text>
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
              placeholderTextColor={Colors.textSecondary}
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
              placeholderTextColor={Colors.textSecondary}
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
              placeholderTextColor={Colors.textSecondary}
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: Colors.scrim,
  },
  backdropPressable: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    maxHeight: '92%',
  },
  sheetContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xxxl : Spacing.xl,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.card,
    backgroundColor: Colors.accentLight,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontFamily: Fonts.displayExtraBold,
    fontSize: FontSize.h2,
    lineHeight: LineHeight.h2,
    color: Colors.ink,
    letterSpacing: -0.4,
    marginBottom: Spacing.sm,
  },
  body: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.body,
    lineHeight: LineHeight.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.base,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.chip,
    backgroundColor: Colors.accent,
    marginBottom: Spacing.lg,
  },
  xpPillIcon: {
    fontSize: FontSize.caption,
  },
  xpPillText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.caption,
    color: Colors.ink,
  },
  benefits: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  benefitDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitCheck: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  benefitText: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.body,
    color: Colors.ink,
  },
  form: {
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  input: {
    height: 52,
    borderRadius: Radius.btn,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.cardLabel,
    color: Colors.ink,
  },
  error: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.caption,
    lineHeight: LineHeight.caption,
    color: Colors.error,
    marginBottom: Spacing.md,
  },
  primaryBtn: {
    height: 54,
    borderRadius: Radius.btn,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  primaryBtnPressed: {
    backgroundColor: Colors.primaryDark,
  },
  primaryBtnSuccess: {
    backgroundColor: Colors.success,
  },
  primaryBtnLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.button,
    color: Colors.white,
    letterSpacing: 0.2,
  },
  guestBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBtnPressed: {
    opacity: 0.6,
  },
  guestBtnLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
