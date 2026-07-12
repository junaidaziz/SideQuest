import { useAuthStore } from './authStore';
import { getTokens, saveTokens, clearTokens } from '../services/tokenStorage';
import { bootstrapGuest, getCurrentUser, login, signup } from '../services/authApi';

jest.mock('../services/tokenStorage');
jest.mock('../services/authApi');

const guestUser = { id: 'u1', email: null, displayName: null, isGuest: true };
const realUser = { id: 'u1', email: 'a@b.com', displayName: 'A', isGuest: false };

describe('authStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, status: 'idle' });
  });

  describe('hydrate', () => {
    it('restores the session from stored tokens when present', async () => {
      (getTokens as jest.Mock).mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
      (getCurrentUser as jest.Mock).mockResolvedValue(realUser);

      await useAuthStore.getState().hydrate();

      expect(useAuthStore.getState().user).toEqual(realUser);
      expect(useAuthStore.getState().status).toBe('ready');
      expect(bootstrapGuest).not.toHaveBeenCalled();
    });

    it('bootstraps a guest session when no tokens are stored', async () => {
      (getTokens as jest.Mock).mockResolvedValue(null);
      (bootstrapGuest as jest.Mock).mockResolvedValue({
        accessToken: 'g',
        refreshToken: 'gr',
        user: guestUser,
      });

      await useAuthStore.getState().hydrate();

      expect(saveTokens).toHaveBeenCalledWith({ accessToken: 'g', refreshToken: 'gr' });
      expect(useAuthStore.getState().user).toEqual(guestUser);
      expect(useAuthStore.getState().status).toBe('ready');
    });

    it('sets status to error when hydration fails', async () => {
      (getTokens as jest.Mock).mockRejectedValue(new Error('storage unavailable'));

      await useAuthStore.getState().hydrate();

      expect(useAuthStore.getState().status).toBe('error');
    });
  });

  describe('login', () => {
    it('stores tokens and sets the returned user', async () => {
      (login as jest.Mock).mockResolvedValue({
        accessToken: 'a',
        refreshToken: 'r',
        user: realUser,
      });

      await useAuthStore.getState().login({ email: 'a@b.com', password: 'hunter22' });

      expect(saveTokens).toHaveBeenCalledWith({ accessToken: 'a', refreshToken: 'r' });
      expect(useAuthStore.getState().user).toEqual(realUser);
      expect(useAuthStore.getState().status).toBe('ready');
    });
  });

  describe('signup', () => {
    it('stores tokens and sets the returned (possibly upgraded) user', async () => {
      (signup as jest.Mock).mockResolvedValue({
        accessToken: 'a',
        refreshToken: 'r',
        user: realUser,
      });

      await useAuthStore.getState().signup({ email: 'a@b.com', password: 'hunter22' });

      expect(useAuthStore.getState().user).toEqual(realUser);
    });
  });

  describe('logout', () => {
    it('clears tokens and resets state to idle', async () => {
      useAuthStore.setState({ user: realUser, status: 'ready' });

      await useAuthStore.getState().logout();

      expect(clearTokens).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().status).toBe('idle');
    });
  });
});
