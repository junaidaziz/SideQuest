import React from 'react';
import { render } from '@testing-library/react-native';
import StreakFlame from './StreakFlame';

jest.mock('react-native-reanimated', () => {
  const { View, Text } = require('react-native');
  const easing = () => 0;
  return {
    __esModule: true,
    default: { View, Text, createAnimatedComponent: (c: unknown) => c },
    useSharedValue: (v: number) => ({ value: v }),
    useAnimatedStyle: (fn: () => unknown) => fn(),
    withTiming: (v: number) => v,
    withRepeat: (v: number) => v,
    Easing: { bezier: () => easing, inOut: () => easing, ease: easing },
  };
});

describe('StreakFlame', () => {
  it('renders the animated flame by default', async () => {
    const { toJSON } = await render(<StreakFlame />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders a static flame when animation is disabled', async () => {
    const { toJSON } = await render(<StreakFlame size={30} animate={false} />);
    expect(toJSON()).toBeTruthy();
  });
});
