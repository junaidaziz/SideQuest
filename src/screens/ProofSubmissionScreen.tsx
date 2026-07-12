import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useMutation } from '@tanstack/react-query';
import {
  Colors,
  Fonts,
  FontSize,
  LineHeight,
  Radius,
  Spacing,
} from '../constants/design';
import { submitPhotoProof, submitTextProof } from '../services/proofApi';
import { ApiError } from '../services/apiClient';
import { GUEST_COMPLETION_LIMIT_REACHED } from '../types/api';
import type { ProofSubmissionResponse } from '../types/api';

export interface ProofSubmissionScreenProps {
  /** The mission the proof is being submitted against. */
  missionId: string;
  /** The mission's specific proof requirement, shown verbatim in the banner. */
  proofRequirement: string;
  /** Fired with the API result after a successful submission. */
  onSubmitSuccess?: (result: ProofSubmissionResponse) => void;
  /** Fired when the header back button is pressed. */
  onCancel?: () => void;
  /** Fired when a guest hits their one free completion (403 gate signal) —
   * the caller shows the signup prompt in response, not a generic error. */
  onGuestLimitReached?: () => void;
}

type ProofTab = 'photo' | 'text';

const MAX_CAPTION = 500;
const CAPTION_WARN_AT = 450;

/**
 * True when the error is the guest-completion gate: an ApiError with a 403 and
 * the `GUEST_COMPLETION_LIMIT_REACHED` reason in its message. Extracted so the
 * branch is unit-testable without constructing a full failed mutation.
 */
export function isGuestLimitError(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    err.status === 403 &&
    err.message.includes(GUEST_COMPLETION_LIMIT_REACHED)
  );
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

