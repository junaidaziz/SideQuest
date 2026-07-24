import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleProp, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { CompassMotion, type CompassPalette } from '../../constants/compassDesign';
import { Icon } from '../../components/icons';
import { getHome } from '../../services/homeApi';
import type { SavedPack } from '../../types/api';
import { exploreStatics, makeStyles } from './ExploreScreen.styles';

type Styles = ReturnType<typeof makeStyles>;

/** One of the four Halcyon+ gamification identities (design § 2.3). Category
 * surfaces rotate through these tints to teach the palette, rather than each
 * carrying its own hardcoded hex gradient. */
export type ModeIdentity = 'community' | 'streak' | 'achievement' | 'xp';

/** Explore "mode" tiles. These map onto the same generic crew/setting filters
 * the shipped ModeSelectScreen already uses — there is no backend "mode" model
 * (see mobileApp/CLAUDE.md product-scope conflicts), so `id` is a client label.
 * `identity` selects an identity tint resolved from the live theme at render. */
export interface ExploreMode {
  id: string;
  name: string;
  icon: string;
  identity: ModeIdentity;
}

export const EXPLORE_MODES: ExploreMode[] = [
  { id: 'get-out', name: 'Get out', icon: '\u{1F9ED}', identity: 'community' },
  { id: 'make', name: 'Make something', icon: '\u{2702}\u{FE0F}', identity: 'streak' },
  { id: 'connect', name: 'Connect', icon: '\u{1F44B}', identity: 'achievement' },
  { id: 'reset', name: 'Reset', icon: '\u{1F33F}', identity: 'xp' },
];

/** Curated shelf item. Placeholder content — no discovery/curation endpoint
 * exists yet, so these are static realistic examples, not fabricated API rows. */
export interface ShelfItem {
  id: string;
  title: string;
  time: string;
  xp: string;
  glyph: string;
  identity: ModeIdentity;
}

export interface ExploreShelf {
  id: string;
  title: string;
  items: ShelfItem[];
}

export const EXPLORE_SHELVES: ExploreShelf[] = [
  {
    id: 'quick-wins',
    title: 'Quick wins',
    items: [
      { id: 'qw-1', title: 'Send a postcard, no reason', time: '10 min', xp: '15 XP', glyph: '\u{1F4EE}', identity: 'community' },
      { id: 'qw-2', title: "Try a drink you can't pronounce", time: '15 min', xp: '15 XP', glyph: '\u{2615}', identity: 'xp' },
    ],
  },
  {
    id: 'outside',
    title: 'Outside',
    items: [
      { id: 'o-1', title: 'Street Type Safari', time: '30 min', xp: '20 XP', glyph: '\u{1F524}', identity: 'achievement' },
      { id: 'o-2', title: 'Green Corner Hunt', time: '40 min', xp: '20 XP', glyph: '\u{1F333}', identity: 'streak' },
    ],
  },
];

/** Resolve an identity's soft tint + AA-safe text colour from the live theme. */
function identityTint(colors: CompassPalette, identity: ModeIdentity): { tint: string; text: string } {
  return { tint: colors[`${identity}Tint`], text: colors[`${identity}Text`] };
}

interface ExploreScreenProps {
  onSearch?: () => void;
  onEditContext?: () => void;
  onSelectMode?: (modeId: string) => void;
  onSeeAll?: (shelfId: string) => void;
  onOpenQuest?: (questId: string) => void;
  onOpenSaved?: () => void;
  /** Placeholder "for this moment" context summary until context is persisted. */
  contextSummary?: string;
}

/** Total saved quests across every saved pack, for the "Saved for later" row. */
export function countSavedQuests(packs: SavedPack[]): number {
  return packs.reduce((sum, p) => sum + p.missionCount, 0);
}

/** "1 quest you bookmarked" vs "6 quests you bookmarked". */
export function savedCountLabel(count: number): string {
  return `${count} quest${count === 1 ? '' : 's'} you bookmarked`;
}

function whenPressed(pressed: boolean, style: StyleProp<ViewStyle>): StyleProp<ViewStyle> {
  return pressed ? style : null;
}

