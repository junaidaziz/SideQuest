import { apiRequest } from './apiClient';
import { localUploadFile } from './localUploadFile';
import type { ProofSubmissionResponse } from '../types/api';

/**
 * Submits a photo as proof. `photoUri` is a local file URI from
 * expo-image-picker (e.g. `file:///...`).
 *
 * Appends the raw `expo-file-system` `File` instance directly — this app's
 * actual runtime `fetch` (Expo's own "Winter" runtime, not React Native's
 * `whatwg-fetch`) only accepts a string, a real `Blob`, or an object with a
 * `.bytes` member when serializing a FormData part. See `localUploadFile.ts`
 * for the full, hard-won explanation: a plain `{ uri, name, type }` object
 * and two different real-`Blob`-construction attempts were each tried first
 * and each failed for a different confirmed reason.
 */
export function submitPhotoProof(
  missionId: string,
  photoUri: string,
  idempotencyKey?: string,
): Promise<ProofSubmissionResponse> {
  const form = new FormData();
  form.append('photo', localUploadFile(photoUri));

  return apiRequest<ProofSubmissionResponse>(`/missions/${missionId}/proof`, {
    method: 'POST',
    body: form,
    idempotencyKey,
  });
}

/**
 * Submits a text caption as proof (1-500 chars, matches the backend DTO).
 * `idempotencyKey` is threaded through for offline-queue replays (M23.4).
 */
export function submitTextProof(
  missionId: string,
  caption: string,
  idempotencyKey?: string,
): Promise<ProofSubmissionResponse> {
  const form = new FormData();
  form.append('caption', caption);

  return apiRequest<ProofSubmissionResponse>(`/missions/${missionId}/proof`, {
    method: 'POST',
    body: form,
    idempotencyKey,
  });
}
