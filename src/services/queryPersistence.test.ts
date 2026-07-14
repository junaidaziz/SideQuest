import type { Query } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}));

import {
  PERSISTED_QUERY_KEYS,
  PERSIST_MAX_AGE,
  QUERY_CACHE_STORAGE_KEY,
  buildPersistOptions,
  clearPersistedQueryCache,
  createQueryPersister,
  queryClient,
  shouldDehydrateQuery,
} from './queryPersistence';

function fakeQuery(status: string, key: unknown[]): Query {
  return { state: { status }, queryKey: key } as unknown as Query;
}

describe('queryPersistence', () => {
  it('uses a 24-hour max age', () => {
    expect(PERSIST_MAX_AGE).toBe(1000 * 60 * 60 * 24);
  });

  it('whitelists exactly the cached read screens', () => {
    expect(PERSISTED_QUERY_KEYS).toEqual(
      expect.arrayContaining([
        'home',
        'quest-results',
        'tasks',
        'task',
        'taskSummary',
        'referralMe',
        'referralHistory',
      ]),
    );
  });

  describe('shouldDehydrateQuery', () => {
    it('persists a successful whitelisted query', () => {
      expect(shouldDehydrateQuery(fakeQuery('success', ['home']))).toBe(true);
      expect(shouldDehydrateQuery(fakeQuery('success', ['referralMe']))).toBe(true);
    });

    it('does not persist an errored or pending query even if whitelisted', () => {
      expect(shouldDehydrateQuery(fakeQuery('error', ['home']))).toBe(false);
      expect(shouldDehydrateQuery(fakeQuery('pending', ['home']))).toBe(false);
    });

    it('does not persist a non-whitelisted query', () => {
      expect(shouldDehydrateQuery(fakeQuery('success', ['payment-methods']))).toBe(false);
    });

    it('does not persist a query whose root key is not a string', () => {
      expect(shouldDehydrateQuery(fakeQuery('success', [123]))).toBe(false);
      expect(shouldDehydrateQuery(fakeQuery('success', []))).toBe(false);
    });
  });

  it('creates an AsyncStorage-backed persister', () => {
    const persister = createQueryPersister();
    expect(typeof persister.persistClient).toBe('function');
    expect(typeof persister.restoreClient).toBe('function');
  });

  it('builds persist options with the persister, max age and dehydrate predicate', () => {
    const options = buildPersistOptions();
    expect(options.maxAge).toBe(PERSIST_MAX_AGE);
    expect(options.persister).toBeDefined();
    expect(options.dehydrateOptions?.shouldDehydrateQuery).toBe(shouldDehydrateQuery);
  });

  it('exposes a stable storage key', () => {
    expect(QUERY_CACHE_STORAGE_KEY).toBe('sidequest:rq-cache');
  });

  describe('clearPersistedQueryCache', () => {
    it('clears the in-memory query client and removes the persisted AsyncStorage blob', async () => {
      // Regression coverage for the cross-user data leak an independent
      // review found: authStore.logout() previously never called this,
      // leaving the persisted cache in AsyncStorage for the next user on a
      // shared device to rehydrate.
      queryClient.setQueryData(['home'], { totalXp: 999 });
      expect(queryClient.getQueryData(['home'])).toEqual({ totalXp: 999 });

      await clearPersistedQueryCache();

      expect(queryClient.getQueryData(['home'])).toBeUndefined();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(QUERY_CACHE_STORAGE_KEY);
    });
  });
});
