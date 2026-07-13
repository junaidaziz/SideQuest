import { apiRequest } from './apiClient';
import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_MIN_LENGTH,
  updateDisplayName,
} from './profileApi';
import type { UserProfile } from '../types/api';

jest.mock('./apiClient');

const mockApiRequest = apiRequest as jest.Mock;

const UPDATED: UserProfile = {
  id: 'u1',
  email: 'a@b.com',
  displayName: 'Ada Lovelace',
  isGuest: false,
  avatarUrl: null,
};

describe('profileApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiRequest.mockResolvedValue(UPDATED);
  });

  it('exposes bounds mirroring the backend UpdateProfileDto', () => {
    expect(DISPLAY_NAME_MIN_LENGTH).toBe(1);
    expect(DISPLAY_NAME_MAX_LENGTH).toBe(50);
  });

  describe('updateDisplayName', () => {
    it('PATCHes /auth/me with the new display name and returns the profile', async () => {
      const result = await updateDisplayName('Ada Lovelace');

      expect(mockApiRequest).toHaveBeenCalledWith('/auth/me', {
        method: 'PATCH',
        body: { displayName: 'Ada Lovelace' },
      });
      expect(result).toEqual(UPDATED);
    });

    it('sends a single-character name at the lower boundary verbatim', async () => {
      await updateDisplayName('A');

      expect(mockApiRequest).toHaveBeenCalledWith('/auth/me', {
        method: 'PATCH',
        body: { displayName: 'A' },
      });
    });

    it('sends a 50-character name at the upper boundary verbatim', async () => {
      const name = 'x'.repeat(DISPLAY_NAME_MAX_LENGTH);
      await updateDisplayName(name);

      expect(mockApiRequest).toHaveBeenCalledWith('/auth/me', {
        method: 'PATCH',
        body: { displayName: name },
      });
    });

    it('propagates an API rejection to the caller', async () => {
      mockApiRequest.mockRejectedValueOnce(new Error('400 Bad Request'));

      await expect(updateDisplayName('Ada')).rejects.toThrow('400 Bad Request');
    });
  });
});
