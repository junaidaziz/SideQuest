# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Expo (React Native) mobile app — cross-platform iOS and Android.

## Setup

```bash
npx create-expo-app@latest . --template blank-typescript
npm install
```

## Common Commands

```bash
npx expo start              # Start dev server (opens Expo Go on device/simulator)
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

## Architecture

This is a new project. As it grows, document the structure here:

- **Navigation**: Note the navigator used (e.g., Expo Router file-based routing, or React Navigation stack/tab)
- **State management**: Note approach when decided (Context, Zustand, Redux, etc.)
- **Data fetching**: Note pattern when decided (React Query, SWR, plain fetch, etc.)

### Key Expo conventions

- `app.json` / `app.config.js` — Expo configuration (bundle ID, permissions, plugins)
- `assets/` — Images, fonts, and other static assets
- With **Expo Router** (file-based): `app/` directory maps to routes; `app/(tabs)/` for tab groups
- With **React Navigation**: navigation stacks are composed in code, typically under `src/navigation/`
- `eas.json` — EAS Build/Submit configuration for production builds

### Building for production

```bash
npm install -g eas-cli
eas build --platform ios
eas build --platform android
eas submit                  # Submit to App Store / Play Store
```

---

## Testing Requirements

**Every code change must ship with relevant unit tests. No exceptions.**

### Coverage threshold — 80% minimum

Coverage is enforced via Jest's `coverageThreshold` in `jest.config.js`:

```js
coverageThreshold: {
  global: { branches: 80, functions: 80, lines: 80, statements: 80 }
}
```

A PR that drops any dimension below 80% must not be merged. When adding new code, verify coverage with `npm test -- --coverage` before marking the task done.

### Test stack

- **Runner**: Jest with `jest-expo` preset
- **Component testing**: `@testing-library/react-native`
- **Mocking**: Jest built-ins; `jest.mock()` for native modules
- **File location**: co-located next to the source file — `src/screens/FooScreen.test.tsx` beside `FooScreen.tsx`

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

Reviewers must be **separate agents** invoked via `Agent()` — not inline skill calls within the producer. This is the Swiss Cheese independence guarantee.

### Swiss Cheese EDD — mandatory before delivery

Every producer agent must invoke an independent reviewer agent after output is produced. The reviewer runs on a different model and has read-only tools. Maximum 2 fix-and-re-eval cycles before escalating to the user.

### Permissions (tools field)

Grant the minimum tools required:
- Reviewers: `Read, Grep, Glob` only — never Write or Edit
- Designers/implementers: `Read, Write, Edit, Glob, Grep, Bash`
- Research skills: add `WebFetch`
- Orchestrators: add `Agent`
