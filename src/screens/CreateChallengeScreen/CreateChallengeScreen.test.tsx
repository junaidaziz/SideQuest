import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const chain = (): unknown => new Proxy(function () {}, { get: () => chain(), apply: () => chain() });
  return { __esModule: true, default: { View, createAnimatedComponent: (c: unknown) => c }, FadeInRight: chain() };
});
jest.mock('../../services/homeApi');
jest.mock('../../services/tasksApi');

import * as Haptics from 'expo-haptics';
import CreateChallengeScreen, { whenPressed } from './CreateChallengeScreen';
import {
  buildCreateRequest,
  canProceed,
  deadlineLabel,
  deadlineToIso,
  EMPTY_DRAFT,
} from './createUtils';
import { getHome } from '../../services/homeApi';
import { createTask, generateTaskInvite } from '../../services/tasksApi';
import type { HomeResponse, Task } from '../../types/api';

const mockGetHome = getHome as jest.MockedFunction<typeof getHome>;
const mockCreate = createTask as jest.MockedFunction<typeof createTask>;
const mockInvite = generateTaskInvite as jest.MockedFunction<typeof generateTaskInvite>;

const HOME: HomeResponse = {
  level: { level: 3, xpIntoLevel: 40, xpToNextLevel: 60, totalXp: 1240 },
  streak: { currentStreak: 7, longestStreak: 12 },
  dailyMission: {
    id: 'm1',
    category: 'explore',
    title: 'Peak Seeker',
    desc: 'Hike three trails.',
    full: 'Hike three different trails this month.',
    proof: 'A photo at each summit.',
    time: '2+ hours',
    xp: '120',
    diff: 'Medium',
    dots: 2,
  },
  pendingChallenges: [],
  savedPacks: [],
  taskStats: { total: 8, approved: 6, pending: 1, rejected: 1, completionRate: 0.75 },
};

const CREATED_TASK: Task = {
  id: 'new-task',
  creatorId: 'me',
  assigneeId: null,
  title: 'Peak Seeker',
  description: 'Hike three trails.',
  rewardXp: 120,
  verificationMethod: 'CREATOR_APPROVAL',
  evidenceRequired: true,
  status: 'Open',
  dueAt: null,
  createdAt: '2026-07-13T09:20:00.000Z',
  updatedAt: '2026-07-13T09:20:00.000Z',
};

async function renderScreen(props: Partial<React.ComponentProps<typeof CreateChallengeScreen>> = {}) {
  const onCancel = jest.fn();
  const onCreated = jest.fn();
  const onShareInvite = jest.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const utils = await render(
    <QueryClientProvider client={queryClient}>
      <CreateChallengeScreen onCancel={onCancel} onCreated={onCreated} onShareInvite={onShareInvite} {...props} />
    </QueryClientProvider>,
  );
  return { ...utils, onCancel, onCreated, onShareInvite };
}

/** Waits for the Continue button to be enabled, then presses it. */
async function pressContinueWhenReady() {
  await waitFor(() =>
    expect(screen.getByLabelText('Continue').props.accessibilityState.disabled).toBe(false),
  );
  fireEvent.press(screen.getByLabelText('Continue'));
}

