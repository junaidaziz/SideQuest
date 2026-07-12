import { useEffect } from 'react';
import { Stack, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';
import { useAuthStore } from '../src/store/authStore';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const navigationIntegration = Sentry.reactNavigationIntegration();

/**
 * `enabled: Boolean(dsn)` is the actual no-op guard — some SDK versions don't
 * reliably no-op on an undefined dsn alone, so this is load-bearing, not a
 * redundant belt-and-suspenders check. Applies for local dev, CI, and any
 * build before a real Sentry project exists. tracesSampleRate is
 * intentionally conservative; revisit once real traffic volume is known.
 * The navigation integration gives sampled transactions real route names
 * instead of leaving tracesSampleRate spending quota on unnamed ones.
 */
Sentry.init({
  dsn: sentryDsn,
  enabled: Boolean(sentryDsn),
  tracesSampleRate: 0.2,
  integrations: [navigationIntegration],
});

function RootLayout() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    // Restores a stored session, or silently bootstraps a guest session
    // when none exists — guest mode requires zero account per v1 spec.
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    navigationIntegration.registerNavigationContainer(navigationRef);
  }, [navigationRef]);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}

export default Sentry.wrap(RootLayout);
