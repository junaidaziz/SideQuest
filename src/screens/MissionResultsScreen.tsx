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
import {
  Colors,
  Duration,
  Fonts,
  FontSize,
  LineHeight,
  Radius,
  Spacing,
} from '../constants/design';

/** Quest category — drives stripe colour and badge styling. */
export type MissionCategory = 'explore' | 'create' | 'discover';

/** A single quest returned for the user's active filters. */
export interface Mission {
  id: number;
  category: MissionCategory;
  title: string;
  /** Short teaser shown on the card (2-line clamp in the mockup). */
  desc: string;
  /** Full brief shown inside the detail sheet. */
  full: string;
  /** What the user must submit as proof of completion. */
  proof: string;
  time: string;
  xp: string;
  diff: string;
  /** Filled difficulty dots, 1–3. */
  dots: number;
}

interface MissionResultsScreenProps {
  /** Active filter chips from onboarding. Defaults to the mockup's set. */
  filters?: string[];
  /** Invoked by the header back button. */
  onBack?: () => void;
  /** Invoked after a quest is accepted (post-confirmation beat). */
  onAccept?: (missionId: number) => void;
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

// TODO: replace with API data — three shuffleable sets from mockup 02.
const SETS: Mission[][] = [
  [
    {
      id: 1,
      category: 'explore',
      title: 'Find the Oldest Thing',
      desc: "Locate the oldest object visible from where you're standing. Age wins. Document it.",
      full: "Look around you right now. What's the oldest thing you can see? It could be a building, a tree, a piece of infrastructure, or something someone left behind. The goal is to find it, learn what you can about its age, and document it.",
      proof: 'Photograph the object and add a one-line caption with your best guess at its age.',
      time: '20 min',
      xp: '+40 XP',
      diff: 'Easy',
      dots: 1,
    },
    {
      id: 2,
      category: 'create',
      title: 'The Balancing Act',
      desc: 'Stack 5 natural objects you find into a tower. Photograph it before gravity wins.',
      full: 'Source 5 natural objects — rocks, sticks, leaves, pinecones — from within a 2-minute walk. Stack them into the most stable tower you can manage. No glue. No cheating. Photograph it standing freely.',
      proof: 'Photo of your tower with at least 5 distinct layers clearly visible.',
      time: '15 min',
      xp: '+35 XP',
      diff: 'Easy',
      dots: 1,
    },
    {
      id: 3,
      category: 'discover',
      title: 'Neighborhood Newbie',
      desc: "Walk one block in a direction you've never gone. Find something you've never noticed before.",
      full: "Pick a direction you almost never walk in — even if you've lived here for years. Walk at least one full block. Your mission is to find one thing you genuinely haven't noticed before and document it.",
      proof: 'Photograph your discovery. Caption: what made it surprising.',
      time: '30 min',
      xp: '+50 XP',
      diff: 'Medium',
      dots: 2,
    },
  ],
  [
    {
      id: 4,
      category: 'explore',
      title: 'Window Worlds',
      desc: 'Find a window with an interesting reflection. Capture it from an unusual angle.',
      full: 'Reflections in glass create layered worlds most people walk past. Your mission: find a window that shows something interesting — a doubled scene, an unexpected juxtaposition, or a distorted view — and photograph it from an unconventional angle.',
      proof: 'One photo. The more unexpected the composition, the better.',
      time: '15 min',
      xp: '+45 XP',
      diff: 'Easy',
      dots: 1,
    },
    {
      id: 5,
      category: 'create',
      title: "Nature's Palette",
      desc: 'Collect 5 objects that form a colour gradient from light to dark. Arrange and photograph.',
      full: 'An eye test and a design challenge in one. Find 5 natural objects — petals, stones, bark, leaves, seeds — that form a smooth gradient from your lightest to darkest find. Arrange them in order.',
      proof: 'One flat-lay photo showing all 5 items in clear light-to-dark order.',
      time: '20 min',
      xp: '+40 XP',
      diff: 'Medium',
      dots: 2,
    },
    {
      id: 6,
      category: 'discover',
      title: 'Sound Map',
      desc: 'Stand still for 2 minutes. Log every distinct sound you hear. Screenshot your list.',
      full: "Find a spot outdoors — anywhere will do. Stand still for exactly 2 minutes. With your eyes closed, catalogue every distinct sound: distance, character, source. Then open your phone's notes app and write your list.",
      proof: 'Screenshot of your notes list with at least 6 distinct sounds identified.',
      time: '10 min',
      xp: '+30 XP',
      diff: 'Easy',
      dots: 1,
    },
  ],
  [
    {
      id: 7,
      category: 'explore',
      title: 'Sky Framing',
      desc: "Use a natural or man-made frame to photograph the sky in a way you've never tried.",
      full: "The sky is always there — it's the frame that makes it interesting. Find an opening: a gap in leaves, an alley between buildings, a tunnel entrance. Use it to frame a sky shot that feels deliberate.",
      proof: 'One photo showing the frame clearly as part of the composition.',
      time: '10 min',
      xp: '+35 XP',
      diff: 'Easy',
      dots: 1,
    },
    {
      id: 8,
      category: 'create',
      title: 'Street Typography',
      desc: 'Find 5 different letterforms in your environment. Collect them into one photo.',
      full: 'Letters are everywhere outdoors — on signs, painted roads, etched walls, grates. Find 5 unique letterforms and collect them into a single composite photo. Photograph them on the same surface or collage in your photo editor.',
      proof: 'Composite photo showing 5 distinct environmental letterforms.',
      time: '25 min',
      xp: '+45 XP',
      diff: 'Medium',
      dots: 2,
    },
    {
      id: 9,
      category: 'discover',
      title: 'The Invisible Path',
      desc: 'Follow a route that only turns left. Where do you end up? Document the journey.',
      full: 'Starting from exactly where you are: walk forward, but only ever turn left when you need to change direction. No right turns. No doubling back. Do this for at least 10 minutes. The constraint creates the adventure.',
      proof: 'A screenshot of your maps route AND a photo of where you ended up.',
      time: '30 min',
      xp: '+55 XP',
      diff: 'Hard',
      dots: 3,
    },
  ],
];

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

const DEFAULT_FILTERS = ['🧍 Solo', '⏱ 30 min', '🌿 Outdoors', '🆓 Free'];
const SHUFFLE_MS = 700;
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

/** Shimmer-free skeleton placeholder shown while a shuffle is in flight. */
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

export default function MissionResultsScreen({
  filters = DEFAULT_FILTERS,
  onBack,
  onAccept,
}: MissionResultsScreenProps) {
  const [currentSet, setCurrentSet] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [saved, setSaved] = useState(false);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(1)).current; // 1 = off-screen, 0 = shown
  const shuffleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const acceptTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (shuffleTimer.current) clearTimeout(shuffleTimer.current);
      if (acceptTimer.current) clearTimeout(acceptTimer.current);
    };
  }, []);

  const missions = SETS[currentSet];

  const handleShuffle = useCallback(() => {
    if (isShuffling) return;
    setIsShuffling(true);

    spinAnim.setValue(0);
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: Duration.screen,
      useNativeDriver: true,
    }).start();

    shuffleTimer.current = setTimeout(() => {
      setCurrentSet((prev) => (prev + 1) % SETS.length);
      setIsShuffling(false);
    }, SHUFFLE_MS);
  }, [isShuffling, spinAnim]);

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

  const handleSave = useCallback(() => {
    setSaved((prev) => !prev);
  }, []);

  const handleBack = useCallback(() => {
    // TODO: replace with navigation call once nav library is chosen
    // Expo Router:       router.back()
    // React Navigation:  navigation.goBack()
    onBack?.();
  }, [onBack]);

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
          disabled={isShuffling}
          accessibilityRole="button"
          accessibilityLabel="Shuffle quests"
          accessibilityState={{ disabled: isShuffling, busy: isShuffling }}
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
        {filters.map((filter) => (
          <View key={filter} style={styles.chip}>
            <Text style={styles.chipText}>{filter}</Text>
          </View>
        ))}
      </ScrollView>

      <Text
        style={styles.count}
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${countLabel} matched your filters`}
      >
        <Text style={styles.countStrong}>{countLabel}</Text> matched your filters
      </Text>

      {isShuffling ? (
        <View style={styles.listArea}>
          <SkeletonList />
        </View>
      ) : (
        <FlatList
          data={missions}
          keyExtractor={(item) => String(item.id)}
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
