import { apiRequest } from './apiClient';
import { submitPhotoProof, submitTextProof } from './proofApi';

jest.mock('./apiClient');
jest.mock('expo-file-system');

const mockApiRequest = apiRequest as jest.Mock;

describe('proofApi', () => {
  let appendSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiRequest.mockResolvedValue({
      completionId: 'c1',
      missionTitle: 'Find the Oldest Thing',
      xpAwarded: 40,
      totalXp: 40,
      currentStreak: 1,
      longestStreak: 1,
      proofUrl: null,
    });
    // RN's FormData polyfill doesn't reliably implement .get()/.getAll(), so
    // assert on what was appended rather than reading the form back.
    appendSpy = jest.spyOn(FormData.prototype, 'append');
  });

  afterEach(() => {
    appendSpy.mockRestore();
  });

  describe('submitPhotoProof', () => {
    it('posts multipart form data with a photo field to the mission proof endpoint', async () => {
      await submitPhotoProof('mission-1', 'file:///tmp/capture.jpg');

      expect(mockApiRequest).toHaveBeenCalledWith(
        '/missions/mission-1/proof',
        expect.objectContaining({ method: 'POST', body: expect.any(FormData) }),
      );
      // A plain { uri, name, type } object is appended — React Native's own
      // native multipart-file mechanism — not a Blob. See localFilePart.ts
      // for why: two separate Blob-based attempts each hit a real,
      // unresolved React Native core bug.
      const [field, part] = appendSpy.mock.calls[0];
      expect(field).toBe('photo');
      expect(part).not.toBeInstanceOf(Blob);
      expect(part).toEqual({
        uri: 'file:///tmp/capture.jpg',
        name: 'capture.jpg',
        type: 'image/jpeg',
      });
    });

    it('derives the filename from the source URI regardless of extension', async () => {
      await submitPhotoProof('mission-1', 'file:///tmp/capture.png');

      const [, part] = appendSpy.mock.calls[0];
      expect(part).toEqual({
        uri: 'file:///tmp/capture.png',
        name: 'capture.png',
        type: 'image/png',
      });
    });

    it('handles a URI with no file extension', async () => {
      await submitPhotoProof('mission-1', 'file:///tmp/capture');

      // No extension means no detectable MIME type — this exercises the
      // regression the reviewer originally flagged: the part must still
      // carry whatever type the file reports (even empty), not silently
      // default to a valid-looking type that would mask a missing-type bug.
      const [, part] = appendSpy.mock.calls[0];
      expect(part).toEqual({ uri: 'file:///tmp/capture', name: 'capture', type: '' });
    });

    it('threads an idempotency key through for offline-queue replays', async () => {
      await submitPhotoProof('mission-1', 'file:///tmp/capture.jpg', 'idem-1');

      expect(mockApiRequest).toHaveBeenCalledWith(
        '/missions/mission-1/proof',
        expect.objectContaining({ idempotencyKey: 'idem-1' }),
      );
    });

    it('omits the idempotency key on a live submission', async () => {
      await submitPhotoProof('mission-1', 'file:///tmp/capture.jpg');

      const [, options] = mockApiRequest.mock.calls[0];
      expect(options.idempotencyKey).toBeUndefined();
    });
  });

  describe('submitTextProof', () => {
    it('posts multipart form data with a caption field to the mission proof endpoint', async () => {
      await submitTextProof('mission-1', 'Found it near the old oak tree.');

      expect(mockApiRequest).toHaveBeenCalledWith(
        '/missions/mission-1/proof',
        expect.objectContaining({ method: 'POST', body: expect.any(FormData) }),
      );
      expect(appendSpy).toHaveBeenCalledWith('caption', 'Found it near the old oak tree.');
    });

    it('threads an idempotency key through for offline-queue replays', async () => {
      await submitTextProof('mission-1', 'Done', 'idem-text');

      expect(mockApiRequest).toHaveBeenCalledWith(
        '/missions/mission-1/proof',
        expect.objectContaining({ idempotencyKey: 'idem-text' }),
      );
    });
  });
});
