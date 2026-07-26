import React from 'react';
import { render } from '@testing-library/react-native';
import { PixelRatio } from 'react-native';
import { ResponsiveImage } from './ResponsiveImage';
import type { MediaVariant } from '../../types/api';

function variant(name: string, width: number, url = `https://cdn.example/${name}.webp`): MediaVariant {
  return { name, url, width, height: width, format: 'webp' };
}

describe('ResponsiveImage', () => {
  beforeEach(() => {
    jest.spyOn(PixelRatio, 'get').mockReturnValue(1);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the smallest variant that covers the requested width', async () => {
    const variants = [variant('xs', 120), variant('md', 240, 'https://cdn.example/md.webp')];

    const { getByTestId } = await render(
      <ResponsiveImage variants={variants} width={48} testID="avatar-image" />,
    );

    const image = getByTestId('avatar-image');
    expect(image.props.source).toEqual([{ uri: 'https://cdn.example/xs.webp' }]);
  });

  it('falls back to fallbackUrl when there are no variants', async () => {
    const { getByTestId } = await render(
      <ResponsiveImage
        variants={[]}
        fallbackUrl="https://legacy.example/avatar.jpg"
        width={48}
        testID="avatar-image"
      />,
    );

    expect(getByTestId('avatar-image').props.source).toEqual([
      { uri: 'https://legacy.example/avatar.jpg' },
    ]);
  });

  it('prefers a variant over fallbackUrl when both are present', async () => {
    const { getByTestId } = await render(
      <ResponsiveImage
        variants={[variant('xs', 120)]}
        fallbackUrl="https://legacy.example/avatar.jpg"
        width={48}
        testID="avatar-image"
      />,
    );

    expect(getByTestId('avatar-image').props.source).toEqual([
      { uri: 'https://cdn.example/xs.webp' },
    ]);
  });

  it('renders nothing when there is no variant and no fallback URL', async () => {
    const { queryByTestId } = await render(
      <ResponsiveImage variants={[]} fallbackUrl={null} width={48} testID="avatar-image" />,
    );

    expect(queryByTestId('avatar-image')).toBeNull();
  });

  it('defaults height to width for a square image', async () => {
    const { getByTestId } = await render(
      <ResponsiveImage variants={[variant('xs', 120)]} width={64} testID="avatar-image" />,
    );

    const style = getByTestId('avatar-image').props.style;
    const flattened = Array.isArray(style) ? Object.assign({}, ...style) : style;
    expect(flattened.width).toBe(64);
    expect(flattened.height).toBe(64);
  });

  it('applies an explicit height when given (non-square, e.g. evidence photos)', async () => {
    const { getByTestId } = await render(
      <ResponsiveImage
        variants={[variant('thumb', 240)]}
        width={240}
        height={160}
        testID="avatar-image"
      />,
    );

    const style = getByTestId('avatar-image').props.style;
    const flattened = Array.isArray(style) ? Object.assign({}, ...style) : style;
    expect(flattened.width).toBe(240);
    expect(flattened.height).toBe(160);
  });

  it('marks itself accessible only when an accessibilityLabel is supplied', async () => {
    const withLabel = await render(
      <ResponsiveImage
        variants={[variant('xs', 120)]}
        width={48}
        accessibilityLabel="Your profile photo"
        testID="labeled"
      />,
    );
    expect(withLabel.getByTestId('labeled').props.accessible).toBe(true);
    expect(withLabel.getByTestId('labeled').props.accessibilityLabel).toBe('Your profile photo');

    const withoutLabel = await render(
      <ResponsiveImage variants={[variant('xs', 120)]} width={48} testID="unlabeled" />,
    );
    expect(withoutLabel.getByTestId('unlabeled').props.accessible).toBe(false);
  });

  it('passes through decorative-image accessibility props', async () => {
    const { getByTestId } = await render(
      <ResponsiveImage
        variants={[variant('xs', 120)]}
        width={48}
        accessibilityElementsHidden
        importantForAccessibility="no"
        testID="avatar-image"
      />,
    );

    const image = getByTestId('avatar-image', { includeHiddenElements: true });
    expect(image.props.accessibilityElementsHidden).toBe(true);
    expect(image.props.importantForAccessibility).toBe('no');
  });
});
