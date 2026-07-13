import { router } from 'expo-router';
import { useCallback } from 'react';
import PaymentMethodsScreen from '../src/screens/PaymentMethodsScreen';

export default function PaymentMethodsRoute() {
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return <PaymentMethodsScreen onBack={handleBack} />;
}
