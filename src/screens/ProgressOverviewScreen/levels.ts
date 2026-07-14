import { levelName } from './progress';

/**
 * Level-curve helpers for the level/XP detail screens (20, 21).
 *
 * The backend uses a documented flat 100-XP-per-level curve: a user enters
 * level `L` at `(L - 1) * 100` total XP. These helpers derive the level map and
 * rank blurbs purely from that curve + the real `LevelInfo` — no extra fetch.
 */

/** Total XP required to *enter* a given level (start-of-level threshold). */
export function xpForLevel(level: number): number {
  return Math.max(0, level - 1) * 100;
}

const BLURBS: Record<string, string> = {
  Trailblazer: 'You seek out the unfamiliar and leave a trail others can follow.',
  Cartographer: 'You map new ground so the next explorer travels lighter.',
  Explorer: 'You go where curiosity points and rarely look back.',
  Wanderer: 'Every ordinary street hides a small adventure for you.',
  Newcomer: 'Your first quests are the start of a much longer journey.',
};

/** Short flavour text for a rank, with a graceful generic fallback. */
export function levelBlurb(level: number): string {
  const name = levelName(level);
  return BLURBS[name] ?? `As ${name}, you keep turning everyday moments into quests.`;
}

export type LevelNodeStatus = 'done' | 'current' | 'locked';

export interface LevelNode {
  level: number;
  name: string;
  xp: number;
  status: LevelNodeStatus;
}

/**
 * A window of the level ladder centred on the current level: one below through
 * two above (clamped at level 1). Used for the "Level map" section.
 */
export function buildLevelMap(current: number): LevelNode[] {
  const start = Math.max(1, current - 1);
  const nodes: LevelNode[] = [];
  for (let lvl = start; lvl <= current + 2; lvl += 1) {
    let status: LevelNodeStatus = 'locked';
    if (lvl < current) status = 'done';
    else if (lvl === current) status = 'current';
    nodes.push({ level: lvl, name: levelName(lvl), xp: xpForLevel(lvl), status });
  }
  return nodes;
}

export interface LevelMilestone {
  level: number;
  name: string;
  xp: number;
  reached: boolean;
}

/** Next-milestones list for the XP detail screen (current + next two). */
export function buildMilestones(current: number): LevelMilestone[] {
  const out: LevelMilestone[] = [];
  for (let lvl = current; lvl <= current + 2; lvl += 1) {
    out.push({ level: lvl, name: levelName(lvl), xp: xpForLevel(lvl), reached: lvl <= current });
  }
  return out;
}
