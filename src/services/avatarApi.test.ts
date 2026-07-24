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
    // uploadAvatar now builds its Blob via localFileToBlob (fetch-based)
    // rather than expo-file-system's File.slice() — see localFileBlob.ts.
    // The raw fetched blob's own type is deliberately left empty here;
    // localFileToBlob re-slices with the file's real type.
    globalThis.fetch = jest.fn().mockResolvedValue({
      blob: () => Promise.resolve(new Blob([], { type: '' })),
    });
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

    it('appends a real Blob (via localFileToBlob) carrying the source MIME type', async () => {
      await uploadAvatar('file:///tmp/avatar.jpg');

      // A genuine Blob — not a duck-typed { uri, name, type } object and not
      // via expo-file-system's File.slice() (a separate, confirmed upstream
      // bug) — see localFileBlob.ts for why.
      const [field, blob, filename] = appendSpy.mock.calls[0];
      expect(field).toBe('avatar');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/jpeg');
      expect(filename).toBe('avatar.jpg');
    });

    it('carries a png source MIME type through unchanged', async () => {
      await uploadAvatar('file:///tmp/avatar.png');

      const [, blob] = appendSpy.mock.calls[0];
      expect(blob.type).toBe('image/png');
      expect(appendSpy).toHaveBeenCalledWith(
        'avatar',
        expect.any(Blob),
        'avatar.png',
      );
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
