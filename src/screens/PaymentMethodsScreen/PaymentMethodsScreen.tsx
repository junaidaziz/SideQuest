import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStripe, PaymentSheetError } from '@stripe/stripe-react-native';
import {
  createSetupIntent,
  listPaymentMethods,
  removePaymentMethod,
  setDefaultPaymentMethod,
} from '../../services/paymentApi';
import { useAuthStore } from '../../store/authStore';
import type { PaymentMethod } from '../../types/api';
import { whenPressed } from '../HomeScreen';
import { styles } from './PaymentMethodsScreen.styles';

/** TanStack Query cache key for the saved-cards list. */
export const PAYMENT_METHODS_QUERY_KEY = ['paymentMethods'] as const;

interface PaymentMethodsScreenProps {
  /** Header back button — routed via router.back() by app/payment-methods.tsx. */
  onBack?: () => void;
}

/** Title-cases a Stripe brand slug (`visa` → `Visa`, `american_express` → `American Express`). */
export function formatBrand(brand: string): string {
  const cleaned = brand.trim();
  if (!cleaned) return 'Card';
  return cleaned
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/** Zero-pads the expiry month and shows a two-digit year: `MM/YY`. */
export function formatExpiry(month: number, year: number): string {
  const mm = String(month).padStart(2, '0');
  const yy = String(year % 100).padStart(2, '0');
  return `${mm}/${yy}`;
}

/** Screen-reader label for a card row, e.g. "Visa ending 4242, expires 12/28, default card". */
export function cardAccessibilityLabel(pm: PaymentMethod): string {
  const base = `${formatBrand(pm.brand)} ending ${pm.last4}, expires ${formatExpiry(
    pm.expMonth,
    pm.expYear,
  )}`;
  return pm.isDefault ? `${base}, default card` : base;
}

/** Skeleton placeholder rows shown while the saved-cards list is loading. */
function CardsSkeleton() {
  return (
    <View
      style={styles.skeletonWrap}
      accessibilityLabel="Loading your saved cards"
      accessibilityRole="progressbar"
    >
      <View style={styles.skel} />
      <View style={styles.skel} />
    </View>
  );
}

/**
 * Shown instead of the card-management UI when a guest reaches this screen
 * (e.g. via deep link or manual navigation) despite ProfileScreen's entry
 * point already being gated to non-guests. Defense in depth, not the primary
 * checkpoint — app/payment-methods.tsx redirects a guest before this screen
 * ever mounts; this fallback covers the case where it somehow doesn't.
 */
function GuestPrompt({ onBack }: { onBack?: () => void }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle} accessibilityRole="header">
          Create an account to add a payment method
        </Text>
        <Text style={styles.emptyBody}>
          Payment methods are saved to your account, so guest sessions can&apos;t add one.
        </Text>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [styles.retryBtn, pressed && styles.retryBtnPressed]}
          >
            <Text style={styles.retryBtnText}>Go back</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

