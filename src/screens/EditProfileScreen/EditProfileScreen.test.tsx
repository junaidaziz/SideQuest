import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import EditProfileScreen, { validateDisplayName } from './EditProfileScreen';
import { updateDisplayName } from '../../services/profileApi';
import { removeAvatar, uploadAvatar } from '../../services/avatarApi';
import type { UserProfile } from '../../types/api';

jest.mock('../../services/profileApi', () => ({
  ...jest.requireActual('../../services/profileApi'),
  updateDisplayName: jest.fn(),
}));
jest.mock('../../services/avatarApi');
jest.mock('expo-image-picker');

const mockUpdateProfile = jest.fn<void, [UserProfile]>();
let mockUser: UserProfile | null;

jest.mock('../../store/authStore', () => ({
  useAuthStore: (
    selector: (s: { user: UserProfile | null; updateProfile: typeof mockUpdateProfile }) => unknown,
  ) => selector({ user: mockUser, updateProfile: mockUpdateProfile }),
}));

const mockUpdateName = updateDisplayName as jest.MockedFunction<typeof updateDisplayName>;
const mockUpload = uploadAvatar as jest.MockedFunction<typeof uploadAvatar>;
const mockRemove = removeAvatar as jest.MockedFunction<typeof removeAvatar>;
const mockReqCamera = ImagePicker.requestCameraPermissionsAsync as jest.Mock;
const mockReqLibrary = ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;
const mockLaunchCamera = ImagePicker.launchCameraAsync as jest.Mock;
const mockLaunchLibrary = ImagePicker.launchImageLibraryAsync as jest.Mock;

const USER: UserProfile = {
  id: 'u1',
  email: 'alex@example.com',
  displayName: 'Alex Rivera',
  isGuest: false,
  avatarUrl: 'https://cdn/x.jpg',
};

const UPDATED: UserProfile = { ...USER, displayName: 'Alex R' };

async function renderScreen(overrides: Partial<React.ComponentProps<typeof EditProfileScreen>> = {}) {
  const props = { onBack: jest.fn(), onSaved: jest.fn(), ...overrides };
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  await render(
    <QueryClientProvider client={queryClient}>
      <EditProfileScreen {...props} />
    </QueryClientProvider>,
  );
  return props;
}

