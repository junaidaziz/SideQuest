import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { OfflineBanner } from './OfflineBanner';

describe('OfflineBanner', () => {
  it('renders nothing when not visible', async () => {
    const { queryByText } = await render(<OfflineBanner visible={false} />);
    expect(queryByText("You're offline")).toBeNull();
  });

  it('renders default copy as a polite alert when visible', async () => {
    const { getByText, getByTestId } = await render(
      <OfflineBanner visible testID="offline-banner" />,
    );
    expect(getByText("You're offline")).toBeTruthy();
    expect(getByText('Some features are unavailable until you reconnect.')).toBeTruthy();
    const banner = getByTestId('offline-banner');
    expect(banner.props.accessibilityRole).toBe('alert');
    expect(banner.props.accessibilityLiveRegion).toBe('polite');
  });

  it('renders custom title and description', async () => {
    const { getByText } = await render(
      <OfflineBanner visible title="No connection" description="Reconnect to sync." />,
    );
    expect(getByText('No connection')).toBeTruthy();
    expect(getByText('Reconnect to sync.')).toBeTruthy();
  });

  it('renders and fires a retry button when onRetry is provided', async () => {
    const onRetry = jest.fn();
    const { getByLabelText } = await render(
      <OfflineBanner visible onRetry={onRetry} retryLabel="Retry connection" />,
    );
    fireEvent.press(getByLabelText('Retry connection'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('omits the retry button when no handler is given', async () => {
    const { queryByRole } = await render(<OfflineBanner visible />);
    expect(queryByRole('button')).toBeNull();
  });

  it('transitions from visible to hidden without error', async () => {
    const { rerender, queryByText } = await render(<OfflineBanner visible />);
    await rerender(<OfflineBanner visible={false} />);
    expect(queryByText("You're offline")).toBeNull();
  });
});
