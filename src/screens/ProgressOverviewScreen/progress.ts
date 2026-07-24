import type { HomeResponse, LevelInfo, StreakInfo, TaskStats } from '../../types/api';
import type { CompassPalette } from '../../constants/compassDesign';

/**
 * Pure, backend-agnostic derivations for the Compass progress cluster
 * (screens 19–25). Everything here is computed from the real `/home`
 * (`HomeResponse`) payload the app already fetches — no invented endpoints.
 *
 * `LevelInfo` uses the documented flat 100-XP-per-level curve, so within-level
 * progress is `xpIntoLevel / (xpIntoLevel + xpToNextLevel)` and never re-derived
 * client-side beyond that ratio.
 */

/** Rank ladder — indexed by level. Level 7 = "Trailblazer", 8 = "Cartographer"
 * to match `19-progress-overview.html`. Levels past the ladder keep the top rank. */
export const RANKS = [
  'Newcomer',
  'Wanderer',
  'Pathfinder',
  'Scout',
  'Explorer',
  'Voyager',
  'Pioneer',
  'Trailblazer',
  'Cartographer',
  'Navigator',
  'Pathmaster',
  'Trailmaster',
  'Compass Legend',
] as const;

/** Human rank name for a level, clamped to the ladder's top entry. */
export function levelName(level: number): string {
  const idx = Math.max(0, Math.min(level, RANKS.length - 1));
  return RANKS[idx];
}

/** Rank name of the next level up — the goal the progress bar points at. */
export function nextLevelName(level: number): string {
  return levelName(level + 1);
}

