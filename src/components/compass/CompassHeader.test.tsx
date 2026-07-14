import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { CompassHeader } from './CompassHeader';

describe('CompassHeader', () => {
  it('renders the title as a header', async () => {
    const { getByText, getByRole } = await render(<CompassHeader title="Settings" />);
    expect(getByText('Settings')).toBeTruthy();
    expect(getByRole('header')).toBeTruthy();
  });

  it('renders and fires the back button', async () => {
    const onBack = jest.fn();
    const { getByLabelText } = await render(
      <CompassHeader title="Account" onBack={onBack} backAccessibilityLabel="Back to settings" />,
    );
    fireEvent.press(getByLabelText('Back to settings'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders a large left-aligned title with a right accessory', async () => {
    const { getByText } = await render(
      <CompassHeader title="You" large right={<Text>GEAR</Text>} />,
    );
    expect(getByText('You')).toBeTruthy();
    expect(getByText('GEAR')).toBeTruthy();
  });

  it('has no back affordance when onBack is absent', async () => {
    const { queryByLabelText } = await render(<CompassHeader title="You" />);
    expect(queryByLabelText('Go back')).toBeNull();
  });
});
