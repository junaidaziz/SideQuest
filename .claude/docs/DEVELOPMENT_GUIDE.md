# Development Guide

## Local setup

```bash
npm install
cp .env.example .env         # fill in EXPO_PUBLIC_API_BASE_URL and the other vars — never commit .env
npx expo start                # opens Expo Go / dev client on device/simulator
npx expo start --ios          # open iOS simulator directly
npx expo start --android      # open Android emulator directly
npx expo start --web          # web target
```

`EXPO_PUBLIC_API_BASE_URL` needs a per-platform value for local backend development: Android emulator can't reach the host via `localhost` (use `10.0.2.2`), iOS simulator/web use `localhost` — `apiClient.ts` already has this fallback built in, but a real device on the same network needs your machine's LAN IP explicitly.

## Common commands

```bash
npm test                                  # run Jest
npm test -- --coverage                    # with coverage report (must stay ≥80%)
npx jest --watchAll=false --silent        # prefer this full-suite form — a scoped --testPathPattern run can hang in this environment independent of the code under test, see ../../CLAUDE.md
npm run lint                              # ESLint
npx expo install <package>                # always use this instead of npm install for Expo-compatible version resolution
```

## Building for production (EAS)

```bash
npm install -g eas-cli
eas build --platform ios --profile development   # dev-client build, Simulator
eas build --platform ios                           # production profile
eas build --platform android
eas submit
```

Three EAS profiles (`eas.json`): `development` (dev client, internal, iOS Simulator), `preview` (internal, Android APK), `production` (autoIncrement). `EXPO_PUBLIC_*` env vars are set per-profile via `eas env:create` — a local `.env` alone isn't enough for an EAS-run build.

**A native module change requires a brand-new EAS build**, not a Metro reload — a dev-client binary only has the native modules it shipped with. JS-only changes are picked up by an already-installed dev client the moment it reconnects to Metro. Know which kind of change you're making before assuming a reload is enough.

`npx expo prebuild` (or anything that triggers it) rewrites `package.json`'s `"android"`/`"ios"` scripts from `expo start --android`/`--ios` to `expo run:android`/`run:ios` as a side effect — revert it if it shows up in an unrelated diff.

## Working against the backend

Backend is the source of truth for every response shape (`backend` repo, sibling to this one). Before changing a screen's expected API response:
1. Check `src/types/api.ts` for the current mirrored type and any documented intentional divergence (field renames like `desc`/`full`/`proof` vs. the backend's `description`/`fullBrief`/`proofRequirement`).
2. If the backend hasn't shipped the change yet, coordinate — don't build against a shape that doesn't exist in the deployed API.
3. Update `src/types/api.ts` to match once the backend change ships; there's no codegen, this is a manual, deliberate mirror.

## Related documents

- `docs/ARCHITECTURE.md` — where things live and why
- `docs/CODING_STANDARDS.md` — what gets enforced in review
- `docs/QA_PROCESS.md` — the gate before something is "done"
- `docs/RELEASE_GUIDE.md` — EAS build/submit runbook
- `../../CLAUDE.md` — the deep reference for all of the above
