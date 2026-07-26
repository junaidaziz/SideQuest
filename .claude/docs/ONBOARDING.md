# Onboarding

For a new developer or a fresh Claude Code session picking up this repo for the first time.

## Read in this order

1. **This file** — orientation.
2. **`../../CLAUDE.md`** — the deep reference. Long, dense, and written from the actual code, not planning docs. Skim it once fully before writing anything.
3. **`docs/ARCHITECTURE.md`** — where things live and why.
4. **`../references/sidequest.md`** — the product framing (core loop, v1 constraints).
5. **`docs/CODING_STANDARDS.md`** — the rules your code will be reviewed against.

Then set up locally per `docs/DEVELOPMENT_GUIDE.md`.

## What this app is

Expo/React Native mobile client for SideQuest — cross-platform iOS/Android, a real-world mission generator with a peer-to-peer "Challenges" feature, notifications, and Stripe cards-on-file. Talks to `sidequest-backend` (sibling repo); backend is the source of truth for data shape.

## Things that will surprise you if you don't read them first

- **Guest mode is the default first-launch state**, not an edge case — `authStore.hydrate()` silently bootstraps an anonymous session if no stored tokens exist.
- **Two design-token systems coexist during a migration** — Compass (`compassDesign.ts`, current) and legacy (`design.ts`, nearly fully retired). Never mix them in one screen.
- **File uploads have one correct pattern and two documented-broken alternatives** — see `docs/CODING_STANDARDS.md`'s "File uploads" section before writing any new upload call site. This isn't a style preference; the two alternatives throw at runtime under Expo's current fetch implementation.
- **Some screens intentionally show fake/preview data**, clearly labeled, because the backend doesn't support that content yet (leaderboards, community feed). See `docs/CODING_STANDARDS.md`'s "Data honesty" section — don't "fix" this by inventing a backing endpoint without a product conversation, and don't remove the "Preview" labeling.
- **Five routes are retired redirects**, kept only so old deep links don't 404 (`app/home.tsx`, `app/mode-select.tsx`, etc. — see `../../CLAUDE.md`'s navigation map). Don't build new functionality against them.

## Agents available in this repo

- **`ui-ux-designer`** (`.claude/agents/ui-ux-designer.md`) — produces HTML mockups (`mockups/<screen>.html`) before any code is written.
- **`eval-driven-development`** (`.claude/agents/eval-driven-development.md`) — independent review of a mockup, four-layer (Swiss Cheese).
- **`rn-implementer`** (`.claude/agents/rn-implementer.md`) — converts a completed mockup into production Expo/React Native code + tests.
- **`rn-eval`** (`.claude/agents/rn-eval.md`) — independent QA review of implemented code, four-layer (Swiss Cheese).

Full pipeline: design → eval → implement → eval. Each producer explicitly hands off to its reviewer rather than self-reviewing; see `../../CLAUDE.md`'s "Agent & Skill Development Rules" section for the governing rules behind this pattern (model assignments, tool permissions, why nested agent spawning doesn't work here).

Both `rn-implementer`/`rn-eval` and `ui-ux-designer`/`eval-driven-development` call skills under `~/.claude/skills/` — user-level, not committed to this repo. If those skills aren't present on a given machine, each agent falls back to doing the equivalent work directly against this repo's own `.claude/docs/` — see each agent file's Workflow section.

## Definition of done

See `docs/QA_PROCESS.md`. Short version: requirements implemented, tests pass at ≥80% coverage on all four dimensions, lint/type-check clean, `rn-eval`/`eval-driven-development` PASS (no unresolved FAIL items), docs updated if the change touches something documented here.
