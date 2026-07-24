import { ICONS, type IconName } from './iconData';

describe('iconData', () => {
  const names = Object.keys(ICONS) as IconName[];

  it('defines a non-empty outline for every glyph', () => {
    expect(names.length).toBeGreaterThan(0);
    names.forEach((name) => {
      expect(ICONS[name].outline.length).toBeGreaterThan(0);
    });
  });

  it('exposes filled variants only for the bottom-nav glyphs', () => {
    const filled = names.filter((name) => ICONS[name].filled != null);
    expect(filled).toEqual(expect.arrayContaining(['today', 'progress', 'you']));
    // A pure-action glyph must not carry a filled variant.
    expect(ICONS.search.filled).toBeUndefined();
  });

  it('uses only supported primitive kinds', () => {
    const kinds = new Set<string>();
    names.forEach((name) => {
      [...ICONS[name].outline, ...(ICONS[name].filled ?? [])].forEach((p) => kinds.add(p.kind));
    });
    kinds.forEach((kind) => expect(['path', 'circle', 'rect']).toContain(kind));
  });

  it('includes the nav, action and brand glyphs the screens need', () => {
    const required: IconName[] = [
      'today',
      'explore',
      'progress',
      'you',
      'add',
      'search',
      'bell',
      'bookmark',
      'back',
      'check',
      'close',
      'spark',
    ];
    required.forEach((name) => expect(ICONS[name]).toBeDefined());
  });
});
