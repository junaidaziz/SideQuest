import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import ForgotPasswordScreen, {
  validateForgotEmail,
  whenPressed,
} from './ForgotPasswordScreen';

const VALID_EMAIL = 'quester@example.com';
const CONFIRMATION_RE = /If an account exists for that email/;
const GENERIC_SUBMIT_ERROR =
  "We couldn't send that reset email just now. Please try again.";

async function renderScreen(
  overrides: Partial<React.ComponentProps<typeof ForgotPasswordScreen>> = {},
) {
  const onSubmit = jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined);
  const onBack = jest.fn();
  await render(
    <ForgotPasswordScreen onSubmit={onSubmit} onBack={onBack} {...overrides} />,
  );
  return { onSubmit, onBack };
}

/** A submit promise the test controls, plus its resolver. */
function deferred(): {
  fn: jest.Mock<Promise<void>, [string]>;
  resolve: () => void;
} {
  const box: { resolve: () => void } = { resolve: () => undefined };
  const fn = jest.fn<Promise<void>, [string]>().mockReturnValueOnce(
    new Promise<void>((r) => {
      box.resolve = () => r();
    }),
  );
  return { fn, resolve: () => box.resolve() };
}

describe('ForgotPasswordScreen', () => {
  describe('rendering', () => {
    it('renders the header, lead copy, email field and submit', async () => {
      await renderScreen();
      expect(screen.getByText('Forgot your password?')).toBeTruthy();
      expect(screen.getByText(/Enter the email for your account/)).toBeTruthy();
      expect(screen.getByLabelText('Email')).toBeTruthy();
      expect(screen.getByLabelText('Send reset link')).toBeTruthy();
    });

    it('renders the back-to-login link', async () => {
      await renderScreen();
      expect(screen.getByLabelText('Back to log in')).toBeTruthy();
    });

    it('shows no confirmation or error before any interaction', async () => {
      await renderScreen();
      expect(screen.queryByText(CONFIRMATION_RE)).toBeNull();
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  describe('interactions', () => {
    it('calls onBack when the header back button is pressed', async () => {
      const { onBack } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Go back'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('calls onBack from the "Log in" switch link', async () => {
      const { onBack } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Back to log in'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('flags an empty email and does not submit', async () => {
      const { onSubmit } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Send reset link'));
      expect(screen.getByText('Enter your email')).toBeTruthy();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('rejects a malformed email and does not submit', async () => {
      const { onSubmit } = await renderScreen();
      await fireEvent.changeText(screen.getByLabelText('Email'), 'not-an-email');
      await fireEvent.press(screen.getByLabelText('Send reset link'));
      expect(screen.getByText("That email doesn't look right")).toBeTruthy();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits the trimmed email then shows the generic confirmation', async () => {
      const { onSubmit } = await renderScreen();
      await fireEvent.changeText(
        screen.getByLabelText('Email'),
        `  ${VALID_EMAIL}  `,
      );
      await fireEvent.press(screen.getByLabelText('Send reset link'));
      await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(VALID_EMAIL));
      await waitFor(() =>
        expect(screen.getByText(CONFIRMATION_RE)).toBeTruthy(),
      );
      // The email field is gone once confirmation is shown.
      expect(screen.queryByLabelText('Email')).toBeNull();
    });

    it('does not distinguish "sent" from "no such account" in the confirmation', async () => {
      await renderScreen();
      await fireEvent.changeText(screen.getByLabelText('Email'), VALID_EMAIL);
      await fireEvent.press(screen.getByLabelText('Send reset link'));
      await waitFor(() => expect(screen.getByText(CONFIRMATION_RE)).toBeTruthy());
      // No copy that would confirm/deny the address is registered.
      expect(screen.queryByText(/we sent you an email/i)).toBeNull();
      expect(screen.queryByText(/no account/i)).toBeNull();
      expect(screen.queryByText(/not found/i)).toBeNull();
    });

    it('offers a Back to log in action from the confirmation view', async () => {
      const { onBack } = await renderScreen();
      await fireEvent.changeText(screen.getByLabelText('Email'), VALID_EMAIL);
      await fireEvent.press(screen.getByLabelText('Send reset link'));
      await waitFor(() => expect(screen.getByText(CONFIRMATION_RE)).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Back to log in'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('clears a visible field error once the user edits the email', async () => {
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Send reset link'));
      expect(screen.getByText('Enter your email')).toBeTruthy();
      await fireEvent.changeText(screen.getByLabelText('Email'), 'q');
      expect(screen.queryByText('Enter your email')).toBeNull();
    });

    it('shows a generic banner and stays on the form when submit rejects', async () => {
      const onSubmit = jest
        .fn<Promise<void>, [string]>()
        .mockRejectedValueOnce(new Error('network down'));
      await renderScreen({ onSubmit });
      await fireEvent.changeText(screen.getByLabelText('Email'), VALID_EMAIL);
      await fireEvent.press(screen.getByLabelText('Send reset link'));
      await waitFor(() =>
        expect(screen.getByText(GENERIC_SUBMIT_ERROR)).toBeTruthy(),
      );
      // Still on the form (confirmation not shown) so the user can retry.
      expect(screen.getByLabelText('Email')).toBeTruthy();
      expect(screen.queryByText(CONFIRMATION_RE)).toBeNull();
    });

    it('clears the form-level error once the user edits the email', async () => {
      const onSubmit = jest
        .fn<Promise<void>, [string]>()
        .mockRejectedValueOnce(new Error('nope'));
      await renderScreen({ onSubmit });
      await fireEvent.changeText(screen.getByLabelText('Email'), VALID_EMAIL);
      await fireEvent.press(screen.getByLabelText('Send reset link'));
      await waitFor(() =>
        expect(screen.getByText(GENERIC_SUBMIT_ERROR)).toBeTruthy(),
      );
      await fireEvent.changeText(screen.getByLabelText('Email'), `${VALID_EMAIL}x`);
      expect(screen.queryByText(GENERIC_SUBMIT_ERROR)).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('exposes the header with the header role', async () => {
      await renderScreen();
      const headers = screen.getAllByRole('header');
      expect(headers.length).toBeGreaterThanOrEqual(1);
    });

    it('gives every button an accessibility label', async () => {
      await renderScreen();
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((btn) => {
        expect(btn.props.accessibilityLabel).toBeTruthy();
      });
    });

    it('announces the field error as a polite alert live region', async () => {
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Send reset link'));
      const alert = screen.getByRole('alert');
      expect(alert.props.accessibilityLiveRegion).toBe('polite');
    });

    it('announces the confirmation as a polite alert live region', async () => {
      await renderScreen();
      await fireEvent.changeText(screen.getByLabelText('Email'), VALID_EMAIL);
      await fireEvent.press(screen.getByLabelText('Send reset link'));
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert.props.accessibilityLiveRegion).toBe('polite');
      });
    });

    it('marks the submit busy and disabled while the request is in flight', async () => {
      const pending = deferred();
      await renderScreen({ onSubmit: pending.fn });
      await fireEvent.changeText(screen.getByLabelText('Email'), VALID_EMAIL);
      const inFlight = fireEvent.press(screen.getByLabelText('Send reset link'));
      await waitFor(() => {
        const btn = screen.getByLabelText('Sending');
        expect(btn.props.accessibilityState.busy).toBe(true);
        expect(btn.props.accessibilityState.disabled).toBe(true);
      });
      pending.resolve();
      await inFlight;
    });
  });

  describe('edge cases', () => {
    it('does not fire submit twice on a rapid double press', async () => {
      const { onSubmit } = await renderScreen();
      await fireEvent.changeText(screen.getByLabelText('Email'), VALID_EMAIL);
      const btn = screen.getByLabelText('Send reset link');
      // Second press lands after the status has left 'idle' (submitting →
      // success), so the guard drops it — onSubmit fires exactly once.
      await fireEvent.press(btn);
      await fireEvent.press(btn);
      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    });

    it('ignores the back button while a request is pending', async () => {
      const pending = deferred();
      const { onBack } = await renderScreen({ onSubmit: pending.fn });
      await fireEvent.changeText(screen.getByLabelText('Email'), VALID_EMAIL);
      const inFlight = fireEvent.press(screen.getByLabelText('Send reset link'));
      await waitFor(() => expect(screen.getByLabelText('Sending')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Go back'));
      expect(onBack).not.toHaveBeenCalled();
      pending.resolve();
      await inFlight;
    });

    it('renders without optional callbacks and does not crash on submit', async () => {
      await render(<ForgotPasswordScreen />);
      await fireEvent.changeText(screen.getByLabelText('Email'), VALID_EMAIL);
      await fireEvent.press(screen.getByLabelText('Send reset link'));
      // With no onSubmit the resolve path still shows the confirmation.
      await waitFor(() => expect(screen.getByText(CONFIRMATION_RE)).toBeTruthy());
      // No onBack provided — pressing back must be a safe no-op.
      await fireEvent.press(screen.getByLabelText('Back to log in'));
    });
  });

  describe('validateForgotEmail', () => {
    it('accepts a well-formed email', () => {
      expect(validateForgotEmail(VALID_EMAIL)).toBeNull();
    });

    it('flags a blank email', () => {
      expect(validateForgotEmail('   ')).toBe('Enter your email');
    });

    it('flags a malformed email', () => {
      expect(validateForgotEmail('nope')).toBe("That email doesn't look right");
    });
  });

  describe('whenPressed', () => {
    it('returns the style only when pressed', () => {
      const style = { opacity: 0.5 };
      expect(whenPressed(true, style)).toBe(style);
      expect(whenPressed(false, style)).toBeNull();
    });
  });
});
