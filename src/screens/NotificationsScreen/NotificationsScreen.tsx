import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleProp, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notificationsApi';
import type { AppNotification } from '../../types/api';
import { formatRelativeTime, iconForType } from './notifications';
import { makeStyles, type NotificationsStyles } from './NotificationsScreen.styles';

interface NotificationsScreenProps {
  onBack?: () => void;
  /** "Explore quests" CTA on the empty state — optional so a caller with
   * nowhere sensible to send the user can omit it. */
  onExplore?: () => void;
  /** Opens whatever the notification's `data.screen` deep-link points at.
   * The screen itself stays navigation-agnostic — see other screens' routing
   * convention. */
  onOpenNotification?: (notification: AppNotification) => void;
}

function whenPressed(pressed: boolean, style: StyleProp<ViewStyle>): StyleProp<ViewStyle> {
  return pressed ? style : null;
}

function Skeleton({ styles }: { styles: NotificationsStyles }) {
  return (
    <View style={styles.skeletonWrap} accessibilityRole="progressbar" accessibilityLabel="Loading notifications">
      <View style={[styles.skel, styles.skelRow]} />
      <View style={[styles.skel, styles.skelRow]} />
      <View style={[styles.skel, styles.skelRow]} />
    </View>
  );
}

export default function NotificationsScreen({ onBack, onExplore, onOpenNotification }: NotificationsScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const queryClient = useQueryClient();

  const listQuery = useQuery({ queryKey: ['notifications'], queryFn: () => listNotifications() });
  // Independent of the list query so the header's "Mark all read" affordance
  // and the app-wide bell badge (elsewhere) can both key off this without
  // waiting on the full list to load.
  const unreadQuery = useQuery({ queryKey: ['notifications', 'unread-count'], queryFn: getUnreadCount });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleRetry = useCallback(() => {
    listQuery.refetch();
  }, [listQuery]);

  const handlePressNotification = useCallback(
    (notification: AppNotification) => {
      if (!notification.readAt) {
        markReadMutation.mutate(notification.id);
      }
      onOpenNotification?.(notification);
    },
    [markReadMutation, onOpenNotification],
  );

  const handleMarkAllRead = useCallback(() => {
    markAllReadMutation.mutate();
  }, [markAllReadMutation]);

  const { data, isLoading, isError } = listQuery;
  const items = data?.items ?? [];
  const hasUnread = (unreadQuery.data?.unreadCount ?? 0) > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={({ pressed }) => [styles.backBtn, whenPressed(pressed, styles.backBtnPressed)]}
        >
          <Text style={styles.backGlyph}>{'‹'}</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          Notifications
        </Text>
        {hasUnread ? (
          <Pressable
            onPress={handleMarkAllRead}
            disabled={markAllReadMutation.isPending}
            accessibilityRole="button"
            accessibilityLabel="Mark all as read"
            style={({ pressed }) => [styles.markAllBtn, whenPressed(pressed, styles.markAllBtnPressed)]}
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        ) : (
          <View style={styles.backBtn} importantForAccessibility="no" />
        )}
      </View>

      {isLoading ? (
        <Skeleton styles={styles} />
      ) : isError ? (
        <View style={styles.stateArea}>
          <Text accessibilityRole="header" style={styles.stateHeading}>
            {"Couldn't load notifications"}
          </Text>
          <Text style={styles.stateBody}>Check your connection and try again.</Text>
          <Pressable
            onPress={handleRetry}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            style={({ pressed }) => [styles.retryBtn, whenPressed(pressed, styles.retryBtnPressed)]}
          >
            <Text style={styles.retryBtnText}>Try again</Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyBadge} importantForAccessibility="no">
            <Text style={styles.emptyGlyph}>{'\u{1F514}✨'}</Text>
          </View>
          <Text accessibilityRole="header" style={styles.emptyTitle}>
            You&apos;re all caught up!
          </Text>
          <Text style={styles.emptyBody}>No new notifications yet.</Text>
          {onExplore ? (
            <Pressable
              onPress={onExplore}
              accessibilityRole="button"
              accessibilityLabel="Explore quests"
              style={({ pressed }) => [styles.emptyCta, whenPressed(pressed, styles.emptyCtaPressed)]}
            >
              <Text style={styles.emptyCtaText}>Explore quests</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {items.map((item) => {
            const unread = !item.readAt;
            return (
              <Pressable
                key={item.id}
                onPress={() => handlePressNotification(item)}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}. ${item.body}${unread ? '. Unread' : ''}`}
                style={({ pressed }) => [
                  styles.row,
                  unread && styles.rowUnread,
                  whenPressed(pressed, styles.rowPressed),
                ]}
              >
                <View style={styles.iconWrap} importantForAccessibility="no">
                  <Text style={styles.icon}>{iconForType(item.type)}</Text>
                </View>
                <View style={styles.rowBody}>
                  <View style={styles.rowTop}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {unread ? <View style={styles.unreadDot} importantForAccessibility="no" /> : null}
                  </View>
                  <Text style={styles.rowText} numberOfLines={2}>
                    {item.body}
                  </Text>
                  <Text style={styles.rowTime}>{formatRelativeTime(item.createdAt)}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
