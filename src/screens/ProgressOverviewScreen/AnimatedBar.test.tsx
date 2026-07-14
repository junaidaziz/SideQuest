import React from 'react';
import { render, screen } from '@testing-library/react-native';
import AnimatedBar, { clampBar } from './AnimatedBar';

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

describe('AnimatedBar', () => {
  describe('clampBar', () => {
    it('clamps into 0–1 and coerces NaN to 0', () => {
      expect(clampBar(-0.5)).toBe(0);
      expect(clampBar(3)).toBe(1);
      expect(clampBar(0.25)).toBeCloseTo(0.25);
      expect(clampBar(NaN)).toBe(0);
    });
  });

  describe('rendering', () => {
    it('renders a progressbar with a derived accessibilityValue', async () => {
      await render(
        <AnimatedBar
          progress={0.7}
          trackColor="#eee"
          fillColor="#654"
          accessibilityLabel="70 percent"
          testID="bar"
        />,
      );
      const bar = screen.getByTestId('bar');
      expect(bar.props.accessibilityRole).toBe('progressbar');
      expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 70 });
    });

    it('honours a supplied accessibilityValue and disabled animation', async () => {
      await render(
        <AnimatedBar
          progress={0.5}
          trackColor="#eee"
          fillColor="#654"
          height={8}
          animate={false}
          accessibilityValue={{ min: 0, max: 5, now: 3, text: '3 of 5' }}
          testID="bar2"
        />,
      );
      const bar = screen.getByTestId('bar2');
      expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 5, now: 3, text: '3 of 5' });
    });
  });
});
