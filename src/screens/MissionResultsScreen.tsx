import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  ListRenderItemInfo,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import {
  Colors,
  Duration,
  Fonts,
  FontSize,
  LineHeight,
  Radius,
  Spacing,
} from '../constants/design';
import { generateMissions, saveMission, unsaveMission } from '../services/missionsApi';
import type { GenerateMissionsRequest, Mission } from '../types/api';

export type { Mission, MissionCategory } from '../types/api';

interface MissionResultsScreenProps {
  /** Structured context filters from onboarding — drives both the API
   * request and the display chips below the header. */
  filters: GenerateMissionsRequest;
  /** Invoked by the header back button. */
  onBack?: () => void;
  /** Invoked after a quest is accepted (post-confirmation beat). */
  onAccept?: (missionId: string) => void;
}

/**
 * Per-category visual tokens: left stripe, badge fill, badge text.
 * `as const` keeps the keys narrow so `CATEGORY_STYLES[m.category]` type-checks.
 */
const CATEGORY_STYLES = {
  explore: {
    stripe: Colors.primary,
    badgeBg: Colors.primaryLight,
    badgeText: Colors.primary,
  },
  create: {
    stripe: Colors.accent,
    badgeBg: Colors.accentLight,
    badgeText: Colors.accentDark,
  },
  discover: {
    stripe: Colors.teal,
    badgeBg: Colors.tealLight,
    badgeText: Colors.teal,
  },
} as const;

/** Same emoji set OnboardingScreen uses for these exact option values, so the
 * filter chips here read consistently with the screen the user just left. */
const FILTER_EMOJI: {
  crew: Record<string, string>;
  time: Record<string, string>;
  setting: Record<string, string>;
  budget: Record<string, string>;
} = {
  crew: {
    Solo: '\u{1F9CD}',
    Partner: '\u{1F491}',
    Friends: '\u{1F465}',
    Family: '\u{1F468}‍\u{1F469}‍\u{1F467}',
    'Kids Mode': '\u{1F9F8}',
  },
  time: {
    '15 min': '⚡',
    '30 min': '\u{1F550}',
    '1 hour': '\u{1F551}',
    '2+ hours': '\u{1F305}',
  },
  setting: {
    Indoors: '\u{1F6CB}️',
    Outdoors: '\u{1F33F}',
    City: '\u{1F3D9}️',
    Nature: '\u{1F332}',
    Anywhere: '\u{1F30D}',
  },
  budget: {
    Free: '\u{1F193}',
    'Under $10': '☕',
    'Under $30': '\u{1F39F}️',
    'No limit': '\u{1F680}',
  },
};

/** Turns structured filters into the emoji chip strings shown under the header. */
export function buildFilterChips(filters: GenerateMissionsRequest): string[] {
  return [
    `${FILTER_EMOJI.crew[filters.crew] ?? ''} ${filters.crew}`.trim(),
    `${FILTER_EMOJI.time[filters.time] ?? ''} ${filters.time}`.trim(),
    `${FILTER_EMOJI.setting[filters.setting] ?? ''} ${filters.setting}`.trim(),
    `${FILTER_EMOJI.budget[filters.budget] ?? ''} ${filters.budget}`.trim(),
  ];
}

/**
 * Returns `style` only while a Pressable is pressed, else `null`. Extracted so
 * the pressed-state branch is unit-testable — RTL's press helpers do not flip
 * Pressable's internal pressed flag, so this decision cannot be reached through
 * fired events alone.
 */
export function whenPressed(
  pressed: boolean,
  style: StyleProp<ViewStyle>,
): StyleProp<ViewStyle> {
  return pressed ? style : null;
}

const SPIN_MS = Duration.screen;
const ACCEPT_CONFIRM_MS = 900;

/** Three difficulty dots, filled up to `dots`. Purely decorative. */
function DifficultyDots({ dots }: { dots: number }) {
  return (
    <View
      style={styles.difficulty}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      {[1, 2, 3].map((d) => (
        <View key={d} style={[styles.dot, d <= dots && styles.dotFilled]} />
      ))}
    </View>
  );
}

