import { apiRequest } from './apiClient';
import type { UserProfile } from '../types/api';

/**
 * Display-name bounds — mirror the backend `UpdateProfileDto`
 * (`@MinLength(1)` / `@MaxLength(50)`) so client-side validation rejects the
 * same inputs the server would 400 on, rather than round-tripping to find out.
 */
export const DISPLAY_NAME_MIN_LENGTH = 1;
export const DISPLAY_NAME_MAX_LENGTH = 50;

/**
 * Updates the authenticated user's display name via `PATCH /auth/me` and
 * returns the freshly-projected profile. The caller is responsible for pushing
 * the result into `authStore` (via `updateProfile`) so every screen reading
 * `user` reflects the change immediately.
 */
export function updateDisplayName(displayName: string): Promise<UserProfile> {
  return apiRequest<UserProfile>('/auth/me', {
    method: 'PATCH',
    body: { displayName },
  });
}
