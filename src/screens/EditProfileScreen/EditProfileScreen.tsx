import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  type AlertButton,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_MIN_LENGTH,
  updateDisplayName,
} from '../../services/profileApi';
import { removeAvatar, uploadAvatar } from '../../services/avatarApi';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { CompassHeader, textStyle, pressedStyle } from '../../components/compass';
import { initialsFromName } from '../YouScreen/YouScreen';
import { createStyles } from './EditProfileScreen.styles';

/** Max length for the (currently local-only) bio field, mirroring the mockup. */
export const BIO_MAX_LENGTH = 140;

export interface EditProfileScreenProps {
  onBack?: () => void;
  /** Fired once a save round-trip completes successfully. */
  onSaved?: () => void;
}

/** Validates a display name against the backend's 1–50 char bounds. */
export function validateDisplayName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < DISPLAY_NAME_MIN_LENGTH) return 'Enter a display name';
  if (trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
    return `Keep it to ${DISPLAY_NAME_MAX_LENGTH} characters or fewer`;
  }
  return null;
}

export default function EditProfileScreen({ onBack, onSaved }: EditProfileScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  // Pronouns and bio have no backend field yet (UpdateProfileDto only accepts
  // displayName). They are captured locally so the UI is complete; wire them to
  // a real PATCH /auth/me payload once the backend adds the columns.
  // TODO(backend M22): persist pronouns + bio.
  const [pronouns, setPronouns] = useState('');
  const [bio, setBio] = useState('');
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const nameMutation = useMutation({
    mutationFn: (name: string) => updateDisplayName(name),
    onSuccess: (updated) => {
      updateProfile(updated);
      setNameError(null);
      onSaved?.();
    },
    onError: () => setNameError("Couldn't save your changes. Please try again."),
  });

  const avatarMutation = useMutation({
    mutationFn: (uri: string) => uploadAvatar(uri),
    onSuccess: (updated) => {
      updateProfile(updated);
      setAvatarError(null);
    },
    onError: () => setAvatarError("Couldn't update your photo. Please try again."),
  });

  const removeAvatarMutation = useMutation({
    mutationFn: () => removeAvatar(),
    onSuccess: (updated) => {
      updateProfile(updated);
      setAvatarError(null);
    },
    onError: () => setAvatarError("Couldn't remove your photo. Please try again."),
  });

  const saving = nameMutation.isPending;
  const avatarBusy = avatarMutation.isPending || removeAvatarMutation.isPending;
  const hasAvatar = Boolean(user?.avatarUrl);

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
      setAvatarError('Camera access is off. Enable it in Settings to take a photo.');
      return;
    }
    applyPickerResult(await ImagePicker.launchCameraAsync({ quality: 0.8 }));
  }, [applyPickerResult]);

  const launchLibrary = useCallback(async () => {
    setAvatarError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setAvatarError('Photo access is off. Enable it in Settings to choose a photo.');
      return;
    }
    applyPickerResult(await ImagePicker.launchImageLibraryAsync({ quality: 0.8 }));
  }, [applyPickerResult]);

  const presentPhotoOptions = useCallback(() => {
    if (avatarBusy) return;
    const options: AlertButton[] = [
      { text: 'Take Photo', onPress: () => void launchCamera() },
      { text: 'Choose from Library', onPress: () => void launchLibrary() },
      { text: 'Cancel', style: 'cancel' },
    ];
    Alert.alert('Profile photo', 'Update your profile photo.', options);
  }, [avatarBusy, launchCamera, launchLibrary]);

  const handleRemovePhoto = useCallback(() => {
    if (avatarBusy || !hasAvatar) return;
    removeAvatarMutation.mutate();
  }, [avatarBusy, hasAvatar, removeAvatarMutation]);

  const handleNameChange = useCallback((value: string) => {
    setDisplayName(value);
    setNameError((prev) => (prev ? null : prev));
  }, []);

  const handleSave = useCallback(() => {
    if (saving) return;
    const error = validateDisplayName(displayName);
    if (error) {
      setNameError(error);
      return;
    }
    nameMutation.mutate(displayName.trim());
  }, [displayName, nameMutation, saving]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <CompassHeader title="Edit profile" onBack={onBack} backAccessibilityLabel="Back to profile" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <CompassHeader title="Edit profile" onBack={onBack} backAccessibilityLabel="Back to profile" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarEdit}>
          <View style={styles.avatarWrap}>
            <LinearGradient
              colors={[colors.brandViolet, colors.brandVioletDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarLg}
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
              {avatarBusy ? (
                <View style={styles.avatarBusy} importantForAccessibility="no">
                  <ActivityIndicator color="#FFFFFF" />
                </View>
              ) : null}
            </LinearGradient>
            <View
              style={styles.camBadge}
              importantForAccessibility="no"
              accessibilityElementsHidden
            >
              <Text style={styles.camGlyph}>{'\u{1F4F7}'}</Text>
            </View>
          </View>

          <View style={styles.avatarActions}>
            <Pressable
              onPress={presentPhotoOptions}
              disabled={avatarBusy}
              accessibilityRole="button"
              accessibilityLabel="Change photo"
              accessibilityState={{ disabled: avatarBusy, busy: avatarBusy }}
              style={({ pressed }) => [styles.smallBtn, pressedStyle(pressed)]}
            >
              <Text style={styles.smallBtnText}>Change photo</Text>
            </Pressable>
            {hasAvatar ? (
              <Pressable
                onPress={handleRemovePhoto}
                disabled={avatarBusy}
                accessibilityRole="button"
                accessibilityLabel="Remove profile photo"
                accessibilityState={{ disabled: avatarBusy }}
                style={({ pressed }) => [styles.tertiaryBtn, pressedStyle(pressed)]}
              >
                <Text style={styles.tertiaryBtnText}>Remove</Text>
              </Pressable>
            ) : null}
          </View>

          {avatarError ? (
            <Text
              style={[textStyle('bodyS'), styles.helperError]}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              {avatarError}
            </Text>
          ) : (
            <View style={styles.uploadNote}>
              <Text importantForAccessibility="no">{'ℹ️'}</Text>
              <Text style={[textStyle('bodyS'), styles.uploadNoteText]}>
                JPG or PNG, up to 5 MB.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.field}>
          <Text style={[textStyle('labelM'), styles.label]} nativeID="displayNameLabel">
            Display name
          </Text>
          <TextInput
            value={displayName}
            onChangeText={handleNameChange}
            editable={!saving}
            maxLength={DISPLAY_NAME_MAX_LENGTH}
            placeholder="Your display name"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, nameError ? styles.inputInvalid : null]}
            accessibilityLabel="Display name"
            aria-labelledby="displayNameLabel"
          />
          {nameError ? (
            <Text
              style={[textStyle('bodyS'), styles.helperError]}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              {nameError}
            </Text>
          ) : (
            <Text style={[textStyle('bodyS'), styles.helper]}>
              This is how you appear across SideQuest.
            </Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={[textStyle('labelM'), styles.label]}>
            Pronouns <Text style={styles.optional}>(optional)</Text>
          </Text>
          <TextInput
            value={pronouns}
            onChangeText={setPronouns}
            editable={!saving}
            placeholder="Add your pronouns"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
            accessibilityLabel="Pronouns"
          />
        </View>

        <View style={styles.field}>
          <Text style={[textStyle('labelM'), styles.label]}>
            Bio <Text style={styles.optional}>(optional)</Text>
          </Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            editable={!saving}
            multiline
            maxLength={BIO_MAX_LENGTH}
            placeholder="Chasing small adventures between meetings."
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, styles.textarea]}
            accessibilityLabel="Bio"
          />
          <Text
            style={[textStyle('bodyS'), styles.count]}
            accessibilityLabel={`${bio.length} of ${BIO_MAX_LENGTH} characters used`}
          >
            {`${bio.length} / ${BIO_MAX_LENGTH}`}
          </Text>
        </View>

        <View>
          <Text style={[textStyle('labelM'), styles.sectionLabel]}>Who can see this</Text>
          <View style={styles.visCard} accessible accessibilityLabel="Your profile is private. Only you can see it.">
            <View style={styles.visIcon} importantForAccessibility="no">
              <Text>{'\u{1F512}'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[textStyle('labelM'), styles.visTitle]}>Private</Text>
              <Text style={[textStyle('caption'), styles.visSub]}>
                Only you can see your profile and history.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.stickyCta}>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Save changes"
          accessibilityState={{ disabled: saving, busy: saving }}
          style={({ pressed }) => [
            styles.saveBtn,
            saving ? styles.saveBtnDisabled : null,
            pressedStyle(pressed),
          ]}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save changes'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
