import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import { ErrorState } from './ErrorState';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve()),
}));

const mockSetString = Clipboard.setStringAsync as jest.Mock;

describe('ErrorState', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('rendering', () => {
    it('renders default reassuring copy as an alert', async () => {
      const { getByText, getByRole } = await render(<ErrorState onRetry={jest.fn()} />);
      expect(getByText("This trail's washed out")).toBeTruthy();
      expect(getByRole('alert')).toBeTruthy();
    });

    it('renders custom title and description', async () => {
      const { getByText } = await render(
        <ErrorState title="Custom" description="Custom body" />,
      );
      expect(getByText('Custom')).toBeTruthy();
      expect(getByText('Custom body')).toBeTruthy();
    });

    it('hides the details disclosure when no reference is given', async () => {
      const { queryByLabelText } = await render(<ErrorState onRetry={jest.fn()} />);
      expect(queryByLabelText('Show error details')).toBeNull();
    });
  });

  describe('interactions', () => {
    it('fires retry', async () => {
      const onRetry = jest.fn();
      const { getByLabelText } = await render(
        <ErrorState onRetry={onRetry} retryLabel="Try again" />,
      );
      fireEvent.press(getByLabelText('Try again'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('fires the secondary action', async () => {
      const onSecondary = jest.fn();
      const { getByLabelText } = await render(
        <ErrorState onSecondary={onSecondary} secondaryLabel="Back to Today" />,
      );
      fireEvent.press(getByLabelText('Back to Today'));
      expect(onSecondary).toHaveBeenCalledTimes(1);
    });

    it('expands details and copies the reference to the clipboard', async () => {
      const { getByLabelText, findByText, queryByText } = await render(
        <ErrorState errorReference="REQ-8f3a" onRetry={jest.fn()} />,
      );
      expect(queryByText('REQ-8f3a')).toBeNull();
      const summary = getByLabelText('Show error details');
      fireEvent.press(summary);
      expect(await findByText('REQ-8f3a')).toBeTruthy();
      expect(
        getByLabelText('Show error details').props.accessibilityState,
      ).toMatchObject({ expanded: true });

      fireEvent.press(getByLabelText('Copy error reference'));
      expect(mockSetString).toHaveBeenCalledWith('REQ-8f3a');
      expect(await findByText('Copied')).toBeTruthy();
    });

    it('collapses details on a second press', async () => {
      const { getByLabelText, findByText, queryByText } = await render(
        <ErrorState errorReference="REQ-1" onRetry={jest.fn()} />,
      );
      const summary = getByLabelText('Show error details');
      fireEvent.press(summary);
      expect(await findByText('REQ-1')).toBeTruthy();
      fireEvent.press(summary);
      await waitFor(() => expect(queryByText('REQ-1')).toBeNull());
    });
  });
});
