import { apiRequest } from './apiClient';
import { removeAvatar, uploadAvatar } from './avatarApi';
import type { UserProfile } from '../types/api';

jest.mock('./apiClient');
jest.mock('expo-file-system');

const mockApiRequest = apiRequest as jest.Mock;

const WITH_AVATAR: UserProfile = {
  id: 'u1',
  email: 'a@b.com',
  displayName: 'Ada',
  isGuest: false,
  avatarUrl: 'https://s3.example.test/avatars/u1.jpg?sig=abc',
};

const WITHOUT_AVATAR: UserProfile = { ...WITH_AVATAR, avatarUrl: null };

describe('avatarApi', () => {
  let appendSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiRequest.mockResolvedValue(WITH_AVATAR);
    // RN's FormData polyfill doesn't reliably implement .get()/.getAll(), so
    // assert on what was appended rather than reading the form back.
    appendSpy = jest.spyOn(FormData.prototype, 'append');
  });

  afterEach(() => {
    appendSpy.mockRestore();
  });

  describe('uploadAvatar', () => {
    it('POSTs multipart form data with an `avatar` field to /users/me/avatar', async () => {
      const result = await uploadAvatar('file:///tmp/avatar.jpg');

      expect(mockApiRequest).toHaveBeenCalledWith(
        '/users/me/avatar',
        expect.objectContaining({ method: 'POST', body: expect.any(FormData) }),
      );
      expect(result).toEqual(WITH_AVATAR);
    });

    it('appends the raw File instance carrying the source MIME type', async () => {
      await uploadAvatar('file:///tmp/avatar.jpg');

      // The raw expo-file-system File instance is appended directly — not a
      // Blob, not a plain object. See localUploadFile.ts for why: this
      // app's actual fetch runtime (Expo's "Winter" fetch) requires an
      // object with a `.bytes` member, which File provides natively.
      const [field, part] = appendSpy.mock.calls[0];
      expect(field).toBe('avatar');
      expect(part).not.toBeInstanceOf(Blob);
      expect(typeof part.bytes).toBe('function');
      expect(part.uri).toBe('file:///tmp/avatar.jpg');
      expect(part.name).toBe('avatar.jpg');
      expect(part.type).toBe('image/jpeg');
    });

    it('carries a png source MIME type through unchanged', async () => {
      await uploadAvatar('file:///tmp/avatar.png');

      const [, part] = appendSpy.mock.calls[0];
      expect(part.name).toBe('avatar.png');
      expect(part.type).toBe('image/png');
    });

    it('propagates an API rejection to the caller', async () => {
      mockApiRequest.mockRejectedValueOnce(new Error('413 Payload Too Large'));

      await expect(uploadAvatar('file:///tmp/big.jpg')).rejects.toThrow(
        '413 Payload Too Large',
      );
    });
  });

  describe('removeAvatar', () => {
    it('DELETEs /users/me/avatar and returns the cleared profile', async () => {
      mockApiRequest.mockResolvedValueOnce(WITHOUT_AVATAR);

      const result = await removeAvatar();

      expect(mockApiRequest).toHaveBeenCalledWith('/users/me/avatar', {
        method: 'DELETE',
      });
      expect(result).toEqual(WITHOUT_AVATAR);
    });

    it('propagates an API rejection to the caller', async () => {
      mockApiRequest.mockRejectedValueOnce(new Error('401 Unauthorized'));

      await expect(removeAvatar()).rejects.toThrow('401 Unauthorized');
    });
  });
});
