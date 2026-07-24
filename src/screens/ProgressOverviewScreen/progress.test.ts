import {
  RANKS,
  achievementStatus,
  buildStatTiles,
  completionFraction,
  deriveAchievements,
  filterAchievements,
  formatXp,
  levelName,
  levelProgress,
  nextLevelName,
  streakLabel,
  tintColor,
  tintSurface,
  toPercentLabel,
  unlockedCount,
  type AchievementDef,
} from './progress';
import { CompassColorsLight } from '../../constants/compassDesign';
import type { HomeResponse } from '../../types/api';

const HOME: HomeResponse = {
  level: { level: 7, xpIntoLevel: 70, xpToNextLevel: 30, totalXp: 720 },
  streak: { currentStreak: 12, longestStreak: 20 },
  dailyMission: null,
  pendingChallenges: [],
  savedPacks: [],
  taskStats: { total: 60, approved: 48, pending: 8, rejected: 4, completionRate: 0.8 },
};

describe('progress helpers', () => {
  describe('levelName / nextLevelName', () => {
    it('maps level 7 to Trailblazer and 8 to Cartographer (matches mockup)', () => {
      expect(levelName(7)).toBe('Trailblazer');
      expect(nextLevelName(7)).toBe('Cartographer');
    });

    it('clamps below zero to the first rank', () => {
      expect(levelName(-5)).toBe(RANKS[0]);
    });

    it('clamps above the ladder to the top rank', () => {
      expect(levelName(999)).toBe(RANKS[RANKS.length - 1]);
      expect(nextLevelName(999)).toBe(RANKS[RANKS.length - 1]);
    });
  });

  describe('formatXp', () => {
    it('groups thousands', () => {
      expect(formatXp(2450)).toBe('2,450');
      expect(formatXp(0)).toBe('0');
    });
  });

  describe('levelProgress', () => {
    it('computes within-level fraction', () => {
      expect(levelProgress(HOME.level)).toBeCloseTo(0.7);
    });

    it('guards the empty curve (no NaN)', () => {
      expect(levelProgress({ level: 0, xpIntoLevel: 0, xpToNextLevel: 0, totalXp: 0 })).toBe(0);
    });
  });

  describe('completionFraction / toPercentLabel', () => {
    it('reads completionRate', () => {
      expect(completionFraction(HOME.taskStats)).toBe(0.8);
    });

    it('returns 0 when stats missing', () => {
      expect(completionFraction(undefined)).toBe(0);
    });

    it('formats percent labels', () => {
      expect(toPercentLabel(0.8)).toBe('80%');
      expect(toPercentLabel(0)).toBe('0%');
    });
  });

  describe('streakLabel', () => {
    it('renders compound-adjective form', () => {
      expect(streakLabel(0)).toBe('0-day streak');
      expect(streakLabel(12)).toBe('12-day streak');
    });
  });

  describe('deriveAchievements', () => {
    it('unlocks achievements whose thresholds are met', () => {
      const defs = deriveAchievements(HOME);
      const first = defs.find((d) => d.id === 'first-steps');
      const master = defs.find((d) => d.id === 'quest-master');
      expect(first?.unlocked).toBe(true);
      expect(master?.unlocked).toBe(true);
    });

    it('leaves higher thresholds locked with partial progress', () => {
      const low: HomeResponse = {
        ...HOME,
        streak: { currentStreak: 1, longestStreak: 1 },
        level: { level: 1, xpIntoLevel: 10, xpToNextLevel: 90, totalXp: 10 },
        taskStats: { total: 2, approved: 2, pending: 0, rejected: 0, completionRate: 1 },
      };
      const defs = deriveAchievements(low);
      const xpHunter = defs.find((d) => d.id === 'xp-hunter');
      expect(xpHunter?.unlocked).toBe(false);
      expect(xpHunter?.progress).toBeCloseTo(10 / 500);
      expect(xpHunter?.progressLabel).toBe('10 / 500 XP');
    });

    it('treats a missing taskStats.approved as zero', () => {
      const noStats = { ...HOME, taskStats: undefined } as unknown as HomeResponse;
      const defs = deriveAchievements(noStats);
      expect(defs.find((d) => d.id === 'first-steps')?.unlocked).toBe(false);
    });
  });

  describe('unlockedCount', () => {
    it('counts unlocked entries', () => {
      const defs = deriveAchievements(HOME);
      expect(unlockedCount(defs)).toBeGreaterThan(0);
      expect(unlockedCount([])).toBe(0);
    });
  });

  describe('achievementStatus / filterAchievements', () => {
    const mk = (progress: number, unlocked: boolean): AchievementDef => ({
      id: 'x',
      name: 'x',
      icon: 'x',
      tint: 'teal',
      description: 'x',
      progress,
      unlocked,
      progressLabel: 'x',
    });

    it('buckets earned, in-progress and locked', () => {
      expect(achievementStatus(mk(1, true))).toBe('earned');
      expect(achievementStatus(mk(0.5, false))).toBe('inProgress');
      expect(achievementStatus(mk(0, false))).toBe('locked');
    });

    it('filters by each bucket and passes through "all"', () => {
      const list = [mk(1, true), mk(0.5, false), mk(0, false)];
      expect(filterAchievements(list, 'all')).toHaveLength(3);
      expect(filterAchievements(list, 'earned')).toHaveLength(1);
      expect(filterAchievements(list, 'inProgress')).toHaveLength(1);
      expect(filterAchievements(list, 'locked')).toHaveLength(1);
    });
  });

  describe('tintColor', () => {
    it('resolves every tint plus the default branch', () => {
      expect(tintColor('teal', CompassColorsLight)).toBe(CompassColorsLight.brandTeal);
      expect(tintColor('violet', CompassColorsLight)).toBe(CompassColorsLight.actionPrimary);
      expect(tintColor('gold', CompassColorsLight)).toBe(CompassColorsLight.xp);
      expect(tintColor('coral', CompassColorsLight)).toBe(CompassColorsLight.streak);
      // Unknown tint falls through to the default arm.
      expect(tintColor('unknown' as never, CompassColorsLight)).toBe(CompassColorsLight.actionPrimary);
    });
  });

  describe('tintSurface', () => {
    it('maps every tint to its identity tint plus the default branch', () => {
      expect(tintSurface('teal', CompassColorsLight)).toBe(CompassColorsLight.communityTint);
      expect(tintSurface('violet', CompassColorsLight)).toBe(CompassColorsLight.achievementTint);
      expect(tintSurface('gold', CompassColorsLight)).toBe(CompassColorsLight.xpTint);
      expect(tintSurface('coral', CompassColorsLight)).toBe(CompassColorsLight.streakTint);
      // Unknown tint falls through to the default arm.
      expect(tintSurface('unknown' as never, CompassColorsLight)).toBe(CompassColorsLight.achievementTint);
    });
  });

  describe('buildStatTiles', () => {
    it('builds four tiles from real stats', () => {
      const tiles = buildStatTiles(HOME.streak, HOME.taskStats);
      expect(tiles.map((t) => t.id)).toEqual(['streak', 'approved', 'pending', 'total']);
      expect(tiles[0].value).toBe('12');
      expect(tiles[1].value).toBe('48');
    });

    it('falls back to zeros when taskStats is missing', () => {
      const tiles = buildStatTiles(HOME.streak, undefined);
      expect(tiles[1].value).toBe('0');
      expect(tiles[3].value).toBe('0');
    });
  });
});
