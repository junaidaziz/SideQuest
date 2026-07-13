import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import ModeSelectScreen, { cardStyle, type QuestMode } from './ModeSelectScreen';
import { Colors } from '../../constants/design';

/**
 * NOTE: `render` is async in this RTLRN version, so every call is awaited.
 * `fireEvent.press()` itself returns void (not a Promise) — `await` on it is
 * harmless but adds nothing; never wrap it in `expect(...).resolves`.
 *
 * ModeSelectScreen is purely presentational: it holds no state and reports the
 * tapped card's key through the `onSelectMode` prop, so the meaningful
 * assertions are "the right label renders" and "the right key comes back".
 */

const EXPECTED: readonly {
  label: string;
  name: string;
  hint: string;
  mode: QuestMode;
}[] = [
  {
    label: 'Solo Adventure: independent quests for one',
    name: 'Solo Adventure',
    hint: 'Independent quests',
    mode: 'solo',
  },
  {
    label: 'Couple Mode: quests designed for two',
    name: 'Couple Mode',
    hint: 'Designed for two',
    mode: 'couple',
  },
  {
    label: 'Friends Night: social group missions',
    name: 'Friends Night',
    hint: 'Social group missions',
    mode: 'friends',
  },
  {
    label: 'Family Weekend: fun for all ages',
    name: 'Family Weekend',
    hint: 'Fun for all ages',
    mode: 'family',
  },
  {
    label: 'Explore My City: discover your neighbourhood',
    name: 'Explore My City',
    hint: 'Know your neighbourhood',
    mode: 'city',
  },
  {
    label: 'Confidence Builder: step outside your comfort zone',
    name: 'Confidence Builder',
    hint: 'Push your comfort zone',
    mode: 'confidence',
  },
  {
    label: 'Travel Mode: quests for unfamiliar places',
    name: 'Travel Mode',
    hint: 'For unfamiliar places',
    mode: 'travel',
  },
  {
    label: 'Kids Mode: child-safe adventures',
    name: 'Kids Mode',
    hint: 'Child-safe adventures',
    mode: 'kids',
  },
];

describe('ModeSelectScreen', () => {
  describe('rendering', () => {
    it('renders the eyebrow, title and subtitle', async () => {
      await render(<ModeSelectScreen />);
      expect(screen.getByText('Choose a mode')).toBeTruthy();
      expect(screen.getByText('What kind of quest?')).toBeTruthy();
      expect(
        screen.getByText('Your pick filters the experience from the start'),
      ).toBeTruthy();
    });

    it('renders all eight mode names and hints', async () => {
      await render(<ModeSelectScreen />);
      EXPECTED.forEach(({ name, hint }) => {
        expect(screen.getByText(name)).toBeTruthy();
        expect(screen.getByText(hint)).toBeTruthy();
      });
    });

    it('renders exactly eight tappable mode cards', async () => {
      await render(<ModeSelectScreen />);
      expect(screen.getAllByRole('button')).toHaveLength(EXPECTED.length);
    });
  });

  describe('interactions', () => {
    it.each(EXPECTED)(
      'reports "$mode" when the "$name" card is tapped',
      async ({ label, mode }) => {
        const onSelectMode = jest.fn();
        await render(<ModeSelectScreen onSelectMode={onSelectMode} />);
        await fireEvent.press(screen.getByLabelText(label));
        expect(onSelectMode).toHaveBeenCalledTimes(1);
        expect(onSelectMode).toHaveBeenCalledWith(mode);
      },
    );

    it('does not throw when a card is tapped without an onSelectMode handler', async () => {
      await render(<ModeSelectScreen />);
      // fireEvent.press() returns void, not a Promise — assert synchronously.
      expect(() =>
        fireEvent.press(screen.getByLabelText(EXPECTED[0].label)),
      ).not.toThrow();
    });

    it('adds pressed-feedback styling only while a card is held down', () => {
      const idle = cardStyle(false, 160);
      const held = cardStyle(true, 160);
      // Property-based rather than positional: robust against cardStyle's
      // return array gaining or reordering entries later. The idle card
      // still has its own (non-pressed) borderColor, so assert on the
      // pressed-specific value rather than mere presence of the property.
      expect(idle).not.toContainEqual(
        expect.objectContaining({ borderColor: Colors.primary }),
      );
      expect(held).toContainEqual(
        expect.objectContaining({ borderColor: Colors.primary }),
      );
      expect(idle).toContainEqual({ width: 160 });
      expect(held).toContainEqual({ width: 160 });
    });
  });

  describe('accessibility', () => {
    it('exposes the screen title with a header role', async () => {
      await render(<ModeSelectScreen />);
      expect(screen.getByText('What kind of quest?').props.accessibilityRole).toBe(
        'header',
      );
    });

    it('gives every card a button role and a descriptive label', async () => {
      await render(<ModeSelectScreen />);
      const cards = screen.getAllByRole('button');
      cards.forEach((card) => {
        expect(card.props.accessibilityRole).toBe('button');
        expect(card.props.accessibilityLabel).toBeTruthy();
      });
    });

    it('labels each card with its full descriptive aria text', async () => {
      await render(<ModeSelectScreen />);
      EXPECTED.forEach(({ label }) => {
        expect(screen.getByLabelText(label)).toBeTruthy();
      });
    });

    it('groups the cards inside a list container with the list role', async () => {
      await render(<ModeSelectScreen />);
      // RNTL's getByRole doesn't index the "list" role in this version —
      // query by label and assert the role directly instead.
      const list = screen.getByLabelText('Quest modes');
      expect(list.props.accessibilityRole).toBe('list');
    });

    it('exposes each card’s position within the set of eight', async () => {
      await render(<ModeSelectScreen />);
      const first = screen.getByLabelText(EXPECTED[0].label);
      const last = screen.getByLabelText(EXPECTED[EXPECTED.length - 1].label);
      expect(first.props.accessibilityValue).toEqual({ text: '1 of 8' });
      expect(last.props.accessibilityValue).toEqual({ text: '8 of 8' });
    });
  });
});
