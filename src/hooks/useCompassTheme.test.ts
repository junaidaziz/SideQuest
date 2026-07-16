import { renderHook } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import { useCompassTheme } from './useCompassTheme';
import { useThemeStore } from '../store/themeStore';
import { CompassColorsDark, CompassColorsLight } from '../constants/compassDesign';

describe('useCompassTheme', () => {
  let useColorScheme: jest.SpyInstance;

  beforeEach(() => {
    useThemeStore.setState({ preference: null });
    useColorScheme = jest.spyOn(ReactNative, 'useColorScheme');
  });

  afterEach(() => {
    useColorScheme.mockRestore();
  });

  it('follows the OS scheme when preference is null (pre-hydrate)', async () => {
    useColorScheme.mockReturnValue('dark');
    const { result } = await renderHook(() => useCompassTheme());
    expect(result.current.scheme).toBe('dark');
    expect(result.current.colors).toBe(CompassColorsDark);
  });

  it('follows the OS scheme when preference is "system"', async () => {
    useThemeStore.setState({ preference: 'system' });
    useColorScheme.mockReturnValue('light');
    const { result } = await renderHook(() => useCompassTheme());
    expect(result.current.scheme).toBe('light');
    expect(result.current.colors).toBe(CompassColorsLight);
  });

  it('forces dark regardless of a light OS scheme', async () => {
    useThemeStore.setState({ preference: 'dark' });
    useColorScheme.mockReturnValue('light');
    const { result } = await renderHook(() => useCompassTheme());
    expect(result.current.scheme).toBe('dark');
    expect(result.current.colors).toBe(CompassColorsDark);
  });

  it('forces light regardless of a dark OS scheme', async () => {
    useThemeStore.setState({ preference: 'light' });
    useColorScheme.mockReturnValue('dark');
    const { result } = await renderHook(() => useCompassTheme());
    expect(result.current.scheme).toBe('light');
    expect(result.current.colors).toBe(CompassColorsLight);
  });

  it('treats an unset OS scheme (null) as light', async () => {
    useThemeStore.setState({ preference: 'system' });
    useColorScheme.mockReturnValue(null);
    const { result } = await renderHook(() => useCompassTheme());
    expect(result.current.scheme).toBe('light');
  });
});
