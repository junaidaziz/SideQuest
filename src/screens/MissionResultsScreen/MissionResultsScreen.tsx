// SUPERSEDED by /quest-results (src/screens/QuestResultsScreen) in the Compass
// redesign. Kept for rollback only — no route renders this; safe to delete in a
// later cleanup pass once the redesign is settled.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  ListRenderItemInfo,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { Duration } from '../../constants/design';
import { generateMissions, saveMission, unsaveMission } from '../../services/missionsApi';
import type { GenerateMissionsRequest, Mission } from '../../types/api';
import { styles } from './MissionResultsScreen.styles';

export type { Mission, MissionCategory } from '../../types/api';

interface MissionResultsScreenProps {
  /** Structured context filters from onboarding — drives both the API
   * request and the display chips below the header. */
  filters: GenerateMissionsRequest;
  /** Invoked by the header back button. */
  onBack?: () => void;
  /** Invoked after a quest is accepted (post-confirmation beat), with the
   * full accepted mission — the caller needs more than just the id (e.g.
   * proofRequirement) to hand off to the next screen. */
  onAccept?: (mission: Mission) => void;
}

/**
 * Per-category visual tokens: left stripe, badge fill, badge text. Maps to
 * pre-declared StyleSheet entries (stripe-prefixed / badgeBg-prefixed /
 * badgeText-prefixed keys below) rather than building inline color style
 * objects per render.
 */
const CATEGORY_STYLES = {
  explore: {
    stripeStyleKey: 'stripeExplore',
    bgStyleKey: 'badgeBgExplore',
    textStyleKey: 'badgeTextExplore',
  },
  create: {
    stripeStyleKey: 'stripeCreate',
    bgStyleKey: 'badgeBgCreate',
    textStyleKey: 'badgeTextCreate',
  },
  discover: {
    stripeStyleKey: 'stripeDiscover',
    bgStyleKey: 'badgeBgDiscover',
    textStyleKey: 'badgeTextDiscover',
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
      <View style={[styles.cardStripe, styles[cat.stripeStyleKey]]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={[styles.badge, styles[cat.bgStyleKey]]}>
            <Text style={[styles.badgeText, styles[cat.textStyleKey]]}>
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
    const mission = activeMission;
    setAccepted(true);
    acceptTimer.current = setTimeout(() => {
      onAccept?.(mission);
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
                    styles[CATEGORY_STYLES[activeMission.category].bgStyleKey],
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      styles[CATEGORY_STYLES[activeMission.category].textStyleKey],
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

