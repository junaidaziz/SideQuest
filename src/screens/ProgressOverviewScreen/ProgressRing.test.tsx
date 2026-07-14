import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ProgressRing, { clampProgress } from './ProgressRing';

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View, createAnimatedComponent: (c: unknown) => c },
    useSharedValue: (v: number) => ({ value: v }),
    useAnimatedStyle: (fn: () => unknown) => fn(),
    withTiming: (v: number) => v,
    Easing: { bezier: () => () => 0 },
  };
});

describe('ProgressRing', () => {
  describe('clampProgress', () => {
    it('clamps into 0–1 and coerces NaN to 0', () => {
      expect(clampProgress(-1)).toBe(0);
      expect(clampProgress(2)).toBe(1);
      expect(clampProgress(0.42)).toBeCloseTo(0.42);
      expect(clampProgress(NaN)).toBe(0);
    });
  });

  describe('rendering', () => {
    it('renders the label and exposes a progressbar with the rounded percent', async () => {
      await render(
        <ProgressRing
          size={64}
          strokeWidth={7}
          progress={0.6}
          trackColor="#eee"
          fillColor="#654"
          holeColor="#fff"
          label="60%"
          accessibilityLabel="Completion rate 60%"
          testID="ring"
        />,
      );
      expect(screen.getByText('60%')).toBeTruthy();
      const ring = screen.getByTestId('ring');
      expect(ring.props.accessibilityRole).toBe('progressbar');
      expect(ring.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 60 });
    });

    it('renders without a label and without animation', async () => {
      await render(
        <ProgressRing
          size={52}
          strokeWidth={6}
          progress={1.5}
          trackColor="#eee"
          fillColor="#654"
          holeColor="#fff"
          animate={false}
          testID="ring2"
        />,
      );
      expect(screen.getByTestId('ring2')).toBeTruthy();
    });
  });
});
