import { apiRequest } from './apiClient';
import { localUploadFile } from './localUploadFile';
import type { UserProfile } from '../types/api';

/**
 * Uploads (or replaces) the authenticated user's profile avatar via
 * `POST /users/me/avatar` and returns the updated profile.
 *
 * `photoUri` is a local file URI from expo-image-picker (e.g. `file:///...`).
 *
 * The multipart body is built with the exact same `localUploadFile` helper
 * as `proofApi.submitPhotoProof` — see `localUploadFile.ts` for why the raw
 * `File` instance is appended directly (this app's actual `fetch` runtime,
 * Expo's "Winter" fetch, requires it).
 *
 * The multipart field name is `avatar` (not `photo`) — it must match the
 * backend's `FileInterceptor('avatar', …)`.
 */
export function uploadAvatar(photoUri: string): Promise<UserProfile> {
  const form = new FormData();
  form.append('avatar', localUploadFile(photoUri));

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