interface MissionCardProps {
  mission: Mission;
  onPress: (mission: Mission) => void;
}

/** A single tappable quest card. Opens the detail sheet on press. */
function MissionCard({ mission, onPress }: MissionCardProps) {
  const cat = CATEGORY_STYLES[mission.category];
  return (
    <Pressable
      onPress={() => onPress(mission)}
      accessibilityRole="button"
      accessibilityLabel={`View quest: ${mission.title}. Difficulty ${mission.diff}, ${mission.time}, ${mission.xp}`}
      style={({ pressed }) => [styles.card, whenPressed(pressed, styles.cardPressed)]}
    >
      <View style={[styles.cardStripe, { backgroundColor: cat.stripe }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={[styles.badge, { backgroundColor: cat.badgeBg }]}>
            <Text style={[styles.badgeText, { color: cat.badgeText }]}>
              {mission.category.toUpperCase()}
            </Text>
          </View>
          <DifficultyDots dots={mission.dots} />
        </View>

        <Text style={styles.cardTitle}>{mission.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {mission.desc}
        </Text>

        <View style={styles.cardMeta}>
          <Text style={styles.metaTime}>{`⏱ ${mission.time}`}</Text>
          <View style={styles.metaXp}>
            <Text style={styles.metaXpText}>{mission.xp}</Text>
          </View>
          <View
            style={styles.metaArrow}
            importantForAccessibility="no"
            accessibilityElementsHidden
          >
            <Text style={styles.metaArrowText}>{'→'}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/** Shimmer-free skeleton placeholder shown while a generate/shuffle request is in flight. */
function SkeletonList() {
  return (
    <View
      style={styles.skeletonWrap}
      accessibilityLabel="Loading new quests"
      accessibilityRole="progressbar"
    >
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonRow}>
            <View style={[styles.skel, styles.skelSm]} />
            <View style={[styles.skel, styles.skelXs]} />
          </View>
          <View style={[styles.skel, styles.skelMd]} />
          <View style={[styles.skel, styles.skelLg]} />
          <View style={[styles.skel, styles.skelLg2]} />
        </View>
      ))}
    </View>
  );
}

/** Shown when the request succeeded but no mission matched the filters. */
function EmptyState() {
  return (
    <View style={styles.stateWrap} accessibilityLabel="No quests matched your filters">
      <Text style={styles.stateHeading}>No quests found</Text>
      <Text style={styles.stateBody}>
        Nothing matched that combination yet. Try loosening a filter or shuffle again.
      </Text>
    </View>
  );
}

/** Shown when the generate request itself failed. */
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.stateWrap} accessibilityLabel="Couldn't load quests">
      <Text style={styles.stateHeading}>{"Couldn't load quests"}</Text>
      <Text style={styles.stateBody}>Check your connection and try again.</Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Try again"
        style={({ pressed }) => [styles.retryBtn, whenPressed(pressed, styles.retryBtnPressed)]}
      >
        <Text style={styles.retryBtnText}>Try again</Text>
      </Pressable>
    </View>
  );
}

