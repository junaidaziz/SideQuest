import { router } from 'expo-router';
import { useCallback } from 'react';
import ModeSelectScreen, { type QuestMode } from '../src/screens/ModeSelectScreen';
import type { Crew, GenerateMissionsRequest, Setting } from '../src/types/api';

/** Crew value for each mode that maps to a crew/headcount concept. */
const CREW_BY_MODE: Readonly<Partial<Record<QuestMode, Crew>>> = {
  solo: 'Solo',
  couple: 'Partner',
  friends: 'Friends',
  family: 'Family',
  kids: 'Kids Mode',
} as const;

/** Setting value for each mode that maps to a location concept — currently
 * only "city" has a direct correspondence in the existing filter set. */
const SETTING_BY_MODE: Readonly<Partial<Record<QuestMode, Setting>>> = {
  city: 'City',
} as const;

/**
 * Maps a quick-start mode tap to a full generate-missions request. Only
 * "solo"/"couple"/"friends"/"family"/"kids" (crew) and "city" (setting) have
 * a direct correspondence to an existing filter dimension — "confidence" and
 * "travel" are theme/mood concepts the backend's crew/time/setting/budget
 * filters have no dimension for yet. Rather than inventing an unjustified
 * mapping for those two, every unmapped dimension falls back to the most
 * permissive value ('Solo' crew — matches nearly every seeded mission per
 * backend/prisma/seed.ts; 'Anywhere' setting; 'No limit' budget; '1 hour'
 * time, generous enough for the vast majority of missions), so every mode
 * still returns real, valid results — just without the same personalization
 * the crew/city-mapped modes get.
 */
export function toFiltersFromMode(mode: QuestMode): GenerateMissionsRequest {
  return {
    crew: CREW_BY_MODE[mode] ?? 'Solo',
    time: '1 hour',
    setting: SETTING_BY_MODE[mode] ?? 'Anywhere',
    budget: 'No limit',
  };
}

export default function ModeSelectRoute() {
  const handleSelectMode = useCallback((mode: QuestMode) => {
    const filters = toFiltersFromMode(mode);
    router.push({ pathname: '/mission-results', params: { filters: JSON.stringify(filters) } });
  }, []);

  return <ModeSelectScreen onSelectMode={handleSelectMode} />;
}
