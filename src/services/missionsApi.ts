import { apiRequest } from './apiClient';
import type {
  GenerateMissionsRequest,
  GenerateMissionsResponse,
  SaveMissionResponse,
} from '../types/api';

/** No account or guest token required — this is the first call after context
 * selection, before any session necessarily exists. */
export function generateMissions(
  filters: GenerateMissionsRequest,
): Promise<GenerateMissionsResponse> {
  return apiRequest<GenerateMissionsResponse>('/missions/generate', {
    method: 'POST',
    body: filters,
    auth: false,
  });
}

/** Idempotent — saving an already-saved mission is a no-op server-side. */
export function saveMission(missionId: string): Promise<SaveMissionResponse> {
  return apiRequest<SaveMissionResponse>(`/missions/${missionId}/save`, {
    method: 'POST',
  });
}

/** Idempotent — unsaving a mission that isn't saved is a no-op server-side. */
export function unsaveMission(missionId: string): Promise<SaveMissionResponse> {
  return apiRequest<SaveMissionResponse>(`/missions/${missionId}/save`, {
    method: 'DELETE',
  });
}
