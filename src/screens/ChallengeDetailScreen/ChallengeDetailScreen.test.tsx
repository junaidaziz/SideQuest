import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ChallengeDetailScreen, { whenPressed } from './ChallengeDetailScreen';
import {
  buildTimeline,
  formatWhen,
  latestPendingSubmission,
  relationship,
  verificationSummary,
} from './detailUtils';
import { generateTaskInvite, getTask, reviewTaskSubmission } from '../../services/tasksApi';
import type { TaskDetail, TaskSubmission } from '../../types/api';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('../../services/tasksApi');

const mockGetTask = getTask as jest.MockedFunction<typeof getTask>;
const mockReview = reviewTaskSubmission as jest.MockedFunction<typeof reviewTaskSubmission>;
const mockInvite = generateTaskInvite as jest.MockedFunction<typeof generateTaskInvite>;

function makeDetail(overrides: Partial<TaskDetail> = {}): TaskDetail {
  return {
    id: 'task-1',
    creatorId: 'creator-id',
    assigneeId: 'assignee-id',
    title: 'Peak Seeker',
    description: 'Hike three trails this month.',
    rewardXp: 120,
    verificationMethod: 'CREATOR_APPROVAL',
    evidenceRequired: true,
    status: 'Submitted',
    dueAt: '2026-08-01T18:00:00.000Z',
    createdAt: '2026-07-13T09:20:00.000Z',
    updatedAt: '2026-07-13T09:20:00.000Z',
    inviteToken: null,
    submissions: [],
    ...overrides,
  };
}

const PENDING_SUB: TaskSubmission = {
  id: 'sub-1',
  submittedById: 'assignee-id',
  notes: 'Done all three!',
  status: 'Submitted',
  submittedAt: '2026-07-20T10:00:00.000Z',
  reviewedAt: null,
  reviewedById: null,
  rejectionReason: null,
  attachments: [],
};

async function renderScreen(detail: TaskDetail, props: Partial<React.ComponentProps<typeof ChallengeDetailScreen>> = {}) {
  mockGetTask.mockResolvedValue(detail);
  const onBack = jest.fn();
  const onSubmitEvidence = jest.fn();
  const onShareInvite = jest.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const utils = await render(
    <QueryClientProvider client={queryClient}>
      <ChallengeDetailScreen
        taskId="task-1"
        onBack={onBack}
        onSubmitEvidence={onSubmitEvidence}
        onShareInvite={onShareInvite}
        {...props}
      />
    </QueryClientProvider>,
  );
  return { ...utils, onBack, onSubmitEvidence, onShareInvite };
}

