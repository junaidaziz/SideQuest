import { apiRequest } from './apiClient';
import { getReferralHistory, getReferralMe } from './referralsApi';
import type { PaginatedReferralHistory, ReferralMe } from '../types/api';

jest.mock('./apiClient');

const mockApiRequest = apiRequest as jest.Mock;

const ME: ReferralMe = {
  code: 'H7KMNP34',
  inviteUrl: 'sidequest://referrals/invite/H7KMNP34',
  totalReferrals: 3,
  completedReferrals: 1,
  pendingReferrals: 2,
  invitesSent: 5,
  rewardsEarnedXp: 50,
};

const HISTORY: PaginatedReferralHistory = {
  items: [
    {
      id: 'ref-1',
      refereeId: 'user-x',
      status: 'Completed',
      code: 'H7KMNP34',
      registeredAt: '2026-07-01T10:00:00.000Z',
      completedAt: '2026-07-02T10:00:00.000Z',
      createdAt: '2026-07-01T10:00:00.000Z',
      rewardXp: 50,
    },
  ],
  total: 1,
  limit: 20,
  offset: 0,
};

describe('referralsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getReferralMe', () => {
    it('GETs /referrals/me', async () => {
      mockApiRequest.mockResolvedValue(ME);
      const result = await getReferralMe();
      expect(mockApiRequest).toHaveBeenCalledWith('/referrals/me');
      expect(result).toBe(ME);
    });
  });

  describe('getReferralHistory', () => {
    it('GETs /referrals/history with no query when called empty', async () => {
      mockApiRequest.mockResolvedValue(HISTORY);
      const result = await getReferralHistory();
      expect(mockApiRequest).toHaveBeenCalledWith('/referrals/history');
      expect(result).toBe(HISTORY);
    });

    it('appends limit and offset params', async () => {
      mockApiRequest.mockResolvedValue(HISTORY);
      await getReferralHistory({ limit: 10, offset: 20 });
      expect(mockApiRequest).toHaveBeenCalledWith('/referrals/history?limit=10&offset=20');
    });

    it('includes a zero offset (0 is a valid value, not omitted)', async () => {
      mockApiRequest.mockResolvedValue(HISTORY);
      await getReferralHistory({ offset: 0 });
      expect(mockApiRequest).toHaveBeenCalledWith('/referrals/history?offset=0');
    });
  });
});
