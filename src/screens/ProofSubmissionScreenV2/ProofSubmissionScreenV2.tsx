import React, { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleProp, Text, TextInput, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
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
import { submitPhotoProof, submitTextProof } from '../../services/proofApi';
import { enqueueProofSubmission } from '../../services/queuedActions';
import { useOfflineStatus } from '../../components/states/useOfflineStatus';
import type { ProofSubmissionResponse } from '../../types/api';
import { makeStyles } from './ProofSubmissionScreenV2.styles';

export type { ProofSubmissionResponse } from '../../types/api';

export type ProofMode = 'photo' | 'text';

// The backend accepts exactly one photo per proof submission (no multi-photo
// endpoint exists — see the submit mutation below). An earlier version of
// this screen let users stage up to 3 photos in a grid and silently
// submitted only the first, with no indication the other two were dropped.
// Capping the UI at 1 removes that false affordance instead of disclosing
// around it: retaking replaces the single photo rather than adding to a set
// that isn't real.
const MAX_PHOTOS = 1;
const MAX_CAPTION = 500;

/** Whether the current draft can be submitted for the active mode. */
export function canSubmit(mode: ProofMode, photos: string[], caption: string): boolean {
  return mode === 'photo' ? photos.length > 0 : caption.trim().length > 0;
}

/** CTA label reflecting what's still needed (or the ready state). */
export function submitLabel(mode: ProofMode, photos: string[], caption: string): string {
  if (mode === 'photo') {
    return photos.length === 0 ? 'Add a photo to submit' : 'Submit proof';
  }
  return caption.trim().length === 0 ? 'Write your proof to submit' : 'Submit proof';
}

function whenPressed(pressed: boolean, style: StyleProp<ViewStyle>): StyleProp<ViewStyle> {
  return pressed ? style : null;
}

interface ProofSubmissionScreenV2Props {
  missionId: string;
  missionTitle: string;
  /** Proof requirement copy shown in the banner (from the mission). */
  proofRequirement?: string;
  /** Launches the camera/library and resolves a local file URI (or null if
   * cancelled). Injected so the screen stays decoupled from expo-image-picker. */
  onRequestAddPhoto?: () => Promise<string | null>;
  onBack?: () => void;
  onSubmitted?: (result: ProofSubmissionResponse) => void;
  /**
   * Called after a submission is durably queued because the device is offline
   * (M23.4). The proof isn't lost — it's stored (photo URI, not a Blob) and
   * replayed on reconnect. Optional so existing callers keep the online-only
   * behaviour unchanged.
   */
  onQueuedOffline?: () => void;
}

export default function ProofSubmissionScreenV2({
  missionId,
  missionTitle,
  proofRequirement = 'Add a clear photo, or describe what you did.',
  onRequestAddPhoto,
  onBack,
  onSubmitted,
  onQueuedOffline,
}: ProofSubmissionScreenV2Props) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const offline = useOfflineStatus();
  const [mode, setMode] = useState<ProofMode>('photo');
  const [photos, setPhotos] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [queued, setQueued] = useState(false);

  const scale = useSharedValue(1);
  const ctaStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability -- reanimated shared values are intentionally mutable
    scale.value = withSpring(0.97, { damping: 18, stiffness: 320 });
  }, [scale]);
  const onPressOut = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability -- reanimated shared values are intentionally mutable
    scale.value = withSpring(1, { damping: 18, stiffness: 320 });
  }, [scale]);

  const submitMutation = useMutation({
    mutationFn: () =>
      mode === 'photo' ? submitPhotoProof(missionId, photos[0]) : submitTextProof(missionId, caption.trim()),
    onSuccess: (result) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onSubmitted?.(result);
    },
    onError: (error) => {
      // Logged so a real failure is diagnosable — the render below only
      // ever shows a generic connectivity message regardless of cause.
      console.error('[ProofSubmissionScreenV2] proof submission failed:', error);
    },
  });

  const handleAddPhoto = useCallback(async () => {
    if (!onRequestAddPhoto || photos.length >= MAX_PHOTOS) return;
    const uri = await onRequestAddPhoto();
    if (uri) setPhotos((prev) => [...prev, uri]);
  }, [onRequestAddPhoto, photos.length]);

  const handleRemovePhoto = useCallback((uri: string) => {
    setPhotos((prev) => prev.filter((p) => p !== uri));
  }, []);

  const submittable = canSubmit(mode, photos, caption) && !submitMutation.isPending && !queued;

  const handleSubmit = useCallback(async () => {
    if (!submittable) return;
    // Offline: durably queue the proof (URI, not a Blob) and let the write
    // queue replay it on reconnect with an idempotency key, rather than
    // failing the submission outright.
    if (offline) {
      const content = mode === 'photo' ? photos[0] : caption.trim();
      await enqueueProofSubmission(mode, missionId, content);
      setQueued(true);
      onQueuedOffline?.();
      return;
    }
    submitMutation.mutate();
  }, [submittable, offline, mode, photos, caption, missionId, submitMutation, onQueuedOffline]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back to active quest" style={styles.iconBtn}>
          <Icon name="back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          {missionTitle}
        </Text>
      </View>

      <Animated.View style={styles.scroll} entering={FadeInDown.duration(CompassMotion.durationStandard)}>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View>
            <Text accessibilityRole="header" style={styles.heading}>
              Submit proof
            </Text>
            <Text style={styles.subhead}>Show what you did — a photo or a few words.</Text>
          </View>

          <View style={styles.reqBanner} accessibilityRole="text">
            <Text accessibilityElementsHidden importantForAccessibility="no">{'\u{1F4F7}'}</Text>
            <Text style={styles.reqText}>{proofRequirement}</Text>
          </View>

          <View style={styles.segmented} accessibilityRole="tablist">
            <Pressable
              onPress={() => setMode('photo')}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === 'photo' }}
              accessibilityLabel="Photo proof"
              style={[styles.seg, mode === 'photo' && styles.segActive]}
            >
              <Text style={[styles.segText, mode === 'photo' && styles.segTextActive]}>{'\u{1F4F7} Photo'}</Text>
            </Pressable>
            <Pressable
              onPress={() => setMode('text')}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === 'text' }}
              accessibilityLabel="Text proof"
              style={[styles.seg, mode === 'text' && styles.segActive]}
            >
              <Text style={[styles.segText, mode === 'text' && styles.segTextActive]}>{'\u{270F}\u{FE0F} Text'}</Text>
            </Pressable>
          </View>

          {mode === 'photo' ? (
            <View style={styles.photoGrid} accessibilityLabel={photos.length > 0 ? 'Your photo' : 'No photo added yet'}>
              {photos.map((uri, index) => (
                <View key={uri} style={styles.photoTile}>
                  <Image source={{ uri }} style={styles.photoImage} accessibilityLabel={`Photo ${index + 1}`} />
                  <Pressable
                    onPress={() => handleRemovePhoto(uri)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove photo ${index + 1}`}
                    style={styles.removeBtn}
                    // Visual glyph stays compact (26x26) to avoid crowding a
                    // photo tile at 31.5% grid width, but the actual touch
                    // target is padded out to COMPASS_TOUCH_MIN via hitSlop —
                    // the standard technique for a small overlay control.
                    hitSlop={{ top: 11, bottom: 11, left: 11, right: 11 }}
                  >
                    <Text style={styles.removeGlyph}>{'✕'}</Text>
                  </Pressable>
                </View>
              ))}
              {photos.length < MAX_PHOTOS ? (
                <Pressable
                  onPress={handleAddPhoto}
                  accessibilityRole="button"
                  accessibilityLabel="Add a photo, opens camera or library"
                  style={styles.addTile}
                >
                  <Icon name="add" size={28} color={colors.actionPrimary} />
                  <Text style={styles.addLabel}>Add photo</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View>
              <TextInput
                value={caption}
                onChangeText={(t) => setCaption(t.slice(0, MAX_CAPTION))}
                placeholder="Describe what you did…"
                placeholderTextColor={colors.textTertiary}
                multiline
                maxLength={MAX_CAPTION}
                accessibilityLabel="Proof description"
                style={styles.textInput}
              />
              <Text style={styles.charCount}>{`${caption.length} / ${MAX_CAPTION}`}</Text>
            </View>
          )}

          <View style={styles.tip}>
            <Text accessibilityElementsHidden importantForAccessibility="no">{'\u{1F4A1}'}</Text>
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Tip: </Text>
              proof is only seen by you and reviewers — no rush, and you can retake before submitting.
            </Text>
          </View>

          {queued ? (
            <Text style={styles.tipText} accessibilityLiveRegion="polite" accessibilityRole="text">
              You&apos;re offline — your proof is saved and will submit automatically once
              you&apos;re back online.
            </Text>
          ) : submitMutation.isError ? (
            <Text style={styles.errorText} accessibilityLiveRegion="polite">
              Couldn&apos;t submit your proof. Check your connection and try again.
            </Text>
          ) : null}
        </ScrollView>
      </Animated.View>

      <View style={styles.stickyCta}>
        <Animated.View style={ctaStyle}>
          <Pressable
            onPress={() => {
              void handleSubmit();
            }}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={!submittable}
            accessibilityRole="button"
            accessibilityState={{ disabled: !submittable, busy: submitMutation.isPending }}
            accessibilityLabel={submitMutation.isPending ? 'Submitting proof' : submitLabel(mode, photos, caption)}
            style={({ pressed }) => [
              styles.primaryBtn,
              !submittable && styles.primaryBtnDisabled,
              whenPressed(pressed, styles.primaryBtnDisabled),
            ]}
          >
            <Text style={styles.primaryBtnText}>
              {queued
                ? 'Proof saved for later'
                : submitMutation.isPending
                  ? 'Submitting…'
                  : submitLabel(mode, photos, caption)}
            </Text>
          </Pressable>
        </Animated.View>
        <Text style={styles.draftNote}>Draft saved · we&apos;ll keep it if you lose signal</Text>
      </View>
    </SafeAreaView>
  );
}
