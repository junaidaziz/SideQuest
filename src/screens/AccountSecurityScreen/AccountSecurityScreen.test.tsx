import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import AccountSecurityScreen, {
  validatePasswordChange,
  MIN_PASSWORD_LENGTH,
} from './AccountSecurityScreen';
import type { UserProfile } from '../../types/api';

let mockUser: UserProfile | null;
jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (s: { user: UserProfile | null }) => unknown) =>
    selector({ user: mockUser }),
}));

const USER: UserProfile = {
  id: 'u1',
  email: 'alex@example.com',
  displayName: 'Alex',
  isGuest: false,
  avatarUrl: null,
  avatarVariants: [],
};

async function renderScreen(
  overrides: Partial<React.ComponentProps<typeof AccountSecurityScreen>> = {},
) {
  const props = {
    onBack: jest.fn(),
    onChangeEmail: jest.fn(),
    onDownloadData: jest.fn(),
    onSignOutOtherDevices: jest.fn(),
    onChangePassword: jest.fn(() => Promise.resolve()),
    onDeleteAccount: jest.fn(() => Promise.resolve()),
    onDeleted: jest.fn(),
    ...overrides,
  };
  await render(<AccountSecurityScreen {...props} />);
  return props;
}

async function fillPasswordForm(current: string, next: string, confirm: string) {
  await fireEvent.press(screen.getByLabelText('Change password'));
  await fireEvent.changeText(screen.getByLabelText('Current password'), current);
  await fireEvent.changeText(screen.getByLabelText('New password'), next);
  await fireEvent.changeText(screen.getByLabelText('Confirm new password'), confirm);
}

