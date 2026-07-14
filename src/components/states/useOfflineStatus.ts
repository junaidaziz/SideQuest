import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Subscribes to connectivity and returns `true` while the device is offline.
 * A screen composes this with `OfflineBanner` (`<OfflineBanner visible={useOfflineStatus()} />`).
 * Treats "connected but not yet internet-reachable" as online — only a firmly
 * disconnected state flips the banner, to avoid flapping on transient checks.
 */
export function useOfflineStatus(): boolean {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOffline(state.isConnected === false);
    });
    return () => unsubscribe();
  }, []);

  return offline;
}
