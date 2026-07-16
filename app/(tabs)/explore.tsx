import { router } from 'expo-router';
import { useCallback } from 'react';
import ExploreScreen from '../../src/screens/ExploreScreen';
import type { GenerateMissionsRequest } from '../../src/types/api';

/**
 * Explore's mode tiles ("Get out", "Make something", "Connect", "Reset") are
 * mood/theme concepts with no direct correspondence to the backend's
 * crew/time/setting/budget filter dimensions, so — exactly like ModeSelect's
 * unmapped-dimension fallback — every entry point here generates against the
 * most permissive filter set, which returns real, valid missions. This mirrors
 * the retired app/mode-select.tsx `toFiltersFromMode` fallback values.
 */
const DEFAULT_QUEST_FILTERS: GenerateMissionsRequest = {
  crew: 'Solo',
  time: '1 hour',
  setting: 'Anywhere',
  budget: 'No limit',
};

function pushQuestResults(filters: GenerateMissionsRequest) {
  router.push({ pathname: '/quest-results', params: { filters: JSON.stringify(filters) } });
}

/**
 * Explore tab — the quest-finding surface that supersedes the old
 * ModeSelectScreen (its mode-tile UI lives inside ExploreScreen now).
 */
export default function ExploreTab() {
  const handleSearch = useCallback(() => {
    pushQuestResults(DEFAULT_QUEST_FILTERS);
  }, []);

  const handleSelectMode = useCallback((_modeId: string) => {
    pushQuestResults(DEFAULT_QUEST_FILTERS);
  }, []);

  const handleSeeAll = useCallback((_shelfId: string) => {
    pushQuestResults(DEFAULT_QUEST_FILTERS);
  }, []);

  const handleOpenQuest = useCallback((questId: string) => {
    // Shelf items are curated placeholders with no backing Mission object and
    // no single-mission GET endpoint, so we open the detail by id only —
    // QuestDetailScreen renders its "unavailable" state when it can't resolve
    // a mission, which is the correct behavior for a placeholder card.
    router.push({ pathname: '/quest/[id]', params: { id: questId } });
  }, []);

  const handleOpenSaved = useCallback(() => {
    router.push('/saved-quests');
  }, []);

  return (
    <ExploreScreen
      onSearch={handleSearch}
      onSelectMode={handleSelectMode}
      onSeeAll={handleSeeAll}
      onOpenQuest={handleOpenQuest}
      onOpenSaved={handleOpenSaved}
      // onEditContext intentionally left unwired: there is no context-editor
      // screen in this migration. Documented no-op rather than routed
      // somewhere unrelated.
    />
  );
}
