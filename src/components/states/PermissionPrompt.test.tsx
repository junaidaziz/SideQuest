import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PermissionPrompt } from './PermissionPrompt';

const baseProps = {
  title: 'Add a photo to your proof',
  message: 'SideQuest needs camera access so you can capture proof.',
  onAllow: jest.fn(),
};

describe('PermissionPrompt', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('rendering', () => {
    it('renders the title and explanation when visible', async () => {
      const { getByText } = await render(<PermissionPrompt visible {...baseProps} />);
      expect(getByText('Add a photo to your proof')).toBeTruthy();
      expect(
        getByText('SideQuest needs camera access so you can capture proof.'),
      ).toBeTruthy();
    });

    it('renders the privacy note when provided', async () => {
      const { getByText } = await render(
        <PermissionPrompt
          visible
          {...baseProps}
          privacyNote="We only use the camera when you add proof."
        />,
      );
      expect(
        getByText('🔒 We only use the camera when you add proof.'),
      ).toBeTruthy();
    });

    it('does not render the fallback action without a handler', async () => {
      const { queryByText } = await render(
        <PermissionPrompt visible {...baseProps} fallbackLabel="Use text proof" />,
      );
      expect(queryByText('Use text proof')).toBeNull();
    });
  });

  describe('interactions', () => {
    it('fires onAllow', async () => {
      const onAllow = jest.fn();
      const { getByLabelText } = await render(
        <PermissionPrompt visible {...baseProps} onAllow={onAllow} allowLabel="Allow camera access" />,
      );
      fireEvent.press(getByLabelText('Allow camera access'));
      expect(onAllow).toHaveBeenCalledTimes(1);
    });

    it('fires the fallback action', async () => {
      const onFallback = jest.fn();
      const { getByLabelText } = await render(
        <PermissionPrompt
          visible
          {...baseProps}
          fallbackLabel="Use text proof instead"
          onFallback={onFallback}
        />,
      );
      fireEvent.press(getByLabelText('Use text proof instead'));
      expect(onFallback).toHaveBeenCalledTimes(1);
    });

    it('dismisses via the scrim', async () => {
      const onRequestClose = jest.fn();
      const { getByTestId } = await render(
        <PermissionPrompt visible {...baseProps} onRequestClose={onRequestClose} />,
      );
      fireEvent.press(getByTestId('permission-scrim', { includeHiddenElements: true }));
      expect(onRequestClose).toHaveBeenCalledTimes(1);
    });
  });
});
