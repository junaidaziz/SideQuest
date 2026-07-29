import { create } from 'zustand';

/**
 * Holds a challenge-invite token that must survive a login/signup detour.
 *
 * The recipient of an invite deep link (`sidequest://tasks/invite/<token>`) is
 * not assumed to be a known, logged-in user — the app is guest-first, and the
 * recipient may want to sign in or create a real account *before* binding the
 * invite to their identity. When they choose that path, the invite route stashes
 * the token here, sends them to Login/Signup, and the root layout re-opens the
 * invite landing once auth resolves to a real (non-guest) account. Kept in memory
 * only: an invite detour is a single-session flow, and persisting an unaccepted
 * token across cold starts would risk silently re-opening a stale invite.
 */
interface PendingInviteState {
  /** The stashed invite token, or null when no detour is in progress. */
  token: string | null;
  /** Stash a token before routing the user through Login/Signup. */
  setToken: (token: string) => void;
  /** Clear the stashed token once it has been resumed or abandoned. */
  clear: () => void;
}

export const usePendingInviteStore = create<PendingInviteState>((set) => ({
  token: null,
  setToken: (token) => set({ token }),
  clear: () => set({ token: null }),
}));