describe('AccountSecurityScreen', () => {
  beforeEach(() => {
    mockUser = USER;
  });

  describe('rendering', () => {
    it('shows the current email from the auth store', async () => {
      await renderScreen();
      expect(screen.getByText('alex@example.com')).toBeTruthy();
    });

    it('falls back when no email is set', async () => {
      mockUser = { ...USER, email: null };
      await renderScreen();
      expect(screen.getByText('Not set')).toBeTruthy();
    });

    it('renders the delete-account danger card', async () => {
      await renderScreen();
      expect(screen.getByText('Delete your account')).toBeTruthy();
      expect(screen.getByLabelText('Delete account')).toBeTruthy();
    });
  });

  describe('navigation rows', () => {
    it('routes email change, download data and sign-out other devices', async () => {
      const props = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Change email'));
      expect(props.onChangeEmail).toHaveBeenCalledTimes(1);
      await fireEvent.press(screen.getByLabelText('Download your data'));
      expect(props.onDownloadData).toHaveBeenCalledTimes(1);
      await fireEvent.press(screen.getByLabelText('Sign out other devices'));
      expect(props.onSignOutOtherDevices).toHaveBeenCalledTimes(1);
    });
  });

  describe('change password', () => {
    it('opens the change-password sheet', async () => {
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Change password'));
      expect(screen.getByLabelText('Update password')).toBeTruthy();
    });

    it('rejects a too-short new password', async () => {
      const props = await renderScreen();
      await fillPasswordForm('oldpass12', 'short', 'short');
      await fireEvent.press(screen.getByLabelText('Update password'));
      await waitFor(() =>
        expect(screen.getByText(`Use at least ${MIN_PASSWORD_LENGTH} characters`)).toBeTruthy(),
      );
      expect(props.onChangePassword).not.toHaveBeenCalled();
    });

    it('rejects a mismatched confirmation', async () => {
      const props = await renderScreen();
      await fillPasswordForm('oldpass12', 'newpass12', 'different1');
      await fireEvent.press(screen.getByLabelText('Update password'));
      await waitFor(() =>
        expect(screen.getByText("New passwords don't match")).toBeTruthy(),
      );
      expect(props.onChangePassword).not.toHaveBeenCalled();
    });

    it('submits a valid change and closes the sheet', async () => {
      const props = await renderScreen();
      await fillPasswordForm('oldpass12', 'newpass12', 'newpass12');
      await fireEvent.press(screen.getByLabelText('Update password'));
      await waitFor(() =>
        expect(props.onChangePassword).toHaveBeenCalledWith('oldpass12', 'newpass12'),
      );
      await waitFor(() => expect(screen.queryByLabelText('Update password')).toBeNull());
    });

    it('surfaces a backend failure and keeps the sheet open', async () => {
      const onChangePassword = jest.fn(() => Promise.reject(new Error('401')));
      await renderScreen({ onChangePassword });
      await fillPasswordForm('oldpass12', 'newpass12', 'newpass12');
      await fireEvent.press(screen.getByLabelText('Update password'));
      await waitFor(() =>
        expect(
          screen.getByText(
            "Couldn't update your password. Check your current password and try again.",
          ),
        ).toBeTruthy(),
      );
      expect(screen.getByLabelText('Update password')).toBeTruthy();
    });

    it('cancels and dismisses the sheet', async () => {
      const props = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Change password'));
      await fireEvent.press(screen.getByLabelText('Cancel password change'));
      await waitFor(() => expect(screen.queryByLabelText('Update password')).toBeNull());
      expect(props.onChangePassword).not.toHaveBeenCalled();
    });
  });

  describe('delete account', () => {
    it('keeps delete disabled until the box is checked and a password entered', async () => {
      await renderScreen();
      const deleteBtn = screen.getByLabelText('Delete account');
      expect(deleteBtn.props.accessibilityState).toMatchObject({ disabled: true });

      await fireEvent.press(
        screen.getByLabelText(
          'I understand my account and progress will be permanently deleted',
        ),
      );
      expect(screen.getByLabelText('Delete account').props.accessibilityState).toMatchObject({
        disabled: true,
      });

      await fireEvent.changeText(
        screen.getByLabelText('Password to confirm deletion'),
        'mypassword',
      );
      expect(screen.getByLabelText('Delete account').props.accessibilityState).toMatchObject({
        disabled: false,
      });
    });

    it('does not delete while disabled', async () => {
      const props = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Delete account'));
      expect(props.onDeleteAccount).not.toHaveBeenCalled();
    });

    it('deletes when confirmed and reports completion', async () => {
      const props = await renderScreen();
      await fireEvent.press(
        screen.getByLabelText(
          'I understand my account and progress will be permanently deleted',
        ),
      );
      await fireEvent.changeText(
        screen.getByLabelText('Password to confirm deletion'),
        'mypassword',
      );
      await fireEvent.press(screen.getByLabelText('Delete account'));
      await waitFor(() =>
        expect(props.onDeleteAccount).toHaveBeenCalledWith('mypassword'),
      );
      expect(props.onDeleted).toHaveBeenCalledTimes(1);
    });

    it('surfaces a delete failure without navigating away', async () => {
      const onDeleteAccount = jest.fn(() => Promise.reject(new Error('401')));
      const props = await renderScreen({ onDeleteAccount });
      await fireEvent.press(
        screen.getByLabelText(
          'I understand my account and progress will be permanently deleted',
        ),
      );
      await fireEvent.changeText(
        screen.getByLabelText('Password to confirm deletion'),
        'wrongpass',
      );
      await fireEvent.press(screen.getByLabelText('Delete account'));
      await waitFor(() =>
        expect(
          screen.getByText(
            "Couldn't delete your account. Check your password and try again.",
          ),
        ).toBeTruthy(),
      );
      expect(props.onDeleted).not.toHaveBeenCalled();
    });

    it('unchecks the confirmation on a second press', async () => {
      await renderScreen();
      const checkbox = screen.getByLabelText(
        'I understand my account and progress will be permanently deleted',
      );
      await fireEvent.press(checkbox);
      expect(
        screen.getByLabelText(
          'I understand my account and progress will be permanently deleted',
        ).props.accessibilityState,
      ).toMatchObject({ checked: true });
      await fireEvent.press(checkbox);
      expect(
        screen.getByLabelText(
          'I understand my account and progress will be permanently deleted',
        ).props.accessibilityState,
      ).toMatchObject({ checked: false });
    });
  });

  describe('validatePasswordChange', () => {
    it('enforces current, length, match and difference rules', () => {
      expect(validatePasswordChange('', 'newpass12', 'newpass12')).toBe(
        'Enter your current password',
      );
      expect(validatePasswordChange('old', 'short', 'short')).toMatch(/at least 8/);
      expect(validatePasswordChange('old', 'newpass12', 'nope')).toBe(
        "New passwords don't match",
      );
      expect(validatePasswordChange('samepass', 'samepass', 'samepass')).toMatch(
        /different from your current/,
      );
      expect(validatePasswordChange('oldpass12', 'newpass12', 'newpass12')).toBeNull();
    });
  });
});
