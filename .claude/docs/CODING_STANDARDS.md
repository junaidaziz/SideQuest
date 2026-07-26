# Coding Standards

These are the rules `rn-implementer` writes to and `rn-eval` reviews against (see `../agents/`). They're binding for human contributors too.

## TypeScript

- **No `any`**, ever, even temporarily.
- Proper interfaces for every prop type and API response shape — `src/types/api.ts` mirrors backend DTOs field-for-field; a new backend field needs a corresponding addition here, not an inline object literal type at the call site.
- Typed function params, not implicit `any` from a missing annotation.

## React Native patterns

- `StyleSheet.create` only — no inline style objects for anything beyond a one-off dynamic value.
- `Pressable`, not the older `Touchable*` components.
- `FlatList` for any list, never `.map()` inside a `ScrollView` for a data-driven list.
- `useNativeDriver: true` on animations wherever the driven properties support it.
- Compass design tokens (`src/constants/compassDesign.ts`) only for new/touched screens — never the legacy `design.ts`, never a hardcoded hex value. See `docs/ARCHITECTURE.md`'s "Compass design system" section.
- `expo-image`'s `ResponsiveImage` component (not core `Image`) for any avatar/media-pipeline-backed image — see `../../CLAUDE.md`'s "Media pipeline" section for the variant-selection contract.

## Accessibility

- `accessibilityLabel` and `accessibilityRole` on every interactive element; `accessibilityState` where relevant (e.g. `selected`, `disabled`).
- A decorative element hidden via `accessibilityElementsHidden` needs `{ includeHiddenElements: true }` in its test query, not the accessibility hiding removed just to make a test pass.

## File uploads — the one pattern that must not regress

Every multipart upload (`proofApi.ts`, `avatarApi.ts`, `tasksApi.ts`'s evidence submission, `mediaApi.ts`) calls `localUploadFile(uri)` and appends its return value **directly** — no `.slice()`, no cast, no `{ uri, name, type }` object. See `../../CLAUDE.md`'s "Photo/file upload" section for exactly why the two alternative approaches both break under Expo's Winter fetch runtime. If you're writing a new file-upload call site, copy this exact pattern; don't reinvent it.

## Data honesty

Screens showing social/comparative content the backend doesn't actually provide (leaderboards, community feed, some statistics) must explicitly label themselves "Preview" and never fabricate a plausible-looking number. See `../../CLAUDE.md`'s "Data-honesty convention" section — this is a deliberate, repeated pattern across several existing screens; a new screen in the same category should follow it, not invent a different convention.

## Camera/picker error handling

`launchCameraAsync`/`launchImageLibraryAsync` throw (not resolve a canceled result) when no camera is available, notably every iOS Simulator. Every call site wraps these in try/catch. A new photo-picker call site must do the same — an unwrapped call either crashes or, worse inside a wrapping `Promise`, hangs forever if `resolve()` is never called on the error path.

## Testing

- Every new screen/component ships co-located tests. No exceptions.
- Coverage gate: 80% branches/functions/lines/statements on `src/**/*.{ts,tsx}` (`app/` route files are integration-tested separately, see `docs/QA_PROCESS.md`).
- Test render states (default/loading/empty/error), every interaction, state transitions, accessibility props, and edge cases. Don't test implementation details, third-party internals, or rely on snapshot tests as a substitute for behavioral tests.

## Formatting

- ESLint (`npm run lint`) — fix before considering a change ready.
- TypeScript strict mode is on — don't add `// @ts-ignore` to route around a real type error.
