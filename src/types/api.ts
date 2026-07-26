/**
 * Mirrors backend DTOs in sidequest-backend `src/auth/dto/*`. No shared-types
 * package/codegen exists yet (tracked as a Milestone 6 decision) — keep this
 * file in sync by hand whenever the backend auth contract changes.
 */

/**
 * One generated, delivery-ready size of a media asset (an avatar, today —
 * see `src/services/mediaApi.ts`). Mirrors the backend's `MediaVariantDto`.
 */
export interface MediaVariant {
  name: string;
  url: string;
  width: number;
  height: number;
  format: string;
}

export interface UserProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  isGuest: boolean;
  /**
   * Delivery URL for the profile avatar, or null when none is set. When the
   * avatar was uploaded through the media pipeline (see `avatarVariants`)
   * this is the largest ready variant's URL — a stable CDN URL in
   * production, a short-lived presigned URL otherwise. For an avatar still
   * on the legacy direct-upload path, this is always a short-lived presigned
   * S3 GET URL. Either way: display-only, do not persist it across app
   * restarts as if it were permanent.
   */
  avatarUrl: string | null;
  /**
   * Every ready-to-render size of the current avatar, for responsive display
   * (see `src/components/media/ResponsiveImage.tsx`). Empty when the avatar
   * is unset, still processing, or was uploaded through the legacy
   * direct-upload path — screens must fall back to `avatarUrl` (a single
   * fixed size) whenever this is empty, never treat an empty array as "no
   * avatar".
   */
  avatarVariants: MediaVariant[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: UserProfile;
}

export interface LogoutResponse {
  success: boolean;
}

/** Mirrors backend ChangePasswordDto (M22.1). */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
}

/**
 * Mirrors backend DeleteAccountDto (M22.2, Decision 7). A password account
 * supplies `currentPassword`; a guest/Google-only account (no password to
 * verify) supplies `confirm: true` instead — these are not either/or, the
 * backend accepts exactly one shape depending on account type.
 */
export interface DeleteAccountRequest {
  currentPassword?: string;
  confirm?: boolean;
}

export interface DeleteAccountResponse {
  success: boolean;
}

/** Mirrors backend NotificationPreferencesDto. */
export interface NotificationPreferencesDto {
  pushEnabled: boolean;
  taskEventsEnabled: boolean;
  referralEventsEnabled: boolean;
  accountEventsEnabled: boolean;
}

export type UpdateNotificationPreferencesRequest = Partial<NotificationPreferencesDto>;

