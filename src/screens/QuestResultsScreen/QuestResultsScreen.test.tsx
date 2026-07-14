import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('react-native-reanimated', () => {
  const R = require('react');
  const { View, Text, ScrollView } = require('react-native');
  const pass = (Comp: unknown) =>
    R.forwardRef((props: Record<string, unknown>, ref: unknown) => {
      const { entering, exiting, layout, ...rest } = props;
      return R.createElement(Comp, { ...rest, ref });
    });
  const chain = (): unknown =>
    new Proxy(function () {}, { get: () => chain(), apply: () => chain() });
  return {
    __esModule: true,
    default: { View: pass(View), Text: pass(Text), ScrollView: pass(ScrollView), createAnimatedComponent: pass },
    FadeInDown: chain(),
  };
});

jest.mock('../../services/missionsApi');
jest.mock('../../services/queuedActions');

import QuestResultsScreen, {
  buildFilterChips,
  buildFitReason,
  categoryLabel,
} from './QuestResultsScreen';
import { generateMissions } from '../../services/missionsApi';
import { enqueueSaveToggle } from '../../services/queuedActions';
import type { GenerateMissionsRequest, Mission } from '../../types/api';

const mockGenerate = generateMissions as jest.Mock;
const mockEnqueueSave = enqueueSaveToggle as jest.Mock;

const FILTERS: GenerateMissionsRequest = { crew: 'Solo', time: '30 min', setting: 'Outdoors', budget: 'Free' };

const MISSIONS: Mission[] = [
  { id: 'm-1', category: 'explore', title: 'Street Type Safari', desc: 'Hunt three letters in the wild.', full: 'x', proof: 'Photo', time: '30 min', xp: '20 XP', diff: 'Easy', dots: 1 },
  { id: 'm-2', category: 'create', title: 'Green Corner Hunt', desc: 'Find the greenest spot nearby.', full: 'x', proof: 'Photo', time: '25 min', xp: '20 XP', diff: 'Medium', dots: 2 },
];

async function renderScreen(overrides: Partial<React.ComponentProps<typeof QuestResultsScreen>> = {}) {
  const props = { filters: FILTERS, onBack: jest.fn(), onEditContext: jest.fn(), onViewDetails: jest.fn(), ...overrides };
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const result = await render(
    <QueryClientProvider client={queryClient}>
      <QuestResultsScreen {...props} />
    </QueryClientProvider>,
  );
  return { ...props, ...result };
}

