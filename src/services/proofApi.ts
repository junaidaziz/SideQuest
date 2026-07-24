import { apiRequest } from './apiClient';
import { localFilePart } from './localFilePart';
import type { ProofSubmissionResponse } from '../types/api';

/**
 * Submits a photo as proof. `photoUri` is a local file URI from
 * expo-image-picker (e.g. `file:///...`).
 *
 * Appends a plain `{ uri, name, type }` object — React Native's own native
 * mechanism for a multipart file part, which streams the file from disk on
 * the native side without the JS layer ever touching a `Blob` or
 * `ArrayBuffer`. See `localFilePart.ts` for why: two earlier attempts to
 * build a real `Blob` instead (`expo-file-system`'s `File.slice()`, then a
 * `fetch()`-based approach) each independently hit the same real,
 * unresolved React Native core bug.
 */
export function submitPhotoProof(
  missionId: string,
  photoUri: string,
  idempotencyKey?: string,
): Promise<ProofSubmissionResponse> {
  const form = new FormData();
  // TypeScript's ambient FormData type is the DOM spec (string | Blob) and
  // doesn't know about React Native's actual runtime FormData, which also
  // accepts a plain { uri, name, type } object — see localFilePart.ts.
  form.append('photo', localFilePart(photoUri) as unknown as Blob);

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
