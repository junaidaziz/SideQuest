import { textStyle } from './typography';

describe('textStyle', () => {
  it('maps size, line height and weight for a body role without letter spacing', () => {
    const style = textStyle('bodyM');
    expect(style.fontSize).toBe(15);
    expect(style.lineHeight).toBe(23);
    expect(style.fontWeight).toBe('400');
    expect(style.letterSpacing).toBeUndefined();
  });

  it('includes letter spacing for a heading role that defines it', () => {
    const style = textStyle('h1');
    expect(style.fontSize).toBe(26);
    expect(style.fontWeight).toBe('700');
    expect(style.letterSpacing).toBeCloseTo(-0.015 * 26);
  });

  it('resolves the metric display role', () => {
    const style = textStyle('metric');
    expect(style.fontSize).toBe(32);
    expect(style.letterSpacing).toBeCloseTo(-0.02 * 32);
  });
});
