// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // react-hooks/refs targets codebases opted into the React Compiler, where
    // reading a ref's `.current` during render is unsafe. This project uses
    // React Native's built-in `Animated` API (see
    // ~/.claude/references/react-native.md), whose documented pattern is
    // exactly `useRef(new Animated.Value(...))` read during render to build
    // interpolated styles — the API requires it, and no React Compiler is in
    // use here. The rule's remaining checks aren't relevant to this pattern,
    // so it's off rather than sprinkling per-line disables across every
    // animated screen.
    rules: {
      "react-hooks/refs": "off",
    },
  },
]);
