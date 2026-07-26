# Release Guide

## Where this ships

EAS (Expo Application Services), project `@junaidaziz/sidequest`. Three build profiles in `eas.json`: `development` (dev client, internal distribution, iOS Simulator build), `preview` (internal, Android APK, channel `preview`), `production` (autoIncrement, channel `production`).

## Pre-release checklist

Everything in `docs/QA_PROCESS.md`'s gate, plus:

- [ ] `EXPO_PUBLIC_*` env vars are set for the target profile via `eas env:create` — a local `.env` is not picked up by an EAS-run build.
- [ ] If the change touches a native module (not just JS/screens), a fresh EAS build is required — an already-installed dev client cannot pick up a native change via Metro reload.
- [ ] `EXPO_PUBLIC_API_BASE_URL` for the target profile points at the intended backend environment (Railway production URL for a real release build, not `localhost`).
- [ ] If the change depends on a new/changed backend endpoint, confirm that endpoint is deployed and live before shipping the mobile build that calls it — a mobile release and a backend release aren't atomic.

## Building

```bash
npm install -g eas-cli
eas build --platform ios --profile development   # dev-client build for Simulator (ios.simulator: true)
eas build --platform ios                          # production profile
eas build --platform android
eas submit                                        # submit to App Store / Play Store
```

## iOS push requires a separate credential step

Push delivery via Expo's push service needs an APNs key uploaded to EAS credentials (`eas credentials -p ios`) — a `.p8` from the Apple Developer account, separate from the Firebase config files (`GoogleService-Info.plist`) used for Analytics/Crashlytics. Android push works without this extra step.

## Firebase config files

`google-services.json` (Android) and `GoogleService-Info.plist` (iOS) live at the repo root and are referenced from `app.json`. These are native-config-file-driven, not env-var-driven — regenerating a build after rotating these files requires a fresh EAS build, same as any other native-config change.

## Store submission status

As of the last verified pass in `../../CLAUDE.md`: EAS build artifacts exist (self-signed Android APK, iOS simulator build) but neither store submission has happened — no Apple Developer Program account or Google Play Console account is configured yet. Check `../../CLAUDE.md`'s current state before assuming store distribution is live; this file doesn't duplicate that status so it can't drift out of sync with it.

## Post-build verification

Before considering an EAS build "shipped" for internal testing:
- Confirm the build installs and the app reaches the Today/Explore tab without crashing (cold start with no stored session — the guest bootstrap path).
- Confirm `EXPO_PUBLIC_API_BASE_URL` for that build profile actually reaches the intended backend (a guest-session bootstrap call succeeding end-to-end is a good smoke test).
- If the build includes a native module change, confirm the specific native functionality works (push registration, camera, Google Sign-In) — these can't be smoke-tested via a JS-only reload.

## Related documents

- `docs/QA_PROCESS.md` — the gate this checklist assumes already passed
- `../../CLAUDE.md`'s "Building for production" section
- `backend/.claude/docs/RELEASE_GUIDE.md` — the backend's own release runbook, relevant when a mobile release depends on a coordinated backend deploy
