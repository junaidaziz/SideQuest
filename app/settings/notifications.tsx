import { router } from 'expo-router';
import { useCallback, useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import NotificationPreferencesScreen from '../../src/screens/NotificationPreferencesScreen';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../../src/services/notificationsApi';
import type { NotificationPreferencesDto } from '../../src/types/api';

const PREFERENCES_QUERY_KEY = ['notification-preferences'] as const;

export default function NotificationPreferencesRoute() {
  const queryClient = useQueryClient();
  const latestRevision = useRef(0);
  const preferences = useQuery({
    queryKey: PREFERENCES_QUERY_KEY,
    queryFn: getNotificationPreferences,
  });
  const update = useMutation({
    // React Query serializes mutations sharing a scope. This preserves server
    // patch order when someone toggles several switches quickly.
    scope: { id: 'notification-preferences' },
    mutationFn: ({ patch }: { patch: Partial<NotificationPreferencesDto>; revision: number }) =>
      updateNotificationPreferences(patch),
    onSuccess: (saved, variables) => {
      // An earlier response must never replace a newer optimistic selection.
      if (variables.revision === latestRevision.current) {
        queryClient.setQueryData(PREFERENCES_QUERY_KEY, saved);
      }
    },
    onError: (_error, variables) => {
      if (variables.revision === latestRevision.current) {
        void queryClient.invalidateQueries({ queryKey: PREFERENCES_QUERY_KEY });
      }
    },
  });
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleChange = useCallback((next: NotificationPreferencesDto) => {
    const current = queryClient.getQueryData<NotificationPreferencesDto>(PREFERENCES_QUERY_KEY);
    if (!current) return;
    const changed = Object.fromEntries(
      Object.entries(next).filter(([key, value]) => current[key as keyof NotificationPreferencesDto] !== value),
    );
    queryClient.setQueryData(PREFERENCES_QUERY_KEY, next);
    latestRevision.current += 1;
    update.mutate({ patch: changed, revision: latestRevision.current });
  }, [queryClient, update]);

  if (preferences.isPending) {
    return <View accessibilityLabel="Loading notification preferences"><ActivityIndicator /></View>;
  }
  if (preferences.isError || !preferences.data) {
    return <View><Text>Couldn&apos;t load notification preferences.</Text></View>;
  }

  return (
    <NotificationPreferencesScreen
      key={JSON.stringify(preferences.data)}
      onBack={handleBack}
      initialPreferences={preferences.data}
      onChange={handleChange}
    />
  );
}
