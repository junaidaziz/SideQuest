# QA Process

## The gate

A mobile change is done only when all of the following hold — this is the same bar for a human PR and for `rn-implementer`/`rn-eval` output:

1. **Lint passes** — `npm run lint`.
2. **Unit tests pass with coverage ≥80%** on branches/functions/lines/statements, scoped to `src/**/*.{ts,tsx}` — `npm test -- --coverage`.
3. **Route-level behavior is integration-tested** — `app/` files aren't in the coverage number, but redirects, param handling, and callback wiring still need tests under `__tests__/app/`.
4. **Independent review passes** — for agent-generated code, `rn-eval`'s four-layer report has no unresolved FAIL (and for a new mockup preceding it, `eval-driven-development`'s four-layer report). For human PRs, standard code review covering the same layers (see `docs/CODING_STANDARDS.md`).
5. **Docs updated** if the change touches anything documented in `../../CLAUDE.md` or this `.claude/docs/` set.

This mirrors what CI (`.github/workflows/ci.yml`) checks on every push/PR.

## The four-layer review (Swiss Cheese model)

**Mockups** (`eval-driven-development`):
- **A · Functional** — matches the brief and `../references/sidequest.md`'s v1 constraints
- **B · Non-functional** — accessibility, performance, responsiveness in the phone-frame viewport
- **C · Best practices** — semantic HTML, heading hierarchy, consistent design tokens
- **D · Security** — no `eval()`, no `innerHTML` injection, no live endpoints in a static mockup

**Implemented code** (`rn-eval`):
- **A · TypeScript** — no `any`, proper interfaces, typed params
- **B · RN Patterns** — `StyleSheet.create`, `Pressable`, `FlatList`, `useNativeDriver`, Compass tokens only
- **C · Accessibility** — `accessibilityLabel`/`accessibilityRole`/`accessibilityState` on every interactive element
- **D · Expo conventions** — no undeclared packages, no stray `console.log`, correct multipart-upload pattern

Each layer independently catches what the others might miss — a FAIL in any layer blocks a PASS verdict overall. Don't soften a FAIL to a WARN to unblock a merge. Maximum 2 fix-and-re-eval cycles before escalating to the user.

## What "known gap, not a regression" looks like

Some incompleteness is intentional and already flagged in the code/docs — e.g. `SettingsScreen`'s unwired nav rows (Privacy/Data/Help/Legal/About), `AppearanceAccessibilityScreen`'s UI-only toggles, `NotificationPreferencesScreen`'s local-state-only persistence despite a backing endpoint existing. See `../../CLAUDE.md`'s screen-by-screen notes. Don't treat these as bugs to silently fix in an unrelated change — if you think one should be wired up, raise it explicitly.

## Data-honesty review

Any screen showing content the backend doesn't back yet must be explicitly labeled "Preview" in the UI and must not fabricate a plausible-looking number. This is a specific, additional check beyond the four layers above — see `../../CLAUDE.md`'s "Data-honesty convention" and `docs/CODING_STANDARDS.md`.

## Milestone reporting

After a completed feature, report: summary, files changed, screens added/changed, any backend API dependency (new or changed), QA results (coverage numbers, which layers passed), accessibility notes, remaining work, and next milestone.