/** Thousands-grouped integer, e.g. 2450 → "2,450". */
export function formatXp(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

/** Within-level XP progress as a 0–1 fraction. Guards the empty-curve edge. */
export function levelProgress(level: LevelInfo): number {
  const span = level.xpIntoLevel + level.xpToNextLevel;
  if (span <= 0) return 0;
  return level.xpIntoLevel / span;
}

/** Completion rate as a 0–1 fraction (server already guards divide-by-zero). */
export function completionFraction(stats: TaskStats | undefined): number {
  if (!stats) return 0;
  return stats.completionRate;
}

/** Whole-number percent string, e.g. 0.6 → "60%". */
export function toPercentLabel(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

/** "1-day streak" / "12-day streak" compound-adjective label. */
export function streakLabel(days: number): string {
  return `${days}-day streak`;
}

export type AchievementTint = 'teal' | 'violet' | 'gold' | 'coral';

export interface AchievementDef {
  id: string;
  name: string;
  icon: string;
  tint: AchievementTint;
  description: string;
  /** Current progress toward unlock, 0–1. */
  progress: number;
  unlocked: boolean;
  /** e.g. "5 / 10 quests". */
  progressLabel: string;
}

interface RawDef {
  id: string;
  name: string;
  icon: string;
  tint: AchievementTint;
  description: string;
  current: number;
  target: number;
  unit: string;
}

/**
 * Achievements are derived client-side from the real progress stats — there is
 * no achievements backend endpoint yet, so unlock state is computed from
 * `approved`, `streak`, `totalXp` and `level` thresholds rather than fetched.
 * This keeps the UI demoable and correct against real data without inventing an
 * API. Swap for a real `/achievements` fetch once that contract exists.
 */
export function deriveAchievements(home: HomeResponse): AchievementDef[] {
  const approved = home.taskStats?.approved ?? 0;
  const { currentStreak, longestStreak } = home.streak;
  const { totalXp, level } = home.level;

  const raw: RawDef[] = [
    { id: 'first-steps', name: 'First Steps', icon: '🥾', tint: 'teal', description: 'Complete your very first quest.', current: approved, target: 1, unit: 'quest' },
    { id: 'helper', name: 'Helper', icon: '🤝', tint: 'coral', description: 'Approve five quests.', current: approved, target: 5, unit: 'quests' },
    { id: 'explorer', name: 'Explorer', icon: '🏔️', tint: 'violet', description: 'Approve ten quests.', current: approved, target: 10, unit: 'quests' },
    { id: 'quest-master', name: 'Quest Master', icon: '🏆', tint: 'violet', description: 'Approve twenty-five quests.', current: approved, target: 25, unit: 'quests' },
    { id: 'streak-keeper', name: 'Streak Keeper', icon: '🔥', tint: 'coral', description: 'Reach a seven-day streak.', current: currentStreak, target: 7, unit: 'days' },
    { id: 'consistent', name: 'Consistent', icon: '📆', tint: 'teal', description: 'Hit a fourteen-day best streak.', current: longestStreak, target: 14, unit: 'days' },
    { id: 'early-bird', name: 'Early Bird', icon: '🌅', tint: 'gold', description: 'Reach level three.', current: level, target: 3, unit: 'levels' },
    { id: 'xp-hunter', name: 'XP Hunter', icon: '⚡', tint: 'gold', description: 'Bank five hundred XP.', current: totalXp, target: 500, unit: 'XP' },
  ];

  return raw.map((d) => {
    const progress = d.target <= 0 ? 1 : Math.min(d.current / d.target, 1);
    return {
      id: d.id,
      name: d.name,
      icon: d.icon,
      tint: d.tint,
      description: d.description,
      progress,
      unlocked: d.current >= d.target,
      progressLabel: `${Math.min(d.current, d.target)} / ${d.target} ${d.unit}`,
    };
  });
}

/** Count of currently-unlocked achievements. */
export function unlockedCount(defs: AchievementDef[]): number {
  return defs.filter((d) => d.unlocked).length;
}

export type AchievementStatus = 'earned' | 'inProgress' | 'locked';

/** Bucket an achievement: earned (unlocked), in-progress (some progress), or
 * locked (no progress yet). Drives the achievements-grid filter. */
export function achievementStatus(def: AchievementDef): AchievementStatus {
  if (def.unlocked) return 'earned';
  if (def.progress > 0) return 'inProgress';
  return 'locked';
}

export type AchievementFilter = 'all' | AchievementStatus;

/** Apply the grid filter to a list of achievements. */
export function filterAchievements(
  defs: AchievementDef[],
  filter: AchievementFilter,
): AchievementDef[] {
  if (filter === 'all') return defs;
  return defs.filter((d) => achievementStatus(d) === filter);
}

/**
 * Resolve a Halcyon+ palette colour for an achievement tint. The `gold` and
 * `coral` arms now read the dedicated gamification identities (XP amber / Ember
 * streak, design § 2.3) instead of the legacy single-purpose `rewardXp` /
 * `socialCoral` aliases — so an XP-earning or streak achievement badge carries
 * the same hue as that concept everywhere else in the app.
 */
export function tintColor(tint: AchievementTint, colors: CompassPalette): string {
  switch (tint) {
    case 'teal':
      return colors.brandTeal;
    case 'violet':
      return colors.actionPrimary;
    case 'gold':
      return colors.xp;
    case 'coral':
      return colors.streak;
    default:
      return colors.actionPrimary;
  }
}

/**
 * Opaque, theme-aware badge-fill for an achievement tint — the curated identity
 * `*Tint` counterpart of {@link tintColor}. Replaces the former runtime
 * `${color}26` alpha blend over the lavender canvas (which is theme-fragile and,
 * for any text-on-fill, the exact low-contrast pattern flagged twice in this
 * project). Each achievement tint maps to the identity whose hue it already
 * carries, matching the four-identity tint rotation in `22-achievements.html`:
 * teal→Community · violet→Achievement · gold→XP · coral→Streak.
 */
export function tintSurface(tint: AchievementTint, colors: CompassPalette): string {
  switch (tint) {
    case 'teal':
      return colors.communityTint;
    case 'violet':
      return colors.achievementTint;
    case 'gold':
      return colors.xpTint;
    case 'coral':
      return colors.streakTint;
    default:
      return colors.achievementTint;
  }
}

export interface StatTile {
  id: string;
  icon: string;
  caption: string;
  value: string;
  sub: string;
}

/** The four real-data stat tiles shown on the overview grid. */
export function buildStatTiles(streak: StreakInfo, stats: TaskStats | undefined): StatTile[] {
  const safe: TaskStats = stats ?? {
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    completionRate: 0,
  };
  return [
    { id: 'streak', icon: '🔥', caption: 'Streak', value: `${streak.currentStreak}`, sub: 'day streak' },
    { id: 'approved', icon: '✅', caption: 'Approved', value: `${safe.approved}`, sub: 'quests all-time' },
    { id: 'pending', icon: '⏳', caption: 'Under review', value: `${safe.pending}`, sub: 'awaiting proof' },
    { id: 'total', icon: '📆', caption: 'Logged', value: `${safe.total}`, sub: 'quests total' },
  ];
}
