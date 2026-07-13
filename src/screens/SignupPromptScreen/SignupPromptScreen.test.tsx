import React from 'react';
import { BackHandler } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import SignupPromptScreen, { validateSignup } from './SignupPromptScreen';
import type { SignupRequest } from '../../types/api';

/**
 * The screen reads `useAuthStore((s) => s.signup)`. We mock the store to hand
 * back a controllable `signup` spy, mirroring the real selector contract
 * without pulling in token persistence / native secure-store.
 */
const mockSignup = jest.fn<Promise<void>, [SignupRequest]>();

jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (s: { signup: typeof mockSignup }) => unknown) =>
    selector({ signup: mockSignup }),
}));

const VALID_EMAIL = 'quester@example.com';
const VALID_PASSWORD = 'superSecret1';

async function renderScreen(
  overrides: Partial<React.ComponentProps<typeof SignupPromptScreen>> = {},
) {
  const onSuccess = jest.fn();
  const onDismiss = jest.fn();
  await render(
    <SignupPromptScreen onSuccess={onSuccess} onDismiss={onDismiss} {...overrides} />,
  );
  return { onSuccess, onDismiss };
}

async function fillValidForm(): Promise<void> {
  await fireEvent.changeText(screen.getByLabelText('Email address'), VALID_EMAIL);
  await fireEvent.changeText(screen.getByLabelText('Password'), VALID_PASSWORD);
}

