import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const chain = (): unknown => new Proxy(function () {}, { get: () => chain(), apply: () => chain() });
  return {
    __esModule: true,
    default: { View, createAnimatedComponent: (comp: unknown) => comp },
    FadeInDown: chain(),
  };
});
jest.mock('../../services/tasksApi');

import ChallengeFeedScreen, { whenPressed } from './ChallengeFeedScreen';
import {
  bucketTasks,
  formatDeadline,
  isDeadlineSoon,
  pickEmoji,
  statusBucket,
  statusLabel,
} from './challengeUtils';
import { listTasks } from '../../services/tasksApi';
import type { Task } from '../../types/api';

const mockListTasks = listTasks as jest.MockedFunction<typeof listTasks>;

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: 'task-1',
    creatorId: 'me',
    assigneeId: null,
    title: 'Hike three trails',
    description: 'Any three this month.',
    rewardXp: 120,
    verificationMethod: 'CREATOR_APPROVAL',
    evidenceRequired: true,
    status: 'Accepted',
    dueAt: null,
    createdAt: '2026-07-13T09:20:00.000Z',
    updatedAt: '2026-07-13T09:20:00.000Z',
    ...overrides,
  };
}

const TASKS: Task[] = [
  makeTask({ id: 't-active', title: 'Peak Seeker', status: 'Accepted' }),
  makeTask({ id: 't-incoming', title: 'Green Thumb', status: 'Invited' }),
  makeTask({ id: 't-done', title: 'Coffee Chat', status: 'Approved' }),
];

async function renderScreen(overrides: Partial<React.ComponentProps<typeof ChallengeFeedScreen>> = {}) {
  const onBack = jest.fn();
  const onCreateChallenge = jest.fn();
  const onOpenChallenge = jest.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const utils = await render(
    <QueryClientProvider client={queryClient}>
      <ChallengeFeedScreen
        onBack={onBack}
        onCreateChallenge={onCreateChallenge}
        onOpenChallenge={onOpenChallenge}
        {...overrides}
      />
    </QueryClientProvider>,
  );
  return { ...utils, onBack, onCreateChallenge, onOpenChallenge };
}

