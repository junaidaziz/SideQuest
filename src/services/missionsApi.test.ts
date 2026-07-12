import { apiRequest } from './apiClient';
import { generateMissions, saveMission, unsaveMission } from './missionsApi';
import type { GenerateMissionsRequest } from '../types/api';

jest.mock('./apiClient');

describe('missionsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiRequest as jest.Mock).mockResolvedValue({ missions: [] });
  });

  it('posts to /missions/generate without auth', async () => {
    const filters: GenerateMissionsRequest = {
      crew: 'Solo',
      time: '30 min',
      setting: 'Outdoors',
      budget: 'Free',
    };

    await generateMissions(filters);

    expect(apiRequest).toHaveBeenCalledWith('/missions/generate', {
      method: 'POST',
      body: filters,
      auth: false,
    });
  });

  describe('saveMission', () => {
    it('posts to /missions/:id/save with auth', async () => {
      (apiRequest as jest.Mock).mockResolvedValue({ saved: true });

      const result = await saveMission('mission-1');

      expect(apiRequest).toHaveBeenCalledWith('/missions/mission-1/save', {
        method: 'POST',
      });
      expect(result).toEqual({ saved: true });
    });
  });

  describe('unsaveMission', () => {
    it('sends DELETE to /missions/:id/save with auth', async () => {
      (apiRequest as jest.Mock).mockResolvedValue({ saved: false });

      const result = await unsaveMission('mission-1');

      expect(apiRequest).toHaveBeenCalledWith('/missions/mission-1/save', {
        method: 'DELETE',
      });
      expect(result).toEqual({ saved: false });
    });
  });
});
