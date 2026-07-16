import { router } from 'expo-router';
import { useCallback } from 'react';
import SavedQuestsScreen from '../src/screens/SavedQuestsScreen';
import type { SavedMission } from '../src/types/api';

export default function SavedQuestsRoute() {
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleExplore = useCallback(() => {
    router.push('/explore');
  }, []);

  const handleViewDetails = useCallback((mission: SavedMission) => {
    router.push({
      pathname: '/quest/[id]',
      params: { id: mission.id, mission: JSON.stringify(mission) },
    });
  }, []);

  return (
    <SavedQuestsScreen
      onBack={handleBack}
      onExplore={handleExplore}
      onViewDetails={handleViewDetails}
    />
  );
}
