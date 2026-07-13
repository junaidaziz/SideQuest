import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MissionResultsScreen, { buildFilterChips, whenPressed } from './MissionResultsScreen';
import { generateMissions, saveMission, unsaveMission } from '../../services/missionsApi';
import type { GenerateMissionsRequest, Mission } from '../../types/api';

jest.mock('../../services/missionsApi');

const mockGenerate = generateMissions as jest.Mock;
const mockSaveMission = saveMission as jest.Mock;
const mockUnsaveMission = unsaveMission as jest.Mock;

const FILTERS: GenerateMissionsRequest = {
  crew: 'Solo',
  time: '30 min',
  setting: 'Outdoors',
  budget: 'Free',
};

const MISSIONS: Mission[] = [
  {
    id: 'm-1',
    category: 'explore',
    title: 'Find the Oldest Thing',
    desc: 'Locate the oldest object visible from where you’re standing.',
    full: 'Full brief for mission one.',
    proof: 'Photograph it.',
    time: '20 min',
    xp: '+40 XP',
    diff: 'Easy',
    dots: 1,
  },
  {
    id: 'm-2',
    category: 'create',
    title: 'The Balancing Act',
    desc: 'Stack 5 natural objects into a tower.',
    full: 'Full brief for mission two.',
    proof: 'Photo of the tower.',
    time: '15 min',
    xp: '+35 XP',
    diff: 'Easy',
    dots: 1,
  },
  {
    id: 'm-3',
    category: 'discover',
    title: 'Neighborhood Newbie',
    desc: 'Walk one block you have never gone before.',
    full: 'Full brief for mission three.',
    proof: 'Photograph your discovery.',
    time: '30 min',
    xp: '+50 XP',
    diff: 'Medium',
    dots: 2,
  },
];

async function renderScreen(
  overrides: Partial<React.ComponentProps<typeof MissionResultsScreen>> = {},
) {
  const onBack = jest.fn();
  const onAccept = jest.fn();
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  await render(
    <QueryClientProvider client={queryClient}>
      <MissionResultsScreen filters={FILTERS} onBack={onBack} onAccept={onAccept} {...overrides} />
    </QueryClientProvider>,
  );
  return { onBack, onAccept };
}

