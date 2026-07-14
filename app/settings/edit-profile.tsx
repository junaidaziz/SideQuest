import { router } from 'expo-router';
import { useCallback } from 'react';
import EditProfileScreen from '../../src/screens/EditProfileScreen';

export default function EditProfileRoute() {
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleSaved = useCallback(() => {
    // Return to the previous surface (You tab or Settings) once the save
    // round-trip completes; the store's updateProfile keeps that surface fresh.
    router.back();
  }, []);

  return <EditProfileScreen onBack={handleBack} onSaved={handleSaved} />;
}
