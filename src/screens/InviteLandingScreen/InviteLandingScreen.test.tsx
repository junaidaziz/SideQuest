import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import InviteLandingScreen from './InviteLandingScreen';
import { acceptTaskInvite, declineTaskInvite } from '../../services/tasksApi';
import type { Task } from '../../types/api';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('../../services/tasksApi');

const mockAccept = acceptTaskInvite as jest.MockedFunction<typeof acceptTaskInvite>;
const mockDecline = declineTaskInvite as jest.MockedFunction<typeof declineTaskInvite>;

const TASK: Task = {
  id: 'task-9',
  creatorId: 'creator-id',
  assigneeId: 'me',
  title: 'Peak Seeker',
  description: null,
  rewardXp: 100,
  verificationMethod: 'CREATOR_APPROVAL',
  evidenceRequired: true,
  status: 'Accepted',
  dueAt: null,
  createdAt: '2026-07-13T09:20:00.000Z',
  updatedAt: '2026-07-13T09:20:00.000Z',
};

async function renderScreen(props: Partial<React.ComponentProps<typeof InviteLandingScreen>> = {}) {
  const onAccepted = jest.fn();
  const onDeclined = jest.fn();
  const onSignInFirst = jest.fn();
  const onBack = jest.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const utils = await render(
    <QueryClientProvider client={queryClient}>
      <InviteLandingScreen
        token="tok-1"
        onAccepted={onAccepted}
        onDeclined={onDeclined}
        onSignInFirst={onSignInFirst}
        onBack={onBack}
        {...props}
      />
    </QueryClientProvider>,
  );
  return { ...utils, onAccepted, onDeclined, onSignInFirst, onBack };
}

describe('InviteLandingScreen', () => {
  afterEach(cleanup);
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccept.mockResolvedValue(TASK);
    mockDecline.mockResolvedValue({ ...TASK, status: 'Declined', assigneeId: null });
  });

  describe('rendering', () => {
    it('renders the invite framing and both actions', async () => {
      await renderScreen();
      expect(screen.getByRole('header', { name: /invited to a challenge/i })).toBeTruthy();
      expect(screen.getByLabelText('Accept challenge')).toBeTruthy();
      expect(screen.getByLabelText('Decline')).toBeTruthy();
    });

    it('offers the sign-in detour for a guest', async () => {
      await renderScreen({ isGuest: true });
      expect(screen.getByLabelText('Sign in before accepting')).toBeTruthy();
    });

    it('hides the sign-in detour for a signed-in user', async () => {
      await renderScreen({ isGuest: false });
      expect(screen.queryByLabelText('Sign in before accepting')).toBeNull();
    });
  });

  describe('interactions', () => {
    it('accepts the invite by token and reports the bound task id', async () => {
      const { onAccepted } = await renderScreen();
      fireEvent.press(screen.getByLabelText('Accept challenge'));
      await waitFor(() => expect(mockAccept).toHaveBeenCalledWith('tok-1'));
      await waitFor(() => expect(onAccepted).toHaveBeenCalledWith('task-9'));
    });

    it('declines the invite by token', async () => {
      const { onDeclined } = await renderScreen();
      fireEvent.press(screen.getByLabelText('Decline'));
      await waitFor(() => expect(mockDecline).toHaveBeenCalledWith('tok-1'));
      await waitFor(() => expect(onDeclined).toHaveBeenCalled());
    });

    it('routes to sign-in first when the guest chooses it', async () => {
      const { onSignInFirst } = await renderScreen({ isGuest: true });
      fireEvent.press(screen.getByLabelText('Sign in before accepting'));
      expect(onSignInFirst).toHaveBeenCalled();
    });

    it('calls onBack from the back button', async () => {
      const { onBack } = await renderScreen();
      fireEvent.press(screen.getByLabelText('Go back'));
      expect(onBack).toHaveBeenCalled();
    });

    it('shows a busy spinner while accepting and disables both actions', async () => {
      let resolve: (t: Task) => void = () => {};
      mockAccept.mockReturnValue(new Promise<Task>((r) => { resolve = r; }));
      await renderScreen();
      fireEvent.press(screen.getByLabelText('Accept challenge'));
      await waitFor(() => expect(screen.getByTestId('invite-accept-spinner')).toBeTruthy());
      expect(screen.getByLabelText('Accepting invite').props.accessibilityState.disabled).toBe(true);
      // A second press while busy must not fire a duplicate accept.
      fireEvent.press(screen.getByLabelText('Accepting invite'));
      resolve(TASK);
      await waitFor(() => expect(mockAccept).toHaveBeenCalledTimes(1));
    });

    it('shows a decline spinner while declining', async () => {
      let resolve: (t: Task) => void = () => {};
      mockDecline.mockReturnValue(new Promise<Task>((r) => { resolve = r; }));
      await renderScreen();
      fireEvent.press(screen.getByLabelText('Decline'));
      await waitFor(() => expect(screen.getByTestId('invite-decline-spinner')).toBeTruthy());
      resolve(TASK);
      await waitFor(() => expect(mockDecline).toHaveBeenCalled());
    });
  });

  describe('error states', () => {
    it('surfaces an accept error and does not call onAccepted', async () => {
      mockAccept.mockRejectedValue(new Error('gone'));
      const { onAccepted } = await renderScreen();
      fireEvent.press(screen.getByLabelText('Accept challenge'));
      await waitFor(() => expect(screen.getByText(/Couldn't accept this invite/i)).toBeTruthy());
      expect(onAccepted).not.toHaveBeenCalled();
    });

    it('surfaces a decline error', async () => {
      mockDecline.mockRejectedValue(new Error('net'));
      await renderScreen();
      fireEvent.press(screen.getByLabelText('Decline'));
      await waitFor(() => expect(screen.getByText(/Couldn't decline this invite/i)).toBeTruthy());
    });
  });

  describe('accessibility', () => {
    it('gives every action a role and label', async () => {
      await renderScreen({ isGuest: true });
      ['Accept challenge', 'Decline', 'Sign in before accepting', 'Go back'].forEach((label) => {
        const node = screen.getByLabelText(label);
        expect(node.props.accessibilityRole).toBe('button');
      });
    });

    it('exposes disabled state to screen readers on the sign-in detour', async () => {
      // The React `disabled` prop alone is invisible to assistive tech; the
      // Pressable must also carry accessibilityState.disabled so a screen reader
      // announces it, matching the Accept/Decline buttons.
      await renderScreen({ isGuest: true });
      const node = screen.getByLabelText('Sign in before accepting');
      expect(node.props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: false }),
      );
    });

    it('reflects busy in the sign-in detour accessibilityState while accepting', async () => {
      let resolve: (t: Task) => void = () => {};
      mockAccept.mockReturnValue(new Promise<Task>((r) => { resolve = r; }));
      await renderScreen({ isGuest: true });
      fireEvent.press(screen.getByLabelText('Accept challenge'));
      await waitFor(() => expect(screen.getByTestId('invite-accept-spinner')).toBeTruthy());
      expect(
        screen.getByLabelText('Sign in before accepting').props.accessibilityState.disabled,
      ).toBe(true);
      resolve(TASK);
      await waitFor(() => expect(mockAccept).toHaveBeenCalledTimes(1));
    });
  });
});
