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
    // submitPhotoProof now builds its Blob via localFileToBlob (fetch-based)
    // rather than expo-file-system's File.slice() — see localFileBlob.ts for
    // why. The raw fetched blob's own type is deliberately left empty here;
    // localFileToBlob re-slices with the file's real type, so these tests
    // still exercise that the correct MIME type ends up on the appended blob.
    globalThis.fetch = jest.fn().mockResolvedValue({
      blob: () => Promise.resolve(new Blob([], { type: '' })),
    });
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
      // A real Blob (via localFileToBlob's fetch()-based construction) is
      // appended — not a duck-typed { uri, name, type } object, and not
      // expo-file-system's File.slice() (a separate, confirmed upstream bug)
      // — see localFileBlob.ts for why.
      const [, blob] = appendSpy.mock.calls[0];
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/jpeg');
      expect(appendSpy).toHaveBeenCalledWith('photo', expect.any(Blob), 'capture.jpg');
    });

    it('derives the filename from the source URI regardless of extension', async () => {
      await submitPhotoProof('mission-1', 'file:///tmp/capture.png');

      const [, blob] = appendSpy.mock.calls[0];
      expect(blob.type).toBe('image/png');
      expect(appendSpy).toHaveBeenCalledWith('photo', expect.any(Blob), 'capture.png');
    });

    it('handles a URI with no file extension', async () => {
      await submitPhotoProof('mission-1', 'file:///tmp/capture');

      // No extension means no detectable MIME type — this exercises the
      // regression the reviewer flagged: the blob must still be re-sliced
      // with whatever type the file reports, not silently default to a
      // valid-looking type that would mask a missing-type bug.
      const [, blob] = appendSpy.mock.calls[0];
      expect(blob.type).toBe('');
      expect(appendSpy).toHaveBeenCalledWith('photo', expect.any(Blob), 'capture');
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
