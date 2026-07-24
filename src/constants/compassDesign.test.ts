import {
  CompassColorsLight,
  CompassColorsDark,
  CompassFonts,
  CompassMotion,
  CompassType,
} from './compassDesign';

const HEX = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

describe('Halcyon+ tokens (compassDesign)', () => {
  it('light and dark palettes expose exactly the same keys', () => {
    expect(Object.keys(CompassColorsDark).sort()).toEqual(Object.keys(CompassColorsLight).sort());
  });

  it('every colour value is a valid hex string', () => {
    [...Object.values(CompassColorsLight), ...Object.values(CompassColorsDark)].forEach((value) => {
      expect(value).toMatch(HEX);
    });
  });

  it('carries the Halcyon+ surfaces and primary verbatim from the token css', () => {
    expect(CompassColorsLight.bgCanvas).toBe('#F2F1FB');
    expect(CompassColorsLight.actionPrimary).toBe('#4B48C6');
    expect(CompassColorsDark.actionPrimary).toBe('#84A4F5');
  });

  it('adds the four gamification identities in both themes', () => {
    (['xp', 'achievement', 'streak', 'community'] as const).forEach((id) => {
      expect(CompassColorsLight[id]).toMatch(HEX);
      expect(CompassColorsLight[`${id}Tint`]).toMatch(HEX);
      expect(CompassColorsLight[`${id}Text`]).toMatch(HEX);
      expect(CompassColorsDark[id]).toMatch(HEX);
    });
    expect(CompassColorsLight.xp).toBe('#E6A21E');
    expect(CompassColorsLight.achievement).toBe('#A23FC9');
    expect(CompassColorsLight.streak).toBe('#E8622A');
    expect(CompassColorsLight.community).toBe('#1E88C9');
  });

  it('adds Aurora, on-primary, chart, skeleton and disabled tokens', () => {
    expect(CompassColorsLight.heroGradStart).toBe('#C9CBFF');
    expect(CompassColorsLight.heroGradEnd).toBe('#FBD9BE');
    expect(CompassColorsLight.onHero).toBe('#23243A');
    expect(CompassColorsLight.onPrimary).toBe('#FFFFFF');
    expect(CompassColorsLight.borderStrong).toBe('#807EA2');
    (['chart1', 'chart2', 'chart3', 'chart4', 'chart5', 'chart6'] as const).forEach((c) =>
      expect(CompassColorsLight[c]).toMatch(HEX),
    );
    expect(CompassColorsLight.skeletonBase).toMatch(HEX);
    expect(CompassColorsLight.disabledText).toBe('#A3A2B8');
  });

  it('adds curated status tint/text pairs in both themes', () => {
    (['statusSuccess', 'statusWarning', 'statusError', 'statusInfo'] as const).forEach((s) => {
      expect(CompassColorsLight[`${s}Tint`]).toMatch(HEX);
      expect(CompassColorsLight[`${s}Text`]).toMatch(HEX);
      expect(CompassColorsDark[`${s}Tint`]).toMatch(HEX);
      expect(CompassColorsDark[`${s}Text`]).toMatch(HEX);
    });
    // The badge fix: text is a curated darker/lighter token, never the base fill.
    expect(CompassColorsLight.statusSuccessText).not.toBe(CompassColorsLight.statusSuccess);
  });

  it('exposes a theme-invariant alwaysWhite token identical in both palettes', () => {
    expect(CompassColorsLight.alwaysWhite).toBe('#FFFFFF');
    expect(CompassColorsDark.alwaysWhite).toBe('#FFFFFF');
  });

  it('keeps Plus Jakarta Sans fallback faces named, not raw strings', () => {
    expect(CompassFonts.fallbackHeavy).toBe('PlusJakartaSans_800ExtraBold');
    expect(CompassFonts.fallbackBold).toBe('PlusJakartaSans_700Bold');
  });

  it('aliases borderDefault to the load-bearing strong border', () => {
    expect(CompassColorsLight.borderDefault).toBe(CompassColorsLight.borderStrong);
    expect(CompassColorsDark.borderDefault).toBe(CompassColorsDark.borderStrong);
  });

  it('restores Syne for display and keeps Inter for body/metrics', () => {
    expect(CompassFonts.display).toBe('Syne_800ExtraBold');
    expect(CompassFonts.displayBold).toBe('Syne_700Bold');
    expect(CompassFonts.body).toBe('Inter_400Regular');
    expect(CompassFonts.numeric).toBe('Inter_800ExtraBold');
  });

  it('adds the spring easing to the motion set', () => {
    expect(CompassMotion.easeSpring).toEqual([0.34, 1.56, 0.64, 1]);
    expect(CompassMotion.durationCelebration).toBe(900);
  });

  it('keeps the type scale unchanged from the css spec', () => {
    expect(CompassType.displayXl.size).toBe(36);
    expect(CompassType.metric.weight).toBe('800');
  });
});