export default function PaymentMethodsScreen({
  onBack,
}: PaymentMethodsScreenProps) {
  const isGuest = useAuthStore((s) => s.user?.isGuest ?? true);
  const queryClient = useQueryClient();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [addingCard, setAddingCard] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const cardsQuery = useQuery({
    queryKey: PAYMENT_METHODS_QUERY_KEY,
    queryFn: listPaymentMethods,
    // Guests never see the card list (GuestPrompt renders below instead),
    // so don't even fire the request — this hook still runs unconditionally
    // per the Rules of Hooks, but there's no reason to hit the endpoint for
    // a screen state a guest can't act on.
    enabled: !isGuest,
  });
  const { data: cards, isLoading, isError, refetch } = cardsQuery;

  // Both mutating endpoints return the freshly-projected list, so we write it
  // straight into the cache instead of triggering a follow-up refetch.
  const writeCards = useCallback(
    (next: PaymentMethod[]) => {
      queryClient.setQueryData(PAYMENT_METHODS_QUERY_KEY, next);
    },
    [queryClient],
  );

  const defaultMutation = useMutation({
    mutationFn: (id: string) => setDefaultPaymentMethod(id),
    onSuccess: (next) => {
      writeCards(next);
      setActionError(null);
    },
    onError: () => setActionError("Couldn't update your default card. Please try again."),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removePaymentMethod(id),
    onSuccess: (next) => {
      writeCards(next);
      setActionError(null);
    },
    onError: () => setActionError("Couldn't remove that card. Please try again."),
  });

  const busy =
    addingCard || defaultMutation.isPending || removeMutation.isPending;

  const handleBack = useCallback(() => {
    // Nav-agnostic: app/payment-methods.tsx's onBack runs router.back().
    onBack?.();
  }, [onBack]);

  const handleAddCard = useCallback(async () => {
    if (busy) return;
    setAddError(null);
    setActionError(null);
    setAddingCard(true);
    try {
      const { clientSecret } = await createSetupIntent();
      const init = await initPaymentSheet({
        merchantDisplayName: 'SideQuest',
        setupIntentClientSecret: clientSecret,
      });
      if (init.error) {
        setAddError("Couldn't start card setup. Please try again.");
        return;
      }
      const result = await presentPaymentSheet();
      if (result.error) {
        // A user-cancelled sheet is not an error worth surfacing.
        if (result.error.code !== PaymentSheetError.Canceled) {
          setAddError("Couldn't save that card. Please try again.");
        }
        return;
      }
      await refetch();
    } catch {
      setAddError("Couldn't save that card. Please try again.");
    } finally {
      setAddingCard(false);
    }
  }, [busy, initPaymentSheet, presentPaymentSheet, refetch]);

  const handleSetDefault = useCallback(
    (id: string) => {
      if (busy) return;
      setActionError(null);
      defaultMutation.mutate(id);
    },
    [busy, defaultMutation],
  );

  const handleRemove = useCallback(
    (pm: PaymentMethod) => {
      if (busy) return;
      Alert.alert(
        'Remove this card?',
        `${formatBrand(pm.brand)} ending ${pm.last4} will be removed from your account. You can add it again anytime.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              setActionError(null);
              removeMutation.mutate(pm.id);
            },
          },
        ],
      );
    },
    [busy, removeMutation],
  );

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // Defense in depth (see GuestPrompt's doc comment) — checked after every
  // hook above so this never violates the Rules of Hooks by branching before
  // a hook call.
  if (isGuest) {
    return <GuestPrompt onBack={onBack} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={({ pressed }) => [
            styles.iconBtn,
            whenPressed(pressed, styles.iconBtnPressed),
          ]}
        >
          <Text style={styles.iconGlyph}>{'‹'}</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.headerTitle}>
          Payment Methods
        </Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Save a card to have it ready for later. You won&apos;t be charged
          anything now — SideQuest never bills you without asking.
        </Text>

        {isLoading ? (
          <CardsSkeleton />
        ) : isError ? (
          <View
            accessible
            style={styles.inlineError}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            accessibilityLabel="Couldn't load your saved cards"
          >
            <Text style={styles.errorHeading}>{"Couldn't load your cards"}</Text>
            <Text style={styles.errorBody}>
              Check your connection and try again.
            </Text>
            <Pressable
              onPress={handleRetry}
              accessibilityRole="button"
              accessibilityLabel="Try again"
              style={({ pressed }) => [
                styles.retryBtn,
                whenPressed(pressed, styles.retryBtnPressed),
              ]}
            >
              <Text style={styles.retryBtnText}>Try again</Text>
            </Pressable>
          </View>
        ) : !cards || cards.length === 0 ? (
          <View
            style={styles.emptyWrap}
            accessible
            accessibilityRole="text"
            accessibilityLabel="No saved cards yet. Add a card to keep it on file for later."
          >
            <Text
              style={styles.emptyGlyph}
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              {'\u{1F4B3}'}
            </Text>
            <Text style={styles.emptyTitle}>No saved cards yet</Text>
            <Text style={styles.emptyBody}>
              Add a card to keep it on file for later.
            </Text>
          </View>
        ) : (
          cards.map((pm) => (
            <View
              key={pm.id}
              style={[styles.card, pm.isDefault ? styles.cardDefault : null]}
              accessible
              accessibilityRole="text"
              accessibilityLabel={cardAccessibilityLabel(pm)}
            >
              <View
                style={styles.cardIcon}
                accessibilityElementsHidden
                importantForAccessibility="no"
              >
                <Text style={styles.cardIconGlyph}>{'\u{1F4B3}'}</Text>
              </View>
              <View style={styles.cardInfo}>
                <View style={styles.cardBrandRow}>
                  <Text style={styles.cardBrand}>
                    {`${formatBrand(pm.brand)} •••• ${pm.last4}`}
                  </Text>
                  {pm.isDefault ? (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.cardExpiry}>
                  {`Expires ${formatExpiry(pm.expMonth, pm.expYear)}`}
                </Text>
              </View>
              <View style={styles.cardActions}>
                {!pm.isDefault ? (
                  <Pressable
                    onPress={() => handleSetDefault(pm.id)}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityLabel={`Set ${formatBrand(pm.brand)} ending ${pm.last4} as default`}
                    accessibilityState={{ disabled: busy }}
                    style={({ pressed }) => [
                      styles.smallBtn,
                      whenPressed(pressed, styles.smallBtnPressed),
                      busy ? styles.smallBtnDisabled : null,
                    ]}
                  >
                    <Text style={styles.smallBtnGlyph}>{'★'}</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => handleRemove(pm)}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${formatBrand(pm.brand)} ending ${pm.last4}`}
                  accessibilityState={{ disabled: busy }}
                  style={({ pressed }) => [
                    styles.smallBtn,
                    whenPressed(pressed, styles.smallBtnDestructivePressed),
                    busy ? styles.smallBtnDisabled : null,
                  ]}
                >
                  <Text style={styles.smallBtnGlyphDestructive}>{'🗑'}</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        {actionError ? (
          <Text
            style={styles.fieldError}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {actionError}
          </Text>
        ) : null}
        {addError ? (
          <Text
            style={styles.fieldError}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {addError}
          </Text>
        ) : null}

        {!isLoading && !isError ? (
          <Pressable
            onPress={handleAddCard}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Add a card"
            accessibilityState={{ disabled: busy, busy: addingCard }}
            style={({ pressed }) => [
              styles.addBtn,
              whenPressed(pressed, styles.addBtnPressed),
              busy ? styles.addBtnDisabled : null,
            ]}
          >
            <Text style={styles.addBtnText}>
              {addingCard ? 'Opening…' : '+ Add a card'}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
