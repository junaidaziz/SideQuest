import React from 'react';
import { render } from '@testing-library/react-native';
import TabsLayout from '../../app/(tabs)/_layout';
import { CompassColorsLight } from '../../src/constants/compassDesign';

type IconProps = { color: string; focused?: boolean; size?: number };

// Mock the Tabs navigator so the layout renders headlessly; capture both the
// screen options (name/title/icon) and the navigator-level screenOptions so
// we can assert tab bar theming actually comes from useCompassTheme(), not
// hardcoded values.
const screens: {
  name: string;
  title: string;
  hasIcon: boolean;
  activeType: unknown;
  inactiveType: unknown;
}[] = [];
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
  function Screen({
    name,
    options,
  }: {
    name: string;
    options: { title: string; tabBarIcon?: (p: IconProps) => React.ReactElement };
  }) {
    const icon = options.tabBarIcon;
    // Exercise the icon renderer for both the active (filled "you are here")
    // and inactive (outline) branches so `selected={focused}` is covered.
    const active = icon ? icon({ color: '#111', focused: true, size: 24 }) : null;
    const inactive = icon ? icon({ color: '#999', focused: false, size: 24 }) : null;
    screens.push({
      name,
      title: options.title,
      hasIcon: typeof icon === 'function',
      // React element type — proves the emoji Text was swapped for a component.
      activeType: (active as React.ReactElement | null)?.type,
      inactiveType: (inactive as React.ReactElement | null)?.type,
    });
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

  it('renders the shared vector Icon component for both tab states', async () => {
    await render(<TabsLayout />);
    // Each tab icon renders the same Icon component function in both the active
    // (filled) and inactive (outline) states — no emoji Text glyphs remain.
    screens.forEach((s) => {
      expect(typeof s.activeType).toBe('function');
      expect(s.activeType).toBe(s.inactiveType);
    });
    // All four tabs share one component (data-driven by name).
    const uniqueTypes = new Set(screens.map((s) => s.activeType));
    expect(uniqueTypes.size).toBe(1);
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
