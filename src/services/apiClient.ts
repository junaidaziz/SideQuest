import { Platform } from 'react-native';
import { getTokens, saveTokens, clearTokens } from './tokenStorage';
import type { ApiErrorBody, AuthTokens } from '../types/api';

// Android emulator can't reach the host machine via `localhost` — it must use
// the special 10.0.2.2 alias. iOS simulator and web both use localhost fine.
const DEFAULT_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3000',
  default: 'http://localhost:3000',
});

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiErrorBody,
  ) {
    super(Array.isArray(body.message) ? body.message.join(', ') : body.message);
    this.name = 'ApiError';
  }
}

let refreshInFlight: Promise<AuthTokens | null> | null = null;

async function refreshAccessToken(): Promise<AuthTokens | null> {
  const tokens = await getTokens();
  if (!tokens) return null;

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: tokens.refreshToken }),
  });

  if (!response.ok) {
    await clearTokens();
    return null;
  }

  const refreshed = (await response.json()) as AuthTokens;
  await saveTokens(refreshed);
  return refreshed;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean; // attach Authorization header — defaults to true
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const tokens = await getTokens();
    if (tokens) headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  const doFetch = () =>
    fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

  let response = await doFetch();

  // One retry after a refresh, only for authenticated requests that got a 401.
  if (response.status === 401 && auth) {
    if (!refreshInFlight) refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
    const refreshed = await refreshInFlight;
    if (refreshed) {
      headers.Authorization = `Bearer ${refreshed.accessToken}`;
      response = await doFetch();
    }
  }

  if (!response.ok) {
    const errorBody = (await response.json()) as ApiErrorBody;
    throw new ApiError(response.status, errorBody);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
