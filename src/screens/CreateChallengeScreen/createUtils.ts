import type { CreateTaskRequest } from '../../types/api';

/** Quick-pick relative deadline choices (no heavy native date picker needed). */
export type DeadlineChoice = 'none' | '3d' | '1w' | '2w';

export const DEADLINE_OPTIONS: { key: DeadlineChoice; label: string }[] = [
  { key: 'none', label: 'No deadline' },
  { key: '3d', label: 'In 3 days' },
  { key: '1w', label: 'In 1 week' },
  { key: '2w', label: 'In 2 weeks' },
];

/** The draft a user assembles across the four steps. */
export interface ChallengeDraft {
  /** 'daily' = prefilled from the real daily mission; 'custom' = user-authored. */
  source: 'daily' | 'custom' | null;
  title: string;
  description: string;
  rewardXp: number | null;
  requireReview: boolean;
  deadline: DeadlineChoice;
}

export const EMPTY_DRAFT: ChallengeDraft = {
  source: null,
  title: '',
  description: '',
  rewardXp: null,
  requireReview: true,
  deadline: 'none',
};

/** Converts a quick-pick choice into an ISO due date, or undefined for none. */
export function deadlineToIso(choice: DeadlineChoice, now: number = Date.now()): string | undefined {
  const dayMs = 24 * 60 * 60 * 1000;
  const days: Record<DeadlineChoice, number> = { none: 0, '3d': 3, '1w': 7, '2w': 14 };
  if (choice === 'none') return undefined;
  return new Date(now + days[choice] * dayMs).toISOString();
}

/** Human summary of the chosen deadline for the review step. */
export function deadlineLabel(choice: DeadlineChoice): string {
  return DEADLINE_OPTIONS.find((o) => o.key === choice)?.label ?? 'No deadline';
}

/**
 * Whether the user may advance from a given step. Step 1 needs a non-empty
 * title; every later step is always satisfiable (invite is link-only, details
 * are optional, review is terminal).
 */
export function canProceed(step: number, draft: ChallengeDraft): boolean {
  if (step === 1) return draft.title.trim().length > 0;
  return true;
}

/**
 * Builds the real `POST /tasks` body from the draft. Requiring review maps to
 * the CREATOR_APPROVAL verification method with mandatory evidence; otherwise a
 * SELF-verified task. Only defined fields are included so the backend's
 * whitelist validation stays happy.
 */
export function buildCreateRequest(draft: ChallengeDraft, now: number = Date.now()): CreateTaskRequest {
  const body: CreateTaskRequest = {
    title: draft.title.trim(),
    verificationMethod: draft.requireReview ? 'CREATOR_APPROVAL' : 'SELF',
    evidenceRequired: draft.requireReview,
  };
  const description = draft.description.trim();
  if (description.length > 0) body.description = description;
  if (draft.rewardXp != null) body.rewardXp = draft.rewardXp;
  const due = deadlineToIso(draft.deadline, now);
  if (due) body.dueAt = due;
  return body;
}
