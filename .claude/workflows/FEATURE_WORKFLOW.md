# Feature Workflow

The standard path for a new mobile feature, from brief to merge. Same shape as `backend` and `web`'s feature workflow, with an added design step before implementation.

## 1. Design

For a new screen or significant flow change, use `ui-ux-designer` (`.claude/agents/ui-ux-designer.md`) to produce an HTML mockup under `mockups/`. Skip this step only for a small change to an already-mocked, already-implemented screen.

## 2. Design review

`eval-driven-development` (`.claude/agents/eval-driven-development.md`) reviews the mockup across four layers before implementation starts. A FAIL routes back to step 1.

## 3. Implement

Use `rn-implementer` (`.claude/agents/rn-implementer.md`) to convert an approved mockup into production Expo/React Native code, or implement directly following `docs/CODING_STANDARDS.md` for a smaller change. Either way: Compass design tokens, co-located tests, the established multipart-upload pattern for any file-upload work, and explicit "Preview" labeling for any not-yet-backend-supported content.

Check whether this feature needs a backend change first — if so, confirm the endpoint/shape with `backend`'s equivalent workflow before building the mobile side against an assumed shape.

## 4. QA

Full gate in `docs/QA_PROCESS.md`: lint, unit tests ≥80% coverage, route-level integration tests for any new `app/` file.

## 5. Independent review

`rn-eval` (`.claude/agents/rn-eval.md`) reviews implemented code across the four Swiss Cheese layers (TypeScript, RN Patterns, Accessibility, Expo conventions). `rn-implementer` cannot review its own output — this step is mandatory, not optional, and a FAIL routes back to step 3.

## 6. Accessibility & data-honesty check

Explicit pass on accessibility props and, if the screen shows any social/comparative content, the "Preview" labeling convention (`docs/CODING_STANDARDS.md`'s "Data honesty" section).

## 7. Documentation

Update whichever of these the change actually touches — don't update all of them reflexively:
- `../CLAUDE.md` — any new screen, service, architectural decision, or product-scope divergence
- `docs/ARCHITECTURE.md` / `CODING_STANDARDS.md` — only if the change introduces a new pattern worth generalizing

## 8. Merge

Definition of done: requirements implemented, QA gate passed, `rn-eval` PASS with no unresolved FAIL, accessibility/data-honesty check passed, docs updated, no critical issues remaining.
