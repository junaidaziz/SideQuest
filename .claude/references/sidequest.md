# SideQuest — Project Reference

**Product**: Real-world mission generator, Android-first
**Tagline**: "Something to actually do, right now, wherever you are."

## Core loop
User selects context (who they're with, time, setting, budget) → app returns 2-3 completable real-world missions → user submits photo or text proof → earns XP, streaks, can challenge friends.

## v1 Constraints
- No public feed — every screen must work standalone for a solo user with zero friends added
- Guest mode: one mission completable with no account
- Account gate triggers only at: save progress / earn XP / send a challenge — never before

## Full v1 screen set
1. **Onboarding / context selector** — Who are you with? → Time available? → Setting? → Budget?
2. **Mission results** — 2-3 mission cards matching the selected filters
3. **Mission detail** — full mission description + proof requirement
4. **Proof submission** — photo/text capture flow
5. **Completion** — XP gained, shareable completion card, challenge-a-friend prompt
6. **Home / returning user** — daily free mission, active streak, XP level, pending challenges, saved mission packs
7. **Mode select** — Solo Adventure, Couple Mode, Friends Night, Family Weekend, Explore My City, Confidence Builder, Travel Mode, Kids Mode
8. **Guest-to-account signup prompt** — triggered contextually (save/XP/challenge moments), never upfront

## Mockup format
Phone-frame HTML prototypes — realistic device frame containing a ~390×844px scrollable viewport. Android Material-influenced visual language but with SideQuest's own identity — not stock Material defaults.

## Design system rule
Establish the full token set (palette, type, layout concept, signature element) on the very first screen. Save decisions to `mockups/design-tokens.md`. Apply consistently to all remaining screens without re-deciding per screen.