/** Press-scale wrapper reused by every tappable tile/card on this screen. */
function PressableScale({
  onPress,
  accessibilityLabel,
  style,
  children,
}: {
  onPress?: () => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability -- reanimated shared values are intentionally mutable
    scale.value = withSpring(0.97, { damping: 18, stiffness: 320 });
  }, [scale]);
  const onPressOut = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability -- reanimated shared values are intentionally mutable
    scale.value = withSpring(1, { damping: 18, stiffness: 320 });
  }, [scale]);
  // `style` (grid sizing/background) lives on this outer Animated.View, since
  // it's the actual flex-item inside the caller's grid/row — putting it on
  // the inner Pressable instead left this wrapper unsized, which breaks any
  // percentage-width caller (see ModeTile).
  return (
    <Animated.View style={[style, animStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={exploreStatics.pressableInner}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

function ModeTile({
  mode,
  styles,
  colors,
  onPress,
}: {
  mode: ExploreMode;
  styles: Styles;
  colors: CompassPalette;
  onPress?: (id: string) => void;
}) {
  const { tint, text } = identityTint(colors, mode.identity);
  return (
    <PressableScale
      accessibilityLabel={`${mode.name} quests`}
      onPress={() => onPress?.(mode.id)}
      style={styles.modeTile}
    >
      <View style={[styles.modeTileFill, { backgroundColor: tint }]}>
        <Text style={styles.modeIcon} accessibilityElementsHidden importantForAccessibility="no">
          {mode.icon}
        </Text>
        <Text style={[styles.modeName, { color: text }]}>{mode.name}</Text>
      </View>
    </PressableScale>
  );
}

function MiniCard({
  item,
  styles,
  colors,
  onPress,
}: {
  item: ShelfItem;
  styles: Styles;
  colors: CompassPalette;
  onPress?: (id: string) => void;
}) {
  return (
    <PressableScale
      accessibilityLabel={`${item.title}, ${item.time}, ${item.xp}`}
      onPress={() => onPress?.(item.id)}
      style={styles.miniCard}
    >
      <View style={[styles.miniArt, { backgroundColor: identityTint(colors, item.identity).tint }]}>
        <Text style={styles.miniArtGlyph} accessibilityElementsHidden importantForAccessibility="no">
          {item.glyph}
        </Text>
      </View>
      <View style={styles.miniBody}>
        <Text style={styles.miniTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.miniMeta}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{item.time}</Text>
          </View>
          <View style={styles.xpBadge}>
            <Text style={styles.xpBadgeText}>{item.xp}</Text>
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

export default function ExploreScreen({
  onSearch,
  onEditContext,
  onSelectMode,
  onSeeAll,
  onOpenQuest,
  onOpenSaved,
  contextSummary = 'Get out · 30 min · nearby · free',
}: ExploreScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const homeQuery = useQuery({ queryKey: ['home'], queryFn: getHome });
  const { data, isLoading, isError } = homeQuery;
  const savedCount = data ? countSavedQuests(data.savedPacks) : 0;

  const handleRetry = useCallback(() => {
    homeQuery.refetch();
  }, [homeQuery]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Text accessibilityRole="header" style={styles.title}>
          Explore
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.stateArea}>
          <View style={styles.skeletonWrap} accessibilityRole="progressbar" accessibilityLabel="Loading Explore">
            <View style={[styles.skel, styles.skelSearch]} />
            <View style={[styles.skel, styles.skelGrid]} />
            <View style={[styles.skel, styles.skelRow]} />
          </View>
        </View>
      ) : isError || !data ? (
        <View style={styles.stateArea}>
          <Text accessibilityRole="header" style={styles.stateTitle}>
            {"Couldn't load Explore"}
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
      ) : (
        <Animated.View style={styles.scroll} entering={FadeInDown.duration(CompassMotion.durationStandard)}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Pressable
              onPress={onSearch}
              accessibilityRole="button"
              accessibilityLabel="Search quests, places and people"
              style={styles.search}
            >
              <Icon name="search" size={18} color={colors.textTertiary} />
              <Text style={styles.searchText}>Search quests, places, people…</Text>
            </Pressable>

            <View style={styles.ctxSummary}>
              <Text style={styles.ctxText}>
                For this moment: <Text style={styles.ctxBold}>{contextSummary}</Text>
              </Text>
              <Pressable
                onPress={onEditContext}
                accessibilityRole="button"
                accessibilityLabel="Edit your moment"
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              >
                <Text style={styles.link}>Edit</Text>
              </Pressable>
            </View>

            <View>
              <View style={styles.sectionHead}>
                <Text style={styles.h3}>What are you in the mood for?</Text>
              </View>
              <View style={styles.modeGrid}>
                {EXPLORE_MODES.map((mode) => (
                  <ModeTile key={mode.id} mode={mode} styles={styles} colors={colors} onPress={onSelectMode} />
                ))}
              </View>
            </View>

            {EXPLORE_SHELVES.map((shelf) => (
              <View key={shelf.id}>
                <View style={styles.sectionHead}>
                  <Text style={styles.h3}>{shelf.title}</Text>
                  <Pressable
                    onPress={() => onSeeAll?.(shelf.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`See all ${shelf.title} quests`}
                  >
                    <Text style={styles.link}>See all</Text>
                  </Pressable>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.hScroll}
                >
                  {shelf.items.map((item) => (
                    <MiniCard key={item.id} item={item} styles={styles} colors={colors} onPress={onOpenQuest} />
                  ))}
                </ScrollView>
              </View>
            ))}

            <Pressable
              onPress={onOpenSaved}
              accessibilityRole="button"
              accessibilityLabel={`Open your saved quests, ${savedCount} saved`}
              style={styles.savedLink}
            >
              <View style={styles.savedIcon}>
                <Icon name="bookmark" size={20} color={colors.actionPrimary} />
              </View>
              <View style={styles.savedBody}>
                <Text style={styles.savedTitle}>Saved for later</Text>
                <Text style={styles.caption}>{savedCountLabel(savedCount)}</Text>
              </View>
              <Icon name="chevronRight" size={18} color={colors.actionPrimary} />
            </Pressable>
          </ScrollView>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
