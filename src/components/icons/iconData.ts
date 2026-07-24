/**
 * Halcyon+ icon set — path data for the shared {@link Icon} component.
 *
 * Spec (design doc § 5.1 Iconography): 24px grid, 1.75px stroke, fully rounded
 * caps *and* joins, `currentColor`-equivalent (driven by the `color` prop).
 * Outline everywhere; a `filled` variant is supplied only for the bottom-nav
 * glyphs, where a solid weight signals "you are here" for the selected tab.
 *
 * Stored as data (primitive descriptors on the 0 0 24 24 viewBox) rather than
 * 20 separate components, so the set stays in one maintainable place. The
 * representative outline set is transcribed from the inline SVG gallery in
 * `product-redesign/halcyon-plus/index.html` § Iconography; the remaining
 * glyphs (check / close / chevron / lock / flame / trophy) replace the emoji
 * and Unicode arrows the current screens render today.
 */

/** A single drawable primitive on the 24×24 viewBox. */
export type IconPrimitive =
  | { readonly kind: 'path'; readonly d: string }
  | { readonly kind: 'circle'; readonly cx: number; readonly cy: number; readonly r: number }
  | {
      readonly kind: 'rect';
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
      readonly rx?: number;
    };

interface IconGlyph {
  /** Stroked outline — the default rendering. */
  readonly outline: readonly IconPrimitive[];
  /** Optional solid variant used when `selected` (bottom-nav "you are here"). */
  readonly filled?: readonly IconPrimitive[];
}

const path = (d: string): IconPrimitive => ({ kind: 'path', d });
const circle = (cx: number, cy: number, r: number): IconPrimitive => ({ kind: 'circle', cx, cy, r });
const rect = (x: number, y: number, width: number, height: number, rx?: number): IconPrimitive => ({
  kind: 'rect',
  x,
  y,
  width,
  height,
  rx,
});

const ICON_DATA = {
  // ---- Bottom nav (each has a filled "selected" variant) ----
  today: {
    outline: [path('M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z'), path('M9 21v-6h6v6')],
    filled: [path('M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z')],
  },
  explore: {
    outline: [circle(12, 12, 9), path('m15.5 8.5-2 5-5 2 2-5z')],
  },
  progress: {
    outline: [path('M4 20V10M10 20V4M16 20v-7')],
    filled: [rect(2.75, 10, 3, 10, 1.2), rect(8.5, 4, 3, 16, 1.2), rect(14.5, 13, 3, 7, 1.2)],
  },
  you: {
    outline: [circle(12, 8, 4), path('M4 21a8 8 0 0 1 16 0')],
    filled: [circle(12, 8, 4), path('M4 21a8 8 0 0 1 16 0z')],
  },
  // ---- Actions ----
  add: { outline: [path('M12 5v14M5 12h14')] },
  search: { outline: [circle(11, 11, 7), path('m16 16 4 4')] },
  bell: { outline: [path('M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6'), path('M10 20a2 2 0 0 0 4 0')] },
  bookmark: { outline: [path('M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z')] },
  share: {
    outline: [
      circle(6, 12, 2.5),
      circle(17, 6, 2.5),
      circle(17, 18, 2.5),
      path('m8.2 10.8 6.6-3.6M8.2 13.2l6.6 3.6'),
    ],
  },
  filter: { outline: [path('M4 6h16M4 12h16M4 18h10')] },
  settings: {
    outline: [
      circle(12, 12, 3),
      path(
        'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9',
      ),
    ],
  },
  back: { outline: [path('m15 5-7 7 7 7')] },
  chevronRight: { outline: [path('m9 5 7 7-7 7')] },
  close: { outline: [path('M6 6l12 12M18 6 6 18')] },
  check: { outline: [path('M5 12.5 9.5 17 19 6.5')] },
  lock: { outline: [rect(5, 11, 14, 9, 2), path('M8 11V8a4 4 0 0 1 8 0v3')] },
  // ---- Brand / gamification ----
  spark: { outline: [path('m12 3 2.3 4.9 5.4.7-4 3.7 1 5.3L12 15l-4.7 2.6 1-5.3-4-3.7 5.4-.7z')] },
  leaf: { outline: [path('M12 3s6 2 6 8-6 10-6 10-6-4-6-10 6-8 6-8z'), path('M9 11c1.5-2 4.5-2 6 0')] },
  flame: {
    outline: [path('M12 3c3 3.5 5 6 5 9a5 5 0 0 1-10 0c0-1.6.6-2.9 1.6-3.9C9.4 9.6 11 7.5 12 3z')],
  },
  trophy: {
    outline: [
      path('M7 4h10v4a5 5 0 0 1-10 0z'),
      path('M12 13v4M8.5 20h7M10 20v-3h4v3'),
      path('M7 5H4.5v1.6A3.5 3.5 0 0 0 7.6 10'),
      path('M17 5h2.5v1.6A3.5 3.5 0 0 1 16.4 10'),
    ],
  },
} satisfies Record<string, IconGlyph>;

export type IconName = keyof typeof ICON_DATA;

/**
 * The icon set, widened to `Record<IconName, IconGlyph>` so consumers can read
 * the optional `filled` on any glyph without narrowing to each literal entry.
 */
export const ICONS: Record<IconName, IconGlyph> = ICON_DATA;
