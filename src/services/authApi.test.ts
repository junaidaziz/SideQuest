import { apiRequest } from './apiClient';
import {
  bootstrapGuest,
  changePassword,
  deleteAccount,
  forgotPassword,
  getCurrentUser,
  googleAuth,
  login,
  logoutRequest,
  signup,
} from './authApi';

jest.mock('./apiClient');

describe('authApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiRequest as jest.Mock).mockResolvedValue({});
  });

  it('bootstrapGuest posts to /auth/guest without auth', async () => {
    await bootstrapGuest();

    expect(apiRequest).toHaveBeenCalledWith('/auth/guest', { method: 'POST', auth: false });
  });

  it('signup posts to /auth/signup with auth enabled so a guest token can upgrade in place', async () => {
    const payload = { email: 'a@b.com', password: 'hunter22' };

    await signup(payload);

    expect(apiRequest).toHaveBeenCalledWith('/auth/signup', { method: 'POST', body: payload });
  });

  it('login posts to /auth/login without auth', async () => {
    const payload = { email: 'a@b.com', password: 'hunter22' };

    await login(payload);

    expect(apiRequest).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: payload,
      auth: false,
    });
  });

  it('forgotPassword posts the email to /auth/forgot-password without auth', async () => {
    const payload = { email: 'a@b.com' };

    await forgotPassword(payload);

    // `auth: false` — a logged-out recovery flow. The endpoint's generic
    // response never leaks whether the email maps to a real account.
    expect(apiRequest).toHaveBeenCalledWith('/auth/forgot-password', {
      method: 'POST',
      body: payload,
      auth: false,
    });
  });

  it('googleAuth posts the idToken to /auth/google with auth enabled so a guest token can upgrade in place', async () => {
    await googleAuth({ idToken: 'id-token-123' });

    // No `auth: false` — the default (auth: true) sends any existing guest
    // token so the backend upgrades that guest's row in place, like signup().
    expect(apiRequest).toHaveBeenCalledWith('/auth/google', {
      method: 'POST',
      body: { idToken: 'id-token-123' },
    });
  });

  it('getCurrentUser fetches /auth/me with default auth', async () => {
    await getCurrentUser();

    expect(apiRequest).toHaveBeenCalledWith('/auth/me');
  });

  it('logoutRequest posts to /auth/logout with default auth', async () => {
    await logoutRequest();

    expect(apiRequest).toHaveBeenCalledWith('/auth/logout', { method: 'POST' });
  });

  it('changePassword patches /auth/password with the current and new password', async () => {
    const payload = { currentPassword: 'old-hunter2', newPassword: 'new-hunter2' };

    await changePassword(payload);

    expect(apiRequest).toHaveBeenCalledWith('/auth/password', { method: 'PATCH', body: payload });
  });

  it('deleteAccount sends currentPassword for a password account', async () => {
    const payload = { currentPassword: 'hunter2' };

    await deleteAccount(payload);

    expect(apiRequest).toHaveBeenCalledWith('/auth/me', { method: 'DELETE', body: payload });
  });

  it('deleteAccount sends confirm:true for a guest/Google-only account with no password', async () => {
    const payload = { confirm: true };

    await deleteAccount(payload);

    expect(apiRequest).toHaveBeenCalledWith('/auth/me', { method: 'DELETE', body: payload });
  });
});
