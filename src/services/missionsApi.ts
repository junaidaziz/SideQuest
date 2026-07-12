import { apiRequest } from './apiClient';
import type { GenerateMissionsRequest, GenerateMissionsResponse } from '../types/api';

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
