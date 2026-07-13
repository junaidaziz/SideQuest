import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import LoginScreen, { validateLoginFields, whenPressed } from './LoginScreen';
import type { LoginRequest } from '../../types/api';

/**
 * The screen reads `useAuthStore((s) => s.login)`. We mock the store to hand
 * back a controllable `login` spy, mirroring the real selector contract
 * without pulling in token persistence / native secure-store.
 */
const mockLogin = jest.fn<Promise<void>, [LoginRequest]>();
const mockLoginWithGoogle = jest.fn<Promise<void>, []>();

jest.mock('../../store/authStore', () => ({
  useAuthStore: (
    selector: (s: {
      login: typeof mockLogin;
      loginWithGoogle: typeof mockLoginWithGoogle;
    }) => unknown,
  ) => selector({ login: mockLogin, loginWithGoogle: mockLoginWithGoogle }),
}));

// Fully mock the native module — never let it load under Jest. `isErrorWithCode`
// mirrors the real guard (an error object carrying a string `code`).
jest.mock('@react-native-google-signin/google-signin', () => ({
  isErrorWithCode: (error: unknown): boolean =>
    typeof (error as { code?: unknown })?.code === 'string',
  statusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED' },
}));

/** An error shaped like the store's cancellation rejection. */
function cancelledError(): Error & { code: string } {
  const err = new Error('Google Sign-In was cancelled') as Error & {
    code: string;
  };
  err.code = 'SIGN_IN_CANCELLED';
  return err;
}

const GENERIC_GOOGLE_ERROR =
  "We couldn't sign you in with Google just now. Please try again.";

/** A Google promise the test controls, plus its resolver. */
function deferredGoogle(): { resolve: () => void } {
  const box: { resolve: () => void } = { resolve: () => undefined };
  mockLoginWithGoogle.mockReturnValueOnce(
    new Promise<void>((r) => {
      box.resolve = () => r();
    }),
  );
  return box;
}

const VALID_EMAIL = 'quester@example.com';
const VALID_PASSWORD = 'superSecret1';

const GENERIC_ERROR =
  "That email and password don't match. Try again, or reset your password.";

async function renderScreen(
  overrides: Partial<React.ComponentProps<typeof LoginScreen>> = {},
) {
  const onSuccess = jest.fn();
  const onBack = jest.fn();
  const onGoToSignup = jest.fn();
  await render(
    <LoginScreen
      onSuccess={onSuccess}
      onBack={onBack}
      onGoToSignup={onGoToSignup}
      {...overrides}
    />,
  );
  return { onSuccess, onBack, onGoToSignup };
}

async function fillValidForm(): Promise<void> {
  await fireEvent.changeText(screen.getByLabelText('Email'), VALID_EMAIL);
  await fireEvent.changeText(screen.getByLabelText('Password'), VALID_PASSWORD);
}

