# Architecture Guide

This is the orientation map. `../../CLAUDE.md` is the deep, continuously-verified reference (navigation map, state management, API client, media pipeline, offline queue, Firebase/push wiring) — read it before touching any screen or service. This file exists to answer "where does X live and why" without re-deriving the whole system from scratch.

## Shape of the app

Expo Router (file-based navigation) over a feature-first screen structure:

```
app/                          # routes only — thin wrappers that wire a screen's props/callbacks to navigation
  (tabs)/                     # Today / Explore / Progress / You bottom-tab group
  <feature>/                  # grouped routes, e.g. challenges/, settings/, progress/, achievements/
src/
  screens/<Name>Screen/       # the actual screen implementation
    <Name>Screen.tsx
    <Name>Screen.styles.ts    # only if the stylesheet exceeds ~150 lines
    <Name>Screen.test.tsx
    index.ts                  # barrel export
  services/                   # one file per backend resource, each a thin fetch wrapper + co-located .test.ts
  store/                      # Zustand: authStore.ts, themeStore.ts — the only two global stores
  constants/compassDesign.ts  # current design-token system — see "Compass migration" below
  types/api.ts                # manually mirrored against backend DTOs, no codegen
```

Coverage collection is `src/**/*.{ts,tsx}` only — `app/` route files are tested separately via integration tests under `__tests__/app/`, not counted toward the 80% coverage number. See `docs/QA_PROCESS.md`.

## The Compass design system — two systems, one migration in progress

`src/constants/compassDesign.ts` (theme-reactive, transcribed from `product-redesign/.../tokens.css`) is current; `src/constants/design.ts` (light-only, static) is legacy. **All 30 live screens are on Compass as of the last verified pass** (see `../../CLAUDE.md`) — the only remaining `design.ts` importer is `app/index.tsx`'s pre-hydration spinner. Never mix the two systems within one screen; never hardcode a hex color instead of importing from `compassDesign.ts`.

## State management

Two Zustand stores, both under `src/store/`:
- **`authStore.ts`** — session state, guest bootstrap, login/signup/Google sign-in, logout (which clears the persisted query cache — a cross-user data-leak fix on shared devices, don't remove it).
- **`themeStore.ts`** — theme preference, persisted, resolved against `useColorScheme()` via `useCompassTheme()`.

Everything else (missions, home, tasks, notifications, referrals, payment methods, saved quests) goes through TanStack Query. Auth bootstrap deliberately does not run through a query — see `../../CLAUDE.md`'s "State management" section for why.

## Offline-first infrastructure

Three purpose-built layers, not TanStack Query's built-in persistence:
- **`src/services/queryPersistence.ts`** — allow-listed query-key roots persisted to AsyncStorage, 24h max age, never persists errored/pending queries.
- **`src/services/offlineQueue.ts` + `queuedActions.ts`** — a write-ahead mutation queue for actions that must survive app restarts (proof submission, save-toggle). Stores the raw file URI, not a `Blob` (which can't survive JSON serialization). Screens depend on `queuedActions.ts`, never on `offlineQueue.ts` directly.

Read `../../CLAUDE.md`'s "Offline write queue" section before touching either — the retry-budget/connectivity-drop distinction there is load-bearing, not incidental.

## Backend contract

`src/services/apiClient.ts` is a thin `fetch` wrapper, not a generated client — `src/types/api.ts` is manually mirrored against `sidequest-backend`'s DTOs and has documented, intentional field-name divergences (see `../../CLAUDE.md`'s "Type contract with backend"). Backend is the source of truth; a response-shape change there is a breaking change here until this repo is updated to match.

## Related documents

- `../../CLAUDE.md` — deep reference, updated whenever the code changes underneath it
- `../references/sidequest.md` — product framing (core loop, v1 constraints)
- `docs/CODING_STANDARDS.md` — the rules `rn-implementer`/`rn-eval` enforce
- `docs/QA_PROCESS.md` — what "done" requires
