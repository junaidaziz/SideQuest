import { apiRequest } from './apiClient';
import {
  acceptTaskInvite,
  createTask,
  declineTaskInvite,
  generateTaskInvite,
  getTask,
  getTaskSummary,
  listTasks,
  reviewTaskSubmission,
  submitTaskEvidence,
} from './tasksApi';
import type { CreateTaskRequest, Task, TaskDetail } from '../types/api';

jest.mock('./apiClient');
jest.mock('expo-file-system');

const mockApiRequest = apiRequest as jest.Mock;

const TASK: Task = {
  id: 'task-1',
  creatorId: 'user-a',
  assigneeId: null,
  title: 'Hike three trails',
  description: 'Any three this month.',
  rewardXp: 120,
  verificationMethod: 'CREATOR_APPROVAL',
  evidenceRequired: true,
  status: 'Open',
  dueAt: '2026-08-01T18:00:00.000Z',
  createdAt: '2026-07-13T09:20:00.000Z',
  updatedAt: '2026-07-13T09:20:00.000Z',
};

const DETAIL: TaskDetail = { ...TASK, inviteToken: 'tok-1', submissions: [] };

describe('tasksApi', () => {
  let appendSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiRequest.mockResolvedValue(TASK);
    // RN's FormData polyfill doesn't reliably implement .get(), so assert on
    // what was appended rather than reading the form back.
    appendSpy = jest.spyOn(FormData.prototype, 'append');
  });

  afterEach(() => {
    appendSpy.mockRestore();
  });

  describe('createTask', () => {
    it('POSTs the task body to /tasks', async () => {
      const body: CreateTaskRequest = { title: 'Hike three trails', rewardXp: 120 };
      await createTask(body);
      expect(mockApiRequest).toHaveBeenCalledWith('/tasks', { method: 'POST', body });
    });
  });

  describe('listTasks', () => {
    it('lists with no query when called empty', async () => {
      mockApiRequest.mockResolvedValue([TASK]);
      const result = await listTasks();
      expect(mockApiRequest).toHaveBeenCalledWith('/tasks');
      expect(result).toEqual([TASK]);
    });

    it('appends status and role query params', async () => {
      mockApiRequest.mockResolvedValue([TASK]);
      await listTasks({ status: 'Accepted', role: 'assignee' });
      expect(mockApiRequest).toHaveBeenCalledWith('/tasks?status=Accepted&role=assignee');
    });

    it('omits an undefined filter', async () => {
      mockApiRequest.mockResolvedValue([TASK]);
      await listTasks({ status: 'Invited' });
      expect(mockApiRequest).toHaveBeenCalledWith('/tasks?status=Invited');
    });
  });

  describe('getTaskSummary', () => {
    it('GETs /tasks/summary', async () => {
      await getTaskSummary();
      expect(mockApiRequest).toHaveBeenCalledWith('/tasks/summary');
    });
  });

  describe('getTask', () => {
    it('GETs a single task by id', async () => {
      mockApiRequest.mockResolvedValue(DETAIL);
      const result = await getTask('task-1');
      expect(mockApiRequest).toHaveBeenCalledWith('/tasks/task-1');
      expect(result).toBe(DETAIL);
    });
  });

  describe('generateTaskInvite', () => {
    it('POSTs to the invite endpoint', async () => {
      mockApiRequest.mockResolvedValue({ inviteToken: 'tok', inviteUrl: 'sidequest://x' });
      await generateTaskInvite('task-1');
      expect(mockApiRequest).toHaveBeenCalledWith('/tasks/task-1/invite', { method: 'POST' });
    });
  });

  describe('acceptTaskInvite / declineTaskInvite', () => {
    it('POSTs accept with the token', async () => {
      await acceptTaskInvite('tok-1');
      expect(mockApiRequest).toHaveBeenCalledWith('/tasks/invites/tok-1/accept', { method: 'POST' });
    });

    it('POSTs decline with the token', async () => {
      await declineTaskInvite('tok-1');
      expect(mockApiRequest).toHaveBeenCalledWith('/tasks/invites/tok-1/decline', { method: 'POST' });
    });
  });

  describe('submitTaskEvidence', () => {
    it('appends a real Blob for a photo plus notes', async () => {
      mockApiRequest.mockResolvedValue(DETAIL);
      await submitTaskEvidence('task-1', { photoUri: 'file:///tmp/proof.jpg', notes: 'Done!' });

      expect(mockApiRequest).toHaveBeenCalledWith(
        '/tasks/task-1/submissions',
        expect.objectContaining({ method: 'POST', body: expect.any(FormData) }),
      );
      const [, blob] = appendSpy.mock.calls[0];
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/jpeg');
      expect(appendSpy).toHaveBeenCalledWith('photo', expect.any(Blob), 'proof.jpg');
      expect(appendSpy).toHaveBeenCalledWith('notes', 'Done!');
    });

    it('submits notes-only with no photo appended', async () => {
      mockApiRequest.mockResolvedValue(DETAIL);
      await submitTaskEvidence('task-1', { notes: 'No photo needed' });
      expect(appendSpy).toHaveBeenCalledWith('notes', 'No photo needed');
      expect(appendSpy).not.toHaveBeenCalledWith('photo', expect.anything(), expect.anything());
    });

    it('submits an empty form when neither photo nor notes given', async () => {
      mockApiRequest.mockResolvedValue(DETAIL);
      await submitTaskEvidence('task-1', {});
      expect(appendSpy).not.toHaveBeenCalled();
      expect(mockApiRequest).toHaveBeenCalledWith(
        '/tasks/task-1/submissions',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('reviewTaskSubmission', () => {
    it('PATCHes the review decision', async () => {
      mockApiRequest.mockResolvedValue(DETAIL);
      await reviewTaskSubmission('task-1', 'sub-1', { decision: 'Approve' });
      expect(mockApiRequest).toHaveBeenCalledWith(
        '/tasks/task-1/submissions/sub-1/review',
        { method: 'PATCH', body: { decision: 'Approve' } },
      );
    });

    it('PATCHes a rejection with a reason', async () => {
      mockApiRequest.mockResolvedValue(DETAIL);
      await reviewTaskSubmission('task-1', 'sub-1', {
        decision: 'Reject',
        rejectionReason: 'Wrong photo',
      });
      expect(mockApiRequest).toHaveBeenCalledWith(
        '/tasks/task-1/submissions/sub-1/review',
        { method: 'PATCH', body: { decision: 'Reject', rejectionReason: 'Wrong photo' } },
      );
    });
  });
});
