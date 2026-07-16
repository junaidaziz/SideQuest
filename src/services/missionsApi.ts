import { apiRequest } from './apiClient';
import type {
  GenerateMissionsRequest,
  GenerateMissionsResponse,
  ListSavedMissionsQuery,
  PaginatedSavedMissions,
  SaveMissionResponse,
} from '../types/api';

/** Serializes defined params into a `?a=b&c=d` suffix (empty when none). */
function buildQuery(params: Record<string, string | undefined>): string {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') usp.append(key, value);
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

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

/** The caller's saved quests, newest-saved-first. */
export function listSavedMissions(
  query: ListSavedMissionsQuery = {},
): Promise<PaginatedSavedMissions> {
  const qs = buildQuery({
    limit: query.limit?.toString(),
    offset: query.offset?.toString(),
  });
  return apiRequest<PaginatedSavedMissions>(`/missions/saved${qs}`);
}