export default function MissionResultsScreen({
  filters,
  onBack,
  onAccept,
}: MissionResultsScreenProps) {
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [saved, setSaved] = useState(false);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(1)).current; // 1 = off-screen, 0 = shown
  const acceptTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const missionsMutation = useMutation({
    mutationFn: generateMissions,
  });
  const { mutate } = missionsMutation;

  // Fetch once on mount, and again whenever the caller passes new filters
  // (e.g. the user redoes onboarding with a different combination).
  useEffect(() => {
    mutate(filters);
  }, [filters, mutate]);

  useEffect(() => {
    return () => {
      if (acceptTimer.current) clearTimeout(acceptTimer.current);
    };
  }, []);

  const missions = missionsMutation.data?.missions ?? [];
  const isLoading = missionsMutation.isPending;
  const isError = missionsMutation.isError && !isLoading;
  const isEmpty = !isLoading && !isError && missions.length === 0;

  const handleShuffle = useCallback(() => {
    if (isLoading) return;

    spinAnim.setValue(0);
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: SPIN_MS,
      useNativeDriver: true,
    }).start();

    mutate(filters);
  }, [filters, isLoading, mutate, spinAnim]);

  const openSheet = useCallback(
    (mission: Mission) => {
      setActiveMission(mission);
      setAccepted(false);
      setSaved(false);
      sheetAnim.setValue(1);
      Animated.timing(sheetAnim, {
        toValue: 0,
        duration: Duration.screen,
        useNativeDriver: true,
      }).start();
    },
    [sheetAnim],
  );

  const closeSheet = useCallback(() => {
    Animated.timing(sheetAnim, {
      toValue: 1,
      duration: Duration.screen,
      useNativeDriver: true,
    }).start(() => {
      setActiveMission(null);
    });
  }, [sheetAnim]);

  const handleAccept = useCallback(() => {
    if (accepted || !activeMission) return;
    const missionId = activeMission.id;
    setAccepted(true);
    acceptTimer.current = setTimeout(() => {
      // TODO: replace with navigation call once nav library is chosen
      // Expo Router:       router.push({ pathname: '/mission-detail', params: { id } })
      // React Navigation:  navigation.navigate('MissionDetail', { missionId })
      onAccept?.(missionId);
      closeSheet();
    }, ACCEPT_CONFIRM_MS);
  }, [accepted, activeMission, closeSheet, onAccept]);

  const saveMutation = useMutation({
    mutationFn: (params: { missionId: string; save: boolean }) =>
      params.save ? saveMission(params.missionId) : unsaveMission(params.missionId),
  });

  // Optimistic toggle, reverted on failure. Note: the sheet always opens with
  // `saved` reset to false (see openSheet) regardless of prior state, because
  // /missions/generate doesn't return per-mission saved status for the
  // current user — re-opening a previously-saved mission won't reflect that
  // until the generate response is extended to include it (tracked, not a
  // bug in this pass, which only wires the button to actually persist).
  const handleSave = useCallback(() => {
    if (!activeMission) return;
    const missionId = activeMission.id;
    const nextSaved = !saved;
    setSaved(nextSaved);
    saveMutation.mutate(
      { missionId, save: nextSaved },
      {
        onError: () => {
          setSaved(!nextSaved);
        },
      },
    );
  }, [activeMission, saved, saveMutation]);

  const handleBack = useCallback(() => {
    // TODO: replace with navigation call once nav library is chosen
    // Expo Router:       router.back()
    // React Navigation:  navigation.goBack()
    onBack?.();
  }, [onBack]);

  const handleRetry = useCallback(() => {
    mutate(filters);
  }, [filters, mutate]);

  const renderCard = useCallback(
    ({ item }: ListRenderItemInfo<Mission>) => (
      <MissionCard mission={item} onPress={openSheet} />
    ),
    [openSheet],
  );

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const countLabel = `${missions.length} quest${missions.length === 1 ? '' : 's'}`;
  const chips = buildFilterChips(filters);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Back to filters"
          style={({ pressed }) => [styles.iconBtn, whenPressed(pressed, styles.iconBtnPressed)]}
        >
          <Text style={styles.iconGlyph}>{'‹'}</Text>
        </Pressable>

        <Text accessibilityRole="header" style={styles.title}>
          Your Quests
        </Text>

        <Pressable
          onPress={handleShuffle}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Shuffle quests"
          accessibilityState={{ disabled: isLoading, busy: isLoading }}
          style={({ pressed }) => [styles.iconBtn, whenPressed(pressed, styles.iconBtnPressed)]}
        >
          <Animated.Text style={[styles.iconGlyph, { transform: [{ rotate: spin }] }]}>
            {'⇄'}
          </Animated.Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
        accessibilityLabel="Active filters"
      >
        {chips.map((chip) => (
          <View key={chip} style={styles.chip}>
            <Text style={styles.chipText}>{chip}</Text>
          </View>
        ))}
      </ScrollView>

      {!isLoading && !isError ? (
        <Text
          style={styles.count}
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${countLabel} matched your filters`}
        >
          <Text style={styles.countStrong}>{countLabel}</Text> matched your filters
        </Text>
      ) : null}

      {isLoading ? (
        <View style={styles.listArea}>
          <SkeletonList />
        </View>
      ) : isError ? (
        <View style={styles.listArea}>
          <ErrorState onRetry={handleRetry} />
        </View>
      ) : isEmpty ? (
        <View style={styles.listArea}>
          <EmptyState />
        </View>
      ) : (
        <FlatList
          data={missions}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          style={styles.listArea}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          accessibilityLabel="Available quests"
        />
      )}

      <Modal
        visible={activeMission !== null}
        transparent
        animationType="none"
        onRequestClose={closeSheet}
        accessibilityViewIsModal
      >
        <View style={styles.modalRoot}>
          <Pressable
            testID="sheet-backdrop"
            style={styles.overlay}
            onPress={closeSheet}
            accessibilityRole="button"
            accessibilityLabel="Dismiss mission detail"
          />
          {activeMission ? (
            <Animated.View
              accessibilityViewIsModal
              style={[
                styles.sheet,
                {
                  transform: [
                    {
                      translateY: sheetAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 600],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.sheetHandle} importantForAccessibility="no" />

              <View style={styles.sheetCloseRow}>
                <Pressable
                  onPress={closeSheet}
                  accessibilityRole="button"
                  accessibilityLabel="Close mission detail"
                  style={({ pressed }) => [styles.iconBtn, whenPressed(pressed, styles.iconBtnPressed)]}
                >
                  <Text style={styles.iconGlyph}>{'✕'}</Text>
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View
                  style={[
                    styles.badge,
                    styles.sheetBadge,
                    { backgroundColor: CATEGORY_STYLES[activeMission.category].badgeBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: CATEGORY_STYLES[activeMission.category].badgeText },
                    ]}
                  >
                    {activeMission.category.toUpperCase()}
                  </Text>
                </View>

                <Text accessibilityRole="header" style={styles.sheetTitle}>
                  {activeMission.title}
                </Text>
                <Text style={styles.sheetBody}>{activeMission.full}</Text>

                <View style={styles.proofBox}>
                  <Text style={styles.proofLabel}>PROOF REQUIRED</Text>
                  <Text style={styles.proofText}>{activeMission.proof}</Text>
                </View>

                <View style={styles.sheetMetaRow}>
                  <View style={styles.sheetMetaItem}>
                    <Text style={styles.sheetMetaLabel}>TIME</Text>
                    <Text style={styles.sheetMetaValue}>{activeMission.time}</Text>
                  </View>
                  <View style={styles.sheetMetaItem}>
                    <Text style={styles.sheetMetaLabel}>XP REWARD</Text>
                    <Text style={[styles.sheetMetaValue, styles.sheetMetaXp]}>
                      {activeMission.xp}
                    </Text>
                  </View>
                  <View style={styles.sheetMetaItem}>
                    <Text style={styles.sheetMetaLabel}>DIFFICULTY</Text>
                    <Text style={styles.sheetMetaValue}>{activeMission.diff}</Text>
                  </View>
                </View>

                <Pressable
                  onPress={handleAccept}
                  disabled={accepted}
                  accessibilityRole="button"
                  accessibilityLabel={accepted ? 'Quest accepted' : 'Accept quest'}
                  accessibilityState={{ disabled: accepted }}
                  style={({ pressed }) => [
                    styles.acceptBtn,
                    accepted && styles.acceptBtnAccepted,
                    whenPressed(pressed, accepted ? null : styles.acceptBtnPressed),
                  ]}
                >
                  <Text style={styles.acceptBtnText}>
                    {accepted ? 'Quest Accepted ✓' : 'Accept Quest'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleSave}
                  accessibilityRole="button"
                  accessibilityLabel={saved ? 'Saved for later' : 'Save for later'}
                  accessibilityState={{ selected: saved }}
                  style={({ pressed }) => [
                    styles.saveBtn,
                    saved && styles.saveBtnSaved,
                    whenPressed(pressed, styles.saveBtnPressed),
                  ]}
                >
                  <Text style={[styles.saveBtnText, saved && styles.saveBtnTextSaved]}>
                    {saved ? 'Saved ✓' : 'Save for later'}
                  </Text>
                </Pressable>
              </ScrollView>
            </Animated.View>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.chip,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: {
    backgroundColor: Colors.surfaceMuted,
    borderColor: Colors.primary,
  },
  iconGlyph: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.ink,
    lineHeight: 22,
  },
  title: {
    fontFamily: Fonts.displayExtraBold,
    fontSize: FontSize.h2,
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  filterRow: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterContent: {
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  chip: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
  },
  chipText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.caption,
    color: Colors.primary,
  },
  count: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
  },
  countStrong: {
    fontFamily: Fonts.bodySemiBold,
    color: Colors.ink,
  },
  listArea: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.card,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardPressed: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceMuted,
  },
  cardStripe: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: Spacing.base,
    gap: Spacing.xs,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  difficulty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotFilled: {
    backgroundColor: Colors.textSecondary,
  },
  cardTitle: {
    fontFamily: Fonts.displayBold,
    fontSize: FontSize.cardLabel,
    color: Colors.ink,
    letterSpacing: -0.2,
    marginTop: Spacing.xs,
  },
  cardDesc: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.caption,
    lineHeight: LineHeight.caption,
    color: Colors.textSecondary,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  metaTime: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
  },
  metaXp: {
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: 6,
    backgroundColor: Colors.accent,
  },
  metaXpText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.ink,
  },
  metaArrow: {
    marginLeft: 'auto',
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaArrowText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
  },
  skeletonWrap: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  skeletonCard: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.card,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skel: {
    backgroundColor: Colors.border,
    borderRadius: 6,
  },
  skelSm: { height: 14, width: 60 },
  skelXs: { height: 12, width: 50 },
  skelMd: { height: 18, width: '80%' },
  skelLg: { height: 13, width: '100%' },
  skelLg2: { height: 13, width: '70%' },
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.sm,
  },
  stateHeading: {
    fontFamily: Fonts.displayBold,
    fontSize: FontSize.cardLabel,
    color: Colors.ink,
    textAlign: 'center',
  },
  stateBody: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.caption,
    lineHeight: LineHeight.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: Spacing.sm,
    borderRadius: Radius.btn,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  retryBtnPressed: {
    backgroundColor: Colors.primaryLight,
  },
  retryBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.body,
    color: Colors.primary,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: Colors.scrim,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    maxHeight: '87%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.base,
  },
  sheetCloseRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing.base,
  },
  sheetBadge: {
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    fontFamily: Fonts.displayExtraBold,
    fontSize: 24,
    color: Colors.ink,
    lineHeight: 28,
    letterSpacing: -0.4,
    marginBottom: Spacing.md,
  },
  sheetBody: {
    fontFamily: Fonts.bodyRegular,
    fontSize: 14,
    lineHeight: 23,
    color: Colors.textSecondary,
    marginBottom: Spacing.base,
  },
  proofBox: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.chip,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  proofLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
  },
  proofText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.caption,
    lineHeight: 19,
    color: Colors.ink,
  },
  sheetMetaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  sheetMetaItem: {
    flex: 1,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.chip,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
  },
  sheetMetaLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  sheetMetaValue: {
    fontFamily: Fonts.displayBold,
    fontSize: FontSize.cardLabel,
    color: Colors.ink,
  },
  sheetMetaXp: {
    color: Colors.accentDark,
  },
  acceptBtn: {
    borderRadius: Radius.btn,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  acceptBtnPressed: {
    backgroundColor: Colors.primaryDark,
  },
  acceptBtnAccepted: {
    backgroundColor: Colors.success,
  },
  acceptBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.button,
    color: Colors.white,
  },
  saveBtn: {
    borderRadius: Radius.btn,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnPressed: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  saveBtnSaved: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
  },
  saveBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.body,
    color: Colors.ink,
  },
  saveBtnTextSaved: {
    color: Colors.success,
  },
});
