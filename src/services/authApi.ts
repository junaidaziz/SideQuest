import { apiRequest } from './apiClient';
import type {
  AuthResponse,
  GoogleAuthRequest,
  LoginRequest,
  LogoutResponse,
  SignupRequest,
  UserProfile,
} from '../types/api';

export function bootstrapGuest(): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/guest', { method: 'POST', auth: false });
}

export function signup(payload: SignupRequest): Promise<AuthResponse> {
  // `auth: true` (default) so an existing guest token, if present, is sent —
  // the backend upgrades that guest's row in place instead of creating a new one.
  return apiRequest<AuthResponse>('/auth/signup', { method: 'POST', body: payload });
}

export function login(payload: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: payload, auth: false });
}

export function googleAuth(payload: GoogleAuthRequest): Promise<AuthResponse> {
  // `auth: true` (default) so an existing guest token, if present, rides along
  // in the Authorization header — the backend upgrades that guest's row in
  // place instead of creating a new one, exactly like signup() above.
  return apiRequest<AuthResponse>('/auth/google', { method: 'POST', body: payload });
}

export function getCurrentUser(): Promise<UserProfile> {
  return apiRequest<UserProfile>('/auth/me');
}

export function logoutRequest(): Promise<LogoutResponse> {
  return apiRequest<LogoutResponse>('/auth/logout', { method: 'POST' });
}
