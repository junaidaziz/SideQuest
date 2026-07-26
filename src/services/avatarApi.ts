import { apiRequest } from './apiClient';
import { localUploadFile } from './localUploadFile';
import type { UserProfile } from '../types/api';

/**
 * Legacy Multer-mediated upload via `POST /users/me/avatar`. Superseded by
 * `mediaApi.uploadAvatarViaMediaPipeline` (the direct-to-S3 flow) — no
 * screen calls this anymore, kept only because the backend endpoint itself
 * is kept for backward compatibility (see `backend/CLAUDE.md`'s Media
 * pipeline section). Don't wire a new call site to this; use
 * `uploadAvatarViaMediaPipeline` instead.
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
