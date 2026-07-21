import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import * as Haptics from 'expo-haptics';
import ProofSubmissionScreenV2, { canSubmit, submitLabel } from './ProofSubmissionScreenV2';
import { submitPhotoProof, submitTextProof } from '../../services/proofApi';
import { enqueueProofSubmission } from '../../services/queuedActions';
import { useOfflineStatus } from '../../components/states/useOfflineStatus';
import type { ProofSubmissionResponse } from '../../types/api';

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('react-native-reanimated', () => {
  const R = require('react');
  const { View, Text, ScrollView } = require('react-native');
  const pass = (Comp: unknown) =>
    R.forwardRef((props: Record<string, unknown>, ref: unknown) => {
      const { entering, exiting, layout, ...rest } = props;
      return R.createElement(Comp, { ...rest, ref });
    });
  const chain = (): unknown =>
    new Proxy(function () {}, { get: () => chain(), apply: () => chain() });
  return {
    __esModule: true,
    default: { View: pass(View), Text: pass(Text), ScrollView: pass(ScrollView), createAnimatedComponent: pass },
    FadeInDown: chain(),
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: (fn: () => unknown) => (typeof fn === 'function' ? fn() : {}),
    withSpring: (v: unknown) => v,
  };
});

jest.mock('../../services/proofApi');
jest.mock('../../services/queuedActions');
jest.mock('../../components/states/useOfflineStatus', () => ({
  useOfflineStatus: jest.fn(() => false),
}));

const mockPhoto = submitPhotoProof as jest.Mock;
const mockText = submitTextProof as jest.Mock;
const mockEnqueueProof = enqueueProofSubmission as jest.Mock;
const mockOffline = useOfflineStatus as jest.Mock;

const RESULT: ProofSubmissionResponse = {
  completionId: 'c-1',
  missionTitle: 'Street Type Safari',
  xpAwarded: 40,
  totalXp: 680,
  currentStreak: 13,
  longestStreak: 13,
  proofUrl: null,
};

async function renderScreen(overrides: Partial<React.ComponentProps<typeof ProofSubmissionScreenV2>> = {}) {
  const props = {
    missionId: 'm-1',
    missionTitle: 'Street Type Safari',
    onRequestAddPhoto: jest.fn(() => Promise.resolve('file:///photo-a.jpg')),
    onBack: jest.fn(),
    onSubmitted: jest.fn(),
    ...overrides,
  };
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const result = await render(
    <QueryClientProvider client={queryClient}>
      <ProofSubmissionScreenV2 {...props} />
    </QueryClientProvider>,
  );
  return { ...props, ...result };
}

