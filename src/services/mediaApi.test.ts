import { apiRequest } from './apiClient';
import {
  confirmMediaUpload,
  createMediaUpload,
  deleteMediaAsset,
  getMediaAsset,
  putFileToPresignedUrl,
  setAvatarFromMedia,
  uploadAvatarViaMediaPipeline,
  waitForMediaReady,
} from './mediaApi';
import type { UserProfile } from '../types/api';

jest.mock('./apiClient');
jest.mock('expo-file-system');

const mockApiRequest = apiRequest as jest.Mock;

const AUTH_RESPONSE = {
  mediaId: 'media-1',
  uploadUrl: 'https://s3.example.test/put-url',
  objectKey: 'avatars/u1/x.png',
  // A second, distinguishing header alongside Content-Type — proves
  // `requiredHeaders` is actually forwarded end to end, not just
  // coincidentally matching what `mimeType` already sends on its own.
  requiredHeaders: { 'Content-Type': 'image/png', 'x-amz-server-side-encryption': 'AES256' },
  expiresAt: '2026-01-01T00:15:00.000Z',
};

const PROFILE: UserProfile = {
  id: 'u1',
  email: 'a@b.com',
  displayName: 'Ada',
  isGuest: false,
  avatarUrl: 'https://cdn.example/lg.webp',
  avatarVariants: [
    { name: 'lg', url: 'https://cdn.example/lg.webp', width: 320, height: 320, format: 'webp' },
  ],
};

