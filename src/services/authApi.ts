import { apiRequest } from './apiClient';
import type {
  AuthResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  DeleteAccountRequest,
  DeleteAccountResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
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

export function forgotPassword(
  payload: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> {
  // `auth: false` — this is a logged-out recovery flow; no token is required or
  // relevant. The backend returns the same generic success response regardless
  // of whether the email maps to an account, so a resolved call never confirms
  // (or denies) that the address is registered.
  return apiRequest<ForgotPasswordResponse>('/auth/forgot-password', {
    method: 'POST',
    body: payload,
    auth: false,
  });
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

export function changePassword(payload: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  return apiRequest<ChangePasswordResponse>('/auth/password', { method: 'PATCH', body: payload });
}

export function deleteAccount(payload: DeleteAccountRequest): Promise<DeleteAccountResponse> {
  return apiRequest<DeleteAccountResponse>('/auth/me', { method: 'DELETE', body: payload });
}