describe('ChallengeFeedScreen', () => {
  afterEach(cleanup);
  beforeEach(() => {
    jest.clearAllMocks();
    mockListTasks.mockResolvedValue(TASKS);
  });

  describe('pure helpers', () => {
    it('statusBucket maps lifecycle to the three tabs', () => {
      expect(statusBucket('Invited')).toBe('incoming');
      expect(statusBucket('Accepted')).toBe('active');
      expect(statusBucket('Open')).toBe('active');
      expect(statusBucket('Approved')).toBe('completed');
      expect(statusBucket('Cancelled')).toBe('completed');
    });

    it('bucketTasks groups a list', () => {
      const groups = bucketTasks(TASKS);
      expect(groups.active).toHaveLength(1);
      expect(groups.incoming).toHaveLength(1);
      expect(groups.completed).toHaveLength(1);
    });

    it('statusLabel humanises every status', () => {
      expect(statusLabel('Open')).toBe('Not sent yet');
      expect(statusLabel('Invited')).toBe('Awaiting reply');
      expect(statusLabel('Accepted')).toBe('In progress');
      expect(statusLabel('Submitted')).toBe('Awaiting review');
      expect(statusLabel('Rejected')).toBe('Needs resubmission');
      expect(statusLabel('Approved')).toBe('Completed');
      expect(statusLabel('Declined')).toBe('Declined');
      expect(statusLabel('Cancelled')).toBe('Cancelled');
      // Defensive default branch for an unknown value.
      expect(statusLabel('Weird' as never)).toBe('Weird');
    });

    it('formatDeadline returns relative text or null', () => {
      const now = new Date('2026-07-13T00:00:00.000Z').getTime();
      expect(formatDeadline(null, now)).toBeNull();
      expect(formatDeadline('2026-07-13T00:00:00.000Z', now)).toBe('Due today');
      expect(formatDeadline('2026-07-14T00:00:00.000Z', now)).toBe('1 day left');
      expect(formatDeadline('2026-07-18T00:00:00.000Z', now)).toBe('5 days left');
      expect(formatDeadline('2026-07-10T00:00:00.000Z', now)).toBe('Overdue');
      expect(formatDeadline('nope', now)).toBeNull();
    });

    it('isDeadlineSoon flags near/overdue deadlines', () => {
      const now = new Date('2026-07-13T00:00:00.000Z').getTime();
      expect(isDeadlineSoon('2026-07-14T00:00:00.000Z', now)).toBe(true); // 1 day left
      expect(isDeadlineSoon('2026-07-13T00:00:00.000Z', now)).toBe(true); // due today
      expect(isDeadlineSoon('2026-07-10T00:00:00.000Z', now)).toBe(true); // overdue
      expect(isDeadlineSoon('2026-07-30T00:00:00.000Z', now)).toBe(false);
      expect(isDeadlineSoon(null, now)).toBe(false);
    });

    it('pickEmoji is deterministic and non-empty', () => {
      expect(pickEmoji('abc')).toBe(pickEmoji('abc'));
      expect(pickEmoji('abc').length).toBeGreaterThan(0);
    });

    it('whenPressed returns style only when pressed', () => {
      const s = { opacity: 0.5 };
      expect(whenPressed(true, s)).toBe(s);
      expect(whenPressed(false, s)).toBeNull();
    });
  });

  describe('rendering', () => {
    it('shows the loading skeleton first', async () => {
      mockListTasks.mockReturnValue(new Promise(() => {}));
      await renderScreen();
      expect(screen.getByLabelText('Loading challenges')).toBeTruthy();
    });

    it('defaults to the Active tab and shows its cards', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/Peak Seeker\. Status: In progress/)).toBeTruthy());
      // An incoming task is not visible under the default Active tab.
      expect(screen.queryByLabelText(/Green Thumb\./)).toBeNull();
    });

    it('renders the error state and retries', async () => {
      mockListTasks.mockRejectedValue(new Error('offline'));
      await renderScreen();
      await waitFor(() => expect(screen.getByText("Couldn't load challenges")).toBeTruthy());
      mockListTasks.mockResolvedValue(TASKS);
      fireEvent.press(screen.getByLabelText('Try again'));
      await waitFor(() => expect(screen.getByLabelText(/Peak Seeker\./)).toBeTruthy());
    });

    it('renders deadline, and cards missing description/reward, without crashing', async () => {
      const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      mockListTasks.mockResolvedValue([
        makeTask({ id: 'soon', title: 'Due Soon', status: 'Accepted', dueAt: future }),
        makeTask({ id: 'bare', title: 'Bare Task', status: 'Accepted', description: null, rewardXp: null }),
      ]);
      await renderScreen();
      // Deadline text is derived from the real dueAt.
      await waitFor(() => expect(screen.getByLabelText(/Due Soon\..*1 day left/)).toBeTruthy());
      // A card with no description or reward still renders its title + status.
      expect(screen.getByLabelText(/Bare Task\. Status: In progress\.$/)).toBeTruthy();
    });

    it('shows an empty state (with a working CTA) when a tab has no challenges', async () => {
      mockListTasks.mockResolvedValue([makeTask({ id: 'only', status: 'Accepted' })]);
      const { onCreateChallenge } = await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/Incoming, 0 challenges/)).toBeTruthy());
      fireEvent.press(screen.getByLabelText(/Incoming, 0 challenges/));
      await waitFor(() => expect(screen.getByText('Nothing here yet')).toBeTruthy());
      fireEvent.press(screen.getByLabelText('Send a new challenge'));
      expect(onCreateChallenge).toHaveBeenCalled();
    });
  });

  describe('interactions', () => {
    it('switches to the Completed tab', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/Completed, 1 challenge/)).toBeTruthy());
      fireEvent.press(screen.getByLabelText(/Completed, 1 challenge/));
      await waitFor(() => expect(screen.getByLabelText(/Coffee Chat\. Status: Completed/)).toBeTruthy());
    });

    it('opens a challenge on card press', async () => {
      const { onOpenChallenge } = await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/Peak Seeker\./)).toBeTruthy());
      fireEvent.press(screen.getByLabelText(/Peak Seeker\./));
      expect(onOpenChallenge).toHaveBeenCalledWith('t-active');
    });

    it('invokes onCreateChallenge from the header', async () => {
      const { onCreateChallenge } = await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Send a challenge')).toBeTruthy());
      fireEvent.press(screen.getByLabelText('Send a challenge'));
      expect(onCreateChallenge).toHaveBeenCalledTimes(1);
    });

    it('invokes onBack from the header', async () => {
      const { onBack } = await renderScreen();
      fireEvent.press(screen.getByLabelText('Back to progress'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('gives every button and tab a label', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/Peak Seeker\./)).toBeTruthy());
      [...screen.getAllByRole('button'), ...screen.getAllByRole('tab')].forEach((b) => {
        expect(b.props.accessibilityLabel).toBeTruthy();
      });
    });
  });
});
