import { create } from 'zustand';
import {
  GoogleSignin,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { getTokens, saveTokens, clearTokens } from '../services/tokenStorage';
import {
  bootstrapGuest,
  getCurrentUser,
  googleAuth,
  login,
  logoutRequest,
  signup,
} from '../services/authApi';
import type { LoginRequest, SignupRequest, UserProfile } from '../types/api';

interface AuthState {
  user: UserProfile | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  /** True once hydrate() has run and found no existing tokens on this
   * device — i.e. this is the first-ever launch, not just a fresh guest
   * session (a returning guest still has tokens from last time). Null
   * until hydrate() resolves. Used to route first launch to Onboarding
   * and every other launch straight to Home. */
  isFirstLaunch: boolean | null;
  /** Runs once at app launch: restores a session from stored tokens, or
   * silently bootstraps a fresh guest session if none exists yet. */
  hydrate: () => Promise<void>;
  login: (payload: LoginRequest) => Promise<void>;
  signup: (payload: SignupRequest) => Promise<void>;
  /** Runs the native Google Sign-In flow, exchanges the resulting ID token
   * with the backend, and promotes the session — the Google analogue of
   * `login`/`signup`. Errors (including user cancellation) propagate to the
   * calling screen, which owns the silent-cancel-vs-error-banner UX decision. */
  loginWithGoogle: () => Promise<void>;
  /** Replaces the cached `user` with a freshly-fetched profile (e.g. after a
   * display-name or avatar change). Keeps every screen reading `user` in sync
   * without re-running hydrate() or routing the update through screen-local
   * state that would go stale elsewhere. */
  updateProfile: (user: UserProfile) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: 'idle',
  isFirstLaunch: null,

  hydrate: async () => {
    set({ status: 'loading' });
    try {
      const existing = await getTokens();
      if (existing) {
        const user = await getCurrentUser();
        set({ user, status: 'ready', isFirstLaunch: false });
        return;
      }
      const guest = await bootstrapGuest();
      await saveTokens({ accessToken: guest.accessToken, refreshToken: guest.refreshToken });
      set({ user: guest.user, status: 'ready', isFirstLaunch: true });
    } catch {
      set({ status: 'error' });
    }
  },

  login: async (payload) => {
    const result = await login(payload);
    await saveTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    set({ user: result.user, status: 'ready' });
  },

  signup: async (payload) => {
    const result = await signup(payload);
    await saveTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    set({ user: result.user, status: 'ready' });
  },

  loginWithGoogle: async () => {
    // No-op on iOS; on Android this verifies Google Play Services is present
    // and up to date before signIn() is attempted (throws a coded error if not).
    await GoogleSignin.hasPlayServices();
    // In v13+ signIn() no longer throws on cancellation — it resolves to a
    // discriminated `{ type: 'cancelled' }` result. Normalise that back into a
    // thrown, coded error so the calling screen can detect cancellation via the
    // same statusCodes.SIGN_IN_CANCELLED check it uses for a thrown cancel on
    // older surfaces — keeping the store's contract "reject on anything that
    // isn't a completed sign-in" and leaving the silent-vs-banner call to the UI.
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      const cancelled = new Error('Google Sign-In was cancelled') as Error & {
        code: string;
      };
      cancelled.code = statusCodes.SIGN_IN_CANCELLED;
      throw cancelled;
    }
    const { idToken } = response.data;
    if (!idToken) {
      throw new Error('Google Sign-In did not return an ID token');
    }
    const result = await googleAuth({ idToken });
    await saveTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    set({ user: result.user, status: 'ready' });
  },

  updateProfile: (user) => {
    set({ user });
  },

  logout: async () => {
    // Best-effort server-side revocation: if this fails (offline, server
    // down, token already expired), still clear local tokens below — a
    // user-initiated logout must never get stuck because the network call
    // failed. This is what actually invalidates the refresh token server-side
    // (see POST /auth/logout); without it, clearTokens() alone only forgets
    // the token locally while it remains valid against /auth/refresh until
    // natural expiry.
    try {
      await logoutRequest();
    } catch {
      // Local logout proceeds regardless — see comment above.
    }
    await clearTokens();
    set({ user: null, status: 'idle', isFirstLaunch: null });
    // Immediately re-bootstrap a fresh guest session rather than leaving the
    // store idle: nothing else re-triggers hydrate() after the initial
    // app/_layout.tsx mount effect, so without this a post-logout screen
    // reading `status` (e.g. app/index.tsx's loading branch) would spin
    // forever instead of ever reaching 'ready' again.
    await get().hydrate();
  },
}));
