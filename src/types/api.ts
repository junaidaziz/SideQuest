/**
 * Mirrors backend DTOs in sidequest-backend `src/auth/dto/*`. No shared-types
 * package/codegen exists yet (tracked as a Milestone 6 decision) — keep this
 * file in sync by hand whenever the backend auth contract changes.
 */

export interface UserProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  isGuest: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: UserProfile;
}

export interface SignupRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiErrorBody {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string | string[];
}
