import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import ProofSubmissionScreenV2 from '../../src/screens/ProofSubmissionScreenV2';
import type { ProofSubmissionResponse } from '../../src/types/api';

/**
 * Launches the camera or photo library and resolves the picked local file URI
 * (or null if cancelled / permission denied). Injected into
 * ProofSubmissionScreenV2, which is deliberately decoupled from
 * expo-image-picker. Mirrors the picker flow the retired ProofSubmissionScreen
 * implemented internally.
 */
export function requestProofPhoto(): Promise<string | null> {
  return new Promise((resolve) => {
    const launch = async (source: 'camera' | 'library') => {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        resolve(null);
        return;
      }
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
          : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
      resolve(result.canceled ? null : (result.assets?.[0]?.uri ?? null));
    };

    Alert.alert('Add proof photo', 'Take a new photo or choose one from your library.', [
      { text: 'Take Photo', onPress: () => void launch('camera') },
      { text: 'Choose from Library', onPress: () => void launch('library') },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}

/**
 * Proof submission (Compass V2). Replaces the old
 * proof-submission/[missionId] route. A cold-start deep link missing the
 * required params has no quest context, so it falls back to Explore.
 */
export default function ProofSubmissionRoute() {
  const { missionId, missionTitle, proofRequirement } = useLocalSearchParams<{
    missionId: string;
    missionTitle: string;
    proofRequirement: string;
  }>();

  const handleSubmitted = useCallback((result: ProofSubmissionResponse) => {
    // replace, not push — a completed submission shouldn't leave the proof
    // form reachable via the hardware/gesture back button.
    router.replace({ pathname: '/completion', params: { result: JSON.stringify(result) } });
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  if (!missionId) {
    return <Redirect href="/explore" />;
  }

  return (
    <ProofSubmissionScreenV2
      missionId={missionId}
      missionTitle={missionTitle ?? 'Your quest'}
      proofRequirement={proofRequirement}
      onRequestAddPhoto={requestProofPhoto}
      onBack={handleBack}
      onSubmitted={handleSubmitted}
    />
  );
}
