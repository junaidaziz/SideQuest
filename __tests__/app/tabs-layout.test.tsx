import React from 'react';
import { render } from '@testing-library/react-native';
import TabsLayout from '../../app/(tabs)/_layout';

// Mock the Tabs navigator so the layout renders headlessly; capture the screen
// options so we can assert the four tabs are declared with icons + titles.
const screens: { name: string; title: string; hasIcon: boolean }[] = [];
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  function Tabs({ children }: { children: React.ReactNode }) {
    return <View>{children}</View>;
  }
  function Screen({ name, options }: { name: string; options: { title: string; tabBarIcon?: (p: { color: string }) => React.ReactNode } }) {
    const icon = options.tabBarIcon;
    screens.push({ name, title: options.title, hasIcon: typeof icon === 'function' });
    // Exercise the icon renderer so its JSX branch is covered.
    if (icon) {
      icon({ color: '#000' });
    }
    return null;
  }
  Tabs.Screen = Screen;
  return { Tabs };
});

describe('TabsLayout', () => {
  beforeEach(() => {
    screens.length = 0;
  });

  it('declares the four Compass tabs with titles and icons', async () => {
    await render(<TabsLayout />);
    expect(screens.map((s) => s.name)).toEqual(['today', 'explore', 'progress', 'you']);
    expect(screens.map((s) => s.title)).toEqual(['Today', 'Explore', 'Progress', 'You']);
    expect(screens.every((s) => s.hasIcon)).toBe(true);
  });
});
