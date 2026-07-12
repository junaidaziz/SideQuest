import { toFilters } from '../../app/onboarding';

describe('toFilters', () => {
  it('maps the index-keyed carousel selections to the named request fields', () => {
    expect(
      toFilters({ 0: 'Solo', 1: '30 min', 2: 'Outdoors', 3: 'Free' }),
    ).toEqual({ crew: 'Solo', time: '30 min', setting: 'Outdoors', budget: 'Free' });
  });

  it('preserves every value verbatim, including a multi-word crew value', () => {
    expect(
      toFilters({ 0: 'Kids Mode', 1: '2+ hours', 2: 'Anywhere', 3: 'No limit' }),
    ).toEqual({ crew: 'Kids Mode', time: '2+ hours', setting: 'Anywhere', budget: 'No limit' });
  });
});
