# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Expo (React Native) mobile app — cross-platform iOS and Android — for SideQuest, a real-world mission generator with a peer-to-peer "Challenges" feature, in-app + push notifications, and Stripe payment-methods-on-file. Talks to `sidequest-backend` (sibling repo, see `backend/CLAUDE.md`); backend is the source of truth for data shape.

This document is written from the actual codebase as of 2026-07-16. If you find a discrepancy between this file and the code, the code wins — update this file. (The previous version of this file, dated 2026-07-13, omitted the Challenges feature entirely, the Notifications feature entirely, and inaccurately described the payment-methods scope — all three were already fully built at that time. Don't assume a "doesn't exist" note here is still accurate without checking.)

## Common Commands

```bash
npx expo start              # Start dev server (opens Expo Go / dev client on device/simulator)
npx expo start --ios        # Start and open iOS simulator
npx expo start --android    # Start and open Android emulator
npx expo start --web        # Start web version

npx expo run:ios            # Build and run native iOS (requires Xcode)
npx expo run:android        # Build and run native Android (requires Android Studio)

npm test                    # Run Jest tests
npm test -- --coverage      # Run with coverage report (must stay ≥ 80%)
npm test -- --testPathPattern=<file>  # Run a single test file
npm run lint                # Run ESLint

npx expo install <package>  # Install Expo-compatible package version (preferred over npm install)
```

Note: running `npx expo prebuild` (or any command that triggers it) rewrites this project's `package.json` `"android"`/`"ios"` scripts from `expo start --android`/`--ios` to `expo run:android`/`run:ios`. That's an Expo side-effect, not an intentional change — revert it if it shows up in an unrelated diff.

### Building for production

```bash
npm install -g eas-cli
eas build --platform ios --profile development   # dev-client build for the Simulator (ios.simulator: true)
eas build --platform ios                          # production profile
eas build --platform android
eas submit                  # Submit to App Store / Play Store
```

`eas.json` defines three profiles: `development` (dev client, internal distribution, iOS Simulator build), `preview` (internal, Android APK, channel `preview`), `production` (autoIncrement, channel `production`).

EAS project env vars (`EXPO_PUBLIC_*`) are set per-profile (development/preview/production) via `eas env:create` — a local `.env` alone isn't enough for a build run on EAS's infrastructure. A **native module change requires a brand-new EAS build**, not just a Metro reload — a dev-client binary only has the native modules it was built with; JS-only changes (screens, services, most bug fixes) are picked up by the already-installed dev client the moment it reconnects to a running Metro server, no rebuild needed. Know which kind of change you're making before assuming a reload is enough.

## Architecture

### Navigation — Expo Router (file-based)

Routes live under `app/`. Five routes are **retired** — thin `Redirect`s to their replacement, kept only so old deep links / stored links don't 404, not something to build against:

```
app/home.tsx                       → redirects to /today
app/mode-select.tsx                → redirects to /explore
app/mission-results.tsx            → redirects to /quest-results
app/profile.tsx                    → redirects to /you
app/proof-submission/[missionId].tsx → redirects to /proof/[missionId]
```

Everything else is live. Grouped by area:

```
app/_layout.tsx                    # root layout — QueryClientProvider, GoogleSignin.configure(), Sentry.init, Firebase Crashlytics enable, push-tap subscription, hydrate() on mount
app/(tabs)/_layout.tsx             # bottom tab navigator: Today / Explore / Progress / You
app/(tabs)/today.tsx               app/(tabs)/explore.tsx
app/(tabs)/progress.tsx            app/(tabs)/you.tsx
app/index.tsx                      # entry — Redirect to /onboarding (first launch) or /today
app/onboarding.tsx                 app/login.tsx                 app/signup-prompt.tsx
app/quest-results.tsx              app/quest/[id].tsx            app/quest/active/[id].tsx
app/proof/[missionId].tsx          app/completion.tsx
app/saved-quests.tsx
app/challenges/index.tsx           app/challenges/[id].tsx       app/challenges/create.tsx
app/notifications.tsx
app/payment-methods.tsx            # guest-guarded — redirects to /today if the caller is a guest
app/settings/index.tsx             app/settings/edit-profile.tsx
app/settings/account-security.tsx  # guest-guarded
app/settings/appearance.tsx        # also serves "Accessibility" — one screen, two entry labels
app/settings/notifications.tsx
app/progress/level.tsx             app/progress/streak.tsx       app/progress/xp.tsx
app/achievements/index.tsx         app/achievements/[id].tsx
app/statistics.tsx                 app/rewards.tsx                app/leaderboards.tsx  app/community.tsx
app/verification/[completionId].tsx  # no backend GET for a single verification exists yet — always renders a placeholder/unavailable state
```

`community.tsx`, `leaderboards.tsx`, and `rewards.tsx` (partially) are UI-only preview screens — see "Data-honesty convention" below before assuming their content is real.

### State management — Zustand

Two global stores under `src/store/`:

- **`authStore.ts`** — owns `user`, `status` (`idle`\|`loading`\|`ready`\|`error`), `isFirstLaunch` (null until `hydrate()` resolves; routes cold start to Onboarding vs Today). `hydrate()` restores a session from stored tokens, or **silently bootstraps a fresh anonymous guest session** if none exist — every first launch is a guest session by design, not optional (see `backend/CLAUDE.md`'s "guest-first" note). `login`/`signup`/`loginWithGoogle` all resolve to the same `{user, status:'ready'}` state shape. `logout()`: best-effort revokes the server-side refresh token → deregisters this device's push token (must happen before tokens are cleared, while the access token is still valid) → clears local tokens → best-effort clears the persisted query cache (a real cross-user data-leak fix on shared devices — found missing by independent review) → immediately re-calls `hydrate()` so the app lands on a fresh guest session instead of an indefinite spinner (nothing else re-triggers hydration after the root layout's one-time mount effect).
- **`themeStore.ts`** — owns `preference: 'system'|'light'|'dark'|null` (null pre-hydration), persisted to AsyncStorage (`sidequest.themePreference`). `useCompassTheme()` resolves this against `useColorScheme()` when preference is `'system'`.

Server state (missions, home data, tasks, notifications, referrals, payment methods, saved quests) goes through TanStack Query (`QueryClientProvider` in `app/_layout.tsx`, persisted to AsyncStorage for an allow-listed set of query-key roots — see "Read-cache persistence" below). Auth bootstrap itself deliberately does **not** run through a query — it must complete before other queries are meaningful.

### API client — `src/services/apiClient.ts`

Thin `fetch` wrapper, not a generated client:

- Base URL from `EXPO_PUBLIC_API_BASE_URL`, falling back per-platform: Android emulator needs `10.0.2.2` (can't reach the host via `localhost`), iOS simulator/web use `localhost`.
- Automatic 401 → refresh-token retry, with in-flight-refresh deduplication (`refreshInFlight` promise) so concurrent 401s don't each trigger their own refresh call.
- Detects `FormData` bodies and deliberately omits a manual `Content-Type` header for them — `fetch`/RN sets the multipart boundary itself, and setting `Content-Type` manually would drop that boundary parameter.
- Accepts an optional `idempotencyKey` per call, sent as the `Idempotency-Key` header — the offline queue reuses each queued item's own `id` as this key on every retry.
- `ApiError` carries the HTTP status and the backend's structured error body (`{ statusCode, timestamp, path, message }`).

### Token storage — `src/services/tokenStorage.ts`

Via `expo-secure-store`. Never AsyncStorage for tokens — this is a hard rule, not a preference, since AsyncStorage is unencrypted on-device storage. (Contrast: `queryPersistence.ts` deliberately *does* use AsyncStorage for the query cache — non-sensitive read payloads, and SecureStore's ~2KB per-item cap would be blown by a serialized query cache anyway.)

### Read-cache persistence — `src/services/queryPersistence.ts` (M23.2)

Persists only an allow-listed set of query-key roots to AsyncStorage (`home`, `quest-results`, `tasks`, `task`, `taskSummary`, `referralMe`, `referralHistory`) with a 24h max age, and never persists an errored or still-pending query — so cached screens render offline instead of showing an empty loading state, without ever surfacing stale error content.

### Offline write queue — `src/services/offlineQueue.ts` + `queuedActions.ts` (M23.3/M23.4)

A dedicated write-ahead queue for mutations that must survive app restarts and flaky connectivity — deliberately **not** TanStack Query's built-in persisted-mutation replay, because a proof/evidence upload builds a real `Blob` at submit time and a `Blob` cannot survive JSON serialization across a restart. The queue instead stores the raw file **URI** and re-materializes the Blob at replay time via the exact same API function a live (non-queued) submission uses — one code path, not two. Backed by AsyncStorage (small item count; `expo-sqlite` is an installed plugin but not actually used by this queue). Each item's `id` doubles as its `Idempotency-Key` on replay, so a mutation the server already processed doesn't double-apply (double-award XP, etc). `drain()` no-ops entirely while offline, leaving items `pending` rather than `failed`. `process()` distinguishes a genuine server rejection (`ApiError` — burns a retry, capped at `MAX_AUTO_RETRIES = 5`) from a bare connectivity-drop exception (does **not** burn a retry) — this distinction was found missing by independent review; the earlier unconditional catch could exhaust the retry budget from mere connectivity flickers during a large upload. `queuedActions.ts` is the thin screen-facing wrapper (`enqueueSaveToggle`, `enqueueProofSubmission`) — screens depend on this layer, not on `offlineQueue.ts` directly, so they can mock the enqueue boundary without pulling in NetInfo/AsyncStorage.

### Type contract with backend — `src/types/api.ts`

Manually mirrored against `sidequest-backend`'s DTOs, field-for-field — **no codegen**. Known intentional divergences to preserve, not "fix":

- Mission fields use short names (`desc`/`full`/`proof`/`time`/`xp`/`diff`/`dots`) that differ from the backend's Prisma column names (`description`/`fullBrief`/`proofRequirement`/`estimatedMinutes`/`xpReward`/`difficulty`/`difficultyDots`) — the backend's `MissionResponseDto` renames on the way out specifically to match this file.
- `HomeResponse.pendingChallenges: unknown[]` is documented as always `[]` — this is a *different*, simpler concept than the real Tasks/Challenges feature (see below); don't conflate the two when reading this field.

### Google Sign-In

`@react-native-google-signin/google-signin`, configured in `app/_layout.tsx` with **both** `webClientId` and `iosClientId` (`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`). Both are required — omitting `iosClientId` produces a real runtime failure ("failed to determine clientID") on iOS specifically. The resulting ID token is verified server-side (`google-auth-library`), not via Firebase Auth — this is true even though the project now has a `GoogleService-Info.plist` (added 2026-07-16 for Firebase Analytics/Crashlytics/push, not for auth).

### Photo/file upload — the New Architecture Blob gotcha

Three services build multipart uploads the same way, and the pattern must not regress: `src/services/proofApi.ts` (field name `photo`), `src/services/avatarApi.ts` (field name `avatar`), `src/services/tasksApi.ts`'s evidence submission (field name `photo`). All three append a real `Blob` via `expo-file-system`'s `File.slice(start, end, contentType)`, **always passing `file.type` explicitly as the third argument**:

- A plain `{ uri, name, type }` object (the old RN convention) fails under React Native's New Architecture (default here on RN 0.86) with "Unsupported FormDataPart implementation" — FormData does a strict `instanceof Blob` check.
- `expo-file-system`'s `File` class only *structurally* implements the TypeScript `Blob` interface — it does not extend the runtime `Blob` global, so appending a `File` instance directly still fails that same check. `File.slice()` is the one call that produces a genuine `Blob`.
- Calling `slice()` with no arguments produces a Blob with an empty MIME type, which the backend's `ALLOWED_IMAGE_MIME_TYPES` filter rejects — always pass `file.type` through as `contentType`.

A separate, related gotcha: **`launchCameraAsync`/`launchImageLibraryAsync` throw (not resolve a canceled result) when no camera is available** — every iOS Simulator, notably. Every call site (`EditProfileScreen`'s camera/library launchers, `app/proof/[missionId].tsx`'s `requestProofPhoto`) wraps these in try/catch for exactly this reason; without it, either the rejection goes unhandled (surfaces as a crash) or — worse, in the case of `requestProofPhoto`'s wrapping `Promise` — `resolve()` is never called and the caller's `await` hangs forever, silently breaking the whole picker flow. If you add a new photo-picker call site, wrap it the same way.

### Firebase (added 2026-07-16)

Entirely native-config-file driven — no `EXPO_PUBLIC_*` env var involved. `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) live at the repo root, referenced from `app.json` via `android.googleServicesFile`/`ios.googleServicesFile`. Requires `expo-build-properties`'s iOS `forceStaticLinking: ["RNFBApp", "RNFBAnalytics", "RNFBCrashlytics"]` — without it, RNFirebase's iOS build fails with a non-modular-header Xcode error under `useFrameworks: "static"`.

- **Analytics** (`@react-native-firebase/analytics`) — `app/_layout.tsx` logs a screen view on every navigation-state change via the existing `navigationRef`, best-effort (errors swallowed, never affects navigation).
- **Crashlytics** (`@react-native-firebase/crashlytics`) — collection enabled once at module load in `app/_layout.tsx`, best-effort. Additive to Sentry, not a replacement — Crashlytics covers native crashes, Sentry covers JS/manual error reporting. Unlike Sentry's explicit `Boolean(dsn)` enabled-flag, Crashlytics has no separate guard: it's automatically a no-op in any build that doesn't bundle the two config files above.
- **Push notifications** (`src/services/pushNotifications.ts`) — uses `expo-notifications` + Expo's push service, **not** FCM/APNs called directly (the backend's `RegisterPushTokenDto.token` example is literally `ExponentPushToken[...]`, confirming this is the intended shape). `registerForPushNotifications()` requests permission if undecided, reads the EAS `projectId` from `Constants.expoConfig?.extra?.eas?.projectId`, gets an Expo push token, and registers it via `POST /notifications/push-tokens` (an upsert — safe to call repeatedly). Called from `app/_layout.tsx` on every transition to `authStatus === 'ready'` (hydrate, login, signup, Google sign-in all land here). `unregisterCurrentDevice()` is called from `authStore.logout()`. `subscribeToNotificationTaps()` opens `/notifications` on a tap — **not** per-notification-type deep-linking; `NotificationsScreen`'s own `data.screen` routing is intentionally left unwired to concrete routes for now, so don't assume tapping a specific notification type navigates anywhere specific yet.
- iOS push delivery additionally requires an APNs key uploaded to EAS credentials (`eas credentials -p ios`) — separate from the Firebase config files, a `.p8` from the Apple Developer account. Android push works without this extra step.

### Payments — Stripe (`src/services/paymentApi.ts`, `PaymentMethodsScreen`)

**Cards-on-file only — there is no charge, checkout, or billing call anywhere in this codebase.** `createSetupIntent` → `initPaymentSheet`/`presentPaymentSheet` (`@stripe/stripe-react-native`) → the card is saved directly against Stripe; the raw card number never touches this app or the backend. `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` is a **public** key (not a secret, safe to commit/paste — Stripe designed it to be embedded client-side), falls back to `''` if unset (StripeProvider still mounts; only the PaymentSheet calls fail at runtime, so an unset key never crashes the app on launch). If "Add a card" fails immediately with a generic error before the card sheet even opens, check whether the *backend's* `STRIPE_SECRET_KEY` is a real key first (`POST /payment/setup-intent` returning 502 is a backend config issue, not a mobile bug) before assuming the mobile key is the problem.

### Key Expo conventions

- `app.json` plugins (in load order): `expo-router`, `expo-status-bar`, `expo-image-picker` (photo/camera permission strings, `microphonePermission: false`), `@sentry/react-native`, `expo-splash-screen`, `@react-native-google-signin/google-signin`, `expo-build-properties` (iOS `useFrameworks: "static"`, `forceStaticLinking` for RNFirebase, `extraPods` for `GoogleUtilities`/`RecaptchaInterop`), `expo-notifications`, `@stripe/stripe-react-native`, `expo-font`, `@react-native-firebase/app`, `@react-native-firebase/analytics`, `@react-native-firebase/crashlytics`.
- `assets/` — brand assets (icons, splash) live under `assets/`, sources under `assets/brand/`.
- `eas.json` — EAS Build/Submit configuration; three profiles, see "Building for production" above.
- `EXPO_PUBLIC_*` env vars actually in use (`.env`/`.env.example`, repo root): `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`. No Firebase-specific env var exists — it's entirely file-driven (see above).

## The Compass design system — migration status

`src/constants/compassDesign.ts` is the current design-token file (colors, `CompassFonts`, `CompassType` scale, `CompassSpacing`, `CompassRadius`, `CompassMotion`, `COMPASS_TOUCH_MIN = 48`), transcribed verbatim from `product-redesign/.../tokens.css`. It **coexists** with the legacy `src/constants/design.ts` during an incremental, screen-by-screen migration — do not mix the two systems within a single screen. Palettes are theme-reactive (`CompassColorsLight`/`CompassColorsDark`, resolved via `useCompassTheme()`); `design.ts` is light-only and static.

**Current status (measured 2026-07-24): all 30 live screens are on Compass.** `PaymentMethodsScreen` was migrated to Compass in Batch 7 (it previously was the sole legacy `design.ts` holdout and cross-imported a `whenPressed` helper from the dead `HomeScreen` module; it now has its own local copy). With that dependency gone, all 6 superseded screens were deleted as dead code in Batch 8. The only remaining importer of legacy `design.ts` anywhere is the `app/index.tsx` route (a pre-hydration loading spinner) — so `design.ts` still exists but no live *screen* references it.

## Screens — live vs superseded

**Superseded (deleted in Batch 8 — listed here only as a rename map for old references)**: `CompletionScreen` (→ `CompletionScreenV2`), `HomeScreen` (→ Today tab / `TodayScreen`), `MissionResultsScreen` (→ `QuestResultsScreen`), `ModeSelectScreen` (→ Explore tab's mode tiles; its `QuestMode` type was relocated to `src/types/questMode.ts`, still used by the retired `mode-select` redirect route), `ProfileScreen` (→ You tab / `YouScreen`), `ProofSubmissionScreen` (→ `ProofSubmissionScreenV2`). Their directories no longer exist under `src/screens/`; the five retired redirect routes under `app/` (`home`, `mode-select`, `mission-results`, `profile`, `proof-submission/[missionId]`) remain so old deep links don't 404.

**Live (30 screens)** — grouped by area, one line each:

*Core quest flow*: `OnboardingScreen` (4-step crew/time/setting/budget carousel) · `ExploreScreen` (quest-finding hub, mode tiles) · `QuestResultsScreen` (filtered results list) · `QuestDetailScreen` (pre-accept detail; renders "unavailable" when no `Mission` object resolves) · `ActiveQuestScreen` (in-progress tracker) · `ProofSubmissionScreenV2` (photo/text proof submission) · `CompletionScreenV2` (post-quest celebration + signup gate for guests) · `SavedQuestsScreen` (bookmarked missions).

*Tabs*: `TodayScreen` · `ProgressOverviewScreen` · `YouScreen` (+ `ExploreScreen` above).

*Challenges (Tasks)*: `ChallengeFeedScreen` (creator/assignee task list, 3 lifecycle tabs) · `ChallengeDetailScreen` (status timeline + role-aware actions) · `CreateChallengeScreen` (4-step creation wizard).

*Progress/gamification detail*: `LevelDetailScreen` · `XpDetailScreen` · `StreakDetailScreen` · `AchievementsScreen` · `AchievementDetailScreen` · `StatisticsScreen`.

*Account & settings*: `LoginScreen` · `SignupPromptScreen` · `EditProfileScreen` · `AccountSecurityScreen` (change password / delete account, guest-guarded) · `SettingsScreen` (nav hub — several rows intentionally unwired: Privacy/Data/Help/Legal/About have no backing screens yet) · `AppearanceAccessibilityScreen` (theme picker; reduce-motion/haptics/sound/contrast toggles are UI-only, not yet wired to anything) · `NotificationPreferencesScreen` (local-state only — no `PATCH /notifications/preferences` call wired yet despite the backend endpoint existing) · `NotificationsScreen` (real inbox).

*Payments & referrals*: `PaymentMethodsScreen` (guest-guarded; see Compass migration note above) · `RewardsScreen` (real referral stats + total XP).

*Preview-only (no live backend, explicitly marked — see "Data-honesty convention")*: `CommunityScreen` · `LeaderboardsScreen` (only the caller's own XP row is real).

*Verification*: `VerificationDetailScreen` — always renders a placeholder/unavailable state; no single-verification GET endpoint exists on the backend yet.

## Services — `src/services/*.ts` (16 modules, each with a co-located `.test.ts`)

| Service | Wraps |
|---|---|
| `apiClient.ts` | the shared `fetch` wrapper (see above) |
| `authApi.ts` | `/auth/*` — guest bootstrap, signup, login, Google auth, me, logout, password change, account deletion |
| `avatarApi.ts` | `/users/me/avatar` upload/remove |
| `homeApi.ts` | `GET /home` — the single aggregate most screens read from |
| `missionsApi.ts` | `/missions/generate`, save/unsave, `GET /missions/saved` |
| `notificationsApi.ts` | `/notifications/*` including push-token register/deregister |
| `paymentApi.ts` | `/payment/*` — SetupIntent, list/remove/set-default card |
| `profileApi.ts` | `PATCH /auth/me` (display name) |
| `proofApi.ts` | `POST /missions/:id/proof` (photo + text) |
| `pushNotifications.ts` | not a REST wrapper — the Expo push registration/permission/tap-handling module (see Firebase section) |
| `queryPersistence.ts` | not a REST wrapper — builds the TanStack Query AsyncStorage persister |
| `queuedActions.ts` | thin screen-facing wrapper over `offlineQueue.ts` |
| `referralsApi.ts` | `GET /referrals/me`, `GET /referrals/history` |
| `tasksApi.ts` | the full Challenges surface — create/list/summary/detail/invite/accept/decline/submit-evidence/review |
| `tokenStorage.ts` | SecureStore token persistence |
| `offlineQueue.ts` | the write-ahead mutation queue itself (see above) |

## Data-honesty convention

A repeated, deliberate pattern across `CommunityScreen`, `LeaderboardsScreen`, `RewardsScreen`, `StatisticsScreen`, `ChallengeFeedScreen`, and `ChallengeDetailScreen`: each explicitly comments (and in the UI, often visibly labels) when content is real vs illustrative placeholder, and refuses to fabricate a number or field the backend doesn't actually provide. `CommunityScreen` and `LeaderboardsScreen` have **zero backing endpoint** — every card beyond the caller's own row is sample content, explicitly framed as "Preview" in the UI. `StatisticsScreen` omits chart types the `/home` payload can't actually support rather than inventing data to fill them. Follow this convention for any new screen that shows social/comparative content the backend doesn't yet expose — a "Preview" label and a real absence of fabricated numbers, not a fake but plausible-looking number.

## Product-scope conflicts (flagged, not silently resolved)

Mirrors `backend/CLAUDE.md`'s section of the same name, from the mobile side:

1. Guest mode is core to `authStore.hydrate()`, not absent.
2. Explore's mode tiles map onto generic `crew`/`time`/`setting`/`budget` filters, not three named backend-modeled modes.
3. **Challenges exist** — as of 2026-07-13 this doc incorrectly said no challenge-sending UI existed. It's fully built (`app/challenges/*`, `ChallengeFeedScreen`/`ChallengeDetailScreen`/`CreateChallengeScreen`), invite-link-based rather than identity-targeted. `HomeResponse.pendingChallenges` staying `[]` is a separate, simpler, still-unbuilt concept — don't conflate the two.
4. Payment methods are cards-on-file only (`PaymentMethodsScreen`) — no pack-purchase/unlock or charge flow exists anywhere in the app.
5. **Account deletion exists** — `AccountSecurityScreen` calls `DELETE /auth/me`. This doc previously said no account-deletion screen existed; that was wrong even at the time.
6. No content-reporting UI exists (matches the backend — confirmed absent).
7. **Push notifications exist** — Firebase/Expo push, added 2026-07-16 (see above). This doc previously said none existed.

---

## Testing Requirements

**Every code change must ship with relevant unit tests. No exceptions.**

### Coverage threshold — 80% minimum

Coverage is enforced via Jest's `coverageThreshold` in `package.json`:

```js
coverageThreshold: {
  global: { branches: 80, functions: 80, lines: 80, statements: 80 }
}
```

Collection scope is `src/**/*.{ts,tsx}` only (excluding `.d.ts`, `src/types/**`, and barrel `index.ts` files) — **`app/` route files are not included in coverage collection at all.** Route-level behavior (redirects, param handling, wiring a screen's callback props to `router.push`) is still expected to be tested, just via integration tests under `__tests__/app/*.test.tsx` rather than counted toward the coverage number. A PR that drops any dimension below 80% must not be merged.

### Test stack

- **Runner**: Jest with `jest-expo` preset
- **Component testing**: `@testing-library/react-native`
- **Mocking**: Jest built-ins; `jest.mock()` for native modules; manual mocks under `__mocks__/` for modules whose native backing can't load under Jest — currently `expo-file-system.js`, `react-native-reanimated.js`, plus scoped mocks for `@react-native-async-storage`, `@react-native-community` (NetInfo), and `@react-native-google-signin`.
- **File location**: co-located next to the source file — feature-first folders (`src/screens/FooScreen/FooScreen.tsx` + `.styles.ts` if the stylesheet exceeds ~150 lines + `.test.tsx` + `index.ts` barrel export). Route-wrapper tests (`app/*.tsx`) live separately under `__tests__/app/`, not co-located with the route file.
- **Accessibility-hidden content**: a decorative element marked `accessibilityElementsHidden` (e.g. a redundant badge digit when the parent control's own `accessibilityLabel` already states the count) is invisible to RTL's default queries in this `@testing-library/react-native` version — query it with `{ includeHiddenElements: true }` rather than removing the accessibility hiding just to make a test pass.
- **Scoped/pattern-based `jest` invocations can hang in this environment** (`--testPathPattern=X` or a positional path filter), independent of the code under test — confirmed by reproducing the same hang against a known-good, already-passing file. Prefer a plain full-suite `npx jest --watchAll=false --silent` run (fast, ~5s for the whole suite) over a scoped one if a scoped run hangs; it isn't a sign your change broke something.

### What must be tested for every component

| Area | What to cover |
|---|---|
| Render | Renders without error in all required states (default, loading, empty, error) |
| Interactions | Every `Pressable` / touchable fires the expected callback |
| State transitions | Selecting an option, toggling saved, accepting a quest — verify state changes |
| Accessibility | `accessibilityLabel`, `accessibilityRole`, `accessibilityState` present on interactive elements |
| Edge cases | Empty list, maximum input length, disabled button |
| Navigation | Navigation placeholder called with correct params (mock the navigate function) |

### What not to test

- Implementation details (internal state variable names, private helper functions)
- Third-party library internals
- Static snapshot tests as a substitute for behavioural tests

### Test structure

```typescript
describe('QuestResultsScreen', () => {
  describe('rendering', () => {
    it('renders mission cards when data is loaded', () => { ... });
    it('renders skeleton when loading', () => { ... });
    it('renders empty state when no missions', () => { ... });
  });

  describe('interactions', () => {
    it('opens sheet when mission card is tapped', () => { ... });
    it('navigates to detail on accept', () => { ... });
    it('shuffles missions when shuffle button pressed', () => { ... });
  });

  describe('accessibility', () => {
    it('every Pressable has accessibilityLabel and accessibilityRole', () => { ... });
  });
});
```

---

## Agent & Skill Development Rules

All custom agents (`~/.claude/agents/`) and skills (`~/.claude/skills/`) in this project must follow these rules. Anatomy template is at `~/.claude/references/agent-skill-anatomy.md`.

### Hard limits

| Rule | Value |
|---|---|
| Max lines per file | **200** |
| Skills are procedures | Never paste code templates inline — describe what to generate |
| One responsibility | One agent/skill does one thing |

### Required anatomy — every file must have all sections in this order

**Agent files** (`~/.claude/agents/<name>.md`):
```
front-matter (name, description, model, tools)
## Role          ← one sentence
## Workflow      ← numbered steps, each with success/failure handling
## Interruption handling  ← named failure paths + recovery
## Anti-patterns ← bulleted list
```

**Skill files** (`~/.claude/skills/<name>.md`):
```
front-matter (description, model, tools)
## Input         ← what this skill expects
## Steps         ← numbered procedure
## Output        ← what to produce and where
## Interruption handling
## Anti-patterns
```

### Model assignments

| Role | Model |
|---|---|
| Producers (design, generate code, research) | `claude-opus-4-8` |
| Reviewers (eval, QA, code review) | `claude-sonnet-4-6` |
| Fast read-only tasks (inspect, parse) | `claude-haiku-4-5-20251001` |
| Pure orchestration (routing/dispatch only) | `claude-fable-5` |

Reviewers must be **separate agents** invoked via `Agent()`, called by the orchestrating conversation — not by the producer itself. Nested agent spawning is not supported in this environment: a producer's own `Agent()` calls silently do nothing even when `Agent` is listed in its tools (confirmed empirically across multiple `rn-implementer`/`backend-implementer` runs). Producers therefore never list `Agent` in their tools; they deliver output and state that independent review is still needed, and the calling conversation invokes the reviewer.

**Fable 5 is reserved for orchestration only** — command files (`~/.claude/commands/*.md`) and any agent whose entire job is parsing input and delegating to other agents/skills, with no independent content generation, analysis, or code review. This keeps token spend proportional to the work actually being reasoned about. Never assign `claude-fable-5` to a producer, code generator, or reviewer — those steps need full reasoning/generation capability and downgrading them would silently degrade output quality, not just cost.

### Swiss Cheese EDD — mandatory before delivery

Every producer agent's output must go through an independent reviewer agent before it ships. The orchestrating conversation invokes the reviewer after the producer completes (producers cannot do this themselves — see above). The reviewer runs on a different model and has read-only tools. Maximum 2 fix-and-re-eval cycles before escalating to the user.

### Permissions (tools field)

Grant the minimum tools required:
- Reviewers: `Read, Grep, Glob` only — never Write or Edit
- Designers/implementers: `Read, Write, Edit, Glob, Grep, Bash` — no `Agent`; nested spawning doesn't work, so review is the caller's job, not the producer's
- Research skills: add `WebFetch`
- Orchestrators: add `Agent`