/** A login promise the test controls, plus its resolver. */
function deferredLogin(): { resolve: () => void } {
  const box: { resolve: () => void } = { resolve: () => undefined };
  mockLogin.mockReturnValueOnce(
    new Promise<void>((r) => {
      box.resolve = () => r();
    }),
  );
  return box;
}

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockResolvedValue(undefined);
    mockLoginWithGoogle.mockResolvedValue(undefined);
  });

  describe('rendering', () => {
    it('renders the header, lead copy, and primary action', async () => {
      await renderScreen();
      expect(screen.getByText('Welcome back')).toBeTruthy();
      expect(screen.getByText(/Log in to pick up your XP, streak/)).toBeTruthy();
      expect(screen.getByLabelText('Log in')).toBeTruthy();
    });

    it('renders both credential fields', async () => {
      await renderScreen();
      expect(screen.getByLabelText('Email')).toBeTruthy();
      expect(screen.getByLabelText('Password')).toBeTruthy();
    });

    it('renders the show-password toggle and forgot-password link', async () => {
      await renderScreen();
      expect(screen.getByLabelText('Show password')).toBeTruthy();
      expect(screen.getByLabelText('Forgot password?')).toBeTruthy();
    });

    it('renders the switch-to-signup link', async () => {
      await renderScreen();
      expect(screen.getByLabelText('Sign up for a new account')).toBeTruthy();
    });

    it('shows no error banner or field errors before any interaction', async () => {
      await renderScreen();
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('does not reveal the reset note until Forgot password is pressed', async () => {
      await renderScreen();
      expect(screen.queryByText(/Password reset isn't available/)).toBeNull();
    });

    it('labels the primary button "Log in" in the idle state', async () => {
      await renderScreen();
      // "Log in" appears as both the header title and the button; the button is
      // disambiguated by its accessibility label.
      expect(screen.getByLabelText('Log in')).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('calls onBack when the back button is pressed', async () => {
      const { onBack } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Go back'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('calls onGoToSignup when the sign-up link is pressed', async () => {
      const { onGoToSignup } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Sign up for a new account'));
      expect(onGoToSignup).toHaveBeenCalledTimes(1);
    });

    it('reveals the reset stub note when Forgot password is pressed', async () => {
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Forgot password?'));
      expect(
        screen.getByText(/Password reset isn't available in this build yet/),
      ).toBeTruthy();
    });

    it('toggles password visibility and updates the toggle label', async () => {
      await renderScreen();
      expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
      await fireEvent.press(screen.getByLabelText('Show password'));
      expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(false);
      expect(screen.getByLabelText('Hide password')).toBeTruthy();
      await fireEvent.press(screen.getByLabelText('Hide password'));
      expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
    });

    it('shows both field errors and does not call login on an empty form', async () => {
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Log in'));
      expect(screen.getByText('Enter your email')).toBeTruthy();
      expect(screen.getByText('Enter your password')).toBeTruthy();
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('rejects a malformed email', async () => {
      await renderScreen();
      await fireEvent.changeText(screen.getByLabelText('Email'), 'not-an-email');
      await fireEvent.changeText(screen.getByLabelText('Password'), VALID_PASSWORD);
      await fireEvent.press(screen.getByLabelText('Log in'));
      expect(screen.getByText("That email doesn't look right")).toBeTruthy();
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('flags an empty password when the email is valid', async () => {
      await renderScreen();
      await fireEvent.changeText(screen.getByLabelText('Email'), VALID_EMAIL);
      await fireEvent.press(screen.getByLabelText('Log in'));
      expect(screen.getByText('Enter your password')).toBeTruthy();
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('calls login with trimmed email and raw password, then onSuccess', async () => {
      const { onSuccess } = await renderScreen();
      await fireEvent.changeText(
        screen.getByLabelText('Email'),
        `  ${VALID_EMAIL}  `,
      );
      await fireEvent.changeText(screen.getByLabelText('Password'), VALID_PASSWORD);
      await fireEvent.press(screen.getByLabelText('Log in'));
      await waitFor(() =>
        expect(mockLogin).toHaveBeenCalledWith({
          email: VALID_EMAIL,
          password: VALID_PASSWORD,
        }),
      );
      await waitFor(() => expect(screen.getByText('Logged in ✓')).toBeTruthy());
      await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1), {
        timeout: 2000,
      });
    });

    it('clears a visible field error once the user edits that field', async () => {
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Log in'));
      expect(screen.getByText('Enter your email')).toBeTruthy();
      await fireEvent.changeText(screen.getByLabelText('Email'), 'q');
      expect(screen.queryByText('Enter your email')).toBeNull();
    });

    it('shows the generic banner and stays on the screen when login rejects', async () => {
      mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
      const { onSuccess } = await renderScreen();
      await fillValidForm();
      await fireEvent.press(screen.getByLabelText('Log in'));
      await waitFor(() => expect(screen.getByText(GENERIC_ERROR)).toBeTruthy());
      expect(onSuccess).not.toHaveBeenCalled();
      // The button returns to its idle label so the user can retry.
      expect(screen.getByLabelText('Log in')).toBeTruthy();
    });

    it('does not leak whether the email or password was wrong', async () => {
      mockLogin.mockRejectedValueOnce(new Error('User not found'));
      await renderScreen();
      await fillValidForm();
      await fireEvent.press(screen.getByLabelText('Log in'));
      await waitFor(() => expect(screen.getByText(GENERIC_ERROR)).toBeTruthy());
      // The specific backend reason must never surface in the UI.
      expect(screen.queryByText(/not found/i)).toBeNull();
    });

    it('clears the form-level error once the user edits the password', async () => {
      mockLogin.mockRejectedValueOnce(new Error('nope'));
      await renderScreen();
      await fillValidForm();
      await fireEvent.press(screen.getByLabelText('Log in'));
      await waitFor(() => expect(screen.getByText(GENERIC_ERROR)).toBeTruthy());
      await fireEvent.changeText(screen.getByLabelText('Password'), 'newValue1');
      expect(screen.queryByText(GENERIC_ERROR)).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('exposes both headers with the header role', async () => {
      await renderScreen();
      const headers = screen.getAllByRole('header');
      expect(headers.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('Welcome back').props.accessibilityRole).toBe(
        'header',
      );
    });

    it('gives every button an accessibility label', async () => {
      await renderScreen();
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((btn) => {
        expect(btn.props.accessibilityLabel).toBeTruthy();
      });
    });

    it('announces the form-level error as a polite alert live region', async () => {
      mockLogin.mockRejectedValueOnce(new Error('nope'));
      await renderScreen();
      await fillValidForm();
      await fireEvent.press(screen.getByLabelText('Log in'));
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert.props.accessibilityLiveRegion).toBe('polite');
      });
    });

    it('announces field errors as polite alert live regions', async () => {
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Log in'));
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
      alerts.forEach((a) =>
        expect(a.props.accessibilityLiveRegion).toBe('polite'),
      );
    });

    it('exposes the toggle checked state alongside its label', async () => {
      await renderScreen();
      const toggle = screen.getByLabelText('Show password');
      expect(toggle.props.accessibilityState.checked).toBe(false);
      await fireEvent.press(toggle);
      expect(
        screen.getByLabelText('Hide password').props.accessibilityState.checked,
      ).toBe(true);
    });

    it('marks the primary button busy while the request is in flight', async () => {
      const pending = deferredLogin();
      await renderScreen();
      await fillValidForm();
      const inFlight = fireEvent.press(screen.getByLabelText('Log in'));
      await waitFor(() =>
        expect(
          screen.getByLabelText('Logging in').props.accessibilityState.busy,
        ).toBe(true),
      );
      pending.resolve();
      await inFlight;
    });

    it('updates the accessibility label through loading and success', async () => {
      const pending = deferredLogin();
      await renderScreen();
      await fillValidForm();
      const inFlight = fireEvent.press(screen.getByLabelText('Log in'));
      await waitFor(() => expect(screen.getByLabelText('Logging in')).toBeTruthy());
      pending.resolve();
      await inFlight;
      await waitFor(() => expect(screen.getByLabelText('Logged in')).toBeTruthy());
    });
  });

  describe('edge cases', () => {
    it('disables the submit and back buttons while submitting', async () => {
      const pending = deferredLogin();
      await renderScreen();
      await fillValidForm();
      const inFlight = fireEvent.press(screen.getByLabelText('Log in'));
      await waitFor(() =>
        expect(
          screen.getByLabelText('Logging in').props.accessibilityState.disabled,
        ).toBe(true),
      );
      expect(
        screen.getByLabelText('Go back').props.accessibilityState.disabled,
      ).toBe(true);
      pending.resolve();
      await inFlight;
    });

    it('does not fire login twice on a rapid double press', async () => {
      await renderScreen();
      await fillValidForm();
      const btn = screen.getByLabelText('Log in');
      await fireEvent.press(btn);
      await fireEvent.press(btn);
      await waitFor(() => expect(mockLogin).toHaveBeenCalledTimes(1));
    });

    it('ignores back and sign-up presses while a request is pending', async () => {
      const pending = deferredLogin();
      const { onBack, onGoToSignup } = await renderScreen();
      await fillValidForm();
      const inFlight = fireEvent.press(screen.getByLabelText('Log in'));
      await waitFor(() => expect(screen.getByText('Logging in…')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Go back'));
      await fireEvent.press(screen.getByLabelText('Sign up for a new account'));
      expect(onBack).not.toHaveBeenCalled();
      expect(onGoToSignup).not.toHaveBeenCalled();
      pending.resolve();
      await inFlight;
    });

    it('leaves the password toggle inert while a request is pending', async () => {
      const pending = deferredLogin();
      await renderScreen();
      await fillValidForm();
      const inFlight = fireEvent.press(screen.getByLabelText('Log in'));
      await waitFor(() => expect(screen.getByText('Logging in…')).toBeTruthy());
      const before = screen.getByLabelText('Password').props.secureTextEntry;
      await fireEvent.press(screen.getByLabelText('Show password'));
      expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(before);
      pending.resolve();
      await inFlight;
    });

    it('renders without optional callbacks and does not crash on submit', async () => {
      await render(<LoginScreen />);
      await fireEvent.changeText(screen.getByLabelText('Email'), VALID_EMAIL);
      await fireEvent.changeText(screen.getByLabelText('Password'), VALID_PASSWORD);
      await fireEvent.press(screen.getByLabelText('Log in'));
      await waitFor(() => expect(mockLogin).toHaveBeenCalledTimes(1));
      // No onBack provided — pressing back must also be a safe no-op.
      await fireEvent.press(screen.getByLabelText('Go back'));
    });
  });

  describe('Continue with Google', () => {
    it('renders the Google button with the correct role and label', async () => {
      await renderScreen();
      const btn = screen.getByLabelText('Continue with Google');
      expect(btn).toBeTruthy();
      expect(btn.props.accessibilityRole).toBe('button');
    });

    it('calls loginWithGoogle then onSuccess on a successful sign-in', async () => {
      const { onSuccess } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Continue with Google'));
      await waitFor(() => expect(mockLoginWithGoogle).toHaveBeenCalledTimes(1));
      // The password path is untouched — Google is a separate route to "in".
      expect(mockLogin).not.toHaveBeenCalled();
      await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1), {
        timeout: 2000,
      });
    });

    it('silently resets on user cancellation with no error banner', async () => {
      mockLoginWithGoogle.mockRejectedValueOnce(cancelledError());
      const { onSuccess } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Continue with Google'));
      await waitFor(() => expect(mockLoginWithGoogle).toHaveBeenCalledTimes(1));
      expect(screen.queryByText(GENERIC_GOOGLE_ERROR)).toBeNull();
      expect(screen.queryByRole('alert')).toBeNull();
      expect(onSuccess).not.toHaveBeenCalled();
      // Returns to idle so the user can retry either path.
      expect(screen.getByLabelText('Continue with Google')).toBeTruthy();
    });

    it('shows the generic banner on a non-cancellation Google failure', async () => {
      mockLoginWithGoogle.mockRejectedValueOnce(new Error('network down'));
      const { onSuccess } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Continue with Google'));
      await waitFor(() =>
        expect(screen.getByText(GENERIC_GOOGLE_ERROR)).toBeTruthy(),
      );
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('disables the whole form while a Google sign-in is in flight', async () => {
      const pending = deferredGoogle();
      await renderScreen();
      const inFlight = fireEvent.press(
        screen.getByLabelText('Continue with Google'),
      );
      await waitFor(() =>
        expect(
          screen.getByLabelText('Continue with Google').props.accessibilityState
            .disabled,
        ).toBe(true),
      );
      // Password submit and back are locked by the shared status too.
      expect(
        screen.getByLabelText('Logging in').props.accessibilityState.disabled,
      ).toBe(true);
      expect(
        screen.getByLabelText('Go back').props.accessibilityState.disabled,
      ).toBe(true);
      pending.resolve();
      await inFlight;
    });

    it('does not fire loginWithGoogle twice on a rapid double press', async () => {
      await renderScreen();
      const btn = screen.getByLabelText('Continue with Google');
      await fireEvent.press(btn);
      await fireEvent.press(btn);
      await waitFor(() => expect(mockLoginWithGoogle).toHaveBeenCalledTimes(1));
    });
  });

  describe('validateLoginFields', () => {
    it('accepts a well-formed email and non-empty password', () => {
      expect(validateLoginFields(VALID_EMAIL, VALID_PASSWORD)).toEqual({
        email: null,
        password: null,
      });
    });

    it('flags a blank email', () => {
      expect(validateLoginFields('   ', VALID_PASSWORD).email).toBe(
        'Enter your email',
      );
    });

    it('flags a malformed email', () => {
      expect(validateLoginFields('nope', VALID_PASSWORD).email).toBe(
        "That email doesn't look right",
      );
    });

    it('flags an empty password', () => {
      expect(validateLoginFields(VALID_EMAIL, '').password).toBe(
        'Enter your password',
      );
    });

    it('accepts a password containing spaces', () => {
      expect(validateLoginFields(VALID_EMAIL, 'a b c').password).toBeNull();
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