export interface SignupRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleAuthRequest {
  /** The Google-issued OpenID Connect ID token obtained from the native SDK. */
  idToken: string;
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

/** Quest difficulty — mirrors backend Prisma `MissionDifficulty` enum. */
export type MissionDifficulty = 'Easy' | 'Medium' | 'Hard';

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
  diff: MissionDifficulty;
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

/**
 * Mirrors sidequest-backend `src/proof/dto/*`. Request is multipart/form-data
 * (see proofApi.ts) so there's no request type here — only the response.
 */
export interface ProofSubmissionResponse {
  completionId: string;
  missionTitle: string;
  xpAwarded: number;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  /** Presigned download URL, present only for photo proofs. */
  proofUrl: string | null;
}

/** Thrown reason string the backend returns when a guest has already used
 * their one free completion — the client keys off this to show the signup gate. */
export const GUEST_COMPLETION_LIMIT_REACHED = 'GUEST_COMPLETION_LIMIT_REACHED';

/** Response from POST/DELETE /missions/:id/save. */
export interface SaveMissionResponse {
  saved: boolean;
}

/** A saved quest, as `Mission` plus when the caller bookmarked it. */
export interface SavedMission extends Mission {
  savedAt: string;
}

/** Paginated, newest-saved-first envelope for `GET /missions/saved`. */
export interface PaginatedSavedMissions {
  items: SavedMission[];
  total: number;
  limit: number;
  offset: number;
}

/** Offset/limit pagination query for `GET /missions/saved`. */
export interface ListSavedMissionsQuery {
  limit?: number;
  offset?: number;
}

/**
 * Mirrors sidequest-backend `src/payment/dto/payment-method.dto.ts`. A saved
 * card projected down to only display-safe fields — Stripe never exposes the
 * full PAN, and the backend deliberately strips fingerprints/billing details.
 * `last4` + `brand` + expiry is all the card row needs. This is
 * payment-methods-on-file only; there is no charge/checkout flow anywhere.
 */
export interface PaymentMethod {
  /** Stripe PaymentMethod id (`pm_…`). Used to set-default or detach the card. */
  id: string;
  /** Card network brand, e.g. `visa`, `mastercard`. */
  brand: string;
  /** Last four digits of the card. */
  last4: string;
  /** Card expiry month, 1-12. */
  expMonth: number;
  /** Card expiry year, four digits. */
  expYear: number;
  /** Whether this is the customer's default payment method. */
  isDefault: boolean;
}

/**
 * Mirrors sidequest-backend `src/payment/dto/setup-intent-response.dto.ts`.
 * The `clientSecret` is handed to the mobile Stripe PaymentSheet, which
 * completes card collection against Stripe directly — the raw card never
 * touches this backend. Not a persisted secret: it authorizes only this one
 * setup attempt for the user's Stripe customer.
 */
export interface SetupIntentResponse {
  clientSecret: string;
}

/**
 * Mirrors sidequest-backend `src/home/dto/*`. Flat 100-XP-per-level curve —
 * level/xpIntoLevel/xpToNextLevel are all derived server-side from totalXp,
 * never stored, so the client never computes them independently.
 */
export interface LevelInfo {
  level: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  totalXp: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
}

/** A saved-mission grouping shown on Home, e.g. "Outdoors Solo pack". Derived
 * server-side from SavedMission rows — no client-side grouping logic. */
export interface SavedPack {
  name: string;
  missionCount: number;
}

/**
 * Proof-verification tallies for the Home "your progress" strip. Mirrors
 * backend `home/dto/home-response.dto.ts` `TaskStatsDto`. Derived server-side
 * from the user's Completion rows grouped by verificationStatus, so the four
 * buckets (approved + pending + rejected) always sum to `total`.
 */
export interface TaskStats {
  /** Every Completion the user owns — the denominator for completionRate. */
  total: number;
  /** Completions whose verificationStatus is Approved — the "genuinely done" count. */
  approved: number;
  /** Completions still Pending review (auto-approved later by the timeout job). */
  pending: number;
  /** Completions an admin (or the timeout path) marked Rejected. */
  rejected: number;
  /** approved / total as a 0-1 fraction — deliberately 0 (never NaN) when total is 0. */
  completionRate: number;
}

export interface HomeResponse {
  level: LevelInfo;
  streak: StreakInfo;
  /** Deterministic per UTC calendar day — a cosmetic highlight, not a gate.
   * Null only if the curated mission pool is empty. */
  dailyMission: Mission | null;
  /**
   * Always [] from `GET /home` — the home endpoint's DTO still ships this
   * placeholder field verbatim. The real peer-to-peer challenge/task data now
   * lives on the dedicated `/tasks` API (see `Task`/`TaskDetail` below and
   * `services/tasksApi.ts`); it is intentionally NOT folded into `/home`
   * (backend "Decision 11" keeps the manually-mirrored HomeResponse stable).
   * Consume tasks via `tasksApi`, not this field.
   */
  pendingChallenges: unknown[];
  savedPacks: SavedPack[];
  /** Proof-verification tallies across all the user's completions. */
  taskStats: TaskStats;
}

/* ────────────────────────────────────────────────────────────────────────
 * Peer-to-peer tasks (M19) — mirrors sidequest-backend `src/tasks/dto/*`.
 * A "challenge" in the redesign's product vocabulary IS a backend `UserTask`:
 * a creator authors a task, invites a friend via a link, the assignee submits
 * evidence, and (for CREATOR_APPROVAL tasks) the creator reviews it. Dates are
 * ISO-8601 strings — the backend `Date` DTO fields serialize to strings over
 * JSON, so the client never sees a live `Date`.
 * ──────────────────────────────────────────────────────────────────────── */

/** How a task's completion is verified. `AUTOMATIC` is reserved server-side and
 * cannot be requested at creation (see `CREATABLE_VERIFICATION_METHODS`). */
export type TaskVerificationMethod = 'NONE' | 'SELF' | 'CREATOR_APPROVAL' | 'AUTOMATIC';

/** The subset a client may request when creating a task. */
export const CREATABLE_VERIFICATION_METHODS = ['NONE', 'SELF', 'CREATOR_APPROVAL'] as const;

/** Lifecycle of a UserTask — mirrors backend Prisma `UserTaskStatus`. */
export type UserTaskStatus =
  | 'Open'
  | 'Invited'
  | 'Accepted'
  | 'Declined'
  | 'Submitted'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled';

/** Status of a single evidence submission. */
export type TaskSubmissionStatus = 'Submitted' | 'Approved' | 'Rejected';

/** Which side of a task the caller wants listed on `GET /tasks`. */
export type TaskRoleFilter = 'creator' | 'assignee' | 'all';

/** One evidence attachment on a submission. */
export interface TaskAttachment {
  id: string;
  /** "photo" or "document". */
  kind: string;
  /** Short-lived presigned GET URL, or null if it could not be signed. */
  url: string | null;
  createdAt: string;
}

/** One evidence submission in a task's history. */
export interface TaskSubmission {
  id: string;
  submittedById: string;
  notes: string | null;
  status: TaskSubmissionStatus;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedById: string | null;
  rejectionReason: string | null;
  attachments: TaskAttachment[];
}

/** A task as returned in list/detail views (list omits `submissions`). */
export interface Task {
  id: string;
  creatorId: string;
  /** null for personal (assignee-less) tasks. */
  assigneeId: string | null;
  title: string;
  description: string | null;
  rewardXp: number | null;
  verificationMethod: TaskVerificationMethod;
  evidenceRequired: boolean;
  status: UserTaskStatus;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Full task detail: the task plus its submission/evidence history. */
export interface TaskDetail extends Task {
  /** Active invite token — exposed to the creator only (null otherwise). */
  inviteToken: string | null;
  submissions: TaskSubmission[];
}

/** Returned when a creator generates an invite link for a shared task. */
export interface InviteResponse {
  inviteToken: string;
  /** Deep link the app shares so an invitee can accept or decline. */
  inviteUrl: string;
}

/** Counts for tasks the caller created. */
export interface CreatedTaskSummary {
  total: number;
  open: number;
  invited: number;
  awaitingMyReview: number;
  approved: number;
}

/** Counts for tasks assigned to the caller. */
export interface AssignedTaskSummary {
  total: number;
  active: number;
  awaitingReview: number;
  needsResubmission: number;
  approved: number;
}

/** Dashboard-style task counts for the current user (`GET /tasks/summary`). */
export interface TaskSummary {
  created: CreatedTaskSummary;
  assigned: AssignedTaskSummary;
}

/** Body for `POST /tasks`. Only `title` is required. */
export interface CreateTaskRequest {
  title: string;
  description?: string;
  verificationMethod?: TaskVerificationMethod;
  evidenceRequired?: boolean;
  rewardXp?: number;
  /** Optional due date, ISO-8601. */
  dueAt?: string;
}

/** The two decisions a creator can make on a pending submission. */
export type ReviewDecision = 'Approve' | 'Reject';

/** Body for `PATCH /tasks/:id/submissions/:submissionId/review`. */
export interface ReviewSubmissionRequest {
  decision: ReviewDecision;
  /** Required when `decision` is `Reject`; ignored on `Approve`. */
  rejectionReason?: string;
}

/** Query filters + pagination for `GET /tasks`. */
export interface ListTasksQuery {
  status?: UserTaskStatus;
  role?: TaskRoleFilter;
  limit?: number;
  offset?: number;
}

/** Paginated, newest-created-first envelope for `GET /tasks`. */
export interface PaginatedTasks {
  items: Task[];
  total: number;
  limit: number;
  offset: number;
}

/* ────────────────────────────────────────────────────────────────────────
 * Referrals (M20) — mirrors sidequest-backend `src/referrals/dto/*`.
 * ──────────────────────────────────────────────────────────────────────── */

/** Status of a conversion referral. */
export type ReferralStatus = 'Pending' | 'Completed' | 'Expired';

/** The caller's referral code, shareable link, and aggregate stats
 * (`GET /referrals/me`, lazily creates the code on first call). */
export interface ReferralMe {
  code: string;
  inviteUrl: string;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  invitesSent: number;
  rewardsEarnedXp: number;
}

/** A single conversion referral in the caller's history. */
export interface ReferralHistoryItem {
  id: string;
  refereeId: string;
  status: ReferralStatus;
  code: string;
  registeredAt: string | null;
  completedAt: string | null;
  createdAt: string;
  rewardXp: number | null;
}

/** Paginated envelope for `GET /referrals/history`. */
export interface PaginatedReferralHistory {
  items: ReferralHistoryItem[];
  total: number;
  limit: number;
  offset: number;
}

/** Offset/limit pagination query for `GET /referrals/history`. */
export interface ReferralHistoryQuery {
  limit?: number;
  offset?: number;
}

export type NotificationType =
  | 'task_assigned'
  | 'task_accepted'
  | 'task_declined'
  | 'task_submitted'
  | 'task_approved'
  | 'task_rejected'
  | 'referral_registered'
  | 'referral_reward_earned'
  | 'account_event';

/** A single in-app notification (`GET /notifications`). */
export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Deep-link target, e.g. `{ screen: 'task-detail', taskId: '...' }` — the
   * backend documents the shape as an open record; the mobile client only
   * reads it when it recognizes a screen key, so no full type is modeled. */
  data: Record<string, unknown> | null;
  /** Null while unread — mirrors the backend's `readAt IS NULL` convention. */
  readAt: string | null;
  createdAt: string;
}

/** Paginated, newest-first envelope for `GET /notifications`. */
export interface PaginatedNotifications {
  items: AppNotification[];
  total: number;
  limit: number;
  offset: number;
}

/** Offset/limit + unread filter for `GET /notifications`. */
export interface ListNotificationsQuery {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}

/** Badge count for `GET /notifications/unread-count`. */
export interface UnreadCount {
  unreadCount: number;
}

/** Result of a mark-read / mark-all-read mutation. */
export interface MarkReadResult {
  updated: number;
}

export type PushPlatform = 'ios' | 'android';

/** Body for `POST /notifications/push-tokens`. */
export interface RegisterPushTokenRequest {
  /** An Expo push token, e.g. `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`. */
  token: string;
  platform: PushPlatform;
  deviceId?: string;
}

/** Registered device push token, echoed back on register. */
export interface PushTokenResult {
  id: string;
  token: string;
  platform: PushPlatform;
  deviceId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Result of deregistering a push token (e.g. on logout). */
export interface DeregisterPushTokenResult {
  success: boolean;
  removed: number;
}