describe('ChallengeDetailScreen', () => {
  afterEach(cleanup);
  beforeEach(() => {
    jest.clearAllMocks();
    mockReview.mockResolvedValue(makeDetail({ status: 'Approved' }));
    mockInvite.mockResolvedValue({ inviteToken: 'tok-1', inviteUrl: 'sidequest://tasks/invite/tok-1' });
  });

  describe('pure helpers', () => {
    it('relationship resolves role from ids', () => {
      const d = makeDetail();
      expect(relationship(d, 'creator-id')).toBe('creator');
      expect(relationship(d, 'assignee-id')).toBe('assignee');
      expect(relationship(d, 'someone-else')).toBe('observer');
      expect(relationship(d, undefined)).toBe('observer');
    });

    it('latestPendingSubmission returns the last Submitted one', () => {
      const older = { ...PENDING_SUB, id: 'old', status: 'Rejected' as const };
      expect(latestPendingSubmission([older, PENDING_SUB])?.id).toBe('sub-1');
      expect(latestPendingSubmission([older])).toBeNull();
    });

    it('formatWhen handles bad input', () => {
      expect(formatWhen(null)).toBeNull();
      expect(formatWhen('nope')).toBeNull();
      expect(formatWhen('2026-07-13T09:20:00.000Z')).toBeTruthy();
    });

    it('buildTimeline derives events from submissions', () => {
      const d = makeDetail({
        status: 'Approved',
        submissions: [{ ...PENDING_SUB, status: 'Approved', reviewedAt: '2026-07-21T10:00:00.000Z' }],
      });
      const tl = buildTimeline(d);
      expect(tl.find((e) => e.title === 'Approved')).toBeTruthy();
      expect(tl.find((e) => e.id === 'accepted')).toBeTruthy();
    });

    it('buildTimeline marks a rejection', () => {
      const d = makeDetail({
        status: 'Rejected',
        submissions: [{ ...PENDING_SUB, status: 'Rejected', rejectionReason: 'Wrong trail' }],
      });
      const rejected = buildTimeline(d).find((e) => e.state === 'rejected');
      expect(rejected?.detail).toBe('Wrong trail');
    });

    it('verificationSummary describes the method', () => {
      expect(verificationSummary(makeDetail({ verificationMethod: 'CREATOR_APPROVAL' }))).toMatch(/reviews/);
      expect(verificationSummary(makeDetail({ verificationMethod: 'NONE' }))).toMatch(/No evidence/);
    });

    it('whenPressed returns style only when pressed', () => {
      const s = { opacity: 0.5 };
      expect(whenPressed(true, s)).toBe(s);
      expect(whenPressed(false, s)).toBeNull();
    });
  });

  describe('rendering', () => {
    it('shows the loading skeleton first', async () => {
      mockGetTask.mockReturnValue(new Promise(() => {}));
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      await render(
        <QueryClientProvider client={queryClient}>
          <ChallengeDetailScreen taskId="task-1" />
        </QueryClientProvider>,
      );
      expect(screen.getByLabelText('Loading challenge')).toBeTruthy();
    });

    it('renders the hero, timeline, and reward', async () => {
      await renderScreen(makeDetail());
      await waitFor(() => expect(screen.getByLabelText(/Peak Seeker\. Status: Awaiting review/)).toBeTruthy());
      expect(screen.getByText('Reward: 120 XP on approval')).toBeTruthy();
      expect(screen.getByLabelText(/Challenge created/)).toBeTruthy();
    });

    it('renders the error state and retries', async () => {
      mockGetTask.mockRejectedValue(new Error('offline'));
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      await render(
        <QueryClientProvider client={queryClient}>
          <ChallengeDetailScreen taskId="task-1" />
        </QueryClientProvider>,
      );
      await waitFor(() => expect(screen.getByText("Couldn't load challenge")).toBeTruthy());
      mockGetTask.mockResolvedValue(makeDetail());
      fireEvent.press(screen.getByLabelText('Try again'));
      await waitFor(() => expect(screen.getByLabelText(/Peak Seeker\./)).toBeTruthy());
    });
  });

  describe('creator review actions', () => {
    it('approves a pending submission', async () => {
      await renderScreen(makeDetail({ submissions: [PENDING_SUB] }), { currentUserId: 'creator-id' });
      await waitFor(() => expect(screen.getByLabelText('Approve this proof')).toBeTruthy());
      fireEvent.press(screen.getByLabelText('Approve this proof'));
      await waitFor(() =>
        expect(mockReview).toHaveBeenCalledWith('task-1', 'sub-1', { decision: 'Approve', rejectionReason: undefined }),
      );
    });

    it('requires a reason before confirming a rejection', async () => {
      await renderScreen(makeDetail({ submissions: [PENDING_SUB] }), { currentUserId: 'creator-id' });
      await waitFor(() => expect(screen.getByLabelText('Reject this proof')).toBeTruthy());
      fireEvent.press(screen.getByLabelText('Reject this proof'));
      const confirm = await screen.findByLabelText('Confirm rejection');
      expect(confirm.props.accessibilityState.disabled).toBe(true);
      fireEvent.press(confirm);
      expect(mockReview).not.toHaveBeenCalled();

      fireEvent.changeText(screen.getByLabelText('Reason for rejection'), 'Wrong trail photo');
      await waitFor(() =>
        expect(screen.getByLabelText('Confirm rejection').props.accessibilityState.disabled).toBe(false),
      );
      fireEvent.press(screen.getByLabelText('Confirm rejection'));
      await waitFor(() =>
        expect(mockReview).toHaveBeenCalledWith('task-1', 'sub-1', {
          decision: 'Reject',
          rejectionReason: 'Wrong trail photo',
        }),
      );
    });

    it('hides approve/reject from the assignee even when a submission is pending', async () => {
      // Regression test: the review actions are gated on role === 'creator',
      // not on submission status alone — an assignee viewing their own
      // pending submission must never see the creator's review controls.
      await renderScreen(makeDetail({ submissions: [PENDING_SUB] }), { currentUserId: 'assignee-id' });
      await waitFor(() => expect(screen.getByLabelText(/Peak Seeker\./)).toBeTruthy());
      expect(screen.queryByLabelText('Approve this proof')).toBeNull();
      expect(screen.queryByLabelText('Reject this proof')).toBeNull();
    });
  });

  describe('assignee actions', () => {
    it('submits proof when accepted', async () => {
      const { onSubmitEvidence } = await renderScreen(makeDetail({ status: 'Accepted', submissions: [] }), {
        currentUserId: 'assignee-id',
      });
      await waitFor(() => expect(screen.getByLabelText('Submit proof')).toBeTruthy());
      fireEvent.press(screen.getByLabelText('Submit proof'));
      expect(onSubmitEvidence).toHaveBeenCalledWith('task-1');
    });

    it('offers resubmit after a rejection', async () => {
      await renderScreen(makeDetail({ status: 'Rejected' }), { currentUserId: 'assignee-id' });
      await waitFor(() => expect(screen.getByLabelText('Resubmit proof')).toBeTruthy());
    });
  });

  describe('creator invite actions', () => {
    it('creates an invite link when none exists', async () => {
      const { onShareInvite } = await renderScreen(makeDetail({ status: 'Open', assigneeId: null, submissions: [] }), {
        currentUserId: 'creator-id',
      });
      await waitFor(() => expect(screen.getByLabelText('Create an invite link')).toBeTruthy());
      fireEvent.press(screen.getByLabelText('Create an invite link'));
      await waitFor(() => expect(mockInvite).toHaveBeenCalledWith('task-1'));
      await waitFor(() => expect(onShareInvite).toHaveBeenCalledWith('sidequest://tasks/invite/tok-1'));
    });

    it('shares an existing invite token without a new API call', async () => {
      const { onShareInvite } = await renderScreen(
        makeDetail({ status: 'Invited', assigneeId: null, inviteToken: 'existing', submissions: [] }),
        { currentUserId: 'creator-id' },
      );
      await waitFor(() => expect(screen.getByLabelText('Share invite link')).toBeTruthy());
      fireEvent.press(screen.getByLabelText('Share invite link'));
      expect(onShareInvite).toHaveBeenCalledWith('sidequest://tasks/invite/existing');
      expect(mockInvite).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('gives every button a label', async () => {
      await renderScreen(makeDetail({ submissions: [PENDING_SUB] }), { currentUserId: 'creator-id' });
      await waitFor(() => expect(screen.getByLabelText('Approve this proof')).toBeTruthy());
      screen.getAllByRole('button').forEach((b) => {
        expect(b.props.accessibilityLabel).toBeTruthy();
      });
    });
  });
});
