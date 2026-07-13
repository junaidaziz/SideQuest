import { File } from 'expo-file-system';
import { apiRequest } from './apiClient';
import type { UserProfile } from '../types/api';

/**
 * Uploads (or replaces) the authenticated user's profile avatar via
 * `POST /users/me/avatar` and returns the updated profile.
 *
 * `photoUri` is a local file URI from expo-image-picker (e.g. `file:///...`).
 *
 * The multipart body is built with the exact same `File.slice()` pattern as
 * `proofApi.submitPhotoProof` — appending a real `Blob` rather than the legacy
 * `{ uri, name, type }` object, which fails React Native's New Architecture
 * strict `instanceof Blob` check ("Unsupported FormDataPart implementation").
 * `expo-file-system`'s `File` only *structurally* implements `Blob`, so
 * appending the `File` directly fails the same check; `File.slice()` is the one
 * call that yields a genuine `Blob`. Its third argument (`contentType`) must be
 * passed `file.type` explicitly — omitting it produces a Blob with an empty
 * MIME type that the backend's `ALLOWED_IMAGE_MIME_TYPES` filter rejects.
 *
 * The multipart field name is `avatar` (not `photo`) — it must match the
 * backend's `FileInterceptor('avatar', …)`.
 */
export function uploadAvatar(photoUri: string): Promise<UserProfile> {
  const form = new FormData();
  const file = new File(photoUri);
  const blob = file.slice(undefined, undefined, file.type);
  form.append('avatar', blob, file.name);

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
