import React, { useCallback } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Colors,
  Fonts,
  FontSize,
  LineHeight,
  Radius,
  Spacing,
} from '../constants/design';

/**
 * The lowercase mode keys reported back to the caller. Kept as a union so the
 * navigation layer (once chosen) can switch on them exhaustively.
 */
export type QuestMode =
  | 'solo'
  | 'couple'
  | 'friends'
  | 'family'
  | 'city'
  | 'confidence'
  | 'travel'
  | 'kids';

/**
 * The four flat tints available for a card's thumb, reusing the existing
 * tinted palette rather than inventing new colour tokens (the mockup's
 * per-card `linear-gradient` has no RN StyleSheet equivalent). Keyed to
 * pre-declared StyleSheet entries — see THUMB_STYLES — so no card ever
 * builds an inline `{ backgroundColor }` object on every render.
 */
type ThumbStyleKey = 'thumbPrimary' | 'thumbAccent' | 'thumbSuccess' | 'thumbTeal';

/** A single mode card definition. */
interface ModeDef {
  key: QuestMode;
  emoji: string;
  name: string;
  hint: string;
  /** Read verbatim by assistive tech in place of the emoji + text. */
  accessibilityLabel: string;
  thumbStyleKey: ThumbStyleKey;
}

interface ModeSelectScreenProps {
  /**
   * Fired with the tapped card's lowercase key. The caller decides where to go
   * next once a navigation library is wired up — this screen stays presentational.
   */
  onSelectMode?: (mode: QuestMode) => void;
}

const MODES: readonly ModeDef[] = [
  {
    key: 'solo',
    emoji: '\u{1F9CD}',
    name: 'Solo Adventure',
    hint: 'Independent quests',
    accessibilityLabel: 'Solo Adventure: independent quests for one',
    thumbStyleKey: 'thumbPrimary',
  },
  {
    key: 'couple',
    emoji: '\u{1F491}',
    name: 'Couple Mode',
    hint: 'Designed for two',
    accessibilityLabel: 'Couple Mode: quests designed for two',
    thumbStyleKey: 'thumbAccent',
  },
  {
    key: 'friends',
    emoji: '\u{1F465}',
    name: 'Friends Night',
    hint: 'Social group missions',
    accessibilityLabel: 'Friends Night: social group missions',
    thumbStyleKey: 'thumbSuccess',
  },
  {
    key: 'family',
    emoji: '\u{1F468}‍\u{1F469}‍\u{1F467}',
    name: 'Family Weekend',
    hint: 'Fun for all ages',
    accessibilityLabel: 'Family Weekend: fun for all ages',
    thumbStyleKey: 'thumbTeal',
  },
  {
    key: 'city',
    emoji: '\u{1F3D9}️',
    name: 'Explore My City',
    hint: 'Know your neighbourhood',
    accessibilityLabel: 'Explore My City: discover your neighbourhood',
    thumbStyleKey: 'thumbPrimary',
  },
  {
    key: 'confidence',
    emoji: '\u{1F4AA}',
    name: 'Confidence Builder',
    hint: 'Push your comfort zone',
    accessibilityLabel: 'Confidence Builder: step outside your comfort zone',
    thumbStyleKey: 'thumbSuccess',
  },
  {
    key: 'travel',
    emoji: '✈️',
    name: 'Travel Mode',
    hint: 'For unfamiliar places',
    accessibilityLabel: 'Travel Mode: quests for unfamiliar places',
    thumbStyleKey: 'thumbAccent',
  },
  {
    key: 'kids',
    emoji: '\u{1F9F8}',
    name: 'Kids Mode',
    hint: 'Child-safe adventures',
    accessibilityLabel: 'Kids Mode: child-safe adventures',
    thumbStyleKey: 'thumbTeal',
  },
];

/** Horizontal gap between the two columns. */
const COLUMN_GAP = Spacing.md;
/** Left + right padding around the grid. */
const GRID_PADDING = Spacing.lg;

/**
 * Resolves a card's style for the current press state. Exported so the
 * held-down feedback (the only visual state this screen has) is verifiable
 * without reaching into Pressable's internal pressed-state machinery.
 */
export function cardStyle(pressed: boolean, width: number) {
  return [styles.card, { width }, pressed && styles.cardPressed];
}

export default function ModeSelectScreen({ onSelectMode }: ModeSelectScreenProps) {
  const { width } = useWindowDimensions();
  // Two equal columns: subtract the outer padding and the single inter-column
  // gap, then halve. Computed rather than a fixed percentage so `gap` never
  // pushes the second column past the screen edge on narrow devices.
  const cardWidth = (width - GRID_PADDING * 2 - COLUMN_GAP) / 2;

  const handleSelect = useCallback(
    (mode: QuestMode) => {
      onSelectMode?.(mode);
    },
    [onSelectMode],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Choose a mode</Text>
        <Text accessibilityRole="header" style={styles.title}>
          What kind of quest?
        </Text>
        <Text style={styles.subtitle}>
          Your pick filters the experience from the start
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={styles.grid}
          accessibilityRole="list"
          accessibilityLabel="Quest modes"
        >
          {MODES.map((mode, index) => (
            <Pressable
              key={mode.key}
              onPress={() => handleSelect(mode.key)}
              accessibilityRole="button"
              accessibilityLabel={mode.accessibilityLabel}
              accessibilityValue={{ text: `${index + 1} of ${MODES.length}` }}
              style={({ pressed }) => cardStyle(pressed, cardWidth)}
            >
              <View
                style={[styles.thumb, styles[mode.thumbStyleKey]]}
                importantForAccessibility="no"
                accessibilityElementsHidden
              >
                <Text style={styles.thumbEmoji}>{mode.emoji}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{mode.name}</Text>
                <Text style={styles.hint}>{mode.hint}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    paddingHorizontal: GRID_PADDING,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  eyebrow: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  title: {
    fontFamily: Fonts.displayExtraBold,
    fontSize: FontSize.h1,
    lineHeight: LineHeight.h1,
    color: Colors.ink,
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSize.body,
    lineHeight: LineHeight.body,
    color: Colors.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: GRID_PADDING,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: COLUMN_GAP,
    rowGap: COLUMN_GAP,
  },
  card: {
    borderRadius: Radius.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  cardPressed: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceMuted,
  },
  thumb: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbPrimary: {
    backgroundColor: Colors.primaryLight,
  },
  thumbAccent: {
    backgroundColor: Colors.accentLight,
  },
  thumbSuccess: {
    backgroundColor: Colors.successLight,
  },
  thumbTeal: {
    backgroundColor: Colors.tealLight,
  },
  thumbEmoji: {
    fontSize: 36,
  },
  info: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  name: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.caption,
    lineHeight: LineHeight.caption,
    color: Colors.ink,
    marginBottom: 2,
  },
  hint: {
    fontFamily: Fonts.bodyRegular,
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
