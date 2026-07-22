import React, { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import {
  CompassHeader,
  SettingsRow,
  SettingsSection,
  createSettingsScreenStyles,
  textStyle,
  pressedStyle,
} from '../../components/compass';
import { createStyles } from './AccountSecurityScreen.styles';

/** Minimum length enforced client-side; mirror the backend rule once it exists. */
export const MIN_PASSWORD_LENGTH = 8;

export interface AccountSecurityScreenProps {
  onBack?: () => void;
  onChangeEmail?: () => void;
  onDownloadData?: () => void;
  onSignOutOtherDevices?: () => void;
  /**
   * Persists a password change.
   * The route supplies the real PATCH /auth/password implementation; injection
   * keeps this presentational screen independently testable.
   */
  onChangePassword?: (currentPassword: string, newPassword: string) => Promise<void>;
  /**
   * Permanently deletes the account.
   * The route supplies the real DELETE /auth/me implementation.
   */
  onDeleteAccount?: (password: string) => Promise<void>;
  /** Fired after a successful account deletion. */
  onDeleted?: () => void | Promise<void>;
}

/** Validates a change-password submission. Returns an error message or null. */
export function validatePasswordChange(
  current: string,
  next: string,
  confirm: string,
): string | null {
  if (!current) return 'Enter your current password';
  if (next.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (next !== confirm) return "New passwords don't match";
  if (next === current) return 'Choose a password different from your current one';
  return null;
}

export default function AccountSecurityScreen({
  onBack,
  onChangeEmail,
  onDownloadData,
  onSignOutOtherDevices,
  onChangePassword = async () => {},
  onDeleteAccount = async () => {},
  onDeleted,
}: AccountSecurityScreenProps) {
  const { colors } = useCompassTheme();
  const shell = useMemo(() => createSettingsScreenStyles(colors), [colors]);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const user = useAuthStore((s) => s.user);
  const email = user?.email ?? 'Not set';

  // ── Change password ──
  const [pwOpen, setPwOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  const resetPwForm = useCallback(() => {
    setCurrent('');
    setNext('');
    setConfirm('');
    setPwError(null);
  }, []);

  const closePw = useCallback(() => {
    if (pwSaving) return;
    setPwOpen(false);
    resetPwForm();
  }, [pwSaving, resetPwForm]);

  const submitPw = useCallback(async () => {
    if (pwSaving) return;
    const error = validatePasswordChange(current, next, confirm);
    if (error) {
      setPwError(error);
      return;
    }
    setPwSaving(true);
    try {
      await onChangePassword(current, next);
      setPwOpen(false);
      resetPwForm();
    } catch {
      setPwError("Couldn't update your password. Check your current password and try again.");
    } finally {
      setPwSaving(false);
    }
  }, [confirm, current, next, onChangePassword, pwSaving, resetPwForm]);

  // ── Delete account ──
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const canDelete = confirmChecked && deletePassword.length > 0 && !deleting;

  const submitDelete = useCallback(async () => {
    if (!canDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDeleteAccount(deletePassword);
      await onDeleted?.();
    } catch {
      setDeleteError("Couldn't delete your account. Check your password and try again.");
    } finally {
      setDeleting(false);
    }
  }, [canDelete, deletePassword, onDeleteAccount, onDeleted]);

  return (
    <SafeAreaView style={shell.container} edges={['top', 'bottom']}>
      <CompassHeader title="Account and security" onBack={onBack} backAccessibilityLabel="Back to settings" />
      <ScrollView
        style={shell.scroll}
        contentContainerStyle={shell.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SettingsSection title="Sign-in" index={0} animate={false}>
          <SettingsRow
            icon="✉️"
            label="Email"
            sub={email}
            accessory={onChangeEmail ? (
              <Pressable
                onPress={onChangeEmail}
                accessibilityRole="button"
                accessibilityLabel="Change email"
                hitSlop={8}
              >
                <Text style={styles.linkText}>Change</Text>
              </Pressable>
            ) : <Text style={styles.linkText}>Unavailable</Text>}
          />
          <SettingsRow
            icon="🔑"
            label="Change password"
            onPress={() => setPwOpen(true)}
            showChevron
          />
        </SettingsSection>

        <View style={shell.note}>
          <Text importantForAccessibility="no">{'🛡️'}</Text>
          <Text style={[textStyle('bodyS'), shell.noteText]}>
            Sensitive changes ask you to confirm it&apos;s you first.
          </Text>
        </View>

        <SettingsSection title="Devices" index={1} animate={false}>
          <SettingsRow icon="📱" label="This device" sub="Active now" />
        </SettingsSection>
        {onSignOutOtherDevices ? <Pressable
          onPress={onSignOutOtherDevices}
          accessibilityRole="button"
          accessibilityLabel="Sign out other devices"
          style={({ pressed }) => [shell.secondaryBtn, pressedStyle(pressed)]}
        >
          <Text style={shell.secondaryBtnText}>Sign out other devices</Text>
        </Pressable> : null}

        <SettingsSection title="Your data" index={2} animate={false}>
          {onDownloadData ? <SettingsRow
            icon="⬇️"
            label="Download your data"
            sub="We'll email a link when it's ready"
            onPress={onDownloadData}
            showChevron
          /> : <SettingsRow icon="⬇️" label="Download your data" sub="Not available yet" />}
        </SettingsSection>

        {/* ── Delete account ── kept animation-free and explicit. */}
        <View>
          <Text style={[textStyle('caption'), styles.groupLabel]} accessibilityRole="header">
            DELETE ACCOUNT
          </Text>
          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>Delete your account</Text>
            <Text style={[textStyle('bodyS'), styles.dangerBody]}>
              This is permanent. When you confirm, we&apos;ll remove your profile, completed quests, achievements, XP, streak, saved quests, and any proof you&apos;ve submitted. This can&apos;t be undone.
            </Text>
            <Pressable
              onPress={() => setConfirmChecked((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityLabel="I understand my account and progress will be permanently deleted"
              accessibilityState={{ checked: confirmChecked }}
              style={styles.checkRow}
            >
              <View style={[styles.checkbox, confirmChecked ? styles.checkboxChecked : null]}>
                {confirmChecked ? <Text style={styles.checkTick}>✓</Text> : null}
              </View>
              <Text style={[textStyle('bodyS'), styles.checkLabel]}>
                I understand my account and progress will be permanently deleted.
              </Text>
            </Pressable>
            <TextInput
              value={deletePassword}
              onChangeText={setDeletePassword}
              editable={!deleting}
              secureTextEntry
              placeholder="Enter your password to confirm"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
              accessibilityLabel="Password to confirm deletion"
            />
            {deleteError ? (
              <Text
                style={[textStyle('bodyS'), styles.fieldError]}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                {deleteError}
              </Text>
            ) : null}
            <Pressable
              onPress={submitDelete}
              disabled={!canDelete}
              accessibilityRole="button"
              accessibilityLabel="Delete account"
              accessibilityState={{ disabled: !canDelete, busy: deleting }}
              style={[styles.deleteBtn, !canDelete ? styles.deleteBtnDisabled : null]}
            >
              <Text style={styles.deleteBtnText}>
                {deleting ? 'Deleting…' : 'Delete account'}
              </Text>
            </Pressable>
            <View style={styles.reauthNote}>
              <Text importantForAccessibility="no">{'🛡️'}</Text>
              <Text style={[textStyle('bodyS'), styles.reauthText]}>
                You re-enter your password to finish.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={pwOpen}
        transparent
        animationType="slide"
        onRequestClose={closePw}
        accessibilityViewIsModal
      >
        <View style={styles.overlay}>
          <Pressable
            testID="password-backdrop"
            style={styles.backdrop}
            importantForAccessibility="no"
            accessibilityElementsHidden
            onPress={closePw}
          />
          <View style={styles.sheet} accessibilityViewIsModal>
            <Text accessibilityRole="header" style={[textStyle('h2'), styles.sheetTitle]}>
              Change password
            </Text>
            <Text style={[textStyle('labelM'), styles.label]}>Current password</Text>
            <TextInput
              value={current}
              onChangeText={(v) => {
                setCurrent(v);
                setPwError(null);
              }}
              editable={!pwSaving}
              secureTextEntry
              placeholder="Current password"
              placeholderTextColor={colors.textTertiary}
              style={[styles.input, pwError ? styles.inputInvalid : null]}
              accessibilityLabel="Current password"
            />
            <Text style={[textStyle('labelM'), styles.label]}>New password</Text>
            <TextInput
              value={next}
              onChangeText={(v) => {
                setNext(v);
                setPwError(null);
              }}
              editable={!pwSaving}
              secureTextEntry
              placeholder="At least 8 characters"
              placeholderTextColor={colors.textTertiary}
              style={[styles.input, pwError ? styles.inputInvalid : null]}
              accessibilityLabel="New password"
            />
            <Text style={[textStyle('labelM'), styles.label]}>Confirm new password</Text>
            <TextInput
              value={confirm}
              onChangeText={(v) => {
                setConfirm(v);
                setPwError(null);
              }}
              editable={!pwSaving}
              secureTextEntry
              placeholder="Re-enter new password"
              placeholderTextColor={colors.textTertiary}
              style={[styles.input, pwError ? styles.inputInvalid : null]}
              accessibilityLabel="Confirm new password"
            />
            {pwError ? (
              <Text
                style={[textStyle('bodyS'), styles.fieldError]}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                {pwError}
              </Text>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable
                onPress={submitPw}
                disabled={pwSaving}
                accessibilityRole="button"
                accessibilityLabel="Update password"
                accessibilityState={{ disabled: pwSaving, busy: pwSaving }}
                style={[styles.primaryBtn, pwSaving ? styles.primaryBtnDisabled : null]}
              >
                <Text style={styles.primaryBtnText}>
                  {pwSaving ? 'Updating…' : 'Update password'}
                </Text>
              </Pressable>
              <Pressable
                onPress={closePw}
                disabled={pwSaving}
                accessibilityRole="button"
                accessibilityLabel="Cancel password change"
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