describe('EditProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = USER;
    mockUpdateName.mockResolvedValue(UPDATED);
    mockUpload.mockResolvedValue(USER);
    mockRemove.mockResolvedValue({ ...USER, avatarUrl: null });
    mockReqCamera.mockResolvedValue({ granted: true });
    mockReqLibrary.mockResolvedValue({ granted: true });
    mockLaunchCamera.mockResolvedValue({ canceled: true });
    mockLaunchLibrary.mockResolvedValue({ canceled: true });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  describe('rendering', () => {
    it('prefills the current display name', async () => {
      await renderScreen();
      expect(screen.getByLabelText('Display name').props.value).toBe('Alex Rivera');
    });

    it('honestly explains which profile fields can be saved', async () => {
      await renderScreen();
      expect(screen.getByText(/Pronouns and bio are not supported yet/)).toBeTruthy();
      expect(screen.queryByLabelText('Bio')).toBeNull();
      expect(screen.queryByLabelText('Pronouns')).toBeNull();
    });

    it('starts with an empty name field when the profile has no display name', async () => {
      mockUser = { ...USER, displayName: null };
      await renderScreen();
      expect(screen.getByLabelText('Display name').props.value).toBe('');
    });

    it('renders a minimal header when there is no user', async () => {
      mockUser = null;
      await renderScreen();
      expect(screen.getByText('Edit profile')).toBeTruthy();
      expect(screen.queryByLabelText('Display name')).toBeNull();
    });
  });

  describe('name editing', () => {
    it('saves a valid name and reports success', async () => {
      const props = await renderScreen();
      await fireEvent.changeText(screen.getByLabelText('Display name'), 'Alex R');
      await fireEvent.press(screen.getByLabelText('Save changes'));
      await waitFor(() => expect(mockUpdateName).toHaveBeenCalledWith('Alex R'));
      expect(mockUpdateProfile).toHaveBeenCalledWith(UPDATED);
      expect(props.onSaved).toHaveBeenCalledTimes(1);
    });

    it('rejects an empty name without calling the API', async () => {
      await renderScreen();
      await fireEvent.changeText(screen.getByLabelText('Display name'), '   ');
      await fireEvent.press(screen.getByLabelText('Save changes'));
      await waitFor(() => expect(screen.getByText('Enter a display name')).toBeTruthy());
      expect(mockUpdateName).not.toHaveBeenCalled();
    });

    it('surfaces a save error and keeps the screen editable', async () => {
      mockUpdateName.mockRejectedValueOnce(new Error('500'));
      const props = await renderScreen();
      await fireEvent.changeText(screen.getByLabelText('Display name'), 'Alex R');
      await fireEvent.press(screen.getByLabelText('Save changes'));
      await waitFor(() =>
        expect(screen.getByText("Couldn't save your changes. Please try again.")).toBeTruthy(),
      );
      expect(props.onSaved).not.toHaveBeenCalled();
    });

    it('clears a validation error as the user types', async () => {
      await renderScreen();
      await fireEvent.changeText(screen.getByLabelText('Display name'), '');
      await fireEvent.press(screen.getByLabelText('Save changes'));
      await waitFor(() => expect(screen.getByText('Enter a display name')).toBeTruthy());
      await fireEvent.changeText(screen.getByLabelText('Display name'), 'A');
      await waitFor(() => expect(screen.queryByText('Enter a display name')).toBeNull());
    });
  });

  describe('avatar', () => {
    it('opens the photo options sheet from Change photo', async () => {
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Change photo'));
      expect(Alert.alert).toHaveBeenCalledTimes(1);
    });

    it('has no separate "Change photo" text pill — the camera badge on the avatar is the only trigger', async () => {
      await renderScreen();
      // A dedicated pill button used to sit next to Remove; it's gone now
      // that the camera badge itself opens the picker.
      expect(screen.queryByText('Change photo')).toBeNull();
      // Exactly one element carries the "Change photo" accessibility label —
      // the camera badge — not two competing triggers.
      expect(screen.getAllByLabelText('Change photo')).toHaveLength(1);
    });

    it('uploads a chosen library photo', async () => {
      mockLaunchLibrary.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///new.jpg' }],
      });
      (Alert.alert as jest.Mock).mockImplementation((_t, _m, buttons) => {
        buttons[1].onPress();
      });
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Change photo'));
      await waitFor(() => expect(mockUpload).toHaveBeenCalledWith('file:///new.jpg'));
    });

    it('warns when library permission is denied', async () => {
      mockReqLibrary.mockResolvedValueOnce({ granted: false });
      (Alert.alert as jest.Mock).mockImplementation((_t, _m, buttons) => {
        buttons[1].onPress();
      });
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Change photo'));
      await waitFor(() =>
        expect(
          screen.getByText('Photo access is off. Enable it in Settings to choose a photo.'),
        ).toBeTruthy(),
      );
      expect(mockUpload).not.toHaveBeenCalled();
    });

    it('takes a photo with the camera and uploads it', async () => {
      mockLaunchCamera.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///cam.jpg' }],
      });
      (Alert.alert as jest.Mock).mockImplementation((_t, _m, buttons) => {
        buttons[0].onPress();
      });
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Change photo'));
      await waitFor(() => expect(mockUpload).toHaveBeenCalledWith('file:///cam.jpg'));
    });

    it('warns when camera permission is denied', async () => {
      mockReqCamera.mockResolvedValueOnce({ granted: false });
      (Alert.alert as jest.Mock).mockImplementation((_t, _m, buttons) => {
        buttons[0].onPress();
      });
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Change photo'));
      await waitFor(() =>
        expect(
          screen.getByText('Camera access is off. Enable it in Settings to take a photo.'),
        ).toBeTruthy(),
      );
      expect(mockUpload).not.toHaveBeenCalled();
    });

    it('shows a friendly error when the camera throws (e.g. no camera on the Simulator)', async () => {
      // launchCameraAsync throws rather than resolving a canceled result when
      // no camera is available — the exact failure mode on every iOS
      // Simulator. Regression test for an unhandled-rejection bug.
      mockLaunchCamera.mockRejectedValueOnce(new Error('Camera not available on simulator'));
      (Alert.alert as jest.Mock).mockImplementation((_t, _m, buttons) => {
        buttons[0].onPress();
      });
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Change photo'));
      await waitFor(() =>
        expect(screen.getByText("Couldn't open the camera. Please try again.")).toBeTruthy(),
      );
      expect(mockUpload).not.toHaveBeenCalled();
    });

    it('shows a friendly error when the photo library throws', async () => {
      mockLaunchLibrary.mockRejectedValueOnce(new Error('boom'));
      (Alert.alert as jest.Mock).mockImplementation((_t, _m, buttons) => {
        buttons[1].onPress();
      });
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Change photo'));
      await waitFor(() =>
        expect(
          screen.getByText("Couldn't open your photo library. Please try again."),
        ).toBeTruthy(),
      );
      expect(mockUpload).not.toHaveBeenCalled();
    });

    it('ignores a canceled picker result', async () => {
      mockLaunchLibrary.mockResolvedValueOnce({ canceled: true });
      (Alert.alert as jest.Mock).mockImplementation((_t, _m, buttons) => {
        buttons[1].onPress();
      });
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Change photo'));
      await waitFor(() => expect(mockReqLibrary).toHaveBeenCalled());
      expect(mockUpload).not.toHaveBeenCalled();
    });

    it('surfaces an upload failure', async () => {
      mockUpload.mockRejectedValueOnce(new Error('500'));
      mockLaunchLibrary.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///x.jpg' }],
      });
      (Alert.alert as jest.Mock).mockImplementation((_t, _m, buttons) => {
        buttons[1].onPress();
      });
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Change photo'));
      await waitFor(() =>
        expect(
          screen.getByText("Couldn't update your photo. Please try again."),
        ).toBeTruthy(),
      );
    });

    it('renders initials when there is no avatar', async () => {
      mockUser = { ...USER, avatarUrl: null, displayName: 'Sam Vale' };
      await renderScreen();
      expect(screen.getByText('SV')).toBeTruthy();
    });

    it('surfaces a remove failure', async () => {
      mockRemove.mockRejectedValueOnce(new Error('500'));
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Remove profile photo'));
      await waitFor(() =>
        expect(
          screen.getByText("Couldn't remove your photo. Please try again."),
        ).toBeTruthy(),
      );
    });

    it('removes the current photo', async () => {
      const props = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Remove profile photo'));
      await waitFor(() => expect(mockRemove).toHaveBeenCalledTimes(1));
      expect(mockUpdateProfile).toHaveBeenCalledWith({ ...USER, avatarUrl: null });
      // No save round-trip involved in avatar removal.
      expect(props.onSaved).not.toHaveBeenCalled();
    });

    it('hides the Remove action when there is no avatar', async () => {
      mockUser = { ...USER, avatarUrl: null };
      await renderScreen();
      expect(screen.queryByLabelText('Remove profile photo')).toBeNull();
    });
  });

  describe('validateDisplayName', () => {
    it('rejects blank and over-long names, accepts valid ones', () => {
      expect(validateDisplayName('  ')).toBe('Enter a display name');
      expect(validateDisplayName('a'.repeat(51))).toMatch(/50 characters/);
      expect(validateDisplayName('Alex')).toBeNull();
    });
  });
});