export default function ProofSubmissionScreen({
  missionId,
  proofRequirement,
  onSubmitSuccess,
  onCancel,
  onGuestLimitReached,
}: ProofSubmissionScreenProps) {
  const [activeTab, setActiveTab] = useState<ProofTab>('photo');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: () => {
      if (activeTab === 'photo' && photoUri) {
        return submitPhotoProof(missionId, photoUri);
      }
      return submitTextProof(missionId, caption.trim());
    },
    onSuccess: (result) => {
      onSubmitSuccess?.(result);
    },
    onError: (err) => {
      if (isGuestLimitError(err)) {
        onGuestLimitReached?.();
        return;
      }
      setSubmitError(
        err instanceof Error && err.message
          ? err.message
          : 'Could not submit your proof. Please try again.',
      );
    },
  });

  const { mutate, isPending } = submitMutation;

  const trimmedCaption = caption.trim();
  const canSubmit =
    activeTab === 'photo' ? photoUri !== null : trimmedCaption.length > 0;

  const handleBack = useCallback(() => {
    if (isPending) return;
    // TODO: replace with navigation call once nav library is chosen
    // Expo Router:       router.back()
    // React Navigation:  navigation.goBack()
    onCancel?.();
  }, [isPending, onCancel]);

  const selectTab = useCallback((tab: ProofTab) => {
    setActiveTab(tab);
    setSubmitError(null);
    // A camera/library permission error belongs to the photo tab — without
    // this it survives a switch to the text tab and shows under the wrong panel.
    setPickerError(null);
  }, []);

  const applyPickerResult = useCallback(
    (result: ImagePicker.ImagePickerResult) => {
      if (result.canceled) return;
      const uri = result.assets?.[0]?.uri;
      if (uri) {
        setPhotoUri(uri);
        setSubmitError(null);
      }
    },
    [],
  );

  const launchCamera = useCallback(async () => {
    setPickerError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setPickerError(
        'Camera access is off. Enable it in Settings to take a photo.',
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    applyPickerResult(result);
  }, [applyPickerResult]);

  const launchLibrary = useCallback(async () => {
    setPickerError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPickerError(
        'Photo access is off. Enable it in Settings to choose a photo.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    applyPickerResult(result);
  }, [applyPickerResult]);

  const presentCaptureOptions = useCallback(() => {
    Alert.alert(
      'Add proof photo',
      'Take a new photo or choose one from your library.',
      [
        { text: 'Take Photo', onPress: () => void launchCamera() },
        { text: 'Choose from Library', onPress: () => void launchLibrary() },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  }, [launchCamera, launchLibrary]);

  const handleRetake = useCallback(() => {
    setPhotoUri(null);
    setSubmitError(null);
  }, []);

  const handleCaptionChange = useCallback((value: string) => {
    setCaption(value);
    setSubmitError(null);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!canSubmit || isPending) return;
    setSubmitError(null);
    mutate();
  }, [canSubmit, isPending, mutate]);

  const submitLabel = isPending ? 'Submitting…' : 'Submit Proof';
  const submitAccessibilityLabel = isPending
    ? 'Submitting your proof'
    : 'Submit your proof and complete the mission';

  const captionCount = caption.length;
  const isCaptionWarn = captionCount > CAPTION_WARN_AT;

  const photoCaptured = photoUri !== null;
  const cameraDisabled = photoCaptured || isPending;
  const cameraAccessibilityLabel = photoCaptured
    ? 'Photo captured. Use retake to replace it.'
    : 'Take photo or choose from library';

  const inlineError = useMemo(
    () => submitError ?? pickerError,
    [submitError, pickerError],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          disabled={isPending}
          accessibilityRole="button"
          accessibilityLabel="Back to mission detail"
          accessibilityState={{ disabled: isPending }}
          style={({ pressed }) => [
            styles.iconBtn,
            whenPressed(pressed, styles.iconBtnPressed),
          ]}
        >
          <Text style={styles.iconGlyph}>{'‹'}</Text>
        </Pressable>

        <Text accessibilityRole="header" style={styles.title}>
          Submit Proof
        </Text>

        <View style={styles.headerSpacer} importantForAccessibility="no" />
      </View>

      <View
        style={styles.banner}
        accessible
        accessibilityRole="text"
        accessibilityLabel={`What counts as proof: ${proofRequirement}`}
      >
        <Text style={styles.bannerLabel}>WHAT COUNTS AS PROOF</Text>
        <Text style={styles.bannerText}>{proofRequirement}</Text>
      </View>

      <View style={styles.tabRow} accessibilityRole="tablist">
        <Pressable
          onPress={() => selectTab('photo')}
          accessibilityRole="tab"
          accessibilityLabel="Photo proof"
          accessibilityState={{ selected: activeTab === 'photo' }}
          style={[styles.tabBtn, activeTab === 'photo' && styles.tabBtnActive]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'photo' && styles.tabTextActive,
            ]}
          >
            {'\u{1F4F7}'} Photo
          </Text>
        </Pressable>

        <Pressable
          onPress={() => selectTab('text')}
          accessibilityRole="tab"
          accessibilityLabel="Text proof"
          accessibilityState={{ selected: activeTab === 'text' }}
          style={[styles.tabBtn, activeTab === 'text' && styles.tabBtnActive]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'text' && styles.tabTextActive,
            ]}
          >
            {'\u{270D}\u{FE0F}'} Text
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.panelArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {activeTab === 'photo' ? (
          <View style={styles.photoPanel}>
            <Pressable
              onPress={presentCaptureOptions}
              disabled={cameraDisabled}
              accessibilityRole="button"
              accessibilityLabel={cameraAccessibilityLabel}
              accessibilityState={{ disabled: cameraDisabled }}
              style={({ pressed }) => [
                styles.cameraArea,
                whenPressed(pressed, styles.cameraAreaPressed),
              ]}
            >
              {photoCaptured ? (
                <View style={styles.previewWrap}>
                  <Image
                    source={{ uri: photoUri ?? undefined }}
                    style={styles.previewImage}
                    accessibilityIgnoresInvertColors
                    accessibilityLabel="Captured proof photo"
                  />
                  <View style={styles.previewOverlay}>
                    <View
                      style={styles.previewCheck}
                      importantForAccessibility="no"
                      accessibilityElementsHidden
                    >
                      <Text style={styles.previewCheckGlyph}>{'✓'}</Text>
                    </View>
                    <Text
                      style={styles.previewLabel}
                      importantForAccessibility="no"
                      accessibilityElementsHidden
                    >
                      Photo captured!
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.cameraIdle}>
                  <View
                    style={styles.cameraIconWrap}
                    importantForAccessibility="no"
                    accessibilityElementsHidden
                  >
                    <Text style={styles.cameraIconGlyph}>{'\u{1F4F7}'}</Text>
                  </View>
                  <Text style={styles.cameraHint}>Tap to capture</Text>
                  <Text style={styles.cameraHintSub}>
                    Take a photo or choose from your library
                  </Text>
                </View>
              )}
            </Pressable>

            {photoCaptured ? (
              <Pressable
                onPress={handleRetake}
                disabled={isPending}
                accessibilityRole="button"
                accessibilityLabel="Retake photo"
                accessibilityState={{ disabled: isPending }}
                style={({ pressed }) => [
                  styles.retakeBtn,
                  whenPressed(pressed, styles.retakeBtnPressed),
                ]}
              >
                <Text style={styles.retakeBtnText}>Retake</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <ScrollView
            style={styles.textPanel}
            contentContainerStyle={styles.textPanelContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text accessibilityRole="text" style={styles.textLabel}>
              Caption / description
            </Text>
            <TextInput
              value={caption}
              onChangeText={handleCaptionChange}
              editable={!isPending}
              multiline
              maxLength={MAX_CAPTION}
              placeholder="Describe what you found and your best guess at its age…"
              placeholderTextColor={Colors.textSecondary}
              style={styles.textArea}
              accessibilityLabel="Caption or description"
            />
            <Text
              style={[styles.charCount, isCaptionWarn && styles.charCountWarn]}
              accessibilityLiveRegion="polite"
              accessibilityLabel={`${captionCount} of ${MAX_CAPTION} characters used`}
            >
              {`${captionCount} / ${MAX_CAPTION}`}
            </Text>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        {inlineError ? (
          <Text
            style={styles.error}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {inlineError}
          </Text>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit || isPending}
          accessibilityRole="button"
          accessibilityLabel={submitAccessibilityLabel}
          accessibilityState={{ disabled: !canSubmit || isPending, busy: isPending }}
          style={({ pressed }) => [
            styles.submitBtn,
            (!canSubmit || isPending) && styles.submitBtnDisabled,
            whenPressed(
              pressed,
              !canSubmit || isPending ? null : styles.submitBtnPressed,
            ),
          ]}
        >
          <Text
            style={[
              styles.submitBtnText,
              (!canSubmit || isPending) && styles.submitBtnTextDisabled,
            ]}
          >
            {submitLabel}
          </Text>
        </Pressable>
      </View>
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
    justifyContent: 'space-between',
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
    fontSize: 20,
    fontWeight: '700',
    color: Colors.ink,
    lineHeight: 22,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  title: {
    fontFamily: Fonts.displayExtraBold,
    fontSize: FontSize.h2,
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  banner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.base,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.chip,
    padding: Spacing.base,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  bannerLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
  },
  bannerText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.caption,
    lineHeight: LineHeight.caption,
    color: Colors.ink,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.base,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 10,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: Colors.surface,
  },
  tabText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.ink,
  },
  panelArea: {
    flex: 1,
  },
  photoPanel: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  cameraArea: {
    flex: 1,
    minHeight: 260,
    borderRadius: Radius.card,
    backgroundColor: Colors.ink,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cameraAreaPressed: {
    borderColor: Colors.primary,
  },
  cameraIdle: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  cameraIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.onPrimaryFill,
    borderWidth: 1.5,
    borderColor: Colors.onPrimaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconGlyph: {
    fontSize: 30,
  },
  cameraHint: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.surface,
    textAlign: 'center',
  },
  cameraHintSub: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  previewWrap: {
    ...StyleSheet.absoluteFill,
  },
  previewImage: {
    ...StyleSheet.absoluteFill,
    resizeMode: 'cover',
  },
  previewOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.scrim,
  },
  previewCheck: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCheckGlyph: {
    fontSize: 26,
    color: Colors.white,
    fontWeight: '700',
  },
  previewLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.white,
  },
  retakeBtn: {
    alignSelf: 'center',
    borderRadius: Radius.btn,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  retakeBtnPressed: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  retakeBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.body,
    color: Colors.ink,
  },
  textPanel: {
    flex: 1,
  },
  textPanelContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  textLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.caption,
    color: Colors.ink,
  },
  textArea: {
    minHeight: 160,
    borderRadius: Radius.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    fontFamily: Fonts.bodyRegular,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.ink,
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: Fonts.bodyRegular,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  charCountWarn: {
    color: Colors.error,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? Spacing.lg : Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Spacing.md,
  },
  error: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.caption,
    lineHeight: LineHeight.caption,
    color: Colors.error,
  },
  submitBtn: {
    height: 54,
    borderRadius: Radius.btn,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnPressed: {
    backgroundColor: Colors.primaryDark,
  },
  submitBtnDisabled: {
    backgroundColor: Colors.border,
  },
  submitBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.button,
    color: Colors.white,
    letterSpacing: 0.2,
  },
  submitBtnTextDisabled: {
    color: Colors.textSecondary,
  },
});