/** Selects the daily template and advances through steps 2 and 3 to review. */
async function advanceToReview() {
  fireEvent.press(await screen.findByLabelText(/Use today's mission/));
  await pressContinueWhenReady(); // 1 -> 2
  await screen.findByLabelText('Invite by link, selected');
  fireEvent.press(screen.getByLabelText('Continue')); // 2 -> 3
  await screen.findByLabelText('No deadline');
  fireEvent.press(screen.getByLabelText('Continue')); // 3 -> 4
  await screen.findByLabelText('Send challenge');
}

describe('CreateChallengeScreen', () => {
  afterEach(cleanup);
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetHome.mockResolvedValue(HOME);
    mockCreate.mockResolvedValue(CREATED_TASK);
    mockInvite.mockResolvedValue({ inviteToken: 'tok', inviteUrl: 'sidequest://tasks/invite/tok' });
  });

  describe('pure helpers', () => {
    it('deadlineToIso maps choices', () => {
      const now = new Date('2026-07-13T00:00:00.000Z').getTime();
      expect(deadlineToIso('none', now)).toBeUndefined();
      expect(deadlineToIso('3d', now)).toBe('2026-07-16T00:00:00.000Z');
      expect(deadlineToIso('1w', now)).toBe('2026-07-20T00:00:00.000Z');
    });

    it('deadlineLabel resolves labels', () => {
      expect(deadlineLabel('1w')).toBe('In 1 week');
      expect(deadlineLabel('none')).toBe('No deadline');
    });

    it('canProceed requires a title on step 1 only', () => {
      expect(canProceed(1, EMPTY_DRAFT)).toBe(false);
      expect(canProceed(1, { ...EMPTY_DRAFT, title: 'Hi' })).toBe(true);
      expect(canProceed(2, EMPTY_DRAFT)).toBe(true);
    });

    it('buildCreateRequest maps require-review and omits empties', () => {
      const now = new Date('2026-07-13T00:00:00.000Z').getTime();
      const body = buildCreateRequest(
        { source: 'custom', title: '  Trail  ', description: '', rewardXp: null, requireReview: true, deadline: '3d' },
        now,
      );
      expect(body).toEqual({
        title: 'Trail',
        verificationMethod: 'CREATOR_APPROVAL',
        evidenceRequired: true,
        dueAt: '2026-07-16T00:00:00.000Z',
      });
    });

    it('buildCreateRequest uses SELF when review is off', () => {
      const body = buildCreateRequest({ ...EMPTY_DRAFT, title: 'X', requireReview: false });
      expect(body.verificationMethod).toBe('SELF');
      expect(body.evidenceRequired).toBe(false);
    });

    it('whenPressed returns style only when pressed', () => {
      const s = { opacity: 0.5 };
      expect(whenPressed(true, s)).toBe(s);
      expect(whenPressed(false, s)).toBeNull();
    });
  });

  describe('step 1', () => {
    it('disables Continue until a mission is chosen', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Continue')).toBeTruthy());
      expect(screen.getByLabelText('Continue').props.accessibilityState.disabled).toBe(true);
    });

    it('enables Continue after typing a custom title', async () => {
      await renderScreen();
      fireEvent.press(await screen.findByLabelText('Write a custom challenge'));
      fireEvent.changeText(await screen.findByLabelText('Challenge title'), 'Read a book');
      await waitFor(() =>
        expect(screen.getByLabelText('Continue').props.accessibilityState.disabled).toBe(false),
      );
    });
  });

  describe('full flow', () => {
    it('walks all four steps and sends, calling both endpoints', async () => {
      const { onShareInvite } = await renderScreen();
      await advanceToReview();
      expect(screen.getByLabelText('Mission: Peak Seeker')).toBeTruthy();
      fireEvent.press(screen.getByLabelText('Send challenge'));

      await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(mockInvite).toHaveBeenCalledWith('new-task'));
      await waitFor(() => expect(screen.getByText('Challenge created')).toBeTruthy());
      expect(onShareInvite).toHaveBeenCalledWith('sidequest://tasks/invite/tok');
    });

    it('fires haptics on step transitions', async () => {
      await renderScreen();
      fireEvent.press(await screen.findByLabelText(/Use today's mission/));
      await pressContinueWhenReady();
      await waitFor(() => expect(Haptics.impactAsync).toHaveBeenCalled());
    });

    it('completes via Done after sending', async () => {
      const { onCreated } = await renderScreen();
      await advanceToReview();
      fireEvent.press(screen.getByLabelText('Send challenge'));
      await waitFor(() => expect(screen.getByLabelText('Done')).toBeTruthy());
      fireEvent.press(screen.getByLabelText('Done'));
      expect(onCreated).toHaveBeenCalledWith('new-task');
    });

    it('shows an error when sending fails', async () => {
      mockCreate.mockRejectedValue(new Error('offline'));
      await renderScreen();
      await advanceToReview();
      fireEvent.press(screen.getByLabelText('Send challenge'));
      await waitFor(() => expect(screen.getByText(/Couldn't send the challenge/)).toBeTruthy());
    });

    it('does not double-submit on a rapid double-tap of Send', async () => {
      let resolveCreate: (value: typeof CREATED_TASK) => void = () => {};
      mockCreate.mockReturnValue(new Promise((resolve) => { resolveCreate = resolve; }));
      await renderScreen();
      await advanceToReview();

      const sendBtn = screen.getByLabelText('Send challenge');
      fireEvent.press(sendBtn);
      // The button must disable itself while the mutation is in flight —
      // a second tap before the first request resolves must not fire a
      // second POST /tasks.
      await waitFor(() => expect(screen.getByLabelText('Send challenge').props.accessibilityState.disabled).toBe(true));
      fireEvent.press(screen.getByLabelText('Send challenge'));

      resolveCreate(CREATED_TASK);
      await waitFor(() => expect(screen.getByText('Challenge created')).toBeTruthy());
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe('navigation', () => {
    it('cancels from step 1', async () => {
      const { onCancel } = await renderScreen();
      fireEvent.press(await screen.findByLabelText('Cancel and go back'));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('goes back a step from step 2', async () => {
      await renderScreen();
      fireEvent.press(await screen.findByLabelText(/Use today's mission/));
      await pressContinueWhenReady();
      await waitFor(() => expect(screen.getByLabelText('Previous step')).toBeTruthy());
      fireEvent.press(screen.getByLabelText('Previous step'));
      await waitFor(() => expect(screen.getByText('Pick a mission to send')).toBeTruthy());
    });

    it('toggles the require-review switch on step 3', async () => {
      await renderScreen();
      fireEvent.press(await screen.findByLabelText(/Use today's mission/));
      await pressContinueWhenReady();
      await screen.findByLabelText('Invite by link, selected');
      fireEvent.press(screen.getByLabelText('Continue'));
      const toggle = await screen.findByLabelText('Require photo proof you review');
      expect(toggle.props.accessibilityState.checked).toBe(true);
      fireEvent.press(toggle);
      await waitFor(() =>
        expect(screen.getByLabelText('Require photo proof you review').props.accessibilityState.checked).toBe(false),
      );
    });
  });

  describe('accessibility', () => {
    it('gives every interactive element a label', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Continue')).toBeTruthy());
      [
        ...screen.getAllByRole('button'),
        ...screen.getAllByRole('radio'),
      ].forEach((b) => {
        expect(b.props.accessibilityLabel).toBeTruthy();
      });
    });
  });
});
