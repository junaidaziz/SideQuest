import { pressedStyle } from './pressedStyle';

describe('pressedStyle', () => {
  it('returns a dimming style when pressed', () => {
    expect(pressedStyle(true)).toEqual({ opacity: 0.85 });
  });

  it('honours a custom opacity', () => {
    expect(pressedStyle(true, 0.6)).toEqual({ opacity: 0.6 });
  });

  it('returns null when not pressed', () => {
    expect(pressedStyle(false)).toBeNull();
  });
});
