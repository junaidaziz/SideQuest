/**
 * Automatic manual mock for the native Google Sign-In SDK.
 *
 * Jest uses this for every test that imports the module without calling
 * `jest.mock()` itself (node_module manual mocks are applied automatically),
 * so tests that pull in `authStore` transitively never load the real
 * TurboModule — which throws under Jest. Test files that need to drive the
 * flow (authStore/LoginScreen/SignupPromptScreen) declare their own
 * `jest.mock(..., factory)`, which overrides this default.
 */
const statusCodes = Object.freeze({
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
});

const GoogleSignin = {
  configure: jest.fn(),
  hasPlayServices: jest.fn().mockResolvedValue(true),
  signIn: jest.fn().mockResolvedValue({ type: 'cancelled', data: null }),
  signOut: jest.fn().mockResolvedValue(null),
};

const isSuccessResponse = (response) => response?.type === 'success';
const isErrorWithCode = (error) => typeof error?.code === 'string';
const isCancelledResponse = (response) => response?.type === 'cancelled';

module.exports = {
  GoogleSignin,
  statusCodes,
  isSuccessResponse,
  isErrorWithCode,
  isCancelledResponse,
};
