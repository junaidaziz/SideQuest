import { apiRequest } from './apiClient';
import { localFileToBlob } from './localFileBlob';
import type { ProofSubmissionResponse } from '../types/api';

/**
 * Submits a photo as proof. `photoUri` is a local file URI from
 * expo-image-picker (e.g. `file:///...`).
 *
 * Appends a real `Blob` (via `localFileToBlob`, backed by `fetch()`) rather
 * than the legacy React Native convention of appending a plain
 * `{ uri, name, type }` object in place of a Blob. That duck-typed shape
 * previously worked, but under React Native's New Architecture (the default
 * here on RN 0.86) FormData's native part handling does a strict
 * `instanceof Blob` check and rejects it with "Unsupported FormDataPart
 * implementation" — confirmed as the exact error hit testing gallery
 * uploads on a real iOS Simulator. `expo-file-system`'s own `File.slice()`
 * looked like the fix (it's explicitly typed to return a genuine `Blob`),
 * but it hits a *different*, separately confirmed bug (expo/expo#40144) —
 * see `localFileBlob.ts` for why `fetch()` is used instead.
 */
export async function submitPhotoProof(
  missionId: string,
  photoUri: string,
  idempotencyKey?: string,
): Promise<ProofSubmissionResponse> {
  const form = new FormData();
  const { blob, name } = await localFileToBlob(photoUri);
  form.append('photo', blob, name);

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
