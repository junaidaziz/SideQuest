/**
 * Ambient module declarations for two native modules the completion-card image
 * share depends on but that are NOT yet installed (they need an EAS rebuild —
 * see the package.json TODO). `shareCard.ts` lazily `require()`s them inside a
 * try/catch and degrades to a text share when they're absent, so the packages
 * ship no `.d.ts` we can rely on at build time. These declarations give the
 * lazy-required values a real type at the call site instead of `any`, without
 * pretending the packages are present at runtime.
 *
 * Keep these in sync with the real package APIs if/when they are installed; at
 * that point the packages' own bundled types take over and this file can be
 * deleted. Excluded from coverage collection (`src/types/**`).
 */
declare module 'react-native-view-shot' {
  import type { RefObject } from 'react';
  import type { View } from 'react-native';

  export interface CaptureOptions {
    format?: 'png' | 'jpg' | 'webm' | 'raw';
    quality?: number;
    width?: number;
    height?: number;
    result?: 'tmpfile' | 'base64' | 'data-uri';
    snapshotContentContainer?: boolean;
  }

  /** Renders a view (by ref, tag, or instance) to a file URI. */
  export function captureRef(
    view: RefObject<View | null> | number | View,
    options?: CaptureOptions,
  ): Promise<string>;
}

declare module 'expo-sharing' {
  export interface SharingOptions {
    mimeType?: string;
    dialogTitle?: string;
    UTI?: string;
  }

  /** Whether the OS share sheet can be presented on this platform. */
  export function isAvailableAsync(): Promise<boolean>;

  /** Presents the OS share sheet for a local file URL. */
  export function shareAsync(url: string, options?: SharingOptions): Promise<void>;
}
