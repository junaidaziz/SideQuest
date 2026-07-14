import React from 'react';
import { OfflineBanner } from '../states/OfflineBanner';
import { useOfflineStatus } from '../states/useOfflineStatus';
import { SyncIndicator } from './SyncIndicator';

/**
 * Global offline chrome mounted once at the app root (M23.1 + M23.5). Composes
 * the persistent `OfflineBanner` (top) with the floating `SyncIndicator`
 * (bottom) so both are visible across every tab and stack route rather than
 * wired per-screen. Rendering the banner as a normal flex child at the top of
 * the root layout is what makes it push content down persistently while
 * offline; the sync indicator positions itself absolutely.
 */
export function OfflineChrome() {
  const offline = useOfflineStatus();
  return (
    <>
      <OfflineBanner visible={offline} testID="offline-banner" />
      <SyncIndicator testID="sync-indicator" />
    </>
  );
}
