import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { Colors } from '../src/constants/design';

/**
 * Entry redirector: hydrate() runs once in the root layout on mount, and this
 * screen waits for it to settle before deciding where to send the user.
 * First-ever launch (no stored tokens, so hydrate() just bootstrapped a fresh
 * guest) goes to onboarding; every other launch — including a returning
 * guest — goes straight to Home. A hydrate() failure falls back to
 * onboarding too, since it's the only screen that doesn't assume a working
 * session is already in place.
 */
export default function Index() {
  const status = useAuthStore((state) => state.status);
  const isFirstLaunch = useAuthStore((state) => state.isFirstLaunch);

  if (status === 'idle' || status === 'loading') {
    return (
      <View
        style={styles.loading}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading SideQuest"
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <Redirect href={isFirstLaunch === false ? '/home' : '/onboarding'} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
});
