import { apiRequest } from './apiClient';
import { generateMissions } from './missionsApi';
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
});