describe('SignupPromptScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignup.mockResolvedValue(undefined);
  });

  describe('rendering', () => {
    it('renders the title and both actions', async () => {
      await renderScreen();
      expect(screen.getByText('Keep your XP and streak')).toBeTruthy();
      expect(screen.getByLabelText('Create a free account')).toBeTruthy();
      expect(
        screen.getByLabelText('Continue as guest and risk losing progress'),
      ).toBeTruthy();
    });

    it('renders the default XP and streak copy', async () => {
      await renderScreen();
      expect(
        screen.getByText(/You've earned 40 XP and are on a 3-day streak/),
      ).toBeTruthy();
      expect(
        screen.getByText('40 XP at risk if you continue as guest'),
      ).toBeTruthy();
    });

    it('renders contextual XP and streak numbers from props', async () => {
      await renderScreen({ xpAtRisk: 120, streakDays: 7 });
      expect(
        screen.getByText(/You've earned 120 XP and are on a 7-day streak/),
      ).toBeTruthy();
      expect(
        screen.getByText('120 XP at risk if you continue as guest'),
      ).toBeTruthy();
    });

    it('renders all three account benefits', async () => {
      await renderScreen();
      expect(screen.getByText('Save XP and level progress permanently')).toBeTruthy();
      expect(screen.getByText('Maintain your streak across devices')).toBeTruthy();
      expect(screen.getByText('Challenge friends and track results')).toBeTruthy();
    });

    it('renders the credential inputs', async () => {
      await renderScreen();
      expect(screen.getByLabelText('Email address')).toBeTruthy();
      expect(screen.getByLabelText('Password')).toBeTruthy();
      expect(screen.getByLabelText('Display name, optional')).toBeTruthy();
    });

    it('does not show an error before any interaction', async () => {
      await renderScreen();
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('labels the primary button "Create free account" in the idle state', async () => {
      await renderScreen();
      expect(screen.getByText('Create free account')).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('calls onDismiss when "Continue as guest" is pressed', async () => {
      const { onDismiss } = await renderScreen();
      await fireEvent.press(
        screen.getByLabelText('Continue as guest and risk losing progress'),
      );
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('calls onDismiss when the backdrop is pressed', async () => {
      const { onDismiss } = await renderScreen();
      // `accessibilityViewIsModal` on the sheet hides the backdrop from
      // VoiceOver on iOS (hence includeHiddenElements below), but TalkBack on
      // Android has no equivalent shelter and can still reach it — see the
      // accessibilityState assertions further down for the Android-relevant
      // disabled-state coverage.
      await fireEvent.press(
        screen.getByLabelText('Dismiss and continue as guest', {
          includeHiddenElements: true,
        }),
      );
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('shows a validation error and does not call signup on an empty form', async () => {
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Create a free account'));
      expect(screen.getByText('Enter your email address.')).toBeTruthy();
      expect(mockSignup).not.toHaveBeenCalled();
    });

    it('rejects a malformed email', async () => {
      await renderScreen();
      await fireEvent.changeText(screen.getByLabelText('Email address'), 'not-an-email');
      await fireEvent.changeText(screen.getByLabelText('Password'), VALID_PASSWORD);
      await fireEvent.press(screen.getByLabelText('Create a free account'));
      expect(screen.getByText('Enter a valid email address.')).toBeTruthy();
      expect(mockSignup).not.toHaveBeenCalled();
    });

    it('rejects a password shorter than 8 characters', async () => {
      await renderScreen();
      await fireEvent.changeText(screen.getByLabelText('Email address'), VALID_EMAIL);
      await fireEvent.changeText(screen.getByLabelText('Password'), 'short');
      await fireEvent.press(screen.getByLabelText('Create a free account'));
      expect(
        screen.getByText('Password must be at least 8 characters.'),
      ).toBeTruthy();
      expect(mockSignup).not.toHaveBeenCalled();
    });

    it('calls signup with the trimmed credentials and no display name when blank', async () => {
      await renderScreen();
      await fireEvent.changeText(
        screen.getByLabelText('Email address'),
        `  ${VALID_EMAIL}  `,
      );
      await fireEvent.changeText(screen.getByLabelText('Password'), VALID_PASSWORD);
      await fireEvent.press(screen.getByLabelText('Create a free account'));
      await waitFor(() =>
        expect(mockSignup).toHaveBeenCalledWith({
          email: VALID_EMAIL,
          password: VALID_PASSWORD,
          displayName: undefined,
        }),
      );
    });

    it('includes a trimmed display name when provided', async () => {
      await renderScreen();
      await fillValidForm();
      await fireEvent.changeText(
        screen.getByLabelText('Display name, optional'),
        '  Ada  ',
      );
      await fireEvent.press(screen.getByLabelText('Create a free account'));
      await waitFor(() =>
        expect(mockSignup).toHaveBeenCalledWith({
          email: VALID_EMAIL,
          password: VALID_PASSWORD,
          displayName: 'Ada',
        }),
      );
    });

    it('clears a visible validation error once the user edits a field', async () => {
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Create a free account'));
      expect(screen.getByText('Enter your email address.')).toBeTruthy();
      await fireEvent.changeText(screen.getByLabelText('Email address'), 'q');
      expect(screen.queryByText('Enter your email address.')).toBeNull();
    });

    it('shows the success label and calls onSuccess after the beat', async () => {
      const { onSuccess } = await renderScreen();
      await fillValidForm();
      await fireEvent.press(screen.getByLabelText('Create a free account'));
      await waitFor(() => expect(screen.getByText('Account created ✓')).toBeTruthy());
      await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1), {
        timeout: 2000,
      });
    });

    it('surfaces the ApiError message and stays on the sheet when signup fails', async () => {
      mockSignup.mockRejectedValueOnce(new Error('Email already in use'));
      const { onSuccess } = await renderScreen();
      await fillValidForm();
      await fireEvent.press(screen.getByLabelText('Create a free account'));
      await waitFor(() =>
        expect(screen.getByText('Email already in use')).toBeTruthy(),
      );
      expect(onSuccess).not.toHaveBeenCalled();
      // The button returns to its idle label so the user can retry.
      expect(screen.getByText('Create free account')).toBeTruthy();
    });

    it('falls back to a generic message when the failure has no message', async () => {
      mockSignup.mockRejectedValueOnce(new Error(''));
      await renderScreen();
      await fillValidForm();
      await fireEvent.press(screen.getByLabelText('Create a free account'));
      await waitFor(() =>
        expect(
          screen.getByText('Could not create your account. Please try again.'),
        ).toBeTruthy(),
      );
    });
  });

  describe('accessibility', () => {
    it('exposes the title as a header', async () => {
      await renderScreen();
      expect(
        screen.getByText('Keep your XP and streak').props.accessibilityRole,
      ).toBe('header');
    });

    it('gives every button an accessibility label and role', async () => {
      await renderScreen();
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((btn) => {
        expect(btn.props.accessibilityLabel).toBeTruthy();
      });
    });

    it('marks the validation error as a polite alert live region', async () => {
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Create a free account'));
      const alert = screen.getByRole('alert');
      expect(alert.props.accessibilityLiveRegion).toBe('polite');
    });

    it('marks the primary button busy while the request is in flight', async () => {
      let resolve: (() => void) | undefined;
      mockSignup.mockReturnValueOnce(
        new Promise<void>((r) => {
          resolve = () => r();
        }),
      );
      await renderScreen();
      await fillValidForm();
      const pending = fireEvent.press(screen.getByLabelText('Create a free account'));
      // The label itself changes while busy (see the test below), so the
      // busy button must be re-queried by its new label, not the idle one.
      await waitFor(() =>
        expect(
          screen.getByLabelText('Creating account').props.accessibilityState.busy,
        ).toBe(true),
      );
      resolve?.();
      await pending;
    });

    it('updates the accessibility label through the loading and success states', async () => {
      let resolve: (() => void) | undefined;
      mockSignup.mockReturnValueOnce(
        new Promise<void>((r) => {
          resolve = () => r();
        }),
      );
      await renderScreen();
      await fillValidForm();
      const pending = fireEvent.press(screen.getByLabelText('Create a free account'));
      // A screen reader must hear the state change, not the original label,
      // while a request is in flight and again once it succeeds.
      await waitFor(() => expect(screen.getByLabelText('Creating account')).toBeTruthy());
      resolve?.();
      await pending;
      await waitFor(() => expect(screen.getByLabelText('Account created')).toBeTruthy());
    });

    it('marks the backdrop as disabled while a request is pending', async () => {
      let resolve: (() => void) | undefined;
      mockSignup.mockReturnValueOnce(
        new Promise<void>((r) => {
          resolve = () => r();
        }),
      );
      await renderScreen();
      await fillValidForm();
      const pending = fireEvent.press(screen.getByLabelText('Create a free account'));
      await waitFor(() => {
        const backdrop = screen.getByLabelText('Dismiss and continue as guest', {
          includeHiddenElements: true,
        });
        expect(backdrop.props.accessibilityState.disabled).toBe(true);
      });
      resolve?.();
      await pending;
    });
  });

  describe('edge cases', () => {
    it('ignores the backdrop and back button while a request is pending', async () => {
      const spy = jest.spyOn(BackHandler, 'addEventListener');
      let resolve: (() => void) | undefined;
      mockSignup.mockReturnValueOnce(
        new Promise<void>((r) => {
          resolve = () => r();
        }),
      );
      const { onDismiss } = await renderScreen();
      await fillValidForm();
      // Don't await the press: the handler awaits a promise we hold open, so
      // awaiting the event itself would hang until we release it below.
      const pending = fireEvent.press(screen.getByLabelText('Create a free account'));
      await waitFor(() => expect(screen.getByText('Creating account…')).toBeTruthy());

      await fireEvent.press(
        screen.getByLabelText('Dismiss and continue as guest', {
          includeHiddenElements: true,
        }),
      );
      expect(onDismiss).not.toHaveBeenCalled();

      // The back-press effect depends on `locked` and re-subscribes whenever
      // it changes, so the listener bound to the current (pending) state is
      // the *last* registered call — the one captured at mount is a stale
      // closure over `locked=false` and would wrongly report "handled".
      const backHandler = spy.mock.calls[spy.mock.calls.length - 1][1] as () => boolean;
      const handled = backHandler();
      expect(handled).toBe(true);
      expect(onDismiss).not.toHaveBeenCalled();

      resolve?.();
      await pending;
      spy.mockRestore();
    });

    it('does not fire signup twice on a rapid double press', async () => {
      await renderScreen();
      await fillValidForm();
      const btn = screen.getByLabelText('Create a free account');
      await fireEvent.press(btn);
      await fireEvent.press(btn);
      await waitFor(() => expect(mockSignup).toHaveBeenCalledTimes(1));
    });

    it('dismisses on Android hardware back press', async () => {
      const spy = jest.spyOn(BackHandler, 'addEventListener');
      const { onDismiss } = await renderScreen();
      const handler = spy.mock.calls[0][1] as () => boolean;
      const handled = handler();
      expect(handled).toBe(true);
      expect(onDismiss).toHaveBeenCalledTimes(1);
      spy.mockRestore();
    });
  });

  describe('validateSignup', () => {
    it('accepts a well-formed email and long-enough password', () => {
      expect(validateSignup(VALID_EMAIL, VALID_PASSWORD)).toBeNull();
    });

    it('flags a blank email, bad email, then a weak password in order', () => {
      expect(validateSignup('   ', VALID_PASSWORD)).toBe('Enter your email address.');
      expect(validateSignup('nope', VALID_PASSWORD)).toBe(
        'Enter a valid email address.',
      );
      expect(validateSignup(VALID_EMAIL, '123')).toBe(
        'Password must be at least 8 characters.',
      );
    });
  });
});
