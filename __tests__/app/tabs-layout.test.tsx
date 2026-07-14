import React from 'react';
import { render } from '@testing-library/react-native';
import TabsLayout from '../../app/(tabs)/_layout';
import { CompassColorsLight } from '../../src/constants/compassDesign';

// Mock the Tabs navigator so the layout renders headlessly; capture both the
// screen options (name/title/icon) and the navigator-level screenOptions so
// we can assert tab bar theming actually comes from useCompassTheme(), not
// hardcoded values.
const screens: { name: string; title: string; hasIcon: boolean }[] = [];
let capturedScreenOptions: Record<string, unknown> | undefined;
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  function Tabs({
    children,
    screenOptions,
  }: {
    children: React.ReactNode;
    screenOptions?: Record<string, unknown>;
  }) {
    capturedScreenOptions = screenOptions;
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
    capturedScreenOptions = undefined;
  });

  it('declares the four Compass tabs with titles and icons', async () => {
    await render(<TabsLayout />);
    expect(screens.map((s) => s.name)).toEqual(['today', 'explore', 'progress', 'you']);
    expect(screens.map((s) => s.title)).toEqual(['Today', 'Explore', 'Progress', 'You']);
    expect(screens.every((s) => s.hasIcon)).toBe(true);
  });

  it('sources tab bar theming from useCompassTheme(), not hardcoded colors', async () => {
    await render(<TabsLayout />);
    expect(capturedScreenOptions?.tabBarActiveTintColor).toBe(CompassColorsLight.actionPrimary);
    expect(capturedScreenOptions?.tabBarInactiveTintColor).toBe(CompassColorsLight.textTertiary);
    expect(capturedScreenOptions?.tabBarStyle).toMatchObject({
      backgroundColor: CompassColorsLight.bgSurface,
      borderTopColor: CompassColorsLight.borderDefault,
    });
  });
});
