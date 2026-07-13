import React from 'react';
import { Share } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import CompletionScreen, {
  buildChallengeMessage,
  buildShareMessage,
  formatStreak,
  hasActiveStreak,
  whenPressed,
} from './CompletionScreen';
import type { ProofSubmissionResponse, SignupRequest } from '../../types/api';

/**
 * `CompletionScreen` mounts the shared `SignupPromptScreen` gate, which reads
 * `useAuthStore((s) => s.signup)`. We mock the store the same way
 * `SignupPromptScreen.test.tsx` does — handing back a controllable `signup`
 * spy — so the guest-to-account flow can be exercised without token
 * persistence or native secure-store.
 */
const mockSignup = jest.fn<Promise<void>, [SignupRequest]>();

jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (s: { signup: typeof mockSignup }) => unknown) =>
    selector({ signup: mockSignup }),
}));

const shareSpy = jest.spyOn(Share, 'share');

const RESULT: ProofSubmissionResponse = {
  completionId: 'completion-1',
  missionTitle: 'Find the Oldest Thing',
  xpAwarded: 40,
  totalXp: 240,
  currentStreak: 3,
  longestStreak: 5,
  proofUrl: null,
};

async function renderScreen(
  overrides: Partial<React.ComponentProps<typeof CompletionScreen>> = {},
) {
  const onFindAnotherQuest = jest.fn();
  const onChallengeSent = jest.fn();
  await render(
    <CompletionScreen
      result={RESULT}
      isGuest={false}
      onFindAnotherQuest={onFindAnotherQuest}
      onChallengeSent={onChallengeSent}
      {...overrides}
    />,
  );
  return { onFindAnotherQuest, onChallengeSent };
}

async function completeSignupInGate(): Promise<void> {
  await fireEvent.changeText(
    screen.getByLabelText('Email address'),
    'quester@example.com',
  );
  await fireEvent.changeText(screen.getByLabelText('Password'), 'superSecret1');
  await fireEvent.press(screen.getByLabelText('Create a free account'));
}

