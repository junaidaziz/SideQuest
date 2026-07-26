import { PixelRatio } from 'react-native';
import { selectResponsiveVariant } from './selectResponsiveVariant';
import type { MediaVariant } from '../types/api';

function variant(name: string, width: number): MediaVariant {
  return { name, url: `https://cdn.example/${name}.webp`, width, height: width, format: 'webp' };
}

describe('selectResponsiveVariant', () => {
  const VARIANTS: MediaVariant[] = [
    variant('xs', 120),
    variant('sm', 150),
    variant('md', 240),
    variant('lg', 320),
  ];

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns null when there are no variants', () => {
    expect(selectResponsiveVariant([], 48)).toBeNull();
    expect(selectResponsiveVariant(null, 48)).toBeNull();
    expect(selectResponsiveVariant(undefined, 48)).toBeNull();
  });

  it('picks the smallest variant that covers the needed pixel width at 1x', () => {
    jest.spyOn(PixelRatio, 'get').mockReturnValue(1);
    // 48pt @1x = 48px needed -> smallest variant >= 48 is xs (120).
    expect(selectResponsiveVariant(VARIANTS, 48)?.name).toBe('xs');
  });

  it('picks a larger variant as pixel density increases', () => {
    jest.spyOn(PixelRatio, 'get').mockReturnValue(3);
    // 76pt @3x = 228px needed -> smallest variant >= 228 is lg (320), since md (240) also qualifies... md is smaller and >= 228.
    expect(selectResponsiveVariant(VARIANTS, 76)?.name).toBe('md');
  });

  it('falls back to the largest variant when every one is smaller than needed', () => {
    jest.spyOn(PixelRatio, 'get').mockReturnValue(3);
    expect(selectResponsiveVariant(VARIANTS, 1000)?.name).toBe('lg');
  });

  it('does not mutate the input array order', () => {
    jest.spyOn(PixelRatio, 'get').mockReturnValue(1);
    const original = [variant('lg', 320), variant('xs', 120)];
    const copy = [...original];
    selectResponsiveVariant(original, 48);
    expect(original).toEqual(copy);
  });

  it('handles a single-variant list', () => {
    jest.spyOn(PixelRatio, 'get').mockReturnValue(1);
    expect(selectResponsiveVariant([variant('only', 100)], 48)?.name).toBe('only');
  });
});
