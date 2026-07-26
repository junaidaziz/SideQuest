import React, { useMemo } from 'react';
import { StyleProp } from 'react-native';
import { Image, ImageContentFit, ImageStyle } from 'expo-image';
import type { MediaVariant } from '../../types/api';
import { selectResponsiveVariant } from '../../utils/selectResponsiveVariant';

export interface ResponsiveImageProps {
  /** Every ready delivery size for this image — see `UserProfileDto.avatarVariants`. */
  variants?: readonly MediaVariant[] | null;
  /**
   * Single fixed-size URL to use when `variants` is empty (an avatar still
   * processing, or on the legacy direct-upload path) — never both sources
   * used together, `variants` always wins when non-empty.
   */
  fallbackUrl?: string | null;
  /** Logical (point) render width — drives which variant is selected for this device's pixel density. */
  width: number;
  /** Defaults to `width` (square) when omitted. */
  height?: number;
  contentFit?: ImageContentFit;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
  /** Pass true when a sibling/parent element (e.g. a Pressable avatar button) already carries the meaningful label, making this image purely decorative. */
  accessibilityElementsHidden?: boolean;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
  testID?: string;
}

/**
 * Renders nothing (returns null) when neither a variant nor a fallback URL
 * resolves to a real source — callers own their own empty-state fallback
 * (e.g. initials) by conditionally rendering this component in the first
 * place, the same way every screen already conditionally rendered a raw
 * `<Image>` before this component existed.
 */
export function ResponsiveImage({
  variants,
  fallbackUrl,
  width,
  height,
  contentFit = 'cover',
  style,
  accessibilityLabel,
  accessibilityElementsHidden,
  importantForAccessibility,
  testID,
}: ResponsiveImageProps): React.JSX.Element | null {
  const uri = useMemo(() => {
    const selected = selectResponsiveVariant(variants, width);
    return selected?.url ?? fallbackUrl ?? null;
  }, [variants, width, fallbackUrl]);

  if (!uri) {
    return null;
  }

  return (
    <Image
      testID={testID}
      source={{ uri }}
      style={[{ width, height: height ?? width }, style]}
      contentFit={contentFit}
      // Content-addressed keys (see MediaUrlService on the backend) mean a
      // given URL's bytes never change — safe to cache aggressively across
      // app sessions, not just in-memory for the current one.
      cachePolicy="memory-disk"
      transition={150}
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={accessibilityElementsHidden}
      importantForAccessibility={importantForAccessibility}
      accessibilityIgnoresInvertColors
    />
  );
}
