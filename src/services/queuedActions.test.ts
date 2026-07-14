import { offlineQueue } from './offlineQueue';
import { enqueueSaveToggle, enqueueProofSubmission } from './queuedActions';

jest.mock('./offlineQueue', () => ({
  offlineQueue: { enqueue: jest.fn() },
}));

const mockEnqueue = offlineQueue.enqueue as jest.Mock;

describe('queuedActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnqueue.mockResolvedValue({ id: 'q-1' });
  });

  describe('enqueueSaveToggle', () => {
    it('enqueues a save when toggling on', async () => {
      await enqueueSaveToggle('m1', true);
      expect(mockEnqueue).toHaveBeenCalledWith({ type: 'mission.save', payload: { missionId: 'm1' } });
    });

    it('enqueues an unsave when toggling off', async () => {
      await enqueueSaveToggle('m1', false);
      expect(mockEnqueue).toHaveBeenCalledWith({
        type: 'mission.unsave',
        payload: { missionId: 'm1' },
      });
    });
  });

  describe('enqueueProofSubmission', () => {
    it('enqueues a photo proof storing the raw URI (not a Blob)', async () => {
      await enqueueProofSubmission('photo', 'm1', 'file:///tmp/p.jpg');
      expect(mockEnqueue).toHaveBeenCalledWith({
        type: 'mission.proof.photo',
        payload: { missionId: 'm1', photoUri: 'file:///tmp/p.jpg' },
      });
    });

    it('enqueues a text proof', async () => {
      await enqueueProofSubmission('text', 'm1', 'Did it');
      expect(mockEnqueue).toHaveBeenCalledWith({
        type: 'mission.proof.text',
        payload: { missionId: 'm1', caption: 'Did it' },
      });
    });
  });
});
