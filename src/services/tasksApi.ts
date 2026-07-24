import { apiRequest } from './apiClient';
import { localFileToBlob } from './localFileBlob';
import type {
  CreateTaskRequest,
  InviteResponse,
  ListTasksQuery,
  PaginatedTasks,
  ReviewSubmissionRequest,
  Task,
  TaskDetail,
  TaskSummary,
} from '../types/api';

/**
 * Peer-to-peer tasks (M19) client — the backend behind the redesign's
 * "challenge" surface. A challenge in product language IS a `UserTask`: created
 * by one user, shared with a friend via an invite link, evidenced by the
 * assignee, and (for CREATOR_APPROVAL tasks) reviewed by the creator.
 *
 * Every call is JWT-guarded server-side and scoped to the calling user (they
 * must be the task's creator or assignee). Mirrors the request/response and
 * error-handling conventions already established in `proofApi.ts` /
 * `paymentApi.ts` — thin wrappers over `apiRequest`, no bespoke HTTP.
 */

/** Serializes defined string params into a `?a=b&c=d` suffix (empty when none). */
function buildQuery(params: Record<string, string | undefined>): string {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') usp.append(key, value);
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

/** Creates a task. Omitting an assignee (the only path the client has) yields a
 * personal/shareable task the creator then invites a friend to via
 * `generateTaskInvite`. */
export function createTask(body: CreateTaskRequest, idempotencyKey?: string): Promise<Task> {
  return apiRequest<Task>('/tasks', { method: 'POST', body, idempotencyKey });
}

/** Lists tasks where the caller is creator or assignee, optionally filtered by
 * status and/or role. Paginated — newest-created-first. */
export function listTasks(query: ListTasksQuery = {}): Promise<PaginatedTasks> {
  const qs = buildQuery({
    status: query.status,
    role: query.role,
    limit: query.limit?.toString(),
    offset: query.offset?.toString(),
  });
  return apiRequest<PaginatedTasks>(`/tasks${qs}`);
}

/** Dashboard-style task counts for the current user. */
export function getTaskSummary(): Promise<TaskSummary> {
  return apiRequest<TaskSummary>('/tasks/summary');
}

/** Full task detail plus submission/evidence history (participants only). */
export function getTask(taskId: string): Promise<TaskDetail> {
  return apiRequest<TaskDetail>(`/tasks/${taskId}`);
}

/** Generates a shareable invite link (creator only; no active assignee). */
export function generateTaskInvite(taskId: string): Promise<InviteResponse> {
  return apiRequest<InviteResponse>(`/tasks/${taskId}/invite`, { method: 'POST' });
}

/** Accepts an invite by its token — binds the caller as the assignee. */
export function acceptTaskInvite(token: string, idempotencyKey?: string): Promise<Task> {
  return apiRequest<Task>(`/tasks/invites/${token}/accept`, { method: 'POST', idempotencyKey });
}

/** Declines an invite by its token — clears it so it cannot re-bind. */
export function declineTaskInvite(token: string, idempotencyKey?: string): Promise<Task> {
  return apiRequest<Task>(`/tasks/invites/${token}/decline`, { method: 'POST', idempotencyKey });
}

/** Optional photo + notes evidence for a submission. */
export interface SubmitEvidenceInput {
  /** Local file URI from expo-image-picker (e.g. `file:///...`). */
  photoUri?: string;
  notes?: string;
}

/**
 * Submits evidence for a task. Multipart, following the exact `proofApi`
 * convention: a real `Blob` (via `localFileToBlob`, backed by `fetch()`) is
 * appended rather than a duck-typed `{ uri, name, type }` object — the latter
 * fails FormData's strict `instanceof Blob` check under React Native's New
 * Architecture. `expo-file-system`'s `File.slice()` was tried first but hits
 * a separate, confirmed upstream bug (expo/expo#40144) — see
 * `localFileBlob.ts`.
 */
export async function submitTaskEvidence(
  taskId: string,
  input: SubmitEvidenceInput,
  idempotencyKey?: string,
): Promise<TaskDetail> {
  const form = new FormData();
  if (input.photoUri) {
    const { blob, name } = await localFileToBlob(input.photoUri);
    form.append('photo', blob, name);
  }
  if (input.notes !== undefined) {
    form.append('notes', input.notes);
  }
  return apiRequest<TaskDetail>(`/tasks/${taskId}/submissions`, {
    method: 'POST',
    body: form,
    idempotencyKey,
  });
}

/** Approves or rejects a pending submission (creator only; CREATOR_APPROVAL). */
export function reviewTaskSubmission(
  taskId: string,
  submissionId: string,
  body: ReviewSubmissionRequest,
  idempotencyKey?: string,
): Promise<TaskDetail> {
  return apiRequest<TaskDetail>(`/tasks/${taskId}/submissions/${submissionId}/review`, {
    method: 'PATCH',
    body,
    idempotencyKey,
  });
}
