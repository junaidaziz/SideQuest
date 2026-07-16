import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  pressedStyle,
} from '../../components/compass';

export type ThemeChoice = 'system' | 'light' | 'dark';

export interface AppearanceSettings {
  theme: ThemeChoice;
  reduceMotion: boolean;
  haptics: boolean;
  sound: boolean;
  highContrast: boolean;
}

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  theme: 'system',
  reduceMotion: false,
  haptics: true,
  sound: false,
  highContrast: false,
};

const THEME_OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export interface AppearanceAccessibilityScreenProps {
  onBack?: () => void;
  initialSettings?: AppearanceSettings;
  /** Fired when a non-theme setting changes (motion/haptics/sound/contrast).
   * These aren't persisted anywhere yet — this screen owns local state for
   * them. Theme changes go through `onThemeChange` instead, not this. */
  onChange?: (next: AppearanceSettings) => void;
  /**
   * Fired directly when the user picks a theme option — kept separate from
   * `onChange` so a theme pick is never re-derived from (and can't be
   * clobbered by) whatever this screen's local `settings` state happens to
   * hold when an unrelated toggle fires later. That coupling previously let
   * a stale local `theme` value get silently re-persisted by an unrelated
   * toggle, reverting a real theme choice back to the last value this
   * screen's local state happened to have.
   */
  onThemeChange?: (theme: ThemeChoice) => void;
  /** Deep-link to the OS text-size settings. */
  onOpenTextSettings?: () => void;
}

/**
 * Compass appearance & accessibility (mockup 40). A prominent theme radio-group
 * plus motion/feedback and accessibility switches. The Haptics switch threads
 * its own value into every CompassToggle so turning haptics off also silences
 * the toggles themselves.
 */
