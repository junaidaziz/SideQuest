/**
 * Hand-rolled Jest mock for react-native-reanimated (v4).
 *
 * The real module eagerly loads `react-native-worklets`, whose native
 * TurboModule is undefined under Jest and throws at import
 * ("Cannot read properties of undefined (reading 'loadUnpackers')"). The
 * package's own `react-native-reanimated/mock` still re-imports that real
 * entry point, so it crashes the same way. This manual mock replaces the
 * module entirely with a synchronous, worklet-free stand-in.
 *
 * Node-module manual mocks under <rootDir>/__mocks__ are applied
 * automatically, so screens/components importing reanimated need no per-file
 * jest.mock() call. Added for the Compass batch (screens 35–45), which is the
 * first code in this app to use reanimated + expo-haptics.
 */
const React = require('react');
const { View, Text, Image, ScrollView } = require('react-native');

// Shared values behave as plain mutable objects in tests.
const useSharedValue = (initial) => ({ value: initial });

// Timing/spring/repeat all resolve immediately to their target value.
const withTiming = (toValue) => toValue;
const withSpring = (toValue) => toValue;
const withDelay = (_delay, animation) => animation;
const withRepeat = (animation) => animation;
const withSequence = (...animations) => animations[animations.length - 1];
const cancelAnimation = () => {};

// Style hooks just return the produced style object.
const useAnimatedStyle = (factory) => factory();
const useDerivedValue = (factory) => ({ value: factory() });
const useAnimatedRef = () => ({ current: null });
const runOnJS = (fn) => fn;
const runOnUI = (fn) => fn;

// Reduced-motion accessibility hook. Defaults to `false` (motion allowed);
// a test can flip it via `(useReducedMotion as jest.Mock).mockReturnValue(true)`
// to exercise the dissolve/instant celebration path.
const useReducedMotion = jest.fn(() => false);

const Easing = {
  bezier: () => (t) => t,
  linear: (t) => t,
  ease: (t) => t,
  in: (fn) => fn,
  out: (fn) => fn,
  inOut: (fn) => fn,
};

// Layout-animation builders: chainable no-ops.
function makeLayoutAnimation() {
  const builder = {
    duration: () => builder,
    delay: () => builder,
    springify: () => builder,
    damping: () => builder,
    withInitialValues: () => builder,
    build: () => ({}),
  };
  return builder;
}
const layoutProxy = new Proxy(
  {},
  {
    get: () => makeLayoutAnimation(),
  },
);

const createAnimatedComponent = (Component) => Component;

const Animated = {
  View,
  Text,
  Image,
  ScrollView,
  createAnimatedComponent,
};

module.exports = {
  __esModule: true,
  default: Animated,
  View,
  Text,
  Image,
  ScrollView,
  createAnimatedComponent,
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useAnimatedRef,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  cancelAnimation,
  runOnJS,
  runOnUI,
  useReducedMotion,
  Easing,
  // Common layout-animation presets used across Compass screens.
  FadeIn: makeLayoutAnimation(),
  FadeInDown: layoutProxy.FadeInDown,
  FadeInUp: layoutProxy.FadeInUp,
  FadeOut: makeLayoutAnimation(),
  Layout: makeLayoutAnimation(),
};
