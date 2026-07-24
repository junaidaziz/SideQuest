import { File } from 'expo-file-system';

export interface LocalFilePart {
  uri: string;
  name: string;
  type: string;
}

/**
 * Builds a React Native `FormData` "file part" — a plain
 * `{ uri, name, type }` object — for attaching a locally picked photo to a
 * multipart upload.
 *
 * This is React Native's own, native, documented mechanism for this — see
 * `node_modules/react-native/Libraries/Network/FormData.js`'s
 * `FormDataValue` type and its own canonical usage example in that file's
 * header comment. `FormData.append()`'s native bridge streams the file
 * directly from disk using `uri`; the JS side never materializes the file's
 * bytes at all — no `Blob`, no `ArrayBuffer`.
 *
 * Two earlier versions of this code instead tried to build a real `Blob` —
 * first via `expo-file-system`'s `File.slice()`, then via
 * `fetch(uri).then(r => r.blob())` — based on a since-disproven claim that
 * the plain object shape fails FormData's "instanceof Blob" check under
 * React Native's New Architecture. That claim doesn't hold up: RN's own
 * `FormData.js` (`getParts()`) accepts any object carrying a `uri` — there
 * is no Blob check anywhere in it — and the exact error string that claim
 * cited ("Unsupported FormDataPart implementation") does not exist anywhere
 * in this project's `node_modules`. Both Blob-based attempts independently
 * hit the same real, currently-unresolved React Native core bug instead
 * (`BlobManager.createFromParts` throws "Creating blobs from 'ArrayBuffer'
 * and 'ArrayBufferView' are not supported" — reproduced live, twice, on a
 * gallery-picked photo): `File.slice()` reads the file into an ArrayBuffer
 * internally before wrapping it in a `Blob`, and this RN version's `fetch()`
 * polyfill (`whatwg-fetch`) does the same for a local `file://` response
 * whenever the native XHR layer doesn't hand back an already-native `Blob`.
 * React Native's `Blob` constructor only supports composing from existing
 * `Blob`s or strings, never raw bytes — so any code path that ends in
 * `new Blob([arrayBufferOrTypedArray])` hits this, regardless of which
 * library produced the ArrayBuffer. This plain-object approach avoids
 * Blob/ArrayBuffer entirely, sidestepping the bug rather than working
 * around it.
 */
export function localFilePart(uri: string): LocalFilePart {
  const file = new File(uri);
  return { uri, name: file.name, type: file.type };
}
