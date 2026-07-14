import type { ViewStyle } from 'react-native';

/**
 * Returns a dimming style while a Pressable is pressed, else null. Extracted so
 * the pressed-state branch is unit-testable in one place — React Native
 * resolves a Pressable's `style` function to a flat style on the host node, so
 * the inline `pressed ? … : null` branch is otherwise unreachable from a
 * rendered tree. Mirrors the `whenPressed` helper the shipped screens use.
 */
export function pressedStyle(pressed: boolean, opacity = 0.85): ViewStyle | null {
  return pressed ? { opacity } : null;
}
