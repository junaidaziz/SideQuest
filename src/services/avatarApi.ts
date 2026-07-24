import { apiRequest } from './apiClient';
import { localFileToBlob } from './localFileBlob';
import type { UserProfile } from '../types/api';

/**
 * Uploads (or replaces) the authenticated user's profile avatar via
 * `POST /users/me/avatar` and returns the updated profile.
 *
 * `photoUri` is a local file URI from expo-image-picker (e.g. `file:///...`).
 *
 * The multipart body is built with the exact same `localFileToBlob` helper as
 * `proofApi.submitPhotoProof` — see `localFileBlob.ts` for why a `fetch()`-based
 * Blob is used instead of `expo-file-system`'s `File.slice()` (a duck-typed
 * `{ uri, name, type }` object fails FormData's New Architecture `instanceof
 * Blob` check; `File.slice()` itself hits a separate, confirmed upstream bug,
 * expo/expo#40144).
 *
 * The multipart field name is `avatar` (not `photo`) — it must match the
 * backend's `FileInterceptor('avatar', …)`.
 */
export async function uploadAvatar(photoUri: string): Promise<UserProfile> {
  const form = new FormData();
  const { blob, name } = await localFileToBlob(photoUri);
  form.append('avatar', blob, name);

  return apiRequest<UserProfile>('/users/me/avatar', {
    method: 'POST',
    body: form,
  });
}

/**
 * Removes the current avatar via `DELETE /users/me/avatar` and returns the
 * updated profile (`avatarUrl: null`). Idempotent server-side — safe to call
 * even when no avatar is set.
 */
export function removeAvatar(): Promise<UserProfile> {
  return apiRequest<UserProfile>('/users/me/avatar', { method: 'DELETE' });
}
