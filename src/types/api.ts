/**
 * Mirrors backend DTOs in sidequest-backend `src/auth/dto/*`. No shared-types
 * package/codegen exists yet (tracked as a Milestone 6 decision) — keep this
 * file in sync by hand whenever the backend auth contract changes.
 */

export interface UserProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  isGuest: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: UserProfile;
}

export interface SignupRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiErrorBody {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string | string[];
}

/**
 * Mirrors backend DTOs in sidequest-backend `src/missions/dto/*`.
 * Field names here (desc/full/proof/time/xp/diff/dots) are intentionally
 * short — the backend renames its DB columns (description/fullBrief/
 * proofRequirement/estimatedMinutes/xpReward/difficulty/difficultyDots) to
 * these on the way out. Do not "fix" this mismatch on either side.
 */

/** Quest category — drives stripe colour and badge styling. */
export type MissionCategory = 'explore' | 'create' | 'discover';

/** A single quest returned for the user's active filters. */
export interface Mission {
  id: string;
  category: MissionCategory;
  title: string;
  /** Short teaser shown on the card (2-line clamp in the mockup). */
  desc: string;
  /** Full brief shown inside the detail sheet. */
  full: string;
  /** What the user must submit as proof of completion. */
  proof: string;
  time: string;
  xp: string;
  diff: string;
  /** Filled difficulty dots, 1–3. */
  dots: number;
}

/** The exact literal vocab OnboardingScreen collects — the backend validates
 * against these same four sets via `@IsIn()`. */
export type Crew = 'Solo' | 'Partner' | 'Friends' | 'Family' | 'Kids Mode';
export type TimeBudget = '15 min' | '30 min' | '1 hour' | '2+ hours';
export type Setting = 'Indoors' | 'Outdoors' | 'City' | 'Nature' | 'Anywhere';
export type CostBudget = 'Free' | 'Under $10' | 'Under $30' | 'No limit';

export interface GenerateMissionsRequest {
  crew: Crew;
  time: TimeBudget;
  setting: Setting;
  budget: CostBudget;
}

export interface GenerateMissionsResponse {
  missions: Mission[];
}
