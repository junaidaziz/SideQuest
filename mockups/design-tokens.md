# SideQuest Design Tokens

Established on screen 1 (onboarding). Apply to all subsequent screens without re-deciding.

## Colour

| Token | Value | Usage |
|---|---|---|
| `--ink` | `#0E0E1A` | Primary text, phone frame background, icons |
| `--surface` | `#FFFFFF` | Screen background, card fills |
| `--surface-muted` | `#F5F3FF` | Unselected option hover, subtle backgrounds |
| `--primary` | `#5B3DE8` | Selected state, CTA buttons, progress, links |
| `--primary-dark` | `#4A2ED6` | Button hover / pressed state |
| `--primary-light` | `#EBE7FD` | Tinted backgrounds, chips unselected |
| `--accent` | `#FFB800` | XP, streaks, rewards, completion moments only |
| `--accent-light` | `#FFF8E1` | Tinted accent background for XP/reward badges |
| `--accent-dark` | `#B45309` | Darkened accent for accent-on-light text (WCAG contrast) |
| `--text-secondary` | `#6B6880` | Subtitles, hints, secondary labels |
| `--border` | `#E8E5F4` | Card borders, dividers, disabled states |
| `--error` | `#E53935` | Error states, destructive actions |
| `--success` | `#2E7D32` | Completion confirmations |
| `--success-light` | `#E8F5E9` | Tinted success background for the "saved" affordance |
| `--teal` | `#0F766E` | Third category accent ("discover" quests) |
| `--teal-light` | `#F0FDFA` | Tinted teal background for "discover" badges |
| `--scrim` | `rgba(14, 14, 26, 0.55)` | Dim backdrop behind modals and bottom sheets |

## Typography

| Token | Value |
|---|---|
| `--font-display` | `'Syne', system-ui, sans-serif` |
| `--font-body` | `'Inter', system-ui, sans-serif` |

| Role | Font | Weight | Size | Line height |
|---|---|---|---|---|
| Screen question / H1 | Syne | 800 | 30px | 1.15 |
| Section heading / H2 | Syne | 700 | 22px | 1.2 |
| Card label | Inter | 600 | 16px | 1.4 |
| Body | Inter | 400 | 15px | 1.6 |
| Caption / hint | Inter | 400 | 13px | 1.5 |
| Button | Inter | 600 | 16px | — |

## Shape

| Token | Value | Usage |
|---|---|---|
| `--radius-card` | `16px` | Option cards, content cards |
| `--radius-btn` | `14px` | Primary buttons |
| `--radius-chip` | `8px` | Small chips, tags |
| `--radius-sheet` | `24px` | Bottom sheets, modals |

## Spacing scale

`4 · 8 · 12 · 16 · 20 · 24 · 28 · 32 · 40 · 48 · 64`

## Motion

| Token | Value |
|---|---|
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `--duration-quick` | `150ms` (selection feedback) |
| `--duration-screen` | `350ms` (screen transitions) |

## Interaction states

- **Selected card:** `background: var(--primary)`, label `color: #fff`, checkmark visible
- **Hover (unselected):** `border-color: var(--primary)`, `background: var(--surface-muted)`
- **Disabled button:** `background: var(--border)`, `color: var(--text-secondary)`
- **Focus visible:** `outline: 3px solid var(--primary)`, `outline-offset: 2px`
