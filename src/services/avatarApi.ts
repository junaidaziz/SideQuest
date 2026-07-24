import { apiRequest } from './apiClient';
import { localFilePart } from './localFilePart';
import type { UserProfile } from '../types/api';

/**
 * Uploads (or replaces) the authenticated user's profile avatar via
 * `POST /users/me/avatar` and returns the updated profile.
 *
 * `photoUri` is a local file URI from expo-image-picker (e.g. `file:///...`).
 *
 * The multipart body is built with the exact same `localFilePart` helper as
 * `proofApi.submitPhotoProof` — see `localFilePart.ts` for why a plain
 * `{ uri, name, type }` object (React Native's own native multipart-file
 * mechanism) is used instead of a `Blob`.
 *
 * The multipart field name is `avatar` (not `photo`) — it must match the
 * backend's `FileInterceptor('avatar', …)`.
 */
export function uploadAvatar(photoUri: string): Promise<UserProfile> {
  const form = new FormData();
  // TypeScript's ambient FormData type is the DOM spec (string | Blob) and
  // doesn't know about React Native's actual runtime FormData, which also
  // accepts a plain { uri, name, type } object — see localFilePart.ts.
  form.append('avatar', localFilePart(photoUri) as unknown as Blob);

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
