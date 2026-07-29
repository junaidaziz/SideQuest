import { Share } from 'react-native';
import { shareCardImage } from './shareCard';

// react-native-view-shot / expo-sharing are native modules not yet installed in
// this project (they need an EAS rebuild — see the package.json TODO). Virtual
// mocks let the image path be exercised without the packages present, and mean
// the source's lazy `require()` of them resolves; the fallback path is covered by
// making the mocked calls reject or report unavailable. `jest.requireMock` (not a
// static import) is used to reach the mocks so this file also typechecks before
// the packages are installed.
jest.mock('react-native-view-shot', () => ({ captureRef: jest.fn() }), { virtual: true });
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }), {
  virtual: true,
});

const { captureRef: mockCapture } = jest.requireMock('react-native-view-shot') as {
  captureRef: jest.Mock;
};
const { isAvailableAsync: mockIsAvailable, shareAsync: mockShareAsync } = jest.requireMock(
  'expo-sharing',
) as { isAvailableAsync: jest.Mock; shareAsync: jest.Mock };

describe('shareCardImage', () => {
  const ref = { current: null };

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAvailable.mockResolvedValue(true);
    mockCapture.mockResolvedValue('file:///tmp/card.png');
    mockShareAsync.mockResolvedValue(undefined);
  });

  it('captures the view and shares the image with the message as dialog title', async () => {
    const shareSpy = jest.spyOn(Share, 'share');
    await shareCardImage(ref, 'I did it! 40 XP');

    expect(mockCapture).toHaveBeenCalledWith(ref, { format: 'png', quality: 0.95 });
    expect(mockShareAsync).toHaveBeenCalledWith(
      'file:///tmp/card.png',
      expect.objectContaining({ mimeType: 'image/png', dialogTitle: 'I did it! 40 XP' }),
    );
    expect(shareSpy).not.toHaveBeenCalled();
  });

  it('falls back to a text share when image sharing is unavailable', async () => {
    mockIsAvailable.mockResolvedValue(false);
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);

    await shareCardImage(ref, 'caption');

    expect(mockShareAsync).not.toHaveBeenCalled();
    expect(shareSpy).toHaveBeenCalledWith({ message: 'caption' });
  });

  it('falls back to a text share when capture fails', async () => {
    mockCapture.mockRejectedValue(new Error('no view'));
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);

    await shareCardImage(ref, 'caption');

    expect(shareSpy).toHaveBeenCalledWith({ message: 'caption' });
  });

  it('swallows a failing text fallback so the caller never rejects', async () => {
    mockIsAvailable.mockResolvedValue(false);
    jest.spyOn(Share, 'share').mockRejectedValue(new Error('no targets'));

    await expect(shareCardImage(ref, 'caption')).resolves.toBeUndefined();
  });
});
