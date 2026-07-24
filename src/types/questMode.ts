/**
 * The lowercase quick-start mode keys. Originally declared inside the retired
 * `ModeSelectScreen`; relocated here when that screen was removed as dead code,
 * because the still-live `/mode-select` redirect route
 * (`app/mode-select.tsx`) maps these keys onto generate-missions filters via
 * `toFiltersFromMode`. Kept as a union so any caller can switch on them
 * exhaustively.
 */
export type QuestMode =
  | 'solo'
  | 'couple'
  | 'friends'
  | 'family'
  | 'city'
  | 'confidence'
  | 'travel'
  | 'kids';
