# SideQuest

Expo (React Native) client for SideQuest, a real-world mission generator app. Guides a user through an onboarding wizard, generates matched real-world "quests," and tracks XP/streak progress across sessions — with a zero-friction guest mode (no account required to try one quest) and a contextual signup prompt that only appears when a guest hits a real gate. See `../backend` for the NestJS API this app consumes.

## Stack

Expo SDK 57 (managed) · Expo Router (file-based navigation) · TypeScript · Zustand (client/session state) · TanStack Query (server state) · `expo-secure-store` (token storage) · Sentry (crash/error reporting) · Jest + `@testing-library/react-native`

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

- **Navigation**: Expo Router (file-based), routes under `app/`. Route files are thin wrappers around the actual screen components in `src/screens/` — they own navigation params and callbacks; the screens themselves stay presentational and navigation-library-agnostic (props-in, callbacks-out).
- **Screens** (`src/screens/`): `OnboardingScreen` (first launch, full 4-step wizard) or `ModeSelectScreen` (returning users, one-tap quick-start) → `MissionResultsScreen` → `ProofSubmissionScreen` → `CompletionScreen` → `HomeScreen`, with `SignupPromptScreen` as a contextual auth gate (mounted both as a standalone route for the mid-submission guest-completion-limit gate, and as an embedded modal inside `CompletionScreen` for the post-completion save/challenge gate). `ModeSelectScreen`'s 8 quest modes don't all map cleanly onto the backend's crew/time/setting/budget filters — 5 map to a `crew` value and 1 (`city`) to `setting`, but `confidence`/`travel` have no corresponding filter dimension and fall back to the most permissive defaults rather than a guessed mapping; see `app/mode-select.tsx`'s `toFiltersFromMode`.
- **State management**: Zustand (`src/store/authStore.ts`) for session state — hydrates once at launch (restores a stored session, or silently bootstraps a guest session if none exists), tracks `isFirstLaunch` so `app/index.tsx` can route a true first launch to Onboarding and every other launch straight to Home.
- **Data fetching**: TanStack Query, provisioned via `QueryClientProvider` in `app/_layout.tsx`, for server state (mission generation, saving, Home aggregation, proof submission).
- **API client**: `src/services/apiClient.ts` — a thin `fetch` wrapper with automatic 401 → refresh-token retry.
- **Token storage**: `src/services/tokenStorage.ts` via `expo-secure-store` — never `AsyncStorage` for tokens.
- **Type contract with backend**: manually mirrored in `src/types/api.ts` against the backend's DTOs — no codegen yet.
- **Crash reporting**: Sentry, initialized in `app/_layout.tsx`, gated on `EXPO_PUBLIC_SENTRY_DSN` (no-op when unset — local dev, CI, and any build before a real Sentry project exists) and wired to Expo Router's navigation container so sampled performance transactions carry real route names.
- **Mockups**: `mockups/` has the original HTML prototypes each screen was implemented from, including a flow map (`mockups/index.html`) documenting the intended screen order.

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
