import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { useCompassTheme } from '../../src/hooks/useCompassTheme';
import { Icon, type IconName } from '../../src/components/icons';

/**
 * The four primary destinations of the Halcyon+ redesign: Today, Explore,
 * Progress, You. Detail/drill-down screens live as stack routes OUTSIDE this
 * group (see app/quest/*, app/settings/*, etc.) so they're shared across tabs
 * rather than duplicated per-tab.
 *
 * Tab glyphs render through the shared vector {@link Icon} component (24px grid,
 * 1.75px stroke) — the same set used across every migrated Halcyon+ screen —
 * replacing the previous emoji `Text` glyphs. The active tab uses each glyph's
 * solid "you are here" variant via `selected`, per the Halcyon+ iconography
 * spec (design doc § 5.1); the inactive tab keeps the outline. Colour still
 * flows from `useCompassTheme()` through the navigator's active/inactive tints.
 */
function tabIcon(name: IconName) {
  return function TabIcon({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) {
    // The navigator's active/inactive tints are always plain token strings.
    return <Icon name={name} size={size} color={String(color)} selected={focused} />;
  };
}

export default function TabsLayout() {
  const { colors } = useCompassTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Bottom-tab switches default to an instant, unanimated swap — this
        // is what actually read as "abrupt", since Today/Explore/Progress/You
        // is the navigation path used constantly. 'shift' cross-fades with a
        // slight horizontal shift, matching the polish of the native stack
        // push animation used everywhere else in the app.
        animation: 'shift',
        tabBarActiveTintColor: colors.actionPrimary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.bgSurface,
          borderTopColor: colors.borderDefault,
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{ title: 'Today', tabBarIcon: tabIcon('today') }}
      />
      <Tabs.Screen
        name="explore"
        options={{ title: 'Explore', tabBarIcon: tabIcon('explore') }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: 'Progress', tabBarIcon: tabIcon('progress') }}
      />
      <Tabs.Screen
        name="you"
        options={{ title: 'You', tabBarIcon: tabIcon('you') }}
      />
    </Tabs>
  );
}
