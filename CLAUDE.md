# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Expo (React Native) mobile app — cross-platform iOS and Android — for SideQuest, a real-world mission generator. Talks to `sidequest-backend` (sibling repo, see `backend/CLAUDE.md`); backend is the source of truth for data shape.

This document is written from the actual codebase as of 2026-07-13. If you find a discrepancy between this file and the code, the code wins — update this file.

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
eas build --platform ios
eas build --platform android
eas submit                  # Submit to App Store / Play Store
```

EAS project env vars (`EXPO_PUBLIC_*`) are set per-profile (development/preview/production) via `eas env:create` — a local `.env` alone isn't enough for a build run on EAS's infrastructure.

## Architecture

### Navigation — Expo Router (file-based)

Routes live under `app/`:

```
app/_layout.tsx                    # root layout — QueryClientProvider, GoogleSignin.configure(), hydrate() on mount
app/index.tsx                      # entry — routes to onboarding (first launch) or home
app/onboarding.tsx
app/mode-select.tsx                # quick-start mode taps → mapped to a GenerateMissionsRequest
app/mission-results.tsx
app/proof-submission/[missionId].tsx
app/completion.tsx
app/home.tsx
app/profile.tsx
app/login.tsx
app/signup-prompt.tsx              # shown to a guest hitting the one-free-completion gate
```

### State management — Zustand

`src/store/authStore.ts` is the only global store. It owns:

- `hydrate()` — runs once at launch: restores a session from stored tokens, or **silently bootstraps a fresh anonymous guest session** if none exist. This is not optional/experimental — every first launch is a guest session by design (see `backend/CLAUDE.md`'s "guest-first" note; do not treat guest mode as something to remove).
- `login` / `signup` / `loginWithGoogle` / `logout` — `logout` best-effort revokes the server-side refresh token, then always clears local tokens and immediately re-calls `hydrate()` so the app lands back on a fresh guest session rather than an indefinite loading spinner.

Server state (missions, home data) goes through TanStack Query (`QueryClientProvider` in `app/_layout.tsx`). Auth bootstrap itself deliberately does **not** run through a query — it must complete before other queries are meaningful.

### API client — `src/services/apiClient.ts`

Thin `fetch` wrapper, not a generated client:

- Base URL from `EXPO_PUBLIC_API_BASE_URL`, falling back per-platform: Android emulator needs `10.0.2.2` (can't reach the host via `localhost`), iOS simulator/web use `localhost`.
- Automatic 401 → refresh-token retry, with in-flight-refresh deduplication (`refreshInFlight` promise) so concurrent 401s don't each trigger their own refresh call.
- Detects `FormData` bodies and deliberately omits a manual `Content-Type` header for them — `fetch`/RN sets the multipart boundary itself, and setting `Content-Type` manually would drop that boundary parameter.
- `ApiError` carries the HTTP status and the backend's structured error body (`{ statusCode, timestamp, path, message }`).

### Token storage — `src/services/tokenStorage.ts`

Via `expo-secure-store`. Never AsyncStorage for tokens — this is a hard rule, not a preference, since AsyncStorage is unencrypted on-device storage.

### Type contract with backend — `src/types/api.ts`

Manually mirrored against `sidequest-backend`'s DTOs, field-for-field — **no codegen**. Two known intentional divergences to preserve, not "fix":

- Mission fields use short names (`desc`/`full`/`proof`/`time`/`xp`/`diff`/`dots`) that differ from the backend's Prisma column names (`description`/`fullBrief`/`proofRequirement`/`estimatedMinutes`/`xpReward`/`difficulty`/`difficultyDots`) — the backend's `MissionResponseDto` renames on the way out specifically to match this file.
- `HomeResponse.pendingChallenges: unknown[]` is documented as always `[]` — there is no challenge-sending backend yet (see `backend/CLAUDE.md`'s product-scope conflicts).

### Google Sign-In

`@react-native-google-signin/google-signin`, configured in `app/_layout.tsx` with **both** `webClientId` and `iosClientId` (`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`). Both are required — omitting `iosClientId` produces a real runtime failure ("failed to determine clientID") on iOS specifically, since this project has no `GoogleService-Info.plist`/Firebase project to fall back to. The resulting ID token is verified server-side (`google-auth-library`), not via Firebase.

### Photo proof upload — `src/services/proofApi.ts`

Appends a real `Blob` via `expo-file-system`'s `File.slice(start, end, contentType)`, **always passing `file.type` explicitly as the third argument**. Two things to not regress:

- A plain `{ uri, name, type }` object (the old RN convention) fails under React Native's New Architecture (default on RN 0.86 here) with "Unsupported FormDataPart implementation" — FormData does a strict `instanceof Blob` check.
- `expo-file-system`'s `File` class only *structurally* implements the TypeScript `Blob` interface — it does not extend the runtime `Blob` global, so appending a `File` instance directly still fails that same check. `File.slice()` is the one call that produces a genuine `Blob`.
- Calling `slice()` with no arguments produces a Blob with an empty MIME type, which the backend's `ALLOWED_IMAGE_MIME_TYPES` filter rejects — always pass `file.type` through as `contentType`.

### Key Expo conventions

- `app.json` — Expo configuration (bundle ID, permissions, plugins: `expo-router`, `expo-image-picker`, `expo-splash-screen`, `@react-native-google-signin/google-signin`, `expo-build-properties`, `@sentry/react-native`)
- `assets/` — brand assets (icons, splash) live under `assets/`, sources under `assets/brand/`
- `eas.json` — EAS Build/Submit configuration for production builds

## Product-scope conflicts (flagged, not silently resolved)

Same conflicts as documented in `backend/CLAUDE.md` apply here, since the mobile client and backend contract must agree:

1. Guest mode is core to `authStore.hydrate()`, not absent — an earlier "no guest mode" planning rule does not match this app.
2. `ModeSelectScreen` offers more than three named modes and maps them onto generic `crew`/`setting` filters, not three backend-modeled modes named "Friends Night"/"Couple Mode"/"Solo Adventure".
3. No challenge-sending UI or backend exists (`pendingChallenges` is always `[]`).
4. No paid-pack purchase/unlock flow exists. The Stripe work now planned is payment-methods-on-file (add/select/remove a card), not a pack-purchase-and-receipt-validation flow.
5. No account-deletion screen or endpoint exists.
6. No content-reporting UI exists.
7. No push-notification integration exists.

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

A PR that drops any dimension below 80% must not be merged. When adding new code, verify coverage with `npm test -- --coverage` before marking the task done.

### Test stack

- **Runner**: Jest with `jest-expo` preset
- **Component testing**: `@testing-library/react-native`
- **Mocking**: Jest built-ins; `jest.mock()` for native modules; manual mocks under `__mocks__/` for modules whose native backing can't load under Jest (e.g. `expo-file-system`)
- **File location**: co-located next to the source file — feature-first folders (`src/screens/FooScreen/FooScreen.tsx` + `.styles.ts` if the stylesheet exceeds ~150 lines + `.test.tsx` + `index.ts` barrel export)

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
describe('MissionResultsScreen', () => {
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
