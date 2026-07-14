import { apiRequest } from './apiClient';
import type { PaginatedReferralHistory, ReferralHistoryQuery, ReferralMe } from '../types/api';

/**
 * Referrals (M20) client. Every call is JWT-guarded server-side and scoped to
 * the calling user. Mirrors the thin-wrapper conventions of `proofApi.ts` /
 * `paymentApi.ts` — no bespoke HTTP, all through `apiRequest`.
 *
 * These are real, backed endpoints: `getReferralMe` lazily provisions the
 * caller's referral code on first call and returns aggregate reward stats;
 * `getReferralHistory` pages through the caller's individual conversion
 * referrals. Used by `RewardsScreen` to surface genuinely earned referral XP.
 */

/** Serializes defined numeric params into a `?a=b&c=d` suffix (empty when none). */
function buildQuery(params: Record<string, number | undefined>): string {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) usp.append(key, String(value));
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

/** The caller's referral code, shareable link, and aggregate reward stats. */
export function getReferralMe(): Promise<ReferralMe> {
  return apiRequest<ReferralMe>('/referrals/me');
}

/** Paginated list of the caller's individual conversion referrals. */
export function getReferralHistory(
  query: ReferralHistoryQuery = {},
): Promise<PaginatedReferralHistory> {
  const qs = buildQuery({ limit: query.limit, offset: query.offset });
  return apiRequest<PaginatedReferralHistory>(`/referrals/history${qs}`);
}
