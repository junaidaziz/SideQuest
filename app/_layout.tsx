import { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { Stack, router, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import * as Sentry from '@sentry/react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useFonts } from 'expo-font';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import { Syne_700Bold, Syne_800ExtraBold } from '@expo-google-fonts/syne';
import {
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../src/store/authStore';
import { useThemeStore } from '../src/store/themeStore';
import { buildPersistOptions, queryClient } from '../src/services/queryPersistence';
import { OfflineChrome } from '../src/components/offline';
import { registerForPushNotifications, subscribeToNotificationTaps } from '../src/services/pushNotifications';

// Keeps the native splash screen up until fonts finish loading below, so the
// app never flashes system-font text before swapping to Syne/Inter.
SplashScreen.preventAutoHideAsync();

// Read-cache persistence (M23.2): rehydrates the query cache from AsyncStorage
// on cold start so cached Home/Challenges/Rewards/Profile reads render offline
// instead of showing empty loading states. Built once at module load.
const persistOptions = buildPersistOptions();

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

/**
 * Native-crash coverage via Crashlytics, additive to Sentry above (which
 * already covers manual/JS error reporting) — not a replacement. Firebase's
 * config files (`google-services.json`/`GoogleService-Info.plist`) already
 * gate this to a no-op in any build that doesn't bundle them, so no extra
 * enabled-flag guard is needed here the way Sentry's DSN check is.
 */
crashlytics()
  .setCrashlyticsCollectionEnabled(true)
  .catch(() => {
    // Best-effort — a Crashlytics setup failure must never block app launch.
  });

/**
 * Configure Google Sign-In once at module load. Unlike Sentry.init() above
 * (which is always called, with `enabled` doing the no-op work), this SDK
 * rejects an undefined `webClientId` outright, so the guard here is an `if`
 * around the call itself rather than an `enabled` flag — different mechanism,
 * same effect: safe to leave unset in local/CI runs without Google Cloud
 * credentials.
 *
 * `webClientId` is the OAuth client the backend verifies ID tokens against
 * (same value on both platforms). `iosClientId` is required in addition on
 * iOS specifically: without a `GoogleService-Info.plist` (this project isn't
 * on Firebase), the native SDK can't derive its own client id and throws
 * "failed to determine clientID" at sign-in time — confirmed by hitting this
 * exact error on a real device test before adding this. The iOS native URL
 * scheme (the *reversed* form of this same client id) is configured
 * separately in app.json's plugin config.
 */
const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
if (googleWebClientId) {
  GoogleSignin.configure({
    webClientId: googleWebClientId,
    iosClientId: googleIosClientId,
  });
}

/**
 * Stripe publishable key — a public (non-secret) client key, safe to ship in
 * the bundle. Falls back to an empty string when unset (local dev/CI before a
 * real key lands): StripeProvider mounts fine with an empty key and only the
 * PaymentSheet card-registration call fails at runtime, so this never crashes
 * the app on launch. Card collection happens entirely against Stripe on-device
 * via the SetupIntent client secret the backend mints — the raw card never
 * touches this app or our backend.
 */
const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

function RootLayout() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const authStatus = useAuthStore((state) => state.status);
  const hydrateTheme = useThemeStore((state) => state.hydrate);
  const navigationRef = useNavigationContainerRef();
  const [fontsLoaded, fontError] = useFonts({
    // Syne — Halcyon+ display face (CompassFonts.display / .displayBold).
    Syne_800ExtraBold,
    Syne_700Bold,
    // Plus Jakarta Sans — retained until every screen migrates off the
    // hardcoded 'PlusJakartaSans_*' families still present in several
    // *.styles.ts files; removing it now would blank those headings.
    PlusJakartaSans_800ExtraBold,
    PlusJakartaSans_700Bold,
    // Inter — body/label/UI + tabular metrics (CompassFonts.numeric = 800).
    Inter_800ExtraBold,
    Inter_600SemiBold,
    Inter_500Medium,
    Inter_400Regular,
  });

  useEffect(() => {
    // Restores a stored session, or silently bootstraps a guest session
    // when none exists — guest mode requires zero account per v1 spec.
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    // Restores the user's Appearance > Theme choice so it survives a cold
    // start, rather than always booting back to 'system'.
    hydrateTheme();
  }, [hydrateTheme]);

  useEffect(() => {
    navigationIntegration.registerNavigationContainer(navigationRef);
  }, [navigationRef]);

  useEffect(() => {
    const unsubscribe = navigationRef.addListener('state', () => {
      // getCurrentRoute()'s return type collapses to `Route<never>` here since
      // this project doesn't globally augment `ReactNavigation.RootParamList`
      // (expo-router's typed routes cover `<Link>`/`router.push` call sites,
      // not this ref) — narrowed to the one field actually used.
      const name = (navigationRef.current?.getCurrentRoute() as { name: string } | undefined)?.name;
      if (!name) return;
      analytics()
        .logScreenView({ screen_name: name, screen_class: name })
        .catch(() => {
          // Best-effort — analytics must never affect navigation.
        });
    });
    return unsubscribe;
  }, [navigationRef]);

  useEffect(() => {
    // Fires after every transition into a signed-in-or-guest ready session
    // (hydrate, login, signup, Google sign-in all land on 'ready') — safe to
    // call repeatedly since the backend endpoint upserts by token.
    if (authStatus !== 'ready') return;
    registerForPushNotifications();
  }, [authStatus]);

  useEffect(() => {
    // A tap on a delivered push (app backgrounded or killed) opens the
    // existing in-app Notifications list.
    return subscribeToNotificationTaps(() => {
      router.push('/notifications');
    });
  }, []);

  // The native splash (kept up by preventAutoHideAsync() above) covers the
  // screen until this fires, so hiding it here — not sooner — is what stops
  // the app from ever flashing system-font text before Syne/Inter are ready.
  // fontError still hides the splash rather than hanging forever: a failed
  // font load shouldn't leave the whole app stuck behind the splash image.
  const onFontsSettled = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    onFontsSettled();
  }, [onFontsSettled]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <StripeProvider publishableKey={stripePublishableKey}>
      <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
        {/* Flex column so OfflineChrome's banner sits above and pushes the
            Stack down persistently while offline (M23.1). */}
        <View style={{ flex: 1 }}>
          <OfflineChrome />
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            {/* SignupPromptScreen already animates its own bottom-sheet
                slide-up internally — presenting it as a transparent modal with
                no stack-level animation avoids double-animating (the screen
                sliding in from the right AND the sheet sliding up inside it). */}
            <Stack.Screen
              name="signup-prompt"
              options={{ presentation: 'transparentModal', animation: 'none' }}
            />
          </Stack>
        </View>
        <StatusBar style="auto" />
      </PersistQueryClientProvider>
    </StripeProvider>
  );
}

export default Sentry.wrap(RootLayout);
