import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import {
  CompassHeader,
  SettingsRow,
  SettingsSection,
  createSettingsScreenStyles,
  textStyle,
  pressedStyle,
} from '../../components/compass';

/** App version string — replace with expo-constants nativeAppVersion when wired. */
const APP_VERSION = 'SideQuest 2.4.0 (build 1487)';

export interface SettingsScreenProps {
  onBack?: () => void;
  onAccountSecurity?: () => void;
  onPrivacy?: () => void;
  onNotifications?: () => void;
  onAppearance?: () => void;
  onAccessibility?: () => void;
  onData?: () => void;
  onHelp?: () => void;
  onLegal?: () => void;
  onAbout?: () => void;
  /** "Log out" — routed to the same confirm/logout flow YouScreen uses. */
  onLogout?: () => void;
  /** Current appearance value shown on the Appearance row, e.g. "Dark". */
  appearanceValue?: string;
}

/**
 * Compass Settings hub (mockup 37). A pure navigation surface — every row
 * delegates through a callback so the screen stays router-agnostic until the
 * nav pass wires it in. Rows fade in with a subtle stagger via SettingsSection.
 */
export default function SettingsScreen({
  onBack,
  onAccountSecurity,
  onPrivacy,
  onNotifications,
  onAppearance,
  onAccessibility,
  onData,
  onHelp,
  onLegal,
  onAbout,
  onLogout,
  appearanceValue = 'System',
}: SettingsScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => createSettingsScreenStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <CompassHeader title="Settings" onBack={onBack} backAccessibilityLabel="Back to profile" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSection title="Account" index={0}>
          <SettingsRow
            icon="👤"
            label="Account and security"
            sub="Email, password, sessions, delete account"
            onPress={onAccountSecurity}
            showChevron
          />
          <SettingsRow
            icon="🔒"
            label="Privacy"
            sub="Profile visibility, who can challenge you"
            onPress={onPrivacy}
            showChevron
          />
        </SettingsSection>

        <SettingsSection title="App" index={1}>
          <SettingsRow icon="🔔" label="Notifications" onPress={onNotifications} showChevron />
          <SettingsRow
            icon="🎨"
            label="Appearance"
            value={appearanceValue}
            onPress={onAppearance}
            showChevron
          />
          <SettingsRow icon="♿" label="Accessibility" onPress={onAccessibility} showChevron />
          <SettingsRow
            icon="🗄️"
            label="Data"
            sub="Download your data, storage"
            onPress={onData}
            showChevron
          />
        </SettingsSection>

        <SettingsSection title="Support" index={2}>
          <SettingsRow icon="❓" label="Help" onPress={onHelp} showChevron />
          <SettingsRow
            icon="📄"
            label="Legal"
            sub="Terms, Privacy Policy, licenses"
            onPress={onLegal}
            showChevron
          />
          <SettingsRow icon="✦" label="About SideQuest" onPress={onAbout} showChevron />
        </SettingsSection>

        <Pressable
          onPress={onLogout}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          style={({ pressed }) => [styles.secondaryBtn, pressedStyle(pressed)]}
        >
          <Text style={styles.secondaryBtnText}>Log out</Text>
        </Pressable>

        <View>
          <Text style={[textStyle('bodyS'), styles.appMeta]}>{APP_VERSION}</Text>
          <Text style={[textStyle('bodyS'), styles.appMeta]}>
            Delete account lives in Account and security.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