describe('ProofSubmissionScreenV2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPhoto.mockResolvedValue(RESULT);
    mockText.mockResolvedValue(RESULT);
    mockEnqueueProof.mockResolvedValue({ id: 'q-1' });
    mockOffline.mockReturnValue(false);
  });

  afterEach(() => cleanup());

  describe('rendering', () => {
    it('renders the header, mode segments and the add-photo tile by default', async () => {
      await renderScreen();
      expect(screen.getByRole('header', { name: 'Submit proof' })).toBeTruthy();
      expect(screen.getByLabelText('Photo proof')).toBeTruthy();
      expect(screen.getByLabelText('Text proof')).toBeTruthy();
      expect(screen.getByLabelText('Add a photo, opens camera or library')).toBeTruthy();
    });

    it('disables submit until proof is added (empty state)', async () => {
      await renderScreen();
      expect(screen.getByLabelText('Add a photo to submit').props.accessibilityState.disabled).toBe(true);
    });

    it('switches to the text editor when the Text tab is selected', async () => {
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Text proof'));
      expect(screen.getByLabelText('Proof description')).toBeTruthy();
      expect(screen.getByLabelText('Text proof').props.accessibilityState.selected).toBe(true);
    });
  });

  describe('interactions', () => {
    it('adds a photo via the injected picker and enables submit', async () => {
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Add a photo, opens camera or library'));
      await waitFor(() => expect(screen.getByLabelText('Remove photo 1')).toBeTruthy());
      expect(screen.getByLabelText('Submit proof').props.accessibilityState.disabled).toBe(false);
    });

    it('caps staging at one photo and never silently drops a submitted photo (regression: the grid used to allow 3 but only ever submit the first)', async () => {
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Add a photo, opens camera or library'));
      await waitFor(() => expect(screen.getByLabelText('Remove photo 1')).toBeTruthy());
      // Once a photo is staged, the add-tile disappears — there is no way to
      // stage a second photo that could then be silently discarded on submit.
      expect(screen.queryByLabelText('Add a photo, opens camera or library')).toBeNull();
      expect(screen.queryByLabelText('Remove photo 2')).toBeNull();
    });

    it('removes a staged photo', async () => {
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Add a photo, opens camera or library'));
      await waitFor(() => expect(screen.getByLabelText('Remove photo 1')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Remove photo 1'));
      await waitFor(() => expect(screen.queryByLabelText('Remove photo 1')).toBeNull());
    });

    it('submits a photo proof, fires success haptic and calls onSubmitted', async () => {
      const { onSubmitted } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Add a photo, opens camera or library'));
      await waitFor(() => expect(screen.getByLabelText('Submit proof')).toBeTruthy());
      const cta = screen.getByLabelText('Submit proof');
      await fireEvent(cta, 'pressIn');
      await fireEvent(cta, 'pressOut');
      await fireEvent.press(cta);
      await waitFor(() => expect(mockPhoto).toHaveBeenCalledWith('m-1', 'file:///photo-a.jpg'));
      await waitFor(() => expect(onSubmitted).toHaveBeenCalledWith(RESULT));
      expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
    });

    it('submits a text proof with the trimmed caption', async () => {
      const { onSubmitted } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Text proof'));
      await fireEvent.changeText(screen.getByLabelText('Proof description'), '  I did the thing  ');
      await waitFor(() => expect(screen.getByLabelText('Submit proof')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Submit proof'));
      await waitFor(() => expect(mockText).toHaveBeenCalledWith('m-1', 'I did the thing'));
      await waitFor(() => expect(onSubmitted).toHaveBeenCalledWith(RESULT));
    });

    it('shows an error message when submission fails', async () => {
      mockPhoto.mockRejectedValueOnce(new Error('offline'));
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Add a photo, opens camera or library'));
      await waitFor(() => expect(screen.getByLabelText('Submit proof')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Submit proof'));
      await waitFor(() => expect(screen.getByText(/Couldn't submit your proof/)).toBeTruthy());
    });

    it('queues the proof (URI, not a Blob) instead of submitting when offline', async () => {
      mockOffline.mockReturnValue(true);
      const onQueuedOffline = jest.fn();
      await renderScreen({ onQueuedOffline });
      await fireEvent.press(screen.getByLabelText('Add a photo, opens camera or library'));
      await waitFor(() => expect(screen.getByLabelText('Submit proof')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Submit proof'));

      await waitFor(() =>
        expect(mockEnqueueProof).toHaveBeenCalledWith('photo', 'm-1', 'file:///photo-a.jpg'),
      );
      expect(mockPhoto).not.toHaveBeenCalled();
      expect(onQueuedOffline).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/saved and will submit automatically/)).toBeTruthy();
    });

    it('queues a text proof when offline', async () => {
      mockOffline.mockReturnValue(true);
      await renderScreen();
      await fireEvent.press(screen.getByLabelText('Text proof'));
      await fireEvent.changeText(screen.getByLabelText('Proof description'), '  did it  ');
      await fireEvent.press(screen.getByLabelText('Submit proof'));
      await waitFor(() => expect(mockEnqueueProof).toHaveBeenCalledWith('text', 'm-1', 'did it'));
      expect(mockText).not.toHaveBeenCalled();
    });

    it('calls onBack from the top bar', async () => {
      const { onBack } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Back to active quest'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('gives every interactive element a role and a label', async () => {
      await renderScreen();
      screen.getAllByRole('button').forEach((btn) => {
        expect(btn.props.accessibilityLabel).toBeTruthy();
      });
    });
  });

  describe('pure helpers', () => {
    it('canSubmit reflects photo/text readiness', () => {
      expect(canSubmit('photo', [], '')).toBe(false);
      expect(canSubmit('photo', ['a'], '')).toBe(true);
      expect(canSubmit('text', [], '  ')).toBe(false);
      expect(canSubmit('text', [], 'hi')).toBe(true);
    });

    it('submitLabel adapts to what is still needed', () => {
      expect(submitLabel('photo', [], '')).toBe('Add a photo to submit');
      expect(submitLabel('photo', ['a'], '')).toBe('Submit proof');
      expect(submitLabel('text', [], '')).toBe('Write your proof to submit');
      expect(submitLabel('text', [], 'hi')).toBe('Submit proof');
    });
  });
});
