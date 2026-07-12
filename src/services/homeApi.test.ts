import { apiRequest } from './apiClient';
import { getHome } from './homeApi';
import type { HomeResponse } from '../types/api';

jest.mock('./apiClient');

const RESPONSE: HomeResponse = {
  level: { level: 3, xpIntoLevel: 50, xpToNextLevel: 50, totalXp: 250 },
  streak: { currentStreak: 3, longestStreak: 5 },
  dailyMission: null,
  pendingChallenges: [],
  savedPacks: [],
};

describe('homeApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiRequest as jest.Mock).mockResolvedValue(RESPONSE);
  });

  it('fetches /home with auth', async () => {
    const result = await getHome();

    expect(apiRequest).toHaveBeenCalledWith('/home');
    expect(result).toEqual(RESPONSE);
  });
});
