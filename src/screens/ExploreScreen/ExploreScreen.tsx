import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleProp, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { CompassMotion } from '../../constants/compassDesign';
import { getHome } from '../../services/homeApi';
import type { SavedPack } from '../../types/api';
import { makeStyles } from './ExploreScreen.styles';

type Styles = ReturnType<typeof makeStyles>;

/** Explore "mode" tiles. These map onto the same generic crew/setting filters
 * the shipped ModeSelectScreen already uses — there is no backend "mode" model
 * (see mobileApp/CLAUDE.md product-scope conflicts), so `id` is a client label. */
export interface ExploreMode {
  id: string;
  name: string;
  icon: string;
  colors: [string, string];
}

export const EXPLORE_MODES: ExploreMode[] = [
  { id: 'get-out', name: 'Get out', icon: '\u{1F9ED}', colors: ['#18A999', '#0E8377'] },
  { id: 'make', name: 'Make something', icon: '\u{2702}\u{FE0F}', colors: ['#FF6B5E', '#FF8A5C'] },
  { id: 'connect', name: 'Connect', icon: '\u{1F44B}', colors: ['#6547F5', '#4A2ED6'] },
  { id: 'reset', name: 'Reset', icon: '\u{1F33F}', colors: ['#246BCE', '#1A4E9B'] },
];

/** Curated shelf item. Placeholder content — no discovery/curation endpoint
 * exists yet, so these are static realistic examples, not fabricated API rows. */
export interface ShelfItem {
  id: string;
  title: string;
  time: string;
  xp: string;
  glyph: string;
  art: string;
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
      { id: 'qw-1', title: 'Send a postcard, no reason', time: '10 min', xp: '15 XP', glyph: '\u{1F4EE}', art: 'rgba(24,169,153,0.14)' },
      { id: 'qw-2', title: "Try a drink you can't pronounce", time: '15 min', xp: '15 XP', glyph: '\u{2615}', art: 'rgba(245,184,46,0.16)' },
    ],
  },
  {
    id: 'outside',
    title: 'Outside',
    items: [
      { id: 'o-1', title: 'Street Type Safari', time: '30 min', xp: '20 XP', glyph: '\u{1F524}', art: 'rgba(101,71,245,0.14)' },
      { id: 'o-2', title: 'Green Corner Hunt', time: '40 min', xp: '20 XP', glyph: '\u{1F333}', art: 'rgba(255,107,94,0.14)' },
    ],
  },
];

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
        style={{ flex: 1 }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

function ModeTile({ mode, styles, onPress }: { mode: ExploreMode; styles: Styles; onPress?: (id: string) => void }) {
  return (
    <PressableScale
      accessibilityLabel={`${mode.name} quests`}
      onPress={() => onPress?.(mode.id)}
      style={styles.modeTile}
    >
      <LinearGradient colors={mode.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.modeTileFill}>
        <Text style={styles.modeIcon} accessibilityElementsHidden importantForAccessibility="no">
          {mode.icon}
        </Text>
        <Text style={styles.modeName}>{mode.name}</Text>
      </LinearGradient>
    </PressableScale>
  );
}

function MiniCard({ item, styles, onPress }: { item: ShelfItem; styles: Styles; onPress?: (id: string) => void }) {
  return (
    <PressableScale
      accessibilityLabel={`${item.title}, ${item.time}, ${item.xp}`}
      onPress={() => onPress?.(item.id)}
      style={styles.miniCard}
    >
      <View style={[styles.miniArt, { backgroundColor: item.art }]}>
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
              <Text accessibilityElementsHidden importantForAccessibility="no">{'\u{1F50D}'}</Text>
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
                  <ModeTile key={mode.id} mode={mode} styles={styles} onPress={onSelectMode} />
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
                    <MiniCard key={item.id} item={item} styles={styles} onPress={onOpenQuest} />
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
                <Text style={styles.savedIconGlyph} accessibilityElementsHidden importantForAccessibility="no">
                  {'\u{1F516}'}
                </Text>
              </View>
              <View style={styles.savedBody}>
                <Text style={styles.savedTitle}>Saved for later</Text>
                <Text style={styles.caption}>{savedCountLabel(savedCount)}</Text>
              </View>
              <Text style={styles.chevron} accessibilityElementsHidden importantForAccessibility="no">
                {'›'}
              </Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
