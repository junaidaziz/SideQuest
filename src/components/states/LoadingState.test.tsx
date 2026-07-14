import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingState } from './LoadingState';

describe('LoadingState', () => {
  it('announces the loading label once via a polite live region', async () => {
    const { getByText } = await render(<LoadingState label="Loading your day" />);
    const status = getByText('Loading your day');
    expect(status.props.accessibilityLiveRegion).toBe('polite');
  });

  it('marks the container as busy', async () => {
    const { getByTestId } = await render(<LoadingState testID="loading" />);
    expect(getByTestId('loading').props.accessibilityState).toMatchObject({
      busy: true,
    });
  });

  it('renders the today hero skeleton for the today variant', async () => {
    const { getByTestId } = await render(<LoadingState variant="today" testID="loading" />);
    expect(getByTestId('skeleton-hero', { includeHiddenElements: true })).toBeTruthy();
  });

  it('renders the requested number of card skeletons for the list variant', async () => {
    const { getByTestId } = await render(<LoadingState variant="list" count={3} />);
    expect(getByTestId('skeleton-card-0', { includeHiddenElements: true })).toBeTruthy();
    expect(getByTestId('skeleton-card-2', { includeHiddenElements: true })).toBeTruthy();
  });

  it('clamps the list count to at least one card', async () => {
    const { getByTestId } = await render(<LoadingState variant="list" count={0} />);
    expect(getByTestId('skeleton-card-0', { includeHiddenElements: true })).toBeTruthy();
  });

  it('renders the section variant by default', async () => {
    const { getByTestId } = await render(<LoadingState testID="loading" />);
    expect(getByTestId('loading')).toBeTruthy();
  });
});
