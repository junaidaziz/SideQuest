import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { Skeleton, SkeletonRow } from './Skeleton';

describe('Skeleton', () => {
  it('renders hidden from assistive tech', async () => {
    const { getByTestId } = await render(<Skeleton testID="sk" />);
    const node = getByTestId('sk', { includeHiddenElements: true });
    expect(node.props.accessibilityElementsHidden).toBe(true);
    expect(node.props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('applies custom width, height and radius', async () => {
    const { getByTestId } = await render(
      <Skeleton testID="sk" width={120} height={40} radius={8} />,
    );
    const node = getByTestId('sk', { includeHiddenElements: true });
    const flat = Array.isArray(node.props.style)
      ? Object.assign({}, ...node.props.style.flat())
      : node.props.style;
    expect(flat.width).toBe(120);
    expect(flat.height).toBe(40);
    expect(flat.borderRadius).toBe(8);
  });

  it('renders a skeleton row wrapper around its children', async () => {
    const { getByText } = await render(
      <SkeletonRow>
        <Text>child</Text>
      </SkeletonRow>,
    );
    expect(getByText('child')).toBeTruthy();
  });
});
