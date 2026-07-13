import { useAuthStore } from './authStore';
import { getTokens, saveTokens, clearTokens } from '../services/tokenStorage';
import { bootstrapGuest, getCurrentUser, login, logoutRequest, signup } from '../services/authApi';

jest.mock('../services/tokenStorage');
jest.mock('../services/authApi');

const guestUser = { id: 'u1', email: null, displayName: null, isGuest: true };
const realUser = { id: 'u1', email: 'a@b.com', displayName: 'A', isGuest: false };

describe('authStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, status: 'idle', isFirstLaunch: null });
  });

  describe('hydrate', () => {
    it('restores the session from stored tokens when present', async () => {
      (getTokens as jest.Mock).mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
      (getCurrentUser as jest.Mock).mockResolvedValue(realUser);

      await useAuthStore.getState().hydrate();

      expect(useAuthStore.getState().user).toEqual(realUser);
      expect(useAuthStore.getState().status).toBe('ready');
      expect(useAuthStore.getState().isFirstLaunch).toBe(false);
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
      expect(useAuthStore.getState().isFirstLaunch).toBe(true);
    });

    it('sets status to error when hydration fails', async () => {
      (getTokens as jest.Mock).mockRejectedValue(new Error('storage unavailable'));

      await useAuthStore.getState().hydrate();

      expect(useAuthStore.getState().status).toBe('error');
      expect(useAuthStore.getState().isFirstLaunch).toBeNull();
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
    it('revokes the session server-side, then clears tokens and re-bootstraps a fresh guest session', async () => {
      useAuthStore.setState({ user: realUser, status: 'ready', isFirstLaunch: false });
      (logoutRequest as jest.Mock).mockResolvedValue({ success: true });
      (getTokens as jest.Mock).mockResolvedValue(null);
      (bootstrapGuest as jest.Mock).mockResolvedValue({
        accessToken: 'g2',
        refreshToken: 'gr2',
        user: guestUser,
      });

      await useAuthStore.getState().logout();

      expect(logoutRequest).toHaveBeenCalled();
      expect(clearTokens).toHaveBeenCalled();
      // Ends in a fully 'ready' state with a fresh guest — not stuck idle —
      // since nothing besides the root layout's one-time mount effect would
      // otherwise ever re-trigger hydrate() after this.
      expect(bootstrapGuest).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toEqual(guestUser);
      expect(useAuthStore.getState().status).toBe('ready');
      expect(useAuthStore.getState().isFirstLaunch).toBe(true);
    });

    it('still clears local tokens and re-bootstraps when server-side revocation fails (offline/server down)', async () => {
      useAuthStore.setState({ user: realUser, status: 'ready', isFirstLaunch: false });
      (logoutRequest as jest.Mock).mockRejectedValue(new Error('network unavailable'));
      (getTokens as jest.Mock).mockResolvedValue(null);
      (bootstrapGuest as jest.Mock).mockResolvedValue({
        accessToken: 'g2',
        refreshToken: 'gr2',
        user: guestUser,
      });

      await useAuthStore.getState().logout();

      expect(logoutRequest).toHaveBeenCalled();
      expect(clearTokens).toHaveBeenCalled();
      expect(useAuthStore.getState().status).toBe('ready');
      expect(useAuthStore.getState().user).toEqual(guestUser);
    });

    it('leaves status as error if the post-logout re-hydrate fails', async () => {
      useAuthStore.setState({ user: realUser, status: 'ready', isFirstLaunch: false });
      (logoutRequest as jest.Mock).mockResolvedValue({ success: true });
      (getTokens as jest.Mock).mockRejectedValue(new Error('storage unavailable'));

      await useAuthStore.getState().logout();

      expect(clearTokens).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().status).toBe('error');
    });
  });
});
