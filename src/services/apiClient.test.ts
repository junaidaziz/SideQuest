import { apiRequest, ApiError } from './apiClient';
import * as tokenStorage from './tokenStorage';

jest.mock('./tokenStorage');

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = jest.fn();
  });

  describe('successful requests', () => {
    it('returns the parsed JSON body', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue(jsonResponse(200, { ok: true }));

      const result = await apiRequest<{ ok: boolean }>('/health', { auth: false });

      expect(result).toEqual({ ok: true });
    });

    it('attaches the Authorization header when auth is true and a token exists', async () => {
      (tokenStorage.getTokens as jest.Mock).mockResolvedValue({
        accessToken: 'access-1',
        refreshToken: 'refresh-1',
      });
      (globalThis.fetch as jest.Mock).mockResolvedValue(jsonResponse(200, {}));

      await apiRequest('/auth/me');

      const [, requestInit] = (globalThis.fetch as jest.Mock).mock.calls[0];
      expect(requestInit.headers.Authorization).toBe('Bearer access-1');
    });

    it('does not attach Authorization when auth is false', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue(jsonResponse(200, {}));

      await apiRequest('/auth/guest', { method: 'POST', auth: false });

      const [, requestInit] = (globalThis.fetch as jest.Mock).mock.calls[0];
      expect(requestInit.headers.Authorization).toBeUndefined();
      expect(tokenStorage.getTokens).not.toHaveBeenCalled();
    });
  });

  describe('401 refresh-and-retry', () => {
    it('refreshes the token once and retries the original request', async () => {
      (tokenStorage.getTokens as jest.Mock).mockResolvedValue({
        accessToken: 'expired',
        refreshToken: 'refresh-1',
      });
      (globalThis.fetch as jest.Mock)
        .mockResolvedValueOnce(jsonResponse(401, { statusCode: 401, message: 'expired' }))
        .mockResolvedValueOnce(jsonResponse(200, { accessToken: 'fresh', refreshToken: 'fresh-r' }))
        .mockResolvedValueOnce(jsonResponse(200, { data: 'ok' }));

      const result = await apiRequest<{ data: string }>('/auth/me');

      expect(result).toEqual({ data: 'ok' });
      expect(globalThis.fetch).toHaveBeenCalledTimes(3);
      expect(tokenStorage.saveTokens).toHaveBeenCalledWith({
        accessToken: 'fresh',
        refreshToken: 'fresh-r',
      });
    });

    it('clears tokens and throws when the refresh itself fails', async () => {
      (tokenStorage.getTokens as jest.Mock).mockResolvedValue({
        accessToken: 'expired',
        refreshToken: 'invalid',
      });
      (globalThis.fetch as jest.Mock)
        .mockResolvedValueOnce(jsonResponse(401, { statusCode: 401, message: 'expired' }))
        .mockResolvedValueOnce(jsonResponse(401, { statusCode: 401, message: 'invalid refresh' }));

      await expect(apiRequest('/auth/me')).rejects.toBeInstanceOf(ApiError);
      expect(tokenStorage.clearTokens).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('throws ApiError with the parsed error body on non-2xx responses', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue(
        jsonResponse(409, {
          statusCode: 409,
          timestamp: '2026-07-12T00:00:00.000Z',
          path: '/auth/signup',
          message: 'Email already in use',
        }),
      );

      await expect(apiRequest('/auth/signup', { method: 'POST', auth: false })).rejects.toThrow(
        'Email already in use',
      );
    });
  });
});
