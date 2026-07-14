import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, type Query } from '@tanstack/react-query';
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';

/**
 * The single QueryClient instance for the whole app — defined here (not in
 * app/_layout.tsx) so authStore.logout() can import and clear it directly,
 * without a route file importing from a store or a circular import between
 * the two. app/_layout.tsx imports this same instance for
 * PersistQueryClientProvider.
 */
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

/**
 * Read-cache persistence (M23.2). TanStack Query is already this app's
 * server-state layer but keeps its cache in memory only, so every relaunch
 * showed empty/loading screens with no signal. Persisting the cache to
 * AsyncStorage lets the last-successful response for the key screens render
 * instantly on a cold, offline start.
 *
 * AsyncStorage (not SecureStore) is correct here: these are non-sensitive read
 * payloads (home stats, task lists, referral totals), and SecureStore has a
 * ~2KB per-item cap that a serialized query cache would blow past. Tokens stay
 * in SecureStore — see `tokenStorage.ts`.
 */

/** Storage key for the single serialized cache blob. */
export const QUERY_CACHE_STORAGE_KEY = 'sidequest:rq-cache';

/**
 * 24 hours. The plan leaves this to engineering judgment. Rationale: a full
 * day means a user who opens the app daily always has yesterday's data to show
 * instantly while fresh data loads, but a cache older than that is stale enough
 * (streak/XP/task-status drift) that showing it risks confusing rather than
 * helping — past 24h we'd rather show the loading/empty state and refetch.
 * TanStack still revalidates in the background whenever online regardless, so
 * this only governs how old a *cold-start* snapshot may be before it's dropped.
 */
export const PERSIST_MAX_AGE = 1000 * 60 * 60 * 24;

/**
 * Root query-key segments whose data is safe and useful to persist across
 * restarts. Everything else (e.g. one-off mutations' transient state) is kept
 * in memory only. Matched against `query.queryKey[0]`.
 *
 * - `home`             — Today / Progress / You (all read `/home`)
 * - `quest-results`    — Mission Results last-generated set
 * - `tasks` / `task`   — Challenges list + detail (`GET /tasks`, `GET /tasks/:id`)
 * - `taskSummary`      — `GET /tasks/summary`
 * - `referralMe` / `referralHistory` — Rewards (`/referrals/me`, `/referrals/history`)
 */
export const PERSISTED_QUERY_KEYS: readonly string[] = [
  'home',
  'quest-results',
  'tasks',
  'task',
  'taskSummary',
  'referralMe',
  'referralHistory',
];

/** True when a query should be written to the persisted cache. */
export function shouldDehydrateQuery(query: Query): boolean {
  // Never persist an errored or still-pending query — a cold start should not
  // resurrect a failure as if it were real cached data.
  if (query.state.status !== 'success') {
    return false;
  }
  const root = query.queryKey[0];
  return typeof root === 'string' && PERSISTED_QUERY_KEYS.includes(root);
}

/** The AsyncStorage-backed persister passed to `PersistQueryClientProvider`. */
export function createQueryPersister() {
  return createAsyncStoragePersister({
    storage: AsyncStorage,
    key: QUERY_CACHE_STORAGE_KEY,
  });
}

/** Assembled options for `<PersistQueryClientProvider persistOptions={...}>`. */
export function buildPersistOptions(): Omit<PersistQueryClientOptions, 'queryClient'> {
  return {
    persister: createQueryPersister(),
    maxAge: PERSIST_MAX_AGE,
    dehydrateOptions: { shouldDehydrateQuery },
  };
}

/**
 * Called from authStore.logout() (found missing by independent review — a
 * real cross-user data leak on a shared device: without this, the next
 * user's cold start rehydrated the previous user's persisted Home/Challenges/
 * Referrals cache from AsyncStorage). Clears the in-memory cache AND removes
 * the persisted blob directly — `queryClient.clear()` alone only clears
 * memory; the persister could still hold (or shortly re-write, if a query was
 * mid-flight at clear time) a stale AsyncStorage copy otherwise.
 */
export async function clearPersistedQueryCache(): Promise<void> {
  queryClient.clear();
  await AsyncStorage.removeItem(QUERY_CACHE_STORAGE_KEY);
}
