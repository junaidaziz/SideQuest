import { apiRequest } from './apiClient';
import type { ProofSubmissionResponse } from '../types/api';

/** Submits a photo as proof. `photoUri` is a local file URI from
 * expo-image-picker (e.g. `file:///...`). */
export function submitPhotoProof(
  missionId: string,
  photoUri: string,
): Promise<ProofSubmissionResponse> {
  const form = new FormData();
  const filename = photoUri.split('/').pop() ?? 'proof.jpg';
  const extMatch = /\.(\w+)$/.exec(filename);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  // React Native's fetch accepts this { uri, name, type } shape in place of a
  // Blob for file uploads — this is the standard RN FormData file convention.
  form.append('photo', { uri: photoUri, name: filename, type: mimeType } as unknown as Blob);

  return apiRequest<ProofSubmissionResponse>(`/missions/${missionId}/proof`, {
    method: 'POST',
    body: form,
  });
}

/** Submits a text caption as proof (1-500 chars, matches the backend DTO). */
export function submitTextProof(
  missionId: string,
  caption: string,
): Promise<ProofSubmissionResponse> {
  const form = new FormData();
  form.append('caption', caption);

  return apiRequest<ProofSubmissionResponse>(`/missions/${missionId}/proof`, {
    method: 'POST',
    body: form,
  });
}