describe('MissionResultsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerate.mockResolvedValue({ missions: MISSIONS });
    mockSaveMission.mockResolvedValue({ saved: true });
    mockUnsaveMission.mockResolvedValue({ saved: false });
  });

  describe('rendering', () => {
    it('renders the header title, back and shuffle controls', async () => {
      await renderScreen();
      expect(screen.getByText('Your Quests')).toBeTruthy();
      expect(screen.getByLabelText('Back to filters')).toBeTruthy();
      expect(screen.getByLabelText('Shuffle quests')).toBeTruthy();
      await waitFor(() => expect(mockGenerate).toHaveBeenCalled());
    });

    it('requests missions with the filters prop on mount', async () => {
      await renderScreen();
      // TanStack Query's mutationFn receives a second (client/meta) argument
      // in v5 — assert on the variables argument only, not a strict arg list.
      await waitFor(() => expect(mockGenerate.mock.calls[0]?.[0]).toEqual(FILTERS));
    });

    it('renders filter chips derived from the filters prop', async () => {
      await renderScreen();
      await waitFor(() => expect(mockGenerate).toHaveBeenCalled());
      for (const chip of buildFilterChips(FILTERS)) {
        expect(screen.getByText(chip)).toBeTruthy();
      }
    });

    it('renders a loading skeleton before the response arrives', async () => {
      mockGenerate.mockReturnValue(new Promise(() => {})); // never resolves
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Loading new quests')).toBeTruthy());
    });

    it('renders all returned missions with the results count once loaded', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Find the Oldest Thing')).toBeTruthy());
      expect(screen.getByText('The Balancing Act')).toBeTruthy();
      expect(screen.getByText('Neighborhood Newbie')).toBeTruthy();
      expect(screen.getByText('3 quests')).toBeTruthy();
    });

    it('renders an empty state when no missions match', async () => {
      mockGenerate.mockResolvedValue({ missions: [] });
      await renderScreen();
      await waitFor(() => expect(screen.getByText('No quests found')).toBeTruthy());
    });

    it('renders an error state when the request fails', async () => {
      mockGenerate.mockRejectedValue(new Error('Network request failed'));
      await renderScreen();
      await waitFor(() => expect(screen.getByText("Couldn't load quests")).toBeTruthy());
    });

    it('does not render the detail sheet before a card is tapped', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Find the Oldest Thing')).toBeTruthy());
      expect(screen.queryByText('PROOF REQUIRED')).toBeNull();
    });
  });

  describe('interactions', () => {
    it('calls onBack when the back button is pressed', async () => {
      const { onBack } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Back to filters'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('requests a fresh set when shuffle is pressed', async () => {
      await renderScreen();
      await waitFor(() => expect(mockGenerate).toHaveBeenCalledTimes(1));
      await fireEvent.press(screen.getByLabelText('Shuffle quests'));
      await waitFor(() => expect(mockGenerate).toHaveBeenCalledTimes(2));
    });

    it('shows the loading skeleton while a shuffle request is in flight', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Find the Oldest Thing')).toBeTruthy());

      let resolve: ((value: { missions: Mission[] }) => void) | undefined;
      mockGenerate.mockReturnValueOnce(
        new Promise((r) => {
          resolve = r;
        }),
      );
      const pending = fireEvent.press(screen.getByLabelText('Shuffle quests'));
      await waitFor(() => expect(screen.getByLabelText('Loading new quests')).toBeTruthy());
      resolve?.({ missions: MISSIONS });
      await pending;
    });

    it('marks the shuffle button busy and disabled while a request is pending', async () => {
      let resolve: ((value: { missions: Mission[] }) => void) | undefined;
      mockGenerate.mockReturnValueOnce(
        new Promise((r) => {
          resolve = r;
        }),
      );
      await renderScreen();
      await waitFor(() =>
        expect(screen.getByLabelText('Shuffle quests').props.accessibilityState.busy).toBe(true),
      );
      resolve?.({ missions: MISSIONS });
    });

    it('opens the detail sheet with the full brief and proof when a card is tapped', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Find the Oldest Thing')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText(/View quest: Find the Oldest Thing/));
      expect(screen.getByText('Full brief for mission one.')).toBeTruthy();
      expect(screen.getByText('PROOF REQUIRED')).toBeTruthy();
      expect(screen.getByText('Photograph it.')).toBeTruthy();
    });

    it('toggles the save button and persists the change via the save API', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Find the Oldest Thing')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText(/View quest: Find the Oldest Thing/));
      await fireEvent.press(screen.getByLabelText('Save for later'));
      expect(screen.getByLabelText('Saved for later')).toBeTruthy();
      await waitFor(() => expect(mockSaveMission).toHaveBeenCalledWith('m-1'));

      await fireEvent.press(screen.getByLabelText('Saved for later'));
      expect(screen.getByLabelText('Save for later')).toBeTruthy();
      await waitFor(() => expect(mockUnsaveMission).toHaveBeenCalledWith('m-1'));
    });

    it('reverts the optimistic save toggle if the persist call fails', async () => {
      mockSaveMission.mockRejectedValueOnce(new Error('Network request failed'));
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Find the Oldest Thing')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText(/View quest: Find the Oldest Thing/));
      await fireEvent.press(screen.getByLabelText('Save for later'));
      await waitFor(() => expect(mockSaveMission).toHaveBeenCalledWith('m-1'));
      // Reverted back to unsaved once the persist call fails — the toggle
      // did not silently stay "saved" while actually unpersisted.
      await waitFor(() => expect(screen.getByLabelText('Save for later')).toBeTruthy());
    });

    it('accepts the quest and calls onAccept with the full mission after confirmation', async () => {
      const { onAccept } = await renderScreen();
      await waitFor(() => expect(screen.getByText('Find the Oldest Thing')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText(/View quest: Find the Oldest Thing/));
      await fireEvent.press(screen.getByLabelText('Accept quest'));
      await waitFor(() => expect(onAccept).toHaveBeenCalledWith(MISSIONS[0]), { timeout: 2000 });
    });

    it('ignores repeated presses on an already-accepted quest', async () => {
      const { onAccept } = await renderScreen();
      await waitFor(() => expect(screen.getByText('Find the Oldest Thing')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText(/View quest: Find the Oldest Thing/));
      await fireEvent.press(screen.getByLabelText('Accept quest'));
      await fireEvent.press(screen.getByLabelText('Quest accepted'));
      await waitFor(() => expect(onAccept).toHaveBeenCalledTimes(1), { timeout: 2000 });
    });

    it('closes the sheet when the backdrop is dismissed', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Find the Oldest Thing')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText(/View quest: Find the Oldest Thing/));
      // The backdrop sits outside accessibilityViewIsModal's tree, so RNTL
      // hides it from queries by default regardless of query type.
      await fireEvent.press(screen.getByTestId('sheet-backdrop', { includeHiddenElements: true }));
      await waitFor(() => expect(screen.queryByText('PROOF REQUIRED')).toBeNull());
    });

    it('closes the sheet when the close button is pressed', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Find the Oldest Thing')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText(/View quest: Find the Oldest Thing/));
      await fireEvent.press(screen.getByLabelText('Close mission detail'));
      await waitFor(() => expect(screen.queryByText('PROOF REQUIRED')).toBeNull());
    });

    it('retries the request when "Try again" is pressed after an error', async () => {
      mockGenerate.mockRejectedValueOnce(new Error('Network request failed'));
      await renderScreen();
      await waitFor(() => expect(screen.getByText("Couldn't load quests")).toBeTruthy());

      mockGenerate.mockResolvedValueOnce({ missions: MISSIONS });
      await fireEvent.press(screen.getByLabelText('Try again'));
      await waitFor(() => expect(screen.getByText('Find the Oldest Thing')).toBeTruthy());
    });

    it('does nothing when shuffle is pressed again while already shuffling', async () => {
      await renderScreen();
      await waitFor(() => expect(mockGenerate).toHaveBeenCalledTimes(1));

      let resolve: ((value: { missions: Mission[] }) => void) | undefined;
      mockGenerate.mockReturnValueOnce(
        new Promise((r) => {
          resolve = r;
        }),
      );
      const pending = fireEvent.press(screen.getByLabelText('Shuffle quests'));
      await waitFor(() => expect(mockGenerate).toHaveBeenCalledTimes(2));
      await fireEvent.press(screen.getByLabelText('Shuffle quests'));
      expect(mockGenerate).toHaveBeenCalledTimes(2);
      resolve?.({ missions: MISSIONS });
      await pending;
    });
  });

  describe('whenPressed style helper', () => {
    it('returns the style while pressed', () => {
      expect(whenPressed(true, { opacity: 0.5 })).toEqual({ opacity: 0.5 });
    });

    it('returns null while not pressed', () => {
      expect(whenPressed(false, { opacity: 0.5 })).toBeNull();
    });
  });

  describe('buildFilterChips', () => {
    it('builds one emoji-prefixed chip per filter', () => {
      expect(buildFilterChips(FILTERS)).toEqual([
        '\u{1F9CD} Solo',
        '\u{1F550} 30 min',
        '\u{1F33F} Outdoors',
        '\u{1F193} Free',
      ]);
    });
  });

  describe('accessibility', () => {
    it('gives every interactive element a button role and a label', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Find the Oldest Thing')).toBeTruthy());
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((btn) => {
        expect(btn.props.accessibilityLabel).toBeTruthy();
      });
    });

    it('exposes the screen title as a header', async () => {
      await renderScreen();
      expect(screen.getByText('Your Quests').props.accessibilityRole).toBe('header');
      await waitFor(() => expect(mockGenerate).toHaveBeenCalled());
    });

    it('announces the results count as a polite live region', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Find the Oldest Thing')).toBeTruthy());
      const count = screen.getByLabelText('3 quests matched your filters');
      expect(count.props.accessibilityLiveRegion).toBe('polite');
    });
  });

  describe('edge cases', () => {
    it('does not throw when accepting without an onAccept handler', async () => {
      await renderScreen({ onAccept: undefined });
      await waitFor(() => expect(screen.getByText('Find the Oldest Thing')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText(/View quest: Find the Oldest Thing/));
      expect(() => fireEvent.press(screen.getByLabelText('Accept quest'))).not.toThrow();
    });

    it('re-fetches when the filters prop changes', async () => {
      const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
      const { rerender } = await render(
        <QueryClientProvider client={queryClient}>
          <MissionResultsScreen filters={FILTERS} />
        </QueryClientProvider>,
      );
      await waitFor(() => expect(mockGenerate).toHaveBeenCalledTimes(1));

      const nextFilters: GenerateMissionsRequest = { ...FILTERS, crew: 'Family' };
      rerender(
        <QueryClientProvider client={queryClient}>
          <MissionResultsScreen filters={nextFilters} />
        </QueryClientProvider>,
      );
      await waitFor(() => {
        const lastCall = mockGenerate.mock.calls[mockGenerate.mock.calls.length - 1];
        expect(lastCall?.[0]).toEqual(nextFilters);
      });
    });
  });
});