export default function AppearanceAccessibilityScreen({
  onBack,
  initialSettings = DEFAULT_APPEARANCE_SETTINGS,
  onChange,
  onThemeChange,
  onOpenTextSettings,
}: AppearanceAccessibilityScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => createSettingsScreenStyles(colors), [colors]);
  const local = useMemo(() => createLocalStyles(colors), [colors]);
  const [settings, setSettings] = useState<AppearanceSettings>(initialSettings);

  // Non-theme settings only — theme goes through handleSelectTheme below,
  // never through this generic path (see the onThemeChange prop doc).
  const update = useCallback(
    <K extends Exclude<keyof AppearanceSettings, 'theme'>>(key: K, value: AppearanceSettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        onChange?.(next);
        return next;
      });
    },
    [onChange],
  );

  const handleSelectTheme = useCallback(
    (theme: ThemeChoice) => {
      setSettings((prev) => ({ ...prev, theme }));
      onThemeChange?.(theme);
    },
    [onThemeChange],
  );

  const hapticsOn = settings.haptics;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <CompassHeader title="Appearance" onBack={onBack} backAccessibilityLabel="Back to settings" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={[textStyle('caption'), local.groupLabel]} accessibilityRole="header">
            THEME
          </Text>
          <View style={local.themePicker} accessibilityRole="radiogroup" accessibilityLabel="App theme">
            {THEME_OPTIONS.map((opt) => {
              const selected = settings.theme === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => handleSelectTheme(opt.value)}
                  accessibilityRole="radio"
                  accessibilityLabel={`${opt.label} theme`}
                  accessibilityState={{ selected, checked: selected }}
                  style={[
                    local.themeOpt,
                    { borderColor: selected ? colors.actionPrimary : colors.borderDefault },
                  ]}
                >
                  <View
                    style={[
                      local.swatch,
                      { backgroundColor: swatchColor(opt.value) },
                    ]}
                    importantForAccessibility="no"
                  />
                  <Text style={[textStyle('labelM'), { color: colors.textPrimary }]}>
                    {opt.label}
                  </Text>
                  <View
                    style={[
                      local.radio,
                      {
                        borderColor: selected ? colors.actionPrimary : colors.borderDefault,
                        backgroundColor: selected ? colors.actionPrimary : 'transparent',
                      },
                    ]}
                    importantForAccessibility="no"
                  >
                    {selected ? <Text style={local.radioTick}>✓</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Text style={[textStyle('caption'), styles.caption, { marginTop: CompassSpacing.s3 }]}>
            Choose System to match your device automatically.
          </Text>
        </View>

        <SettingsSection title="Motion & feedback" index={1}>
          <SettingsRow
            icon="🎞️"
            label="Reduce motion"
            sub="Trim non-essential animations"
            accessory={
              <CompassToggle
                value={settings.reduceMotion}
                onValueChange={(v) => update('reduceMotion', v)}
                accessibilityLabel="Reduce motion"
                hapticsEnabled={hapticsOn}
              />
            }
          />
          <SettingsRow
            icon="📳"
            label="Haptics"
            sub="Gentle taps for actions and rewards"
            accessory={
              <CompassToggle
                value={settings.haptics}
                onValueChange={(v) => update('haptics', v)}
                accessibilityLabel="Haptics"
              />
            }
          />
          <SettingsRow
            icon="🔈"
            label="Sound"
            sub="Off by default"
            accessory={
              <CompassToggle
                value={settings.sound}
                onValueChange={(v) => update('sound', v)}
                accessibilityLabel="Sound"
                hapticsEnabled={hapticsOn}
              />
            }
          />
        </SettingsSection>

        <SettingsSection title="Accessibility" index={2}>
          <SettingsRow
            icon="◐"
            label="High contrast"
            sub="Stronger borders and text contrast"
            accessory={
              <CompassToggle
                value={settings.highContrast}
                onValueChange={(v) => update('highContrast', v)}
                accessibilityLabel="High contrast"
                hapticsEnabled={hapticsOn}
              />
            }
          />
        </SettingsSection>

        <View style={local.sizePreview}>
          <Text style={[textStyle('labelM'), { color: colors.textPrimary }]}>Text size</Text>
          <Text style={[textStyle('bodyS'), { color: colors.textSecondary, marginVertical: CompassSpacing.s2 }]}>
            SideQuest follows your device text size so it stays consistent with your other apps.
          </Text>
          <Text style={[textStyle('bodyL'), { color: colors.textPrimary }]}>
            Three quests fit your moment.
          </Text>
          <Pressable
            onPress={onOpenTextSettings}
            accessibilityRole="button"
            accessibilityLabel="Open device text settings"
            style={({ pressed }) => (pressedStyle(pressed, 0.6))}
          >
            <Text style={[textStyle('labelM'), local.link]}>Open device text settings</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function swatchColor(theme: ThemeChoice): string {
  if (theme === 'light') return '#F6F4FC';
  if (theme === 'dark') return '#0F0D18';
  return '#8B78FF';
}

function createLocalStyles(colors: ReturnType<typeof useCompassTheme>['colors']) {
  return StyleSheet.create({
    groupLabel: {
      color: colors.textTertiary,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginLeft: CompassSpacing.s1,
      marginBottom: CompassSpacing.s2,
    },
    themePicker: { flexDirection: 'row', gap: CompassSpacing.s3 },
    themeOpt: {
      flex: 1,
      alignItems: 'center',
      gap: CompassSpacing.s2,
      backgroundColor: colors.bgSurface,
      borderWidth: 1.5,
      borderRadius: CompassRadius.lg,
      paddingVertical: CompassSpacing.s3,
      paddingHorizontal: CompassSpacing.s2,
    },
    swatch: {
      width: '100%',
      height: 56,
      borderRadius: CompassRadius.md,
      borderWidth: 1,
      borderColor: colors.borderDefault,
    },
    radio: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioTick: { color: '#FFFFFF', fontSize: 11 },
    sizePreview: {
      backgroundColor: colors.bgSubtle,
      borderRadius: CompassRadius.md,
      padding: CompassSpacing.s4,
      gap: CompassSpacing.s1,
    },
    link: { color: colors.actionPrimary, marginTop: CompassSpacing.s3 },
  });
}
