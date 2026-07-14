import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { CompassToggle } from './CompassToggle';

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
}));

const mockSelection = Haptics.selectionAsync as jest.Mock;

describe('CompassToggle', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('rendering', () => {
    it('exposes a switch role with the checked state and label', async () => {
      const { getByRole } = await render(
        <CompassToggle
          value
          onValueChange={jest.fn()}
          accessibilityLabel="Haptics"
        />,
      );
      const sw = getByRole('switch');
      expect(sw.props.accessibilityLabel).toBe('Haptics');
      expect(sw.props.accessibilityState).toMatchObject({ checked: true });
    });

    it('reflects the unchecked state', async () => {
      const { getByRole } = await render(
        <CompassToggle value={false} onValueChange={jest.fn()} accessibilityLabel="Sound" />,
      );
      expect(getByRole('switch').props.accessibilityState).toMatchObject({
        checked: false,
      });
    });
  });

  describe('interactions', () => {
    it('calls onValueChange with the negated value when pressed', async () => {
      const onChange = jest.fn();
      const { getByRole } = await render(
        <CompassToggle value={false} onValueChange={onChange} accessibilityLabel="Sound" />,
      );
      fireEvent.press(getByRole('switch'));
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('fires a selection haptic by default', async () => {
      const { getByRole } = await render(
        <CompassToggle value onValueChange={jest.fn()} accessibilityLabel="Sound" />,
      );
      fireEvent.press(getByRole('switch'));
      expect(mockSelection).toHaveBeenCalledTimes(1);
    });

    it('suppresses the haptic when hapticsEnabled is false', async () => {
      const { getByRole } = await render(
        <CompassToggle
          value
          onValueChange={jest.fn()}
          accessibilityLabel="Sound"
          hapticsEnabled={false}
        />,
      );
      fireEvent.press(getByRole('switch'));
      expect(mockSelection).not.toHaveBeenCalled();
    });

    it('does not call onValueChange while disabled', async () => {
      const onChange = jest.fn();
      const { getByRole } = await render(
        <CompassToggle
          value={false}
          onValueChange={onChange}
          accessibilityLabel="Sound"
          disabled
        />,
      );
      fireEvent.press(getByRole('switch'));
      expect(onChange).not.toHaveBeenCalled();
      expect(getByRole('switch').props.accessibilityState).toMatchObject({
        disabled: true,
      });
    });
  });
});