describe('mediaApi', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('createMediaUpload', () => {
    it('posts the upload request to /media/uploads', async () => {
      mockApiRequest.mockResolvedValue(AUTH_RESPONSE);

      const result = await createMediaUpload({
        purpose: 'AVATAR',
        fileName: 'x.png',
        mimeType: 'image/png',
        fileSize: 12345,
      });

      expect(mockApiRequest).toHaveBeenCalledWith(
        '/media/uploads',
        expect.objectContaining({
          method: 'POST',
          body: { purpose: 'AVATAR', fileName: 'x.png', mimeType: 'image/png', fileSize: 12345 },
        }),
      );
      expect(result).toEqual(AUTH_RESPONSE);
    });
  });

  describe('putFileToPresignedUrl', () => {
    it('PUTs the raw bytes with the declared content type, not via apiRequest', async () => {
      fetchSpy.mockResolvedValue({ ok: true, status: 200 } as Response);

      await putFileToPresignedUrl('https://s3.example.test/put-url', new Uint8Array([1, 2, 3]), 'image/png');

      expect(fetchSpy).toHaveBeenCalledWith('https://s3.example.test/put-url', {
        method: 'PUT',
        headers: { 'Content-Type': 'image/png' },
        body: expect.any(Uint8Array),
      });
      expect(mockApiRequest).not.toHaveBeenCalled();
    });

    it('throws with the storage response detail on a non-2xx status', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('SignatureDoesNotMatch'),
      } as unknown as Response);

      await expect(
        putFileToPresignedUrl('https://s3.example.test/put-url', new Uint8Array([1]), 'image/png'),
      ).rejects.toThrow(/400/);
    });

    it('merges additionalHeaders (from requiredHeaders) into the PUT, without dropping Content-Type', async () => {
      fetchSpy.mockResolvedValue({ ok: true, status: 200 } as Response);

      await putFileToPresignedUrl(
        'https://s3.example.test/put-url',
        new Uint8Array([1, 2, 3]),
        'image/png',
        { 'x-amz-checksum-crc32': 'abc123', 'x-amz-server-side-encryption': 'AES256' },
      );

      expect(fetchSpy).toHaveBeenCalledWith('https://s3.example.test/put-url', {
        method: 'PUT',
        headers: {
          'x-amz-checksum-crc32': 'abc123',
          'x-amz-server-side-encryption': 'AES256',
          'Content-Type': 'image/png',
        },
        body: expect.any(Uint8Array),
      });
    });
  });

  describe('confirmMediaUpload / getMediaAsset / deleteMediaAsset / setAvatarFromMedia', () => {
    it('confirmMediaUpload posts to the complete endpoint', async () => {
      mockApiRequest.mockResolvedValue({ id: 'media-1', status: 'UPLOADED', variants: [] });
      await confirmMediaUpload('media-1');
      expect(mockApiRequest).toHaveBeenCalledWith('/media/uploads/media-1/complete', {
        method: 'POST',
      });
    });

    it('getMediaAsset GETs the media asset', async () => {
      mockApiRequest.mockResolvedValue({ id: 'media-1', status: 'READY', variants: [] });
      await getMediaAsset('media-1');
      expect(mockApiRequest).toHaveBeenCalledWith('/media/media-1');
    });

    it('deleteMediaAsset DELETEs the media asset', async () => {
      mockApiRequest.mockResolvedValue(undefined);
      await deleteMediaAsset('media-1');
      expect(mockApiRequest).toHaveBeenCalledWith('/media/media-1', { method: 'DELETE' });
    });

    it('setAvatarFromMedia posts the mediaId to the avatar/media endpoint', async () => {
      mockApiRequest.mockResolvedValue(PROFILE);
      const result = await setAvatarFromMedia('media-1');
      expect(mockApiRequest).toHaveBeenCalledWith('/users/me/avatar/media', {
        method: 'POST',
        body: { mediaId: 'media-1' },
      });
      expect(result).toEqual(PROFILE);
    });
  });

  describe('waitForMediaReady', () => {
    it('returns immediately when the asset is already READY', async () => {
      mockApiRequest.mockResolvedValue({ id: 'media-1', status: 'READY', variants: [] });
      const result = await waitForMediaReady('media-1');
      expect(result.status).toBe('READY');
      expect(mockApiRequest).toHaveBeenCalledTimes(1);
    });

    it('polls until the asset becomes READY', async () => {
      mockApiRequest
        .mockResolvedValueOnce({ id: 'media-1', status: 'PROCESSING', variants: [] })
        .mockResolvedValueOnce({ id: 'media-1', status: 'PROCESSING', variants: [] })
        .mockResolvedValueOnce({ id: 'media-1', status: 'READY', variants: [] });

      const result = await waitForMediaReady('media-1', { intervalMs: 1 });

      expect(result.status).toBe('READY');
      expect(mockApiRequest).toHaveBeenCalledTimes(3);
    });

    it('throws when the asset transitions to FAILED', async () => {
      mockApiRequest.mockResolvedValue({ id: 'media-1', status: 'FAILED', variants: [] });
      await expect(waitForMediaReady('media-1', { intervalMs: 1 })).rejects.toThrow(/processing failed/i);
    });

    it('throws once the timeout is exceeded', async () => {
      mockApiRequest.mockResolvedValue({ id: 'media-1', status: 'PROCESSING', variants: [] });
      await expect(
        waitForMediaReady('media-1', { intervalMs: 1, timeoutMs: 1 }),
      ).rejects.toThrow(/longer than expected/i);
    });
  });

  describe('uploadAvatarViaMediaPipeline', () => {
    it('runs the full authorize -> PUT -> confirm -> wait -> set-avatar sequence', async () => {
      mockApiRequest
        .mockResolvedValueOnce(AUTH_RESPONSE) // createMediaUpload
        .mockResolvedValueOnce({ id: 'media-1', status: 'UPLOADED', variants: [] }) // confirmMediaUpload
        .mockResolvedValueOnce({ id: 'media-1', status: 'READY', variants: PROFILE.avatarVariants }) // waitForMediaReady
        .mockResolvedValueOnce(PROFILE); // setAvatarFromMedia
      fetchSpy.mockResolvedValue({ ok: true, status: 200 } as Response);

      const result = await uploadAvatarViaMediaPipeline('file:///tmp/avatar.png');

      expect(mockApiRequest).toHaveBeenNthCalledWith(
        1,
        '/media/uploads',
        expect.objectContaining({
          method: 'POST',
          body: expect.objectContaining({
            purpose: 'AVATAR',
            fileName: 'avatar.png',
            mimeType: 'image/png',
            fileSize: 12345,
          }),
        }),
      );
      expect(fetchSpy).toHaveBeenCalledWith(
        AUTH_RESPONSE.uploadUrl,
        expect.objectContaining({
          method: 'PUT',
          // requiredHeaders from the authorization response is forwarded
          // and merged with Content-Type, not silently dropped.
          headers: { 'Content-Type': 'image/png', 'x-amz-server-side-encryption': 'AES256' },
        }),
      );
      expect(mockApiRequest).toHaveBeenNthCalledWith(2, '/media/uploads/media-1/complete', {
        method: 'POST',
      });
      expect(mockApiRequest).toHaveBeenNthCalledWith(4, '/users/me/avatar/media', {
        method: 'POST',
        body: { mediaId: 'media-1' },
      });
      expect(result).toEqual(PROFILE);
    });

    it('propagates a storage PUT failure without confirming the upload', async () => {
      mockApiRequest.mockResolvedValueOnce(AUTH_RESPONSE);
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve('AccessDenied'),
      } as unknown as Response);

      await expect(uploadAvatarViaMediaPipeline('file:///tmp/avatar.png')).rejects.toThrow(/403/);
      expect(mockApiRequest).toHaveBeenCalledTimes(1);
    });
  });
});
