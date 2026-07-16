import { apiRequest } from './apiClient';
import { generateMissions, listSavedMissions, saveMission, unsaveMission } from './missionsApi';
import type { GenerateMissionsRequest, PaginatedSavedMissions } from '../types/api';

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

  describe('listSavedMissions', () => {
    it('GETs /missions/saved with no query when called empty', async () => {
      const page: PaginatedSavedMissions = { items: [], total: 0, limit: 20, offset: 0 };
      (apiRequest as jest.Mock).mockResolvedValue(page);

      const result = await listSavedMissions();

      expect(apiRequest).toHaveBeenCalledWith('/missions/saved');
      expect(result).toBe(page);
    });

    it('appends limit and offset params', async () => {
      const page: PaginatedSavedMissions = { items: [], total: 0, limit: 5, offset: 10 };
      (apiRequest as jest.Mock).mockResolvedValue(page);

      await listSavedMissions({ limit: 5, offset: 10 });

      expect(apiRequest).toHaveBeenCalledWith('/missions/saved?limit=5&offset=10');
    });

    it('includes a zero offset (0 is a valid value, not omitted)', async () => {
      const page: PaginatedSavedMissions = { items: [], total: 0, limit: 20, offset: 0 };
      (apiRequest as jest.Mock).mockResolvedValue(page);

      await listSavedMissions({ offset: 0 });

      expect(apiRequest).toHaveBeenCalledWith('/missions/saved?offset=0');
    });
  });
});
