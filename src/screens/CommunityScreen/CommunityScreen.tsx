import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleProp, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useCompassTheme } from '../../hooks/useCompassTheme';
import { Icon } from '../../components/icons';
import { makeStyles } from './CommunityScreen.styles';

/**
 * DATA HONESTY: this is a UI-ONLY preview screen. There is NO community backend
 * in SideQuest — no cross-user visibility endpoint exists at all (confirmed:
 * `backend/src/` has no community/leaderboard module, and `backend/CLAUDE.md`
 * lists no such feature). Every card below is illustrative placeholder content,
 * explicitly framed as a "Preview" so it can never be mistaken for the user's
 * real data. No fabricated number is presented as if it were live. The screen
 * ships to prove the design system covers a community surface; the moment a
 * real endpoint exists it should replace `PREVIEW_DISCOVERIES` with live data.
 */

export interface CommunityScreenProps {
  onBack?: () => void;
  /** Opens the guidelines / reporting surface once that screen is wired. */
  onOpenGuidelines?: () => void;
  /** "Try quest" on a discovery card — routed to quest detail once nav is wired. */
  onOpenQuest?: (questId: string) => void;
}

export function whenPressed(pressed: boolean, style: StyleProp<ViewStyle>): StyleProp<ViewStyle> {
  return pressed ? style : null;
}

export type CommunityTab = 'inspiration' | 'nearby';

interface PreviewDiscovery {
  id: string;
  icon: string;
  title: string;
  meta: string;
  /** Which brand-color pairing tints this card's banner, per the mockup. */
  accent: 'teal' | 'coral';
}

/** Illustrative sample content — NOT live data. See the file-level note. */
export const PREVIEW_DISCOVERIES: PreviewDiscovery[] = [
  { id: 'sunrise', icon: '🌄', title: 'Watch a sunrise somewhere new', meta: 'Outdoors · ~45 min', accent: 'teal' },
  { id: 'postcard', icon: '✍️', title: 'Write a postcard to your future self', meta: 'Reset · ~20 min', accent: 'coral' },
];

export default function CommunityScreen({ onBack, onOpenGuidelines, onOpenQuest }: CommunityScreenProps) {
  const { colors } = useCompassTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [tab, setTab] = useState<CommunityTab>('inspiration');

  const handleTry = useCallback((id: string) => onOpenQuest?.(id), [onOpenQuest]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => onBack?.()}
          accessibilityRole="button"
          accessibilityLabel="Back to explore"
          style={({ pressed }) => [styles.backBtn, whenPressed(pressed, styles.backBtnPressed)]}
        >
          <Icon name="back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          Community
        </Text>
        <Pressable
          onPress={() => onOpenGuidelines?.()}
          accessibilityRole="button"
          accessibilityLabel="Community guidelines and reporting"
          style={({ pressed }) => [styles.iconBtn, whenPressed(pressed, styles.backBtnPressed)]}
        >
          <Text style={styles.iconGlyph}>{'🛡️'}</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.conceptNote} accessibilityRole="text" accessibilityLabel="Preview. Community is a design preview and is not yet connected to live data.">
          <Text style={styles.conceptIcon} accessibilityElementsHidden importantForAccessibility="no">
            {'🧭'}
          </Text>
          <Text style={styles.conceptText}>
            <Text style={styles.conceptStrong}>Preview. </Text>
            Community isn&apos;t connected to live data yet — there&apos;s no cross-user
            backend in SideQuest. Everything below is a sample of the design.
          </Text>
        </View>

        <View style={styles.segmented} accessibilityRole="tablist" accessibilityLabel="Community view">
          <Pressable
            onPress={() => setTab('inspiration')}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === 'inspiration' }}
            accessibilityLabel="Inspiration"
            style={[styles.seg, tab === 'inspiration' && styles.segSelected]}
          >
            <Text style={[styles.segText, tab === 'inspiration' && styles.segTextSelected]}>Inspiration</Text>
          </Pressable>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: false, disabled: true }}
            accessibilityLabel="Nearby, unavailable until approximate location is allowed"
            disabled
            style={[styles.seg, styles.segDisabled]}
          >
            <Text style={styles.segTextDisabled}>Nearby 📍</Text>
          </Pressable>
        </View>
        <Text style={styles.hint}>Nearby appears only after you allow approximate location.</Text>

        <LinearGradient
          colors={[colors.heroGradStart, colors.heroGradEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.curateHero}
          accessible
          accessibilityLabel="Curated this week, sample: Small acts of courage"
        >
          <Text style={styles.curateEyebrow}>Curated this week · sample</Text>
          <Text style={styles.curateTitle}>Small acts of courage</Text>
          <Text style={styles.curateSub}>
            An example of a hand-picked weekly collection the team could feature.
          </Text>
        </LinearGradient>

        <Text style={styles.sectionLabel}>Sample discoveries (preview)</Text>
        {PREVIEW_DISCOVERIES.map((d) => (
          <View key={d.id} style={styles.discCard}>
            <LinearGradient
              colors={
                d.accent === 'teal'
                  ? [colors.communityTint, colors.bgSurface]
                  : [colors.streakTint, colors.bgSurface]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.discBanner}
            >
              <Text style={styles.discBannerIcon} accessibilityElementsHidden importantForAccessibility="no">
                {d.icon}
              </Text>
            </LinearGradient>
            <Text style={styles.discTitle}>{d.title}</Text>
            <Text style={styles.discMeta}>{`Sample quest · ${d.meta}`}</Text>
            <View style={styles.discFoot}>
              <Text style={styles.discSampleTag}>Preview</Text>
              <Pressable
                onPress={() => handleTry(d.id)}
                accessibilityRole="button"
                accessibilityLabel={`Try quest: ${d.title}`}
                style={({ pressed }) => [styles.tryBtn, whenPressed(pressed, styles.tryBtnPressed)]}
              >
                <Text style={styles.tryBtnText}>Try quest</Text>
              </Pressable>
            </View>
          </View>
        ))}

        <Text style={styles.footnote} accessibilityRole="text">
          When a real community backend exists it will be curated and
          privacy-first: no infinite public feed, no precise locations, with
          reporting, blocking, and moderation built in.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
