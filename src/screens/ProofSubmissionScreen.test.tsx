import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import ProofSubmissionScreen, {
  isGuestLimitError,
  whenPressed,
} from './ProofSubmissionScreen';
import { submitPhotoProof, submitTextProof } from '../services/proofApi';
import { ApiError } from '../services/apiClient';
import { GUEST_COMPLETION_LIMIT_REACHED } from '../types/api';
import type { ProofSubmissionResponse } from '../types/api';

jest.mock('expo-image-picker');
jest.mock('../services/proofApi');

const mockSubmitPhoto = submitPhotoProof as jest.Mock;
const mockSubmitText = submitTextProof as jest.Mock;
const mockRequestCamera =
  ImagePicker.requestCameraPermissionsAsync as jest.Mock;
const mockRequestLibrary =
  ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;
const mockLaunchCamera = ImagePicker.launchCameraAsync as jest.Mock;
const mockLaunchLibrary = ImagePicker.launchImageLibraryAsync as jest.Mock;

const MISSION_ID = 'mission-42';
const PROOF_REQUIREMENT =
  'Photograph the object and add a one-line caption with your best guess at its age.';
const CAPTION_PLACEHOLDER =
  'Describe what you found and your best guess at its age…';

const RESULT: ProofSubmissionResponse = {
  completionId: 'c-1',
  missionTitle: 'Find the Oldest Thing',
  xpAwarded: 40,
  totalXp: 240,
  currentStreak: 3,
  longestStreak: 5,
  proofUrl: 'https://example.test/proof.jpg',
};

function granted() {
  return { granted: true, status: 'granted' as const };
}

function denied() {
  return { granted: false, status: 'denied' as const };
}

function pickedAsset(uri = 'file:///tmp/proof.jpg') {
  return { canceled: false, assets: [{ uri }] };
}

async function renderScreen(
  overrides: Partial<React.ComponentProps<typeof ProofSubmissionScreen>> = {},
) {
  const onSubmitSuccess = jest.fn();
  const onCancel = jest.fn();
  const onGuestLimitReached = jest.fn();
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  await render(
    <QueryClientProvider client={queryClient}>
      <ProofSubmissionScreen
        missionId={MISSION_ID}
        proofRequirement={PROOF_REQUIREMENT}
        onSubmitSuccess={onSubmitSuccess}
        onCancel={onCancel}
        onGuestLimitReached={onGuestLimitReached}
        {...overrides}
      />
    </QueryClientProvider>,
  );
  return { onSubmitSuccess, onCancel, onGuestLimitReached };
}

/** Fires the tap on the camera area, then invokes the Nth Alert action. */
async function captureVia(actionIndex: number) {
  const alertSpy = jest.spyOn(Alert, 'alert');
  await fireEvent.press(screen.getByLabelText('Take photo or choose from library'));
  const buttons = alertSpy.mock.calls[0]?.[2];
  const action = buttons?.[actionIndex];
  await action?.onPress?.();
  alertSpy.mockRestore();
}

