import React from 'react';
import { render } from '@testing-library/react-native';
import { TierBadge } from './TierBadge';
import { TIER_META, type AchievementTier } from './tiers';

// The badge is one accessibility element (role="image") that announces the tier
// once; its inner name/pip Text is therefore collapsed out of the accessibility
// tree by design, so visual-content assertions use includeHiddenElements.
const hidden = { includeHiddenElements: true } as const;
const allTiers: AchievementTier[] = [1, 2, 3, 4, 5];

describe('TierBadge', () => {
  describe('rendering', () => {
    it('renders each tier with its name and pip count', async () => {
      for (const tier of allTiers) {
        const { getByText } = await render(<TierBadge tier={tier} />);
        expect(getByText(TIER_META[tier].name, hidden)).toBeTruthy();
        expect(getByText(TIER_META[tier].pips, hidden)).toBeTruthy();
      }
    });

    it('renders a solid medallion for a low tier', async () => {
      const { getByTestId } = await render(<TierBadge tier={2} testID="b" />);
      expect(getByTestId('b-solid', hidden)).toBeTruthy();
    });

    it('renders a gradient medallion for a high tier', async () => {
      const { getByTestId } = await render(<TierBadge tier={5} testID="b" />);
      expect(getByTestId('b-gradient', hidden)).toBeTruthy();
    });

    it('hides the tier label row when showTierLabel is false', async () => {
      const { queryByText } = await render(<TierBadge tier={3} showTierLabel={false} />);
      expect(queryByText('Rare', hidden)).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('announces the tier and its rank, never colour alone', async () => {
      const { getByLabelText } = await render(<TierBadge tier={3} testID="b" />);
      expect(getByLabelText('Rare, tier 3 of 5')).toBeTruthy();
    });

    it('weaves the achievement name into the label when provided', async () => {
      const { getByLabelText } = await render(<TierBadge tier={4} label="Trailblazer" />);
      expect(getByLabelText('Trailblazer achievement, Epic, tier 4 of 5')).toBeTruthy();
    });

    it('hides the decorative pip glyphs from assistive tech', async () => {
      const { getByText } = await render(<TierBadge tier={5} />);
      const pips = getByText(TIER_META[5].pips, hidden);
      expect(pips.props.accessibilityElementsHidden).toBe(true);
    });
  });
});
