import { toFiltersFromMode } from '../../app/mode-select';

describe('toFiltersFromMode', () => {
  it.each([
    ['solo', 'Solo'],
    ['couple', 'Partner'],
    ['friends', 'Friends'],
    ['family', 'Family'],
    ['kids', 'Kids Mode'],
  ] as const)('maps "%s" to crew "%s"', (mode, crew) => {
    expect(toFiltersFromMode(mode).crew).toBe(crew);
  });

  it('maps "city" to setting "City", not a crew value', () => {
    const filters = toFiltersFromMode('city');
    expect(filters.setting).toBe('City');
    expect(filters.crew).toBe('Solo');
  });

  it.each(['confidence', 'travel'] as const)(
    'falls back to the most permissive filters for "%s" (no direct dimension)',
    (mode) => {
      expect(toFiltersFromMode(mode)).toEqual({
        crew: 'Solo',
        time: '1 hour',
        setting: 'Anywhere',
        budget: 'No limit',
      });
    },
  );
});
