import React from 'react';
import { render } from '@testing-library/react-native';
import { Icon } from './Icon';
import { ICONS, type IconName } from './iconData';

type JsonNode = { type?: string; props?: Record<string, unknown>; children?: unknown };

/** Flattens a react-test-renderer JSON tree into a list of nodes. */
function collect(node: unknown, acc: JsonNode[] = []): JsonNode[] {
  if (!node || typeof node !== 'object') return acc;
  const n = node as JsonNode;
  acc.push(n);
  const kids = n.children;
  if (Array.isArray(kids)) kids.forEach((k) => collect(k, acc));
  return acc;
}

// react-native-svg parses colours (hex string → a numeric payload object) and
// coerces fill="none" → null. So drawable nodes are identified structurally:
// an outline node carries a numeric strokeWidth; a filled node carries a
// truthy fill with no strokeWidth.
const drawables = (tree: unknown) =>
  collect(tree).filter((n) => n.type === 'RNSVGPath' || n.type === 'RNSVGCircle' || n.type === 'RNSVGRect');

describe('Icon', () => {
  describe('rendering', () => {
    it('renders every glyph in the set without error', async () => {
      const names = Object.keys(ICONS) as IconName[];
      for (const name of names) {
        const { toJSON } = await render(<Icon name={name} testID={`ic-${name}`} />);
        const root = toJSON() as JsonNode | null;
        expect(root?.type).toBe('RNSVGSvgView');
        expect(drawables(root).length).toBeGreaterThan(0);
      }
    });

    it('applies a custom size to the svg box', async () => {
      const { toJSON } = await render(<Icon name="search" size={28} />);
      const root = toJSON() as JsonNode;
      expect(root.props?.width).toBe(28);
      expect(root.props?.height).toBe(28);
    });

    it('defaults to a 24px box', async () => {
      const { toJSON } = await render(<Icon name="search" />);
      expect((toJSON() as JsonNode).props?.width).toBe(24);
    });
  });

  describe('outline vs filled', () => {
    it('strokes the outline (strokeWidth 1.75, no fill) by default', async () => {
      const { toJSON } = await render(<Icon name="search" color="#123456" />);
      const nodes = drawables(toJSON());
      expect(nodes.length).toBeGreaterThan(0);
      nodes.forEach((n) => {
        expect(n.props?.strokeWidth).toBe(1.75);
        expect(n.props?.fill).toBeNull();
      });
    });

    it('fills (no stroke width) when selected and a filled variant exists', async () => {
      const { toJSON } = await render(<Icon name="today" color="#ABCDEF" selected />);
      const nodes = drawables(toJSON());
      expect(nodes.length).toBeGreaterThan(0);
      nodes.forEach((n) => {
        expect(n.props?.strokeWidth).toBeUndefined();
        expect(n.props?.fill).toBeTruthy();
      });
    });

    it('falls back to the outline when selected but no filled variant exists', async () => {
      const { toJSON } = await render(<Icon name="explore" color="#00FF00" selected />);
      const nodes = drawables(toJSON());
      expect(nodes.every((n) => n.props?.strokeWidth === 1.75)).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('is decorative (hidden) by default', async () => {
      const { toJSON } = await render(<Icon name="bell" />);
      const root = toJSON() as JsonNode;
      expect(root.props?.accessibilityElementsHidden).toBe(true);
      expect(root.props?.importantForAccessibility).toBe('no-hide-descendants');
      expect(root.props?.accessibilityRole).toBe('none');
      expect(root.props?.accessible).toBe(false);
    });

    it('exposes an image role and label when accessibilityLabel is provided', async () => {
      const { getByTestId } = await render(
        <Icon name="bell" accessibilityLabel="Notifications" testID="ic" />,
      );
      const svg = getByTestId('ic');
      expect(svg.props.accessibilityElementsHidden).toBe(false);
      expect(svg.props.accessibilityRole).toBe('image');
      expect(svg.props.accessibilityLabel).toBe('Notifications');
      expect(svg.props.accessible).toBe(true);
    });
  });
});