describe('CompletionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    shareSpy.mockResolvedValue({ action: 'sharedAction' });
    mockSignup.mockResolvedValue(undefined);
  });

  describe('rendering', () => {
    it('renders the celebration hero heading', async () => {
      await renderScreen();
      expect(screen.getByText('You did it!')).toBeTruthy();
    });

    it('shows the mission title from the result prop', async () => {
      await renderScreen();
      // Appears in both the hero sub and the achievement card.
      expect(screen.getAllByText('Find the Oldest Thing').length).toBeGreaterThan(0);
    });

    it('renders the XP earned from the result prop', async () => {
      await renderScreen();
      expect(screen.getByText('+40 XP')).toBeTruthy();
    });

    it('renders the total XP and streak stats from the result prop', async () => {
      await renderScreen();
      expect(screen.getByText('240')).toBeTruthy();
      expect(screen.getByText('3')).toBeTruthy();
    });

    it('renders the plural streak text for a multi-day streak', async () => {
      await renderScreen();
      expect(screen.getByText('3-day streak!')).toBeTruthy();
    });

    it('renders the singular streak text for a one-day streak', async () => {
      await renderScreen({ result: { ...RESULT, currentStreak: 1 } });
      expect(screen.getByText('1-day streak!')).toBeTruthy();
    });

    it('hides the streak section entirely for a 0-day streak', async () => {
      await renderScreen({ result: { ...RESULT, currentStreak: 0 } });
      expect(screen.queryByText('0-day streak!')).toBeNull();
      expect(
        screen.queryByText('Complete a quest tomorrow to keep it going'),
      ).toBeNull();
    });

    it('renders the challenge section heading and prompt', async () => {
      await renderScreen();
      expect(screen.getByText('Challenge a friend')).toBeTruthy();
      expect(
        screen.getByText(/Dare someone to beat your time on this quest/),
      ).toBeTruthy();
    });

    it('does not show the guest gate before any interaction', async () => {
      await renderScreen();
      expect(screen.queryByText('Keep your XP and streak')).toBeNull();
    });
  });

  describe('interactions', () => {
    it('invokes the native share sheet with the achievement message', async () => {
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Share this achievement'));
      await waitFor(() =>
        expect(shareSpy).toHaveBeenCalledWith({
          message:
            "I just completed 'Find the Oldest Thing' and earned 40 XP on SideQuest!",
        }),
      );
    });

    it('does not crash when the share sheet is dismissed without picking a target', async () => {
      // Share.share() resolves — it does not reject — when the user cancels
      // the native sheet without sharing.
      shareSpy.mockResolvedValueOnce({ action: Share.dismissedAction });
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Share this achievement'));
      await waitFor(() => expect(shareSpy).toHaveBeenCalledTimes(1));
      expect(screen.getByText('You did it!')).toBeTruthy();
    });

    it('swallows a genuine share-sheet system error without crashing', async () => {
      shareSpy.mockRejectedValueOnce(new Error('platform failure'));
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Share this achievement'));
      await waitFor(() => expect(shareSpy).toHaveBeenCalledTimes(1));
      expect(screen.getByText('You did it!')).toBeTruthy();
    });

    it('shares challenge copy and reports it sent when the share actually completes', async () => {
      shareSpy.mockResolvedValueOnce({ action: Share.sharedAction });
      const { onChallengeSent } = await renderScreen({ isGuest: false });
      await fireEvent.press(screen.getByLabelText('Challenge a friend to this quest'));
      await waitFor(() =>
        expect(shareSpy).toHaveBeenCalledWith({
          message:
            "I dare you to beat my time on 'Find the Oldest Thing' — join me on SideQuest!",
        }),
      );
      await waitFor(() => expect(onChallengeSent).toHaveBeenCalledTimes(1));
    });

    it('does not report the challenge sent when the share sheet is dismissed without picking a target', async () => {
      // The real regression this guards: Share.share() resolves (not rejects)
      // on cancellation, so onChallengeSent must check the resolved action,
      // not just "the promise didn't throw".
      shareSpy.mockResolvedValueOnce({ action: Share.dismissedAction });
      const { onChallengeSent } = await renderScreen({ isGuest: false });
      await fireEvent.press(screen.getByLabelText('Challenge a friend to this quest'));
      await waitFor(() => expect(shareSpy).toHaveBeenCalledTimes(1));
      expect(onChallengeSent).not.toHaveBeenCalled();
    });

    it('does not report the challenge sent on a genuine share-sheet system error', async () => {
      shareSpy.mockRejectedValueOnce(new Error('platform failure'));
      const { onChallengeSent } = await renderScreen({ isGuest: false });
      await fireEvent.press(screen.getByLabelText('Challenge a friend to this quest'));
      await waitFor(() => expect(shareSpy).toHaveBeenCalledTimes(1));
      expect(onChallengeSent).not.toHaveBeenCalled();
    });

    it('opens the signup gate instead of sharing when a guest challenges', async () => {
      const { onChallengeSent } = await renderScreen({ isGuest: true });
      await fireEvent.press(screen.getByLabelText('Challenge a friend to this quest'));
      expect(screen.getByText('Keep your XP and streak')).toBeTruthy();
      expect(shareSpy).not.toHaveBeenCalled();
      expect(onChallengeSent).not.toHaveBeenCalled();
    });

    it('passes the result XP and streak to the gate as at-risk context', async () => {
      await renderScreen({ isGuest: true });
      await fireEvent.press(screen.getByLabelText('Challenge a friend to this quest'));
      expect(
        screen.getByText(/You've earned 40 XP and are on a 3-day streak/),
      ).toBeTruthy();
    });

    it('closes the gate without reporting a challenge when the guest dismisses', async () => {
      const { onChallengeSent } = await renderScreen({ isGuest: true });
      await fireEvent.press(screen.getByLabelText('Challenge a friend to this quest'));
      await fireEvent.press(
        screen.getByLabelText('Continue as guest and risk losing progress'),
      );
      await waitFor(() =>
        expect(screen.queryByText('Keep your XP and streak')).toBeNull(),
      );
      expect(onChallengeSent).not.toHaveBeenCalled();
    });

    it('reports the challenge sent after the guest completes signup', async () => {
      const { onChallengeSent } = await renderScreen({ isGuest: true });
      await fireEvent.press(screen.getByLabelText('Challenge a friend to this quest'));
      await completeSignupInGate();
      await waitFor(() => expect(mockSignup).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(onChallengeSent).toHaveBeenCalledTimes(1), {
        timeout: 2000,
      });
      await waitFor(() =>
        expect(screen.queryByText('Keep your XP and streak')).toBeNull(),
      );
    });

    it('calls onFindAnotherQuest when the footer button is pressed', async () => {
      const { onFindAnotherQuest } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Find another quest'));
      expect(onFindAnotherQuest).toHaveBeenCalledTimes(1);
    });

    it('does not throw when optional callbacks are omitted', async () => {
      await render(<CompletionScreen result={RESULT} isGuest={false} />);
      await fireEvent.press(screen.getByLabelText('Find another quest'));
      await fireEvent.press(screen.getByLabelText('Challenge a friend to this quest'));
      await waitFor(() => expect(shareSpy).toHaveBeenCalledTimes(1));
      expect(screen.getByText('You did it!')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('exposes the celebration heading as a header', async () => {
      await renderScreen();
      expect(screen.getByText('You did it!').props.accessibilityRole).toBe('header');
    });

    it('gives every button an accessibility label and role', async () => {
      await renderScreen();
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((btn) => {
        expect(btn.props.accessibilityLabel).toBeTruthy();
      });
    });

    it('labels the XP counter for assistive tech', async () => {
      await renderScreen();
      expect(screen.getByLabelText('40 XP earned')).toBeTruthy();
    });

    it('labels the streak row as active for assistive tech', async () => {
      await renderScreen();
      expect(screen.getByLabelText('3-day streak active')).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('whenPressed returns the style only while pressed', () => {
      // RTL's press helpers never flip Pressable's internal `pressed` flag, so
      // the pressed-state style branch is unreachable through fired events
      // alone — the decision is extracted into this pure helper instead.
      const style = { opacity: 1 };
      expect(whenPressed(true, style)).toBe(style);
      expect(whenPressed(false, style)).toBeNull();
    });
  });

  describe('pure helpers', () => {
    it('builds the achievement share message from the result', async () => {
      expect(buildShareMessage(RESULT)).toBe(
        "I just completed 'Find the Oldest Thing' and earned 40 XP on SideQuest!",
      );
    });

    it('builds the challenge share message from the result', async () => {
      expect(buildChallengeMessage(RESULT)).toBe(
        "I dare you to beat my time on 'Find the Oldest Thing' — join me on SideQuest!",
      );
    });

    it('formats streaks in compound-adjective form', async () => {
      expect(formatStreak(1)).toBe('1-day streak');
      expect(formatStreak(3)).toBe('3-day streak');
    });

    it('treats only a positive streak as active', async () => {
      expect(hasActiveStreak(0)).toBe(false);
      expect(hasActiveStreak(1)).toBe(true);
      expect(hasActiveStreak(3)).toBe(true);
    });
  });
});