describe('ProofSubmissionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitPhoto.mockResolvedValue(RESULT);
    mockSubmitText.mockResolvedValue(RESULT);
    mockRequestCamera.mockResolvedValue(granted());
    mockRequestLibrary.mockResolvedValue(granted());
    mockLaunchCamera.mockResolvedValue(pickedAsset());
    mockLaunchLibrary.mockResolvedValue(pickedAsset('file:///tmp/library.png'));
  });

  describe('rendering', () => {
    it('renders the header, title and back control', async () => {
      await renderScreen();
      // Two "Submit Proof" text nodes exist (header + idle submit button
      // label) — query the header specifically via its role.
      expect(screen.getByRole('header')).toBeTruthy();
      expect(screen.getByLabelText('Back to mission detail')).toBeTruthy();
    });

    it('renders the proof requirement banner text from props', async () => {
      await renderScreen();
      expect(screen.getByText(PROOF_REQUIREMENT)).toBeTruthy();
      expect(screen.getByText('WHAT COUNTS AS PROOF')).toBeTruthy();
    });

    it('renders both proof-method tabs with photo selected by default', async () => {
      await renderScreen();
      expect(screen.getByLabelText('Photo proof').props.accessibilityState.selected).toBe(
        true,
      );
      expect(screen.getByLabelText('Text proof').props.accessibilityState.selected).toBe(
        false,
      );
    });

    it('renders the camera idle state on the photo tab', async () => {
      await renderScreen();
      expect(screen.getByText('Tap to capture')).toBeTruthy();
      expect(
        screen.getByLabelText('Take photo or choose from library'),
      ).toBeTruthy();
    });

    it('renders the caption field and counter on the text tab', async () => {
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Text proof'));
      expect(screen.getByPlaceholderText(CAPTION_PLACEHOLDER)).toBeTruthy();
      expect(screen.getByText('0 / 500')).toBeTruthy();
    });

    it('disables the submit button until proof is provided', async () => {
      await renderScreen();
      const submit = screen.getByLabelText(
        'Submit your proof and complete the mission',
      );
      expect(submit.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('tab switching', () => {
    it('activates the text tab and its panel when tapped', async () => {
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Text proof'));
      expect(screen.getByLabelText('Text proof').props.accessibilityState.selected).toBe(
        true,
      );
      expect(screen.queryByText('Tap to capture')).toBeNull();
    });

    it('returns to the photo tab when tapped', async () => {
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Text proof'));
      await fireEvent.press(screen.getByLabelText('Photo proof'));
      expect(screen.getByText('Tap to capture')).toBeTruthy();
    });
  });

  describe('photo capture', () => {
    it('captures a photo via the camera path and shows the preview', async () => {
      await renderScreen();
      await captureVia(0);
      await waitFor(() =>
        expect(mockRequestCamera).toHaveBeenCalled(),
      );
      expect(mockLaunchCamera).toHaveBeenCalled();
      await waitFor(() => expect(screen.getByText('Photo captured!')).toBeTruthy());
    });

    it('captures a photo via the library path and shows the preview', async () => {
      await renderScreen();
      await captureVia(1);
      await waitFor(() => expect(mockLaunchLibrary).toHaveBeenCalled());
      await waitFor(() => expect(screen.getByText('Photo captured!')).toBeTruthy());
    });

    it('enables submit once a photo is captured', async () => {
      await renderScreen();
      await captureVia(0);
      await waitFor(() => {
        const submit = screen.getByLabelText(
          'Submit your proof and complete the mission',
        );
        expect(submit.props.accessibilityState.disabled).toBe(false);
      });
    });

    it('clears the captured photo when retake is pressed', async () => {
      await renderScreen();
      await captureVia(0);
      await waitFor(() => expect(screen.getByLabelText('Retake photo')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Retake photo'));
      expect(screen.getByText('Tap to capture')).toBeTruthy();
    });

    it('does nothing when the picker is canceled', async () => {
      mockLaunchCamera.mockResolvedValue({ canceled: true, assets: null });
      await renderScreen();
      await captureVia(0);
      await waitFor(() => expect(mockLaunchCamera).toHaveBeenCalled());
      expect(screen.getByText('Tap to capture')).toBeTruthy();
    });

    it('shows an inline error when camera permission is denied', async () => {
      mockRequestCamera.mockResolvedValue(denied());
      await renderScreen();
      await captureVia(0);
      await waitFor(() =>
        expect(
          screen.getByText(/Camera access is off/),
        ).toBeTruthy(),
      );
      expect(mockLaunchCamera).not.toHaveBeenCalled();
    });

    it('shows an inline error when library permission is denied', async () => {
      mockRequestLibrary.mockResolvedValue(denied());
      await renderScreen();
      await captureVia(1);
      await waitFor(() =>
        expect(screen.getByText(/Photo access is off/)).toBeTruthy(),
      );
      expect(mockLaunchLibrary).not.toHaveBeenCalled();
    });

    it('does not capture when the Cancel action is chosen', async () => {
      await renderScreen();
      await captureVia(2);
      expect(mockRequestCamera).not.toHaveBeenCalled();
      expect(mockRequestLibrary).not.toHaveBeenCalled();
    });
  });

  describe('text entry', () => {
    it('updates the character counter as the caption changes', async () => {
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Text proof'));
      await fireEvent.changeText(
        screen.getByPlaceholderText(CAPTION_PLACEHOLDER),
        'A rusty key',
      );
      expect(screen.getByText('11 / 500')).toBeTruthy();
    });

    it('enables submit when the caption is non-empty', async () => {
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Text proof'));
      await fireEvent.changeText(
        screen.getByPlaceholderText(CAPTION_PLACEHOLDER),
        'An old coin',
      );
      const submit = screen.getByLabelText(
        'Submit your proof and complete the mission',
      );
      expect(submit.props.accessibilityState.disabled).toBe(false);
    });

    it('keeps submit disabled for whitespace-only captions', async () => {
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Text proof'));
      await fireEvent.changeText(screen.getByPlaceholderText(CAPTION_PLACEHOLDER), '    ');
      const submit = screen.getByLabelText(
        'Submit your proof and complete the mission',
      );
      expect(submit.props.accessibilityState.disabled).toBe(true);
    });

    it('flags the counter with the warn style past the threshold', async () => {
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Text proof'));
      await fireEvent.changeText(
        screen.getByPlaceholderText(CAPTION_PLACEHOLDER),
        'x'.repeat(451),
      );
      const counter = screen.getByText('451 / 500');
      const flat = Array.isArray(counter.props.style)
        ? Object.assign({}, ...counter.props.style.filter(Boolean))
        : counter.props.style;
      expect(flat.color).toBe('#E53935');
    });
  });

  describe('submission', () => {
    it('submits a photo proof and calls onSubmitSuccess with the result', async () => {
      const { onSubmitSuccess } = await renderScreen();
      await captureVia(0);
      await waitFor(() => expect(screen.getByText('Photo captured!')).toBeTruthy());
      await fireEvent.press(
        screen.getByLabelText('Submit your proof and complete the mission'),
      );
      await waitFor(() =>
        expect(mockSubmitPhoto).toHaveBeenCalledWith(
          MISSION_ID,
          'file:///tmp/proof.jpg',
        ),
      );
      await waitFor(() => expect(onSubmitSuccess).toHaveBeenCalledWith(RESULT));
    });

    it('submits a text proof with the trimmed caption', async () => {
      const { onSubmitSuccess } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Text proof'));
      await fireEvent.changeText(
        screen.getByPlaceholderText(CAPTION_PLACEHOLDER),
        '  A weathered gravestone, maybe 1800s  ',
      );
      await fireEvent.press(
        screen.getByLabelText('Submit your proof and complete the mission'),
      );
      await waitFor(() =>
        expect(mockSubmitText).toHaveBeenCalledWith(
          MISSION_ID,
          'A weathered gravestone, maybe 1800s',
        ),
      );
      await waitFor(() => expect(onSubmitSuccess).toHaveBeenCalledWith(RESULT));
    });

    it('shows a busy label and busy accessibility state while submitting', async () => {
      let resolve: ((value: ProofSubmissionResponse) => void) | undefined;
      mockSubmitText.mockReturnValue(
        new Promise((r) => {
          resolve = r;
        }),
      );
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Text proof'));
      await fireEvent.changeText(
        screen.getByPlaceholderText(CAPTION_PLACEHOLDER),
        'A fossil',
      );
      await fireEvent.press(
        screen.getByLabelText('Submit your proof and complete the mission'),
      );
      await waitFor(() => {
        const busy = screen.getByLabelText('Submitting your proof');
        expect(busy.props.accessibilityState.busy).toBe(true);
        expect(busy.props.accessibilityState.disabled).toBe(true);
      });
      expect(screen.getByText('Submitting…')).toBeTruthy();
      resolve?.(RESULT);
    });

    it('shows an inline error and lets the user retry on a generic failure', async () => {
      mockSubmitText.mockRejectedValueOnce(new Error('Network request failed'));
      const { onSubmitSuccess } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Text proof'));
      await fireEvent.changeText(
        screen.getByPlaceholderText(CAPTION_PLACEHOLDER),
        'A fossil',
      );
      await fireEvent.press(
        screen.getByLabelText('Submit your proof and complete the mission'),
      );
      await waitFor(() =>
        expect(screen.getByText('Network request failed')).toBeTruthy(),
      );
      expect(onSubmitSuccess).not.toHaveBeenCalled();

      await fireEvent.press(
        screen.getByLabelText('Submit your proof and complete the mission'),
      );
      await waitFor(() => expect(onSubmitSuccess).toHaveBeenCalledWith(RESULT));
    });

    it('falls back to a default message when the error has no message', async () => {
      mockSubmitText.mockRejectedValueOnce(new Error(''));
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Text proof'));
      await fireEvent.changeText(
        screen.getByPlaceholderText(CAPTION_PLACEHOLDER),
        'A fossil',
      );
      await fireEvent.press(
        screen.getByLabelText('Submit your proof and complete the mission'),
      );
      await waitFor(() =>
        expect(
          screen.getByText('Could not submit your proof. Please try again.'),
        ).toBeTruthy(),
      );
    });

    it('routes a 403 guest-limit error to onGuestLimitReached', async () => {
      mockSubmitText.mockRejectedValueOnce(
        new ApiError(403, {
          statusCode: 403,
          timestamp: 't',
          path: '/p',
          message: GUEST_COMPLETION_LIMIT_REACHED,
        }),
      );
      const { onGuestLimitReached } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Text proof'));
      await fireEvent.changeText(
        screen.getByPlaceholderText(CAPTION_PLACEHOLDER),
        'A fossil',
      );
      await fireEvent.press(
        screen.getByLabelText('Submit your proof and complete the mission'),
      );
      await waitFor(() => expect(onGuestLimitReached).toHaveBeenCalledTimes(1));
      expect(screen.queryByText(GUEST_COMPLETION_LIMIT_REACHED)).toBeNull();
    });

    it('shows a generic error for a 403 without the guest-limit reason', async () => {
      mockSubmitText.mockRejectedValueOnce(
        new ApiError(403, {
          statusCode: 403,
          timestamp: 't',
          path: '/p',
          message: 'Forbidden',
        }),
      );
      const { onGuestLimitReached } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Text proof'));
      await fireEvent.changeText(
        screen.getByPlaceholderText(CAPTION_PLACEHOLDER),
        'A fossil',
      );
      await fireEvent.press(
        screen.getByLabelText('Submit your proof and complete the mission'),
      );
      await waitFor(() => expect(screen.getByText('Forbidden')).toBeTruthy());
      expect(onGuestLimitReached).not.toHaveBeenCalled();
    });
  });

  describe('navigation', () => {
    it('calls onCancel when the back button is pressed', async () => {
      const { onCancel } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Back to mission detail'));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('does not cancel while a submission is in flight', async () => {
      let resolve: ((value: ProofSubmissionResponse) => void) | undefined;
      mockSubmitText.mockReturnValue(
        new Promise((r) => {
          resolve = r;
        }),
      );
      const { onCancel } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Text proof'));
      await fireEvent.changeText(
        screen.getByPlaceholderText(CAPTION_PLACEHOLDER),
        'A fossil',
      );
      await fireEvent.press(
        screen.getByLabelText('Submit your proof and complete the mission'),
      );
      await waitFor(() => expect(screen.getByText('Submitting…')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Back to mission detail'));
      expect(onCancel).not.toHaveBeenCalled();
      resolve?.(RESULT);
    });
  });

  describe('accessibility', () => {
    it('gives every interactive element a role and a label', async () => {
      await renderScreen();
      const buttons = [
        ...screen.getAllByRole('button'),
        ...screen.getAllByRole('tab'),
      ];
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((el) => {
        expect(el.props.accessibilityLabel).toBeTruthy();
      });
    });

    it('exposes the screen title as a header', async () => {
      await renderScreen();
      expect(screen.getByRole('header').props.children).toBe('Submit Proof');
    });

    it('announces the character counter as a polite live region', async () => {
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Text proof'));
      const counter = screen.getByLabelText('0 of 500 characters used');
      expect(counter.props.accessibilityLiveRegion).toBe('polite');
    });
  });

  describe('edge cases', () => {
    it('does not throw when capturing without optional handlers', async () => {
      await renderScreen({
        onSubmitSuccess: undefined,
        onCancel: undefined,
        onGuestLimitReached: undefined,
      });
      await fireEvent.press(screen.getByLabelText('Back to mission detail'));
      await captureVia(0);
      await waitFor(() => expect(screen.getByText('Photo captured!')).toBeTruthy());
      expect(() =>
        fireEvent.press(
          screen.getByLabelText('Submit your proof and complete the mission'),
        ),
      ).not.toThrow();
    });

    it('ignores submit taps while a submission is already pending', async () => {
      let resolve: ((value: ProofSubmissionResponse) => void) | undefined;
      mockSubmitText.mockReturnValue(
        new Promise((r) => {
          resolve = r;
        }),
      );
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Text proof'));
      await fireEvent.changeText(
        screen.getByPlaceholderText(CAPTION_PLACEHOLDER),
        'A fossil',
      );
      await fireEvent.press(
        screen.getByLabelText('Submit your proof and complete the mission'),
      );
      await waitFor(() => expect(screen.getByText('Submitting…')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Submitting your proof'));
      expect(mockSubmitText).toHaveBeenCalledTimes(1);
      resolve?.(RESULT);
    });

    it('clears a stale submit error when switching tabs', async () => {
      mockSubmitText.mockRejectedValueOnce(new Error('Network request failed'));
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Text proof'));
      await fireEvent.changeText(
        screen.getByPlaceholderText(CAPTION_PLACEHOLDER),
        'A fossil',
      );
      await fireEvent.press(
        screen.getByLabelText('Submit your proof and complete the mission'),
      );
      await waitFor(() =>
        expect(screen.getByText('Network request failed')).toBeTruthy(),
      );
      await fireEvent.press(screen.getByLabelText('Photo proof'));
      expect(screen.queryByText('Network request failed')).toBeNull();
    });
  });

  describe('isGuestLimitError', () => {
    it('is true for a 403 ApiError carrying the guest-limit reason', async () => {
      const err = new ApiError(403, {
        statusCode: 403,
        timestamp: 't',
        path: '/p',
        message: GUEST_COMPLETION_LIMIT_REACHED,
      });
      expect(isGuestLimitError(err)).toBe(true);
    });

    it('is false for a 403 without the reason', async () => {
      const err = new ApiError(403, {
        statusCode: 403,
        timestamp: 't',
        path: '/p',
        message: 'Forbidden',
      });
      expect(isGuestLimitError(err)).toBe(false);
    });

    it('is false for a non-403 ApiError with the reason', async () => {
      const err = new ApiError(500, {
        statusCode: 500,
        timestamp: 't',
        path: '/p',
        message: GUEST_COMPLETION_LIMIT_REACHED,
      });
      expect(isGuestLimitError(err)).toBe(false);
    });

    it('is false for a plain Error', async () => {
      expect(isGuestLimitError(new Error(GUEST_COMPLETION_LIMIT_REACHED))).toBe(
        false,
      );
    });
  });

  describe('whenPressed helper', () => {
    it('returns the style while pressed', async () => {
      expect(whenPressed(true, { opacity: 0.5 })).toEqual({ opacity: 0.5 });
    });

    it('returns null while not pressed', async () => {
      expect(whenPressed(false, { opacity: 0.5 })).toBeNull();
    });
  });
});
