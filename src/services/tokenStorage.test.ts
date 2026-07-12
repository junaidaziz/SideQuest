import * as SecureStore from 'expo-secure-store';
import { saveTokens, getTokens, clearTokens } from './tokenStorage';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('tokenStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves access and refresh tokens under their own keys', async () => {
    await saveTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' });

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('sidequest.accessToken', 'access-1');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('sidequest.refreshToken', 'refresh-1');
  });

  it('returns both tokens when present', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) =>
      Promise.resolve(key.includes('access') ? 'access-1' : 'refresh-1'),
    );

    const tokens = await getTokens();

    expect(tokens).toEqual({ accessToken: 'access-1', refreshToken: 'refresh-1' });
  });

  it('returns null when either token is missing', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    const tokens = await getTokens();

    expect(tokens).toBeNull();
  });

  it('clears both tokens', async () => {
    await clearTokens();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('sidequest.accessToken');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('sidequest.refreshToken');
  });
});
