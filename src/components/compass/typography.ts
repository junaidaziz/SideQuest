import type { TextStyle } from 'react-native';
import { CompassType } from '../../constants/compassDesign';

/**
 * Resolves a Compass type-scale role into a React Native TextStyle.
 * Keeps every Compass screen reading font size / line-height / weight /
 * tracking from the single `CompassType` token table rather than re-deriving
 * per-component. `letterSpacing` is only present on the display/heading/metric
 * roles, so it is spread conditionally.
 */
export function textStyle(role: keyof typeof CompassType): TextStyle {
  const t = CompassType[role];
  const style: TextStyle = {
    fontSize: t.size,
    lineHeight: t.lineHeight,
    fontWeight: t.weight,
  };
  if ('letterSpacing' in t) {
    style.letterSpacing = (t as { letterSpacing: number }).letterSpacing;
  }
  return style;
}
