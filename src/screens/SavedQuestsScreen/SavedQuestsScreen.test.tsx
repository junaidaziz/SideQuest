import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../services/missionsApi');
jest.mock('../../services/queuedActions');

import SavedQuestsScreen from './SavedQuestsScreen';
import { listSavedMissions } from '../../services/missionsApi';
import { enqueueSaveToggle } from '../../services/queuedActions';
import type { PaginatedSavedMissions } from '../../types/api';

const mockListSaved = listSavedMissions as jest.Mock;
const mockEnqueueSave = enqueueSaveToggle as jest.Mock;

const PAGE: PaginatedSavedMissions = {
  items: [
    {
      id: 'm-1',
      category: 'explore',
      title: 'Street Type Safari',
      desc: 'Hunt three letters in the wild.',
      full: 'x',
      proof: 'Photo',
      time: '30 min',
      xp: '+20 XP',
      diff: 'Easy',
      dots: 1,
      savedAt: '2026-07-16T10:00:00.000Z',
    },
    {
      id: 'm-2',
      category: 'create',
      title: 'Green Corner Hunt',
      desc: 'Find the greenest spot nearby.',
      full: 'x',
      proof: 'Photo',
      time: '25 min',
      xp: '+20 XP',
      diff: 'Medium',
      dots: 2,
      savedAt: '2026-07-15T10:00:00.000Z',
    },
  ],
  total: 2,
  limit: 20,
  offset: 0,
};

async function renderScreen(overrides: Partial<React.ComponentProps<typeof SavedQuestsScreen>> = {}) {
  const props = { onBack: jest.fn(), onExplore: jest.fn(), onViewDetails: jest.fn(), ...overrides };
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const result = await render(
    <QueryClientProvider client={queryClient}>
      <SavedQuestsScreen {...props} />
    </QueryClientProvider>,
  );
  return { ...props, ...result };
}

describe('SavedQuestsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListSaved.mockResolvedValue(PAGE);
    mockEnqueueSave.mockResolvedValue({ id: 'q-1' });
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders saved quest cards, newest-saved-first as returned by the API', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Street Type Safari')).toBeTruthy());
      expect(screen.getByText('Green Corner Hunt')).toBeTruthy();
      expect(screen.getByText('2')).toBeTruthy(); // count badge
    });

    it('renders the loading skeleton before the response arrives', async () => {
      mockListSaved.mockReturnValue(new Promise(() => {}));
      await renderScreen();
      expect(screen.getByLabelText('Loading saved quests')).toBeTruthy();
    });

    it('renders an error state with retry when the request fails', async () => {
      mockListSaved.mockRejectedValue(new Error('network'));
      await renderScreen();
      await waitFor(() => expect(screen.getByText("Couldn't load saved quests")).toBeTruthy());
      expect(screen.getByLabelText('Try again')).toBeTruthy();
    });

    it('renders the empty state with an Explore CTA when nothing is saved', async () => {
      mockListSaved.mockResolvedValue({ items: [], total: 0, limit: 20, offset: 0 });
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Nothing saved yet')).toBeTruthy());
      expect(screen.getByLabelText('Explore quests')).toBeTruthy();
    });

    it('omits the Explore CTA when no onExplore handler is provided', async () => {
      mockListSaved.mockResolvedValue({ items: [], total: 0, limit: 20, offset: 0 });
      await renderScreen({ onExplore: undefined });
      await waitFor(() => expect(screen.getByText('Nothing saved yet')).toBeTruthy());
      expect(screen.queryByLabelText('Explore quests')).toBeNull();
    });
  });

  describe('interactions', () => {
    it('navigates back', async () => {
      const props = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Back'));
      expect(props.onBack).toHaveBeenCalledTimes(1);
    });

    it('opens quest details on card tap', async () => {
      const props = await renderScreen();
      await waitFor(() => expect(screen.getByText('Street Type Safari')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('View quest: Street Type Safari, 30 min, +20 XP'));
      expect(props.onViewDetails).toHaveBeenCalledWith(PAGE.items[0]);
    });

    it('retries the query from the error state', async () => {
      mockListSaved.mockRejectedValueOnce(new Error('network'));
      mockListSaved.mockResolvedValueOnce(PAGE);
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Try again')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Try again'));
      await waitFor(() => expect(screen.getByText('Street Type Safari')).toBeTruthy());
    });

    it('fires the Explore CTA from the empty state', async () => {
      mockListSaved.mockResolvedValue({ items: [], total: 0, limit: 20, offset: 0 });
      const props = await renderScreen();
      await waitFor(() => expect(screen.getByText('Nothing saved yet')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Explore quests'));
      expect(props.onExplore).toHaveBeenCalledTimes(1);
    });

    it('removes a quest from the list on unsave and enqueues the toggle', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Street Type Safari')).toBeTruthy());

      await fireEvent.press(screen.getByLabelText('Remove Street Type Safari from saved quests'));

      expect(mockEnqueueSave).toHaveBeenCalledWith('m-1', false);
      await waitFor(() => expect(screen.queryByText('Street Type Safari')).toBeNull());
      expect(screen.getByText('Green Corner Hunt')).toBeTruthy();
    });

    it('restores the quest if the unsave enqueue fails', async () => {
      mockEnqueueSave.mockRejectedValue(new Error('storage full'));
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Street Type Safari')).toBeTruthy());

      await fireEvent.press(screen.getByLabelText('Remove Street Type Safari from saved quests'));

      await waitFor(() => expect(screen.getByText('Street Type Safari')).toBeTruthy());
    });
  });
});
