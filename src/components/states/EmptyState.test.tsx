import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  describe('rendering', () => {
    it('groups title and description into a single announcement', async () => {
      const { getByLabelText } = await render(
        <EmptyState title="No saved quests yet" description="Save quests for later." />,
      );
      expect(getByLabelText('No saved quests yet. Save quests for later.')).toBeTruthy();
    });

    it('announces just the title when there is no description', async () => {
      const { getByLabelText } = await render(<EmptyState title="All caught up" />);
      expect(getByLabelText('All caught up')).toBeTruthy();
    });

    it('renders no action button when actionLabel is omitted', async () => {
      const { queryByRole } = await render(<EmptyState title="Quiet here" />);
      expect(queryByRole('button')).toBeNull();
    });
  });

  describe('interactions', () => {
    it('renders and fires the primary action', async () => {
      const onAction = jest.fn();
      const { getByRole } = await render(
        <EmptyState
          title="No saved quests yet"
          actionLabel="Explore quests"
          onAction={onAction}
        />,
      );
      const btn = getByRole('button');
      expect(btn.props.accessibilityLabel).toBe('Explore quests');
      fireEvent.press(btn);
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('does not render the button without an onAction handler', async () => {
      const { queryByRole } = await render(
        <EmptyState title="No history" actionLabel="Find a quest" />,
      );
      expect(queryByRole('button')).toBeNull();
    });
  });
});
