import { apiRequest } from './apiClient';
import type { HomeResponse } from '../types/api';

/** Requires a session (guest or signed-in) — the guest token from
 * authStore's hydration is sufficient, no full account needed. */
export function getHome(): Promise<HomeResponse> {
  return apiRequest<HomeResponse>('/home');
}
