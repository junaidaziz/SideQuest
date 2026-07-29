import type { RefObject } from 'react';
import { Share, type View } from 'react-native';

/**
 * Captures a view as a PNG and shares it as an image through the OS share sheet,
 * degrading gracefully to a plain text share when image capture or the native
 * share module isn't available.
 *
 * The completion screen's "Share this moment" button previously shared text only.
 * This turns it into a real card-image share while keeping the same copy as the
 * caption / dialog title, and — critically — never leaves the button dead: any
 * failure (the native modules not yet in the build, no view to capture, the user
 * having no share targets) falls back to the original text share.
 *
 * `react-native-view-shot` and `expo-sharing` are required lazily so this module
 * still loads in a build (or a Jest run) that hasn't installed them — the try/catch
 * then routes to the text fallback. See the package.json TODO: they must be added
 * via `npx expo install` before the image path can run on device (a native module
 * change needs a fresh EAS build, not just a Metro reload).
 */
export async function shareCardImage(
  viewRef: RefObject<View | null>,
  message: string,
): Promise<void> {
  try {
    // Lazy, guarded require: these native modules may not be linked into the
    // current build (they need an EAS rebuild — see the module header). The
    // `as typeof import(...)` casts pull the real types from the ambient
    // declarations in `src/types/native-modules.d.ts`, so `captureRef` and
    // `Sharing.shareAsync` are fully typed at the call site below — no `any`.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { captureRef } = require('react-native-view-shot') as typeof import('react-native-view-shot');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sharing = require('expo-sharing') as typeof import('expo-sharing');

    const available = await Sharing.isAvailableAsync();
    if (!available) throw new Error('sharing-unavailable');

    const uri = await captureRef(viewRef, { format: 'png', quality: 0.95 });
    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: message,
      UTI: 'public.png',
    });
  } catch {
    await Share.share({ message }).catch(() => {});
  }
}
