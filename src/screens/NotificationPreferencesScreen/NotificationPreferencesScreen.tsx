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
import type { NotificationPreferencesDto } from '../../types/api';

export type NotificationPreferences = NotificationPreferencesDto;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  pushEnabled: true,
  taskEventsEnabled: true,
  referralEventsEnabled: true,
  accountEventsEnabled: true,
};

export interface NotificationPreferencesScreenProps {
  onBack?: () => void;
  initialPreferences?: NotificationPreferences;
  /**
   * Fired whenever a preference changes. The route persists the partial
   * update through PATCH /notifications/preferences.
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
  { key: 'taskEventsEnabled', icon: '✅', label: 'Tasks and challenges', sub: 'Task invitations, updates, and proof results', a11y: 'Task and challenge notifications' },
  { key: 'referralEventsEnabled', icon: '👥', label: 'Invites and referrals', sub: 'Referral progress and rewards', a11y: 'Referral notifications' },
  { key: 'accountEventsEnabled', icon: '🛡️', label: 'Account activity', sub: 'Important account and security updates', a11y: 'Account activity notifications' },
];

/**
 * Compass notification preferences (mockup 39). A master push switch gates the
 * per-category switches; each switch is the shared animated CompassToggle.
 * Only preferences supported by the backend are shown; unsupported quiet-hour
 * and marketing toggles are intentionally not simulated locally.
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
  });
}
