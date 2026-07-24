import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { AchievementUnlockCelebration } from './AchievementUnlockCelebration';

const mockedReducedMotion = useReducedMotion as unknown as jest.Mock;

describe('AchievementUnlockCelebration', () => {
  beforeEach(() => {
    mockedReducedMotion.mockReturnValue(false);
  });

  describe('rendering', () => {
    // Usage example: unlocking a Rare achievement with a 50 XP bonus.
    it('shows the name, rarity pill and XP-bonus pill', async () => {
      const { getByText, getByTestId } = await render(
        <AchievementUnlockCelebration
          tier={3}
          label="Trailblazer"
          xpBonus={50}
          onContinue={jest.fn()}
          testID="ach"
        />,
      );
      expect(getByText('Trailblazer')).toBeTruthy();
      // Pill Views are single accessibility elements, so their child Text is
      // collapsed out of the default query tree — query with hidden included.
      expect(getByText('◆◆◆ Rare', { includeHiddenElements: true })).toBeTruthy();
      expect(getByText('+50 XP', { includeHiddenElements: true })).toBeTruthy();
      expect(getByTestId('ach-xp', { includeHiddenElements: true })).toBeTruthy();
    });

    // Usage example: a Common achievement with no XP bonus.
    it('omits the XP pill when no bonus is provided', async () => {
      const { queryByTestId, getByText } = await render(
        <AchievementUnlockCelebration tier={1} label="First Steps" onContinue={jest.fn()} testID="ach" />,
      );
      expect(getByText('First Steps')).toBeTruthy();
      expect(queryByTestId('ach-xp')).toBeNull();
    });
  });

  describe('reduced motion', () => {
    it('still renders all content when reduced motion is on', async () => {
      mockedReducedMotion.mockReturnValue(true);
      const { getByText } = await render(
        <AchievementUnlockCelebration tier={5} label="Legend" xpBonus={200} onContinue={jest.fn()} />,
      );
      expect(getByText('Legend')).toBeTruthy();
      expect(getByText('◆◆◆◆◆ Legendary', { includeHiddenElements: true })).toBeTruthy();
      expect(getByText('+200 XP', { includeHiddenElements: true })).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('fires onContinue when the CTA is pressed', async () => {
      const onContinue = jest.fn();
      const { getByTestId } = await render(
        <AchievementUnlockCelebration tier={2} label="Explorer" onContinue={onContinue} testID="ach" />,
      );
      fireEvent.press(getByTestId('ach-cta'));
      expect(onContinue).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('labels the rarity pill with the tier and rank, never colour alone', async () => {
      const { getByLabelText } = await render(
        <AchievementUnlockCelebration tier={4} label="Epic Deed" xpBonus={100} onContinue={jest.fn()} testID="ach" />,
      );
      // Both pills must be accessible elements so the merged label is announced
      // as one unit, not read as individual child glyphs by VoiceOver/TalkBack.
      const rarity = getByLabelText('Epic, tier 4 of 5');
      const xp = getByLabelText('Plus 100 XP bonus');
      expect(rarity.props.accessible).toBe(true);
      expect(xp.props.accessible).toBe(true);
    });
  });
});
