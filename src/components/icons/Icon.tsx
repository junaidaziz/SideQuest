import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { ICONS, type IconName, type IconPrimitive } from './iconData';

export interface IconProps {
  /** Which glyph to draw. */
  name: IconName;
  /** Rendered box size in px (glyph scales; stroke stays 1.75 in viewBox units). Default 24. */
  size?: number;
  /**
   * Glyph colour. Halcyon+ icons inherit token colours — pass a resolved token
   * (e.g. `colors.actionPrimary` for active nav, `colors.textTertiary` for meta
   * rows, an identity hue inside a gamification well). Default `#000000`.
   */
  color?: string;
  /**
   * When true, renders the solid variant if the glyph defines one (bottom-nav
   * "you are here"). Glyphs without a filled variant fall back to the outline,
   * still distinguished by the active `color`. Default false.
   */
  selected?: boolean;
  /**
   * Screen-reader label. Omit for decorative icons whose meaning the parent
   * control already announces (the default) — the icon is then hidden from
   * assistive tech so a screen reader never reads a redundant glyph name.
   */
  accessibilityLabel?: string;
  testID?: string;
}

const STROKE_WIDTH = 1.75;
const VIEWBOX = 24;

function renderPrimitive(
  primitive: IconPrimitive,
  index: number,
  strokeColor: string | undefined,
  fillColor: string,
): React.ReactElement {
  const key = `p${index}`;
  switch (primitive.kind) {
    case 'circle':
      return (
        <Circle
          key={key}
          cx={primitive.cx}
          cy={primitive.cy}
          r={primitive.r}
          stroke={strokeColor}
          strokeWidth={strokeColor ? STROKE_WIDTH : undefined}
          fill={fillColor}
        />
      );
    case 'rect':
      return (
        <Rect
          key={key}
          x={primitive.x}
          y={primitive.y}
          width={primitive.width}
          height={primitive.height}
          rx={primitive.rx}
          stroke={strokeColor}
          strokeWidth={strokeColor ? STROKE_WIDTH : undefined}
          fill={fillColor}
        />
      );
    default:
      return (
        <Path
          key={key}
          d={primitive.d}
          stroke={strokeColor}
          strokeWidth={strokeColor ? STROKE_WIDTH : undefined}
          fill={fillColor}
        />
      );
  }
}

/**
 * Shared Halcyon+ icon. Data-driven from {@link ICONS}: a single component that
 * maps a `name` to path data, rather than one component per glyph.
 *
 * Rounded caps + joins, 1.75px stroke on a 24px grid. Decorative by default
 * (hidden from assistive tech); pass `accessibilityLabel` to expose it as an
 * image with a name.
 */
export function Icon({
  name,
  size = 24,
  color = '#000000',
  selected = false,
  accessibilityLabel,
  testID,
}: IconProps): React.ReactElement {
  const glyph = ICONS[name];
  const useFilled = selected && glyph.filled != null;
  const primitives = useFilled ? glyph.filled! : glyph.outline;

  // Filled variant: solid fill, no stroke. Outline: coloured stroke, no fill.
  const strokeColor = useFilled ? undefined : color;
  const fillColor = useFilled ? color : 'none';

  const isDecorative = accessibilityLabel == null;

  return (
    <Svg
      testID={testID}
      width={size}
      height={size}
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      accessible={!isDecorative}
      accessibilityRole={isDecorative ? 'none' : 'image'}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={isDecorative}
      importantForAccessibility={isDecorative ? 'no-hide-descendants' : 'yes'}
    >
      {primitives.map((primitive, index) => renderPrimitive(primitive, index, strokeColor, fillColor))}
    </Svg>
  );
}
