import { create } from 'zustand';
import { getTokens, saveTokens, clearTokens } from '../services/tokenStorage';
import { bootstrapGuest, getCurrentUser, login, signup } from '../services/authApi';
import type { LoginRequest, SignupRequest, UserProfile } from '../types/api';

interface AuthState {
  user: UserProfile | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
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

  hydrate: async () => {
    set({ status: 'loading' });
    try {
      const existing = await getTokens();
      if (existing) {
        const user = await getCurrentUser();
        set({ user, status: 'ready' });
        return;
      }
      const guest = await bootstrapGuest();
      await saveTokens({ accessToken: guest.accessToken, refreshToken: guest.refreshToken });
      set({ user: guest.user, status: 'ready' });
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
    set({ user: null, status: 'idle' });
  },
}));
