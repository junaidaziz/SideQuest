import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import PaymentMethodsScreen from '../src/screens/PaymentMethodsScreen';
import { useAuthStore } from '../src/store/authStore';

export default function PaymentMethodsRoute() {
  // Primary checkpoint: a guest reaching this route (deep link, manual
  // navigation) is redirected before the screen ever mounts, rather than
  // relying solely on ProfileScreen's entry point being hidden. `?? true`
  // treats "no user yet" (still hydrating) as guest-like so nothing flashes
  // before hydrate() resolves.
  const isGuest = useAuthStore((s) => s.user?.isGuest ?? true);

  useEffect(() => {
    if (isGuest) {
      router.replace('/home');
    }
  }, [isGuest]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  if (isGuest) {
    return null;
  }

  return <PaymentMethodsScreen onBack={handleBack} />;
}
