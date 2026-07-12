import { apiRequest } from './apiClient';
import { submitPhotoProof, submitTextProof } from './proofApi';

jest.mock('./apiClient');

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
      expect(appendSpy).toHaveBeenCalledWith(
        'photo',
        expect.objectContaining({ uri: 'file:///tmp/capture.jpg', type: 'image/jpeg' }),
      );
    });

    it('derives the mimetype from the file extension', async () => {
      await submitPhotoProof('mission-1', 'file:///tmp/capture.png');

      expect(appendSpy).toHaveBeenCalledWith(
        'photo',
        expect.objectContaining({ type: 'image/png' }),
      );
    });

    it('recognizes webp', async () => {
      await submitPhotoProof('mission-1', 'file:///tmp/capture.webp');

      expect(appendSpy).toHaveBeenCalledWith(
        'photo',
        expect.objectContaining({ type: 'image/webp' }),
      );
    });

    it('defaults to image/jpeg for an unrecognized or missing extension', async () => {
      await submitPhotoProof('mission-1', 'file:///tmp/capture');

      expect(appendSpy).toHaveBeenCalledWith(
        'photo',
        expect.objectContaining({ type: 'image/jpeg' }),
      );
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
  });
});
