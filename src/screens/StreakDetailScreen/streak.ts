/**
 * Streak-strip derivation for the streak detail screen (mockup 25).
 *
 * The mockup shows a month calendar heatmap, but no per-day completion history
 * endpoint exists — only `StreakInfo.currentStreak`. So we derive an honest
 * trailing N-day strip: the last `currentStreak` days (capped to the window)
 * are marked complete, with the final cell representing today.
 */
export interface StreakDay {
  index: number;
  done: boolean;
  isToday: boolean;
}

/** Build a trailing window of days, filling the most recent `currentStreak`. */
export function buildDayStrip(currentStreak: number, windowSize = 14): StreakDay[] {
  const filled = Math.max(0, Math.min(currentStreak, windowSize));
  const firstDone = windowSize - filled;
  const days: StreakDay[] = [];
  for (let i = 0; i < windowSize; i += 1) {
    days.push({ index: i, done: i >= firstDone && filled > 0, isToday: i === windowSize - 1 });
  }
  return days;
}

/** "12-day streak" / "1-day streak" compound label. */
export function streakHeadline(days: number): string {
  return `${days}-day streak`;
}
