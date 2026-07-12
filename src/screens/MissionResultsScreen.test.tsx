import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import MissionResultsScreen, { whenPressed } from './MissionResultsScreen';

/**
 * NOTE: @testing-library/react-native v14 (React 19 concurrent renderer) makes
 * `render` and `fireEvent` async — every call is awaited. The detail sheet lives
 * inside a <Modal>, whose children only mount while `visible` is true, so the
 * sheet-content queries below are genuine assertions that the sheet opened.
 */

const FIRST_CARD = /View quest: Find the Oldest Thing/;
const SECOND_SET_CARD = /View quest: Window Worlds/;

async function openFirstSheet(): Promise<void> {
  // Await the press so the `activeMission` state commits before we query the
  // Modal's children (RTL v14 fireEvent is async).
  await fireEvent.press(screen.getByLabelText(FIRST_CARD));
}

describe('MissionResultsScreen', () => {
  describe('rendering', () => {
    it('renders the header title, back and shuffle controls', async () => {
      await render(<MissionResultsScreen />);
      expect(screen.getByText('Your Quests')).toBeTruthy();
      expect(screen.getByLabelText('Back to filters')).toBeTruthy();
      expect(screen.getByLabelText('Shuffle quests')).toBeTruthy();
    });

    it('renders the default active filter chips', async () => {
      await render(<MissionResultsScreen />);
      expect(screen.getByText('🧍 Solo')).toBeTruthy();
      expect(screen.getByText('🌿 Outdoors')).toBeTruthy();
      expect(screen.getByText('🆓 Free')).toBeTruthy();
      // "⏱ 30 min" also appears as a card meta time, so assert the chip exists
      // among (not uniquely against) the matches.
      expect(screen.getAllByText('⏱ 30 min').length).toBeGreaterThanOrEqual(1);
    });

    it('renders custom filters when the filters prop is supplied', async () => {
      await render(<MissionResultsScreen filters={['👥 Friends', '💸 No limit']} />);
      expect(screen.getByText('👥 Friends')).toBeTruthy();
      expect(screen.getByText('💸 No limit')).toBeTruthy();
      expect(screen.queryByText('🧍 Solo')).toBeNull();
    });

    it('renders all three cards of the first set with the results count', async () => {
      await render(<MissionResultsScreen />);
      expect(screen.getByLabelText(FIRST_CARD)).toBeTruthy();
      expect(screen.getByLabelText(/View quest: The Balancing Act/)).toBeTruthy();
      expect(screen.getByLabelText(/View quest: Neighborhood Newbie/)).toBeTruthy();
      expect(screen.getByText('3 quests')).toBeTruthy();
    });

    it('does not render the detail sheet before a card is tapped', async () => {
      await render(<MissionResultsScreen />);
      expect(screen.queryByLabelText('Accept quest')).toBeNull();
      expect(screen.queryByLabelText('Save for later')).toBeNull();
    });
  });

  describe('interactions', () => {
    it('calls onBack when the back button is pressed', async () => {
      const onBack = jest.fn();
      await render(<MissionResultsScreen onBack={onBack} />);
      await fireEvent.press(screen.getByLabelText('Back to filters'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('shows the loading skeleton then a new set when shuffled', async () => {
      await render(<MissionResultsScreen />);
      await fireEvent.press(screen.getByLabelText('Shuffle quests'));
      expect(screen.getByLabelText('Loading new quests')).toBeTruthy();
      await waitFor(() => expect(screen.getByLabelText(SECOND_SET_CARD)).toBeTruthy(), {
        timeout: 2000,
        interval: 100,
      });
      expect(screen.queryByLabelText(FIRST_CARD)).toBeNull();
    });

    it('marks the shuffle button busy and disabled while shuffling', async () => {
      await render(<MissionResultsScreen />);
      await fireEvent.press(screen.getByLabelText('Shuffle quests'));
      const shuffle = screen.getByLabelText('Shuffle quests');
      expect(shuffle.props.accessibilityState.disabled).toBe(true);
      expect(shuffle.props.accessibilityState.busy).toBe(true);
    });

    it('opens the detail sheet with the full brief and proof when a card is tapped', async () => {
      await render(<MissionResultsScreen />);
      await openFirstSheet();
      expect(screen.getByText(/What's the oldest thing you can see/)).toBeTruthy();
      expect(screen.getByText('PROOF REQUIRED')).toBeTruthy();
      expect(screen.getByLabelText('Accept quest')).toBeTruthy();
      expect(screen.getByLabelText('Save for later')).toBeTruthy();
    });

    it('toggles the save button between saved and unsaved', async () => {
      await render(<MissionResultsScreen />);
      await openFirstSheet();
      const save = screen.getByLabelText('Save for later');
      expect(save.props.accessibilityState.selected).toBe(false);
      await fireEvent.press(save);
      const saved = screen.getByLabelText('Saved for later');
      expect(saved.props.accessibilityState.selected).toBe(true);
    });

    it('accepts the quest and calls onAccept with the mission id after confirmation', async () => {
      const onAccept = jest.fn();
      await render(<MissionResultsScreen onAccept={onAccept} />);
      await openFirstSheet();
      await fireEvent.press(screen.getByLabelText('Accept quest'));

      const accepted = screen.getByLabelText('Quest accepted');
      expect(accepted.props.accessibilityState.disabled).toBe(true);
      expect(onAccept).not.toHaveBeenCalled();

      await waitFor(() => expect(onAccept).toHaveBeenCalledWith(1), {
        timeout: 2000,
        interval: 100,
      });
    });

    it('ignores repeated presses on an already-accepted quest', async () => {
      const onAccept = jest.fn();
      await render(<MissionResultsScreen onAccept={onAccept} />);
      await openFirstSheet();
      await fireEvent.press(screen.getByLabelText('Accept quest'));
      await fireEvent.press(screen.getByLabelText('Quest accepted'));
      await waitFor(() => expect(onAccept).toHaveBeenCalledTimes(1), {
        timeout: 2000,
        interval: 100,
      });
    });

    it('closes the sheet when the backdrop is dismissed', async () => {
      await render(<MissionResultsScreen />);
      await openFirstSheet();
      expect(screen.getByLabelText('Accept quest')).toBeTruthy();
      // The backdrop sits outside the sheet's `accessibilityViewIsModal` subtree
      // (correctly hidden from screen readers), so it is reached via testID here.
      await fireEvent.press(
        screen.getByTestId('sheet-backdrop', { includeHiddenElements: true }),
      );
      await waitFor(() => expect(screen.queryByLabelText('Accept quest')).toBeNull(), {
        timeout: 2000,
        interval: 100,
      });
    });

    it('closes the sheet when the close button is pressed', async () => {
      await render(<MissionResultsScreen />);
      await openFirstSheet();
      await fireEvent.press(screen.getByLabelText('Close mission detail'));
      await waitFor(() => expect(screen.queryByLabelText('Accept quest')).toBeNull(), {
        timeout: 2000,
        interval: 100,
      });
    });

    it('does nothing when shuffle is pressed again while already shuffling', async () => {
      await render(<MissionResultsScreen />);
      await fireEvent.press(screen.getByLabelText('Shuffle quests'));
      // Second press re-enters handleShuffle while `isShuffling` is true and is
      // ignored by the guard; the set still advances exactly once.
      await fireEvent.press(screen.getByLabelText('Shuffle quests'));
      await waitFor(() => expect(screen.getByLabelText(SECOND_SET_CARD)).toBeTruthy(), {
        timeout: 2000,
        interval: 100,
      });
      expect(screen.queryByLabelText(/View quest: Sky Framing/)).toBeNull();
    });
  });

  describe('whenPressed style helper', () => {
    it('returns the style while pressed', () => {
      const style = { opacity: 0.5 };
      expect(whenPressed(true, style)).toBe(style);
    });

    it('returns null while not pressed', () => {
      expect(whenPressed(false, { opacity: 0.5 })).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('gives every interactive element a button role and a label', async () => {
      await render(<MissionResultsScreen />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((btn) => {
        expect(btn.props.accessibilityLabel).toBeTruthy();
      });
    });

    it('exposes the screen title as a header', async () => {
      await render(<MissionResultsScreen />);
      expect(screen.getByText('Your Quests').props.accessibilityRole).toBe('header');
    });

    it('announces the results count as a polite live region', async () => {
      await render(<MissionResultsScreen />);
      const count = screen.getByLabelText('3 quests matched your filters');
      expect(count.props.accessibilityLiveRegion).toBe('polite');
    });
  });

  describe('edge cases', () => {
    it('does not throw when accepting without an onAccept handler', async () => {
      await render(<MissionResultsScreen />);
      await openFirstSheet();
      await fireEvent.press(screen.getByLabelText('Accept quest'));
      expect(screen.getByLabelText('Quest accepted')).toBeTruthy();
    });

    it('cycles back to the first set after three shuffles', async () => {
      await render(<MissionResultsScreen />);
      await fireEvent.press(screen.getByLabelText('Shuffle quests'));
      await waitFor(() => expect(screen.getByLabelText(SECOND_SET_CARD)).toBeTruthy(), {
        timeout: 2000,
        interval: 100,
      });
      await fireEvent.press(screen.getByLabelText('Shuffle quests'));
      await waitFor(() => expect(screen.getByLabelText(/View quest: Sky Framing/)).toBeTruthy(), {
        timeout: 2000,
        interval: 100,
      });
      await fireEvent.press(screen.getByLabelText('Shuffle quests'));
      await waitFor(() => expect(screen.getByLabelText(FIRST_CARD)).toBeTruthy(), {
        timeout: 2000,
        interval: 100,
      });
    });
  });
});
