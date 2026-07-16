import { buildDayStrip, chunkIntoWeeks, streakHeadline } from './streak';

describe('streak helpers', () => {
  describe('buildDayStrip', () => {
    it('fills the trailing days up to the current streak', () => {
      const strip = buildDayStrip(3, 7);
      expect(strip).toHaveLength(7);
      expect(strip.filter((d) => d.done)).toHaveLength(3);
      // the last three are the done ones
      expect(strip.slice(4).every((d) => d.done)).toBe(true);
      expect(strip[6].isToday).toBe(true);
    });

    it('caps a streak longer than the window', () => {
      const strip = buildDayStrip(30, 14);
      expect(strip.every((d) => d.done)).toBe(true);
    });

    it('marks nothing done for a zero streak', () => {
      const strip = buildDayStrip(0, 5);
      expect(strip.some((d) => d.done)).toBe(false);
      expect(strip[4].isToday).toBe(true);
    });

    it('clamps a negative streak to empty', () => {
      const strip = buildDayStrip(-4, 5);
      expect(strip.some((d) => d.done)).toBe(false);
    });
  });

  describe('streakHeadline', () => {
    it('formats the compound label', () => {
      expect(streakHeadline(0)).toBe('0-day streak');
      expect(streakHeadline(12)).toBe('12-day streak');
    });
  });

  describe('chunkIntoWeeks', () => {
    it('splits a 14-day strip into two 7-day rows', () => {
      const strip = buildDayStrip(3, 14);
      const rows = chunkIntoWeeks(strip);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toHaveLength(7);
      expect(rows[1]).toHaveLength(7);
    });

    it('keeps a short final row instead of padding it', () => {
      const strip = buildDayStrip(0, 10);
      const rows = chunkIntoWeeks(strip);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toHaveLength(7);
      expect(rows[1]).toHaveLength(3);
    });

    it('returns an empty array for an empty strip', () => {
      expect(chunkIntoWeeks([])).toEqual([]);
    });
  });
});
