import { File } from 'expo-file-system';
import { apiRequest } from './apiClient';
import type { ProofSubmissionResponse } from '../types/api';

/**
 * Submits a photo as proof. `photoUri` is a local file URI from
 * expo-image-picker (e.g. `file:///...`).
 *
 * Appends a real `Blob` (via `File.slice()`) rather than the legacy React
 * Native convention of appending a plain `{ uri, name, type }` object in
 * place of a Blob. That duck-typed shape previously worked, but under React
 * Native's New Architecture (the default here on RN 0.86) FormData's native
 * part handling does a strict `instanceof Blob` check and rejects it with
 * "Unsupported FormDataPart implementation" — confirmed as the exact error
 * hit testing gallery uploads on a real iOS Simulator. `expo-file-system`'s
 * `File` class itself only *structurally* implements the `Blob` TypeScript
 * interface (it doesn't actually extend the runtime `Blob` global — verified
 * this the hard way, appending a `File` directly still fails the same
 * `instanceof Blob` check under test). `File.slice()` is explicitly typed to
 * return a genuine `Blob`, which is the one call in this API that reliably
 * produces an object satisfying that check.
 */
export function submitPhotoProof(
  missionId: string,
  photoUri: string,
  idempotencyKey?: string,
): Promise<ProofSubmissionResponse> {
  const form = new FormData();
  const file = new File(photoUri);
  // slice() does NOT carry over the source file's MIME type on its own — its
  // third argument (contentType) defaults to undefined, which produces a
  // Blob with type "" if omitted. That empty type reaches the backend's
  // multer fileFilter as an unrecognized Content-Type and gets rejected by
  // ALLOWED_IMAGE_MIME_TYPES — a real bug caught in review, not a hypothetical
  // one. `file.type` (native-detected from the file itself) must be passed
  // through explicitly.
  const blob = file.slice(undefined, undefined, file.type);
  form.append('photo', blob, file.name);

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
