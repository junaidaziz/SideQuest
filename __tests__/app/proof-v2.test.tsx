import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import ProofSubmissionRoute, { requestProofPhoto } from '../../app/proof/[missionId]';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: jest.fn(),
  Redirect: jest.fn(({ href }: { href: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return <Text>{`redirect:${href}`}</Text>;
  }),
}));
jest.mock('expo-image-picker');

jest.mock('../../src/screens/ProofSubmissionScreenV2', () =>
  jest.fn((props: { onRequestAddPhoto: () => Promise<string | null>; onSubmitted: (r: unknown) => void; onBack: () => void }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, Text } = require('react-native');
    return (
      <>
        <Pressable accessibilityRole="button" accessibilityLabel="back" onPress={props.onBack}><Text>back</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="submit" onPress={() => props.onSubmitted({ completionId: 'c1' })}><Text>submit</Text></Pressable>
      </>
    );
  }),
);

const picker = ImagePicker as jest.Mocked<typeof ImagePicker>;

describe('ProofSubmissionRoute (V2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to Explore when missionId is missing', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ missionId: undefined });
    const { findByText } = await render(<ProofSubmissionRoute />);
    expect(await findByText('redirect:/explore')).toBeTruthy();
  });

  it('goes back from the back control', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ missionId: 'm-1', missionTitle: 'T', proofRequirement: 'p' });
    const { getByLabelText } = await render(<ProofSubmissionRoute />);
    await fireEvent.press(getByLabelText('back'));
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('replaces to /completion with the serialized result on submit', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ missionId: 'm-1', missionTitle: 'T', proofRequirement: 'p' });
    const { getByLabelText } = await render(<ProofSubmissionRoute />);
    await fireEvent.press(getByLabelText('submit'));
    expect(router.replace).toHaveBeenCalledWith({
      pathname: '/completion',
      params: { result: JSON.stringify({ completionId: 'c1' }) },
    });
  });
});

describe('requestProofPhoto', () => {
  beforeEach(() => jest.clearAllMocks());

  function pressAlertButton(index: number) {
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    buttons[index].onPress?.();
  }

  it('resolves the camera photo uri when permission granted and not cancelled', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    picker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true } as never);
    picker.launchCameraAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'file://p.jpg' }] } as never);
    const promise = requestProofPhoto();
    pressAlertButton(0);
    await expect(promise).resolves.toBe('file://p.jpg');
  });

  it('resolves null when camera permission denied', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    picker.requestCameraPermissionsAsync.mockResolvedValue({ granted: false } as never);
    const promise = requestProofPhoto();
    pressAlertButton(0);
    await expect(promise).resolves.toBeNull();
  });

  it('resolves the library photo uri when chosen', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    picker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true } as never);
    picker.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'file://lib.jpg' }] } as never);
    const promise = requestProofPhoto();
    pressAlertButton(1);
    await expect(promise).resolves.toBe('file://lib.jpg');
  });

  it('resolves null when the library pick is cancelled', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    picker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true } as never);
    picker.launchImageLibraryAsync.mockResolvedValue({ canceled: true } as never);
    const promise = requestProofPhoto();
    pressAlertButton(1);
    await expect(promise).resolves.toBeNull();
  });

  it('resolves null when the user taps Cancel', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const promise = requestProofPhoto();
    pressAlertButton(2);
    await expect(promise).resolves.toBeNull();
  });

  it('resolves null (rather than hanging forever) when the camera throws', async () => {
    // Regression test: launchCameraAsync throws — rather than resolving a
    // canceled result — when no camera is available (every iOS Simulator).
    // Before the fix, that rejection was uncaught and resolve() was never
    // called, so this promise hung forever instead of resolving null.
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    picker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true } as never);
    picker.launchCameraAsync.mockRejectedValue(new Error('Camera not available on simulator'));
    const promise = requestProofPhoto();
    pressAlertButton(0);
    await expect(promise).resolves.toBeNull();
  });

  it('resolves null (rather than hanging forever) when the library picker throws', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    picker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true } as never);
    picker.launchImageLibraryAsync.mockRejectedValue(new Error('boom'));
    const promise = requestProofPhoto();
    pressAlertButton(1);
    await expect(promise).resolves.toBeNull();
  });
});
