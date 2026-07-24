import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { LevelUpCelebration } from './LevelUpCelebration';

const mockedReducedMotion = useReducedMotion as unknown as jest.Mock;

describe('LevelUpCelebration', () => {
  beforeEach(() => {
    mockedReducedMotion.mockReturnValue(false);
  });

  describe('rendering', () => {
    // Usage example: a level-up with a perk unlock.
    it('shows the level number, title and perk', async () => {
      const { getByText } = await render(
        <LevelUpCelebration level={7} perk="Streak freeze unlocked" onContinue={jest.fn()} />,
      );
      expect(getByText('7')).toBeTruthy();
      expect(getByText('Level 7')).toBeTruthy();
      expect(getByText('Streak freeze unlocked')).toBeTruthy();
    });

    it('omits the perk line when none is given', async () => {
      const { queryByText } = await render(<LevelUpCelebration level={3} onContinue={jest.fn()} />);
      expect(queryByText('Level 3')).toBeTruthy();
      expect(queryByText('Streak freeze unlocked')).toBeNull();
    });

    it('renders ambient rays when motion is allowed', async () => {
      const { getByTestId } = await render(
        <LevelUpCelebration level={2} onContinue={jest.fn()} testID="lvl" />,
      );
      expect(getByTestId('lvl-rays', { includeHiddenElements: true })).toBeTruthy();
    });
  });

  describe('reduced motion', () => {
    // Usage example: same celebration, respecting the OS "reduce motion" setting.
    it('drops the rays for a dissolve when reduced motion is on', async () => {
      mockedReducedMotion.mockReturnValue(true);
      const { queryByTestId } = await render(
        <LevelUpCelebration level={2} onContinue={jest.fn()} testID="lvl" />,
      );
      expect(queryByTestId('lvl-rays', { includeHiddenElements: true })).toBeNull();
    });
  });

  describe('interactions', () => {
    it('fires onContinue when the primary CTA is pressed', async () => {
      const onContinue = jest.fn();
      const { getByTestId } = await render(
        <LevelUpCelebration level={5} onContinue={onContinue} continueLabel="Keep going" testID="lvl" />,
      );
      fireEvent.press(getByTestId('lvl-cta'));
      expect(onContinue).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('exposes the reached level and a labelled CTA', async () => {
      const { getByLabelText } = await render(
        <LevelUpCelebration level={9} onContinue={jest.fn()} continueLabel="Continue" />,
      );
      expect(getByLabelText('Level 9 reached')).toBeTruthy();
      expect(getByLabelText('Continue')).toBeTruthy();
    });
  });
});
