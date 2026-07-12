import { create } from 'zustand';
import { getTokens, saveTokens, clearTokens } from '../services/tokenStorage';
import { bootstrapGuest, getCurrentUser, login, signup } from '../services/authApi';
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
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
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

  logout: async () => {
    await clearTokens();
    // isFirstLaunch reset alongside status: 'idle' so a future re-entry into
    // app/index.tsx's spinner (status === 'idle') doesn't get stuck — the
    // route's redirect condition depends on isFirstLaunch resolving via a
    // fresh hydrate() call, not the stale value from before logout.
    set({ user: null, status: 'idle', isFirstLaunch: null });
  },
}));
