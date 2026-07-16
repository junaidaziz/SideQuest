# SideQuest

Expo (React Native) client for SideQuest, a real-world mission generator app. Guides a user through an onboarding wizard, generates matched real-world "quests," and tracks XP/streak progress across sessions — with a zero-friction guest mode (no account required to try one quest), a contextual signup prompt that only appears when a guest hits a real gate, a peer-to-peer Challenges feature, in-app + push notifications, and Stripe-backed saved payment methods. See `../backend` for the NestJS API this app consumes, and `CLAUDE.md` for the full screen-by-screen and service-by-service reference.

## Stack

Expo SDK 57 (managed) · Expo Router (file-based navigation) · TypeScript · Zustand (client/session state) · TanStack Query (server state, persisted read-cache + an offline write queue) · `expo-secure-store` (token storage) · Sentry (crash/error reporting) · Firebase (Analytics, Crashlytics, and Expo-push-token registration) · Stripe (`@stripe/stripe-react-native`, saved cards only) · Jest + `@testing-library/react-native`

## Setup

```bash
npm install
cp .env.example .env    # EXPO_PUBLIC_API_BASE_URL, EXPO_PUBLIC_SENTRY_DSN — both optional, see below
npx expo start
```

The backend (`../backend`) must be running for the app to do anything beyond render onboarding — see its README. `EXPO_PUBLIC_API_BASE_URL` defaults per platform (`10.0.2.2` for the Android emulator, since `localhost` isn't reachable from it; `localhost` for iOS simulator/web).

`@sentry/react-native` is a native module — plain Expo Go can't load it. Use a custom dev client (`eas build --profile development`, or `npx expo run:ios` / `npx expo run:android` locally) rather than scanning the Expo Go QR code.

## Common commands

```bash
npx expo start              # dev server (Expo Go for JS-only iteration; see the Sentry note above for native testing)
npx expo start --android
npx expo start --ios
npx expo run:ios            # full native build (requires Xcode)
npx expo run:android        # full native build (requires Android Studio)

npm test                    # unit tests
npm test -- --coverage      # unit tests with coverage (must stay ≥ 80% on all four dimensions)
npm run lint                # eslint (expo lint, check-only — no --fix)

npx tsc --noEmit            # typecheck
npx expo-doctor             # dependency/config sanity check
```

## Architecture

- **Navigation**: Expo Router (file-based), routes under `app/` — a bottom-tab shell (Today/Explore/Progress/You) plus stacked routes for quest flow, Challenges, settings, and payment methods. Route files are thin wrappers around the actual screen components in `src/screens/` — they own navigation params and callbacks; the screens themselves stay presentational and navigation-library-agnostic (props-in, callbacks-out). Five routes (`home`, `mode-select`, `mission-results`, `profile`, `proof-submission/[missionId]`) are retired — thin redirects to their Compass-redesign replacement, kept only so old deep links don't 404.
- **Screens** (`src/screens/`, 30 live): `OnboardingScreen` (first launch, 4-step wizard) → `ExploreScreen`/`QuestResultsScreen` (mode tiles + filtered results, the redesign's replacement for the old one-tap quick-start flow) → `QuestDetailScreen` → `ActiveQuestScreen` → `ProofSubmissionScreenV2` → `CompletionScreenV2`, with `SignupPromptScreen` as a contextual guest-conversion gate. Plus a peer-to-peer Challenges flow (`ChallengeFeedScreen`/`ChallengeDetailScreen`/`CreateChallengeScreen`), a Notifications inbox, Saved Quests, and account/settings/payment screens. Six older screens (`ModeSelectScreen`, `MissionResultsScreen`, `ProofSubmissionScreen`, `CompletionScreen`, `HomeScreen`, `ProfileScreen`) are superseded and kept only for rollback — see `CLAUDE.md` for the full live/dead map before assuming any of them is still reachable.
- **State management**: Zustand — `src/store/authStore.ts` for session state (hydrates once at launch, restores a stored session or silently bootstraps a guest session, tracks `isFirstLaunch` so `app/index.tsx` can route a true first launch to Onboarding), and `src/store/themeStore.ts` for the Appearance theme override (system/light/dark), persisted to AsyncStorage.
- **Data fetching**: TanStack Query, provisioned via `QueryClientProvider` in `app/_layout.tsx`, for all server state — with an AsyncStorage-persisted read cache for an allow-listed set of query keys, and a separate offline write queue (`src/services/offlineQueue.ts`) for mutations (saves, proof/evidence submission) that must survive an app restart or a dropped connection.
- **API client**: `src/services/apiClient.ts` — a thin `fetch` wrapper with automatic 401 → refresh-token retry and optional `Idempotency-Key` header support.
- **Token storage**: `src/services/tokenStorage.ts` via `expo-secure-store` — never `AsyncStorage` for tokens.
- **Type contract with backend**: manually mirrored in `src/types/api.ts` against the backend's DTOs — no codegen yet.
- **Crash/analytics reporting**: Sentry (JS/manual errors, gated on `EXPO_PUBLIC_SENTRY_DSN`) plus Firebase Crashlytics (native crashes) and Firebase Analytics (screen-view tracking) — Firebase is entirely native-config-file driven (`google-services.json`/`GoogleService-Info.plist`), no env var involved.
- **Push notifications**: `expo-notifications` + the Expo push service (not FCM/APNs directly) — see `CLAUDE.md`'s Firebase section for the full registration/permission/tap-handling flow.
- **Payments**: `@stripe/stripe-react-native` PaymentSheet against a backend-issued SetupIntent — saved cards only, no charge flow.
- **Mockups**: `mockups/` has the original HTML prototypes each screen was implemented from, including a flow map (`mockups/index.html`) documenting the intended screen order. A separate, newer `../product-redesign/mockups-html/` set documents the current Compass visual redesign these screens were rebuilt against.

## Testing

Every screen and utility ships with unit tests co-located next to its source file (`FooScreen.test.tsx` beside `FooScreen.tsx`). Route wrapper tests live in `__tests__/app/` instead of next to their `app/` source files — Expo Router's file-based router treats every `.ts(x)` file anywhere under `app/` as a potential route via a recursive `require.context`, so co-locating tests there pulls test-only dependencies into the production bundle. Coverage is enforced at 80% minimum across statements/branches/functions/lines via `jest.config` in `package.json` (`src/**` only — `app/` route files are excluded from the coverage count, matching how `app/_layout.tsx` was already treated); the project currently sits at 97–100% on every covered file.

## Accessibility & platform parity

Development and manual testing this project was Android-emulator-first; a dedicated iOS/Android accessibility parity pass (VoiceOver vs TalkBack differences, safe-area handling) was done as part of production hardening — see commit history for specifics (e.g. `accessibilityViewIsModal` is iOS-only and needs an explicit Android-side `importantForAccessibility="no-hide-descendants"` companion on same-screen overlays that aren't wrapped in a real `<Modal>`).

## Building for production

```bash
npm install -g eas-cli
eas build --profile development   # internal, dev client, needed to test native modules (Sentry) outside Expo Go
eas build --profile preview       # internal APK, for QA installs
eas build --profile production    # store distribution, auto-incrementing build numbers
eas submit
```

See `eas.json` for the full profile definitions. `ios.bundleIdentifier` / `android.package` are currently set to `com.sidequest.app` — confirm this is the final identifier before any real store submission, since it's effectively permanent once published.

## CI

`.github/workflows/ci.yml` runs on every push/PR to `main`: `npm ci` → typecheck → lint → unit tests (coverage-gated).

## Environment variables

See `.env.example` for the full list with inline documentation. Never commit `.env` — it's gitignored.
