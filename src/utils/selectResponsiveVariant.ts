import { PixelRatio } from 'react-native';
import type { MediaVariant } from '../types/api';

/**
 * Picks the smallest available variant whose real pixel width covers the
 * requested logical (point) render width on this device's density — falling
 * back to the largest variant when every one is smaller than needed (an
 * upscaled slightly-soft image beats a broken/oversized-download tradeoff).
 * Returns null only when there are no variants to choose from at all.
 *
 * Pure and platform-density-aware via `PixelRatio.get()` — a 1x device needs
 * far less data than a 3x device for the same on-screen size, and this is
 * the one place that decision is made so no screen has to reimplement it.
 */
export function selectResponsiveVariant(
  variants: readonly MediaVariant[] | null | undefined,
  targetWidthPoints: number,
): MediaVariant | null {
  if (!variants || variants.length === 0) {
    return null;
  }
  const neededPixels = targetWidthPoints * PixelRatio.get();
  const sorted = [...variants].sort((a, b) => a.width - b.width);
  return sorted.find((variant) => variant.width >= neededPixels) ?? sorted[sorted.length - 1];
}
