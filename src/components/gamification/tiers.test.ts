import { CompassColorsLight, CompassColorsDark } from '../../constants/compassDesign';
import { TIER_META, tierVisual, type AchievementTier } from './tiers';

describe('tiers', () => {
  const allTiers: AchievementTier[] = [1, 2, 3, 4, 5];

  it('names and pip counts match the 5-tier spec', () => {
    expect(TIER_META[1]).toMatchObject({ name: 'Common', pips: '◆' });
    expect(TIER_META[3]).toMatchObject({ name: 'Rare', pips: '◆◆◆' });
    expect(TIER_META[5]).toMatchObject({ name: 'Legendary', pips: '◆◆◆◆◆' });
    allTiers.forEach((t) => expect(TIER_META[t].pips.length).toBe(t));
  });

  it('gives lower tiers a solid fill and higher tiers a gradient', () => {
    expect(tierVisual(1, CompassColorsLight).fill).toHaveLength(1);
    expect(tierVisual(2, CompassColorsLight).fill).toHaveLength(1);
    expect(tierVisual(3, CompassColorsLight).fill).toHaveLength(1);
    expect(tierVisual(4, CompassColorsLight).fill.length).toBeGreaterThan(1);
    expect(tierVisual(5, CompassColorsLight).fill.length).toBeGreaterThan(1);
  });

  it('anchors Rare on the amethyst achievement colour', () => {
    expect(tierVisual(3, CompassColorsLight).fill[0]).toBe(CompassColorsLight.achievement);
  });

  it('only Epic and Legendary carry the celebration glow', () => {
    expect(tierVisual(1, CompassColorsLight).glow).toBe(false);
    expect(tierVisual(3, CompassColorsLight).glow).toBe(false);
    expect(tierVisual(4, CompassColorsLight).glow).toBe(true);
    expect(tierVisual(5, CompassColorsLight).glow).toBe(true);
  });

  it('gives Legendary a gold rim; lower tiers have none', () => {
    expect(tierVisual(5, CompassColorsLight).rim).toBe(CompassColorsLight.brandGold);
    expect(tierVisual(3, CompassColorsLight).rim).toBeUndefined();
  });

  it('resolves the glow colour from the active theme (not a fixed orange)', () => {
    // Spark hue differs by theme (#EE6C4D light / #F2895C dark) — the glow must
    // track it so dark mode does not stay light-mode orange.
    expect(tierVisual(5, CompassColorsLight).glowColor).toBe(CompassColorsLight.brandCoral);
    expect(tierVisual(5, CompassColorsDark).glowColor).toBe(CompassColorsDark.brandCoral);
    expect(tierVisual(5, CompassColorsLight).glowColor).not.toBe(
      tierVisual(5, CompassColorsDark).glowColor,
    );
  });
});
