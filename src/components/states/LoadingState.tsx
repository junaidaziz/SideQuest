import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { CompassSpacing } from '../../constants/compassDesign';
import { Skeleton, SkeletonRow } from './Skeleton';

export type LoadingVariant = 'today' | 'list' | 'section';

export interface LoadingStateProps {
  /**
   * Skeleton layout to render. `today` mirrors the home hero + metric layout,
   * `list` a stack of cards, `section` a couple of text lines. Header/nav are
   * expected to stay mounted by the host screen — this fills the body only.
   */
  variant?: LoadingVariant;
  /** Announced once to assistive tech via a polite live region. */
  label?: string;
  /** Card count for the `list` variant. */
  count?: number;
  testID?: string;
}

/**
 * Global loading pattern (mockup 41). Renders shimmer skeletons plus a single
 * visually-hidden status announcement so screen readers hear "Loading …" once
 * instead of reading every placeholder. Never blocks the header or nav.
 */
export function LoadingState({
  variant = 'section',
  label = 'Loading',
  count = 3,
  testID,
}: LoadingStateProps) {
  return (
    <View style={styles.wrap} accessibilityState={{ busy: true }} testID={testID}>
      <Text
        accessibilityRole="text"
        accessibilityLiveRegion="polite"
        style={styles.srOnly}
      >
        {label}
      </Text>
      {variant === 'today' ? <TodaySkeleton /> : null}
      {variant === 'list' ? <ListSkeleton count={count} /> : null}
      {variant === 'section' ? <SectionSkeleton /> : null}
    </View>
  );
}

function TodaySkeleton() {
  return (
    <>
      <Skeleton height={168} radius={28} testID="skeleton-hero" />
      <SkeletonRow>
        <Skeleton height={92} radius={20} style={styles.flex13} />
        <Skeleton height={92} radius={20} style={styles.flex1} />
      </SkeletonRow>
      <Skeleton width="45%" height={12} />
      <Skeleton height={76} radius={20} />
    </>
  );
}

function ListSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: Math.max(1, count) }).map((_, i) => (
        <Skeleton key={i} height={76} radius={20} testID={`skeleton-card-${i}`} />
      ))}
    </>
  );
}

function SectionSkeleton() {
  return (
    <>
      <Skeleton width="60%" height={12} />
      <Skeleton width="80%" height={12} />
      <Skeleton height={76} radius={20} />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: CompassSpacing.gutterPhone,
    gap: CompassSpacing.s4,
  },
  flex13: { flex: 1.3 },
  flex1: { flex: 1 },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    opacity: 0,
  },
});