describe('QuestResultsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerate.mockResolvedValue({ missions: MISSIONS });
    mockEnqueueSave.mockResolvedValue({ id: 'q-1' });
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('requests missions with the filters and renders result cards', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Street Type Safari')).toBeTruthy());
      expect(mockGenerate.mock.calls[0]?.[0]).toEqual(FILTERS);
      expect(screen.getByText('Green Corner Hunt')).toBeTruthy();
      expect(screen.getByText('2 quests fit your moment')).toBeTruthy();
    });

    it('renders the loading skeleton before the response arrives', async () => {
      mockGenerate.mockReturnValue(new Promise(() => {}));
      await renderScreen();
      expect(screen.getByLabelText('Finding your quests')).toBeTruthy();
    });

    it('renders the empty state when no missions match', async () => {
      mockGenerate.mockResolvedValue({ missions: [] });
      await renderScreen();
      await waitFor(() => expect(screen.getByText('No quests found')).toBeTruthy());
    });

    it('renders the error state when the request fails', async () => {
      mockGenerate.mockRejectedValue(new Error('offline'));
      await renderScreen();
      await waitFor(() => expect(screen.getByText("Couldn't load quests")).toBeTruthy());
    });

    it('renders the fit reason and filter summary', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Street Type Safari')).toBeTruthy());
      expect(screen.getAllByText(/Why this fits:/).length).toBe(2);
      expect(screen.getByText('Solo · 30 min · Outdoors · Free')).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('calls onBack and onEditContext', async () => {
      const { onBack, onEditContext } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Back to explore'));
      await fireEvent.press(screen.getByLabelText('Edit your moment'));
      expect(onBack).toHaveBeenCalledTimes(1);
      expect(onEditContext).toHaveBeenCalledTimes(1);
    });

    it('calls onViewDetails with the tapped mission', async () => {
      const { onViewDetails } = await renderScreen();
      await waitFor(() => expect(screen.getByText('Street Type Safari')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('View details for Street Type Safari'));
      expect(onViewDetails).toHaveBeenCalledWith(MISSIONS[0]);
    });

    it('toggles save and enqueues the change for queue-and-retry', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Street Type Safari')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Save Street Type Safari'));
      expect(screen.getByLabelText('Saved Street Type Safari')).toBeTruthy();
      await waitFor(() => expect(mockEnqueueSave).toHaveBeenCalledWith('m-1', true));
      await fireEvent.press(screen.getByLabelText('Saved Street Type Safari'));
      expect(screen.getByLabelText('Save Street Type Safari')).toBeTruthy();
      await waitFor(() => expect(mockEnqueueSave).toHaveBeenCalledWith('m-1', false));
    });

    it('reverts the optimistic save toggle when enqueue itself fails', async () => {
      mockEnqueueSave.mockRejectedValueOnce(new Error('storage full'));
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Street Type Safari')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Save Street Type Safari'));
      await waitFor(() => expect(mockEnqueueSave).toHaveBeenCalledWith('m-1', true));
      await waitFor(() => expect(screen.getByLabelText('Save Street Type Safari')).toBeTruthy());
    });

    it('rerolls (refetches) when the reroll button is pressed', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Street Type Safari')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Reroll these quests'));
      await waitFor(() => expect(mockGenerate).toHaveBeenCalledTimes(2));
    });

    it('rerolls from the top-bar Reroll control', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Street Type Safari')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Reroll quests'));
      await waitFor(() => expect(mockGenerate).toHaveBeenCalledTimes(2));
    });

    it('ignores reroll while a fetch is already in flight', async () => {
      let resolve: ((v: { missions: Mission[] }) => void) | undefined;
      mockGenerate.mockReturnValueOnce(new Promise((r) => { resolve = r; }));
      await renderScreen();
      // still loading — reroll button not shown, use the top-bar control
      await fireEvent.press(screen.getByLabelText('Reroll quests'));
      expect(mockGenerate).toHaveBeenCalledTimes(1);
      resolve?.({ missions: MISSIONS });
      await waitFor(() => expect(screen.getByText('Street Type Safari')).toBeTruthy());
    });

    it('retries after an error via Try again', async () => {
      mockGenerate.mockRejectedValueOnce(new Error('offline'));
      await renderScreen();
      await waitFor(() => expect(screen.getByText("Couldn't load quests")).toBeTruthy());
      mockGenerate.mockResolvedValueOnce({ missions: MISSIONS });
      await fireEvent.press(screen.getByLabelText('Try again'));
      await waitFor(() => expect(screen.getByText('Street Type Safari')).toBeTruthy());
    });
  });

  describe('accessibility', () => {
    it('gives every interactive element a button role and a label', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Street Type Safari')).toBeTruthy());
      screen.getAllByRole('button').forEach((btn) => {
        expect(btn.props.accessibilityLabel).toBeTruthy();
      });
    });
  });

  describe('pure helpers', () => {
    it('categoryLabel maps categories to human labels', () => {
      expect(categoryLabel('explore')).toBe('Get out');
      expect(categoryLabel('create')).toBe('Make something');
      expect(categoryLabel('discover')).toBe('Connect');
    });

    it('buildFitReason varies by difficulty', () => {
      expect(buildFitReason(MISSIONS[0])).toContain('quick and low-effort');
      expect(buildFitReason(MISSIONS[1])).toContain('a satisfying stretch');
    });

    it('buildFilterChips returns one entry per filter', () => {
      expect(buildFilterChips(FILTERS)).toEqual(['Solo', '30 min', 'Outdoors', 'Free']);
    });
  });
});
