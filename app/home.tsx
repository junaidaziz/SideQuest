import { router } from 'expo-router';
import { useCallback } from 'react';
import HomeScreen from '../src/screens/HomeScreen';

export default function HomeRoute() {
  const handleStartNewQuest = useCallback(() => {
    // Mode Select, not the full onboarding wizard — Home is only ever seen
    // by a returning user (app/index.tsx sends first launch to onboarding
    // instead), so the faster one-tap path is the right default here.
    router.push('/mode-select');
  }, []);

  const handleSelectDailyMission = useCallback(() => {
    // The daily mission is cosmetic only (per product decision — no gate,
    // no dedicated single-mission lookup endpoint exists to jump straight
    // into an accept/proof flow for just this one mission), so tapping it
    // starts a fresh quest-finding flow rather than a broken deep link.
    router.push('/mode-select');
  }, []);

  return (
    <HomeScreen
      onStartNewQuest={handleStartNewQuest}
      onSelectDailyMission={handleSelectDailyMission}
      // onOpenProfile / onOpenPack intentionally left unwired: no profile
      // or pack-detail screen exists yet. Left as no-ops rather than routed
      // somewhere unrelated.
    />
  );
}
