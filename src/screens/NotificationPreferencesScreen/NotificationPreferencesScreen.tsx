import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { CompassRadius, CompassSpacing } from '../../constants/compassDesign';
import {
  CompassHeader,
  CompassToggle,
  SettingsRow,
  SettingsSection,
  createSettingsScreenStyles,
  textStyle,
} from '../../components/compass';

/** Notification preference keys. Mirrors the intended backend shape. */
export interface NotificationPreferences {
  pushEnabled: boolean;
  questVerification: boolean;
  challenges: boolean;
  groups: boolean;
  achievements: boolean;
  productUpdates: boolean;
  quietHours: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  pushEnabled: true,
  questVerification: true,
  challenges: true,
  groups: false,
  achievements: true,
  productUpdates: false,
  quietHours: true,
};

export interface NotificationPreferencesScreenProps {
  onBack?: () => void;
  initialPreferences?: NotificationPreferences;
  /**
   * Fired (debounced by the caller) whenever a preference changes.
   * TODO(backend M21): wire to PATCH /notifications/preferences — the endpoint
   * does not exist yet, so this screen owns realistic local state meanwhile.
   */
  onChange?: (next: NotificationPreferences) => void;
}

const CATEGORIES: {
  key: keyof NotificationPreferences;
  icon: string;
  label: string;
  sub: string;
  a11y: string;
}[] = [
  { key: 'questVerification', icon: '✅', label: 'Quest verification', sub: 'Proof approved, needs another look', a11y: 'Quest verification notifications' },
  { key: 'challenges', icon: '⚔️', label: 'Challenges', sub: 'Invites and replies from people you know', a11y: 'Challenge notifications' },
  { key: 'groups', icon: '👥', label: 'Groups', sub: 'Shared goals and group activity', a11y: 'Group notifications' },
  { key: 'achievements', icon: '🏅', label: 'Achievements & weekly recap', sub: 'Milestones and your Sunday summary', a11y: 'Achievements and weekly recap notifications' },
  { key: 'productUpdates', icon: '📣', label: 'Product updates', sub: 'New features and occasional tips', a11y: 'Product update notifications' },
];

/**
 * Compass notification preferences (mockup 39). A master push switch gates the
 * per-category switches; each switch is the shared animated CompassToggle.
 * Quiet-hours range is display-only for now (native time pickers come with the
 * backend milestone).
 */
export default function NotificationPreferencesScreen({
  onBack,
  initialPreferences = DEFAULT_NOTIFICATION_PREFERENCES,
  onChange,
}: NotificationPreferencesScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => createSettingsScreenStyles(colors), [colors]);
  const local = useMemo(() => createLocalStyles(colors), [colors]);
  const [prefs, setPrefs] = useState<NotificationPreferences>(initialPreferences);

  const update = useCallback(
    (key: keyof NotificationPreferences, value: boolean) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: value };
        onChange?.(next);
        return next;
      });
    },
    [onChange],
  );

  const pushOff = !prefs.pushEnabled;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <CompassHeader title="Notifications" onBack={onBack} backAccessibilityLabel="Back to settings" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={local.osBanner} accessibilityRole="text">
          <Text importantForAccessibility="no" style={local.osIcon}>{'🔔'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[textStyle('labelM'), { color: colors.textPrimary }]}>
              System notifications are on
            </Text>
            <Text style={[textStyle('caption'), { color: colors.textSecondary }]}>
              If you turn them off in Settings, we&apos;ll show a link to re-enable them here.
            </Text>
          </View>
        </View>

        <SettingsSection title="Push notifications" index={0}>
          <SettingsRow
            icon="📲"
            label="Allow push notifications"
            sub="Turn everything on or off at once"
            accessory={
              <CompassToggle
                value={prefs.pushEnabled}
                onValueChange={(v) => update('pushEnabled', v)}
                accessibilityLabel="Allow push notifications"
              />
            }
          />
        </SettingsSection>

        <SettingsSection title="What you hear about" index={1}>
          {CATEGORIES.map((cat) => (
            <SettingsRow
              key={cat.key}
              icon={cat.icon}
              label={cat.label}
              sub={cat.sub}
              accessory={
                <CompassToggle
                  value={pushOff ? false : Boolean(prefs[cat.key])}
                  onValueChange={(v) => update(cat.key, v)}
                  accessibilityLabel={cat.a11y}
                  disabled={pushOff}
                />
              }
            />
          ))}
        </SettingsSection>

        <SettingsSection title="Quiet hours" index={2}>
          <SettingsRow
            icon="🌙"
            label="Mute during quiet hours"
            sub="We'll hold non-urgent notifications"
            accessory={
              <CompassToggle
                value={prefs.quietHours}
                onValueChange={(v) => update('quietHours', v)}
                accessibilityLabel="Mute during quiet hours"
              />
            }
          />
        </SettingsSection>

        <View style={local.quietTimes} accessibilityRole="text" accessibilityLabel="Quiet hours from 10:00 PM to 7:00 AM">
          <View style={local.timePill}>
            <Text style={[textStyle('caption'), { color: colors.textSecondary }]}>From</Text>
            <Text style={local.timeVal}>10:00 PM</Text>
          </View>
          <View style={local.timePill}>
            <Text style={[textStyle('caption'), { color: colors.textSecondary }]}>To</Text>
            <Text style={local.timeVal}>7:00 AM</Text>
          </View>
        </View>
        <Text style={[textStyle('caption'), styles.caption]}>
          Times use your device timezone.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function createLocalStyles(colors: ReturnType<typeof useCompassTheme>['colors']) {
  return StyleSheet.create({
    osBanner: {
      flexDirection: 'row',
      gap: CompassSpacing.s3,
      alignItems: 'center',
      backgroundColor: colors.bgSubtle,
      borderRadius: CompassRadius.md,
      padding: CompassSpacing.s4,
    },
    osIcon: { fontSize: 20 },
    quietTimes: { flexDirection: 'row', gap: CompassSpacing.s3 },
    timePill: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: colors.bgSubtle,
      borderRadius: CompassRadius.md,
      padding: CompassSpacing.s3,
    },
    timeVal: { color: colors.textPrimary, fontWeight: '700', fontSize: 18 },
  });
}
