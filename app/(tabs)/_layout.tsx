import { Tabs } from 'expo-router';
import { StyleSheet, Text, type ColorValue } from 'react-native';
import { useCompassTheme } from '../../src/hooks/useCompassTheme';

const styles = StyleSheet.create({
  icon: { fontSize: 22 },
});

/**
 * The four primary destinations of the Compass redesign: Today, Explore,
 * Progress, You. Detail/drill-down screens live as stack routes OUTSIDE this
 * group (see app/quest/*, app/settings/*, etc.) so they're shared across tabs
 * rather than duplicated per-tab.
 *
 * Icons use emoji glyphs rather than a vector-icon set — this project ships no
 * `@expo/vector-icons` dependency and every Compass screen already renders its
 * own header icons as emoji Text (see TodayScreen's bell glyph), so this keeps
 * the tab bar consistent with the rest of the design system without adding a
 * new native dependency.
 */
function tabIcon(glyph: string) {
  return function TabIcon({ color }: { color: ColorValue }) {
    return <Text style={[styles.icon, { color }]}>{glyph}</Text>;
  };
}

export default function TabsLayout() {
  const { colors } = useCompassTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
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
        options={{ title: 'Today', tabBarIcon: tabIcon('\u{1F9ED}') }}
      />
      <Tabs.Screen
        name="explore"
        options={{ title: 'Explore', tabBarIcon: tabIcon('\u{1F50D}') }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: 'Progress', tabBarIcon: tabIcon('\u{26A1}') }}
      />
      <Tabs.Screen
        name="you"
        options={{ title: 'You', tabBarIcon: tabIcon('\u{1F464}') }}
      />
    </Tabs>
  );
}
