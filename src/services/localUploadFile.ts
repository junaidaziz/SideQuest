import { File } from 'expo-file-system';

/**
 * Returns a local file (from a `file://` URI, e.g. from expo-image-picker)
 * ready to append directly to a `FormData` for multipart upload — as the
 * raw `File` instance, NOT sliced, NOT wrapped, NOT converted to a `Blob`.
 *
 * This is the third and (root-cause-confirmed) correct attempt at this
 * problem. The full picture, so nobody re-derives it the hard way again:
 *
 * This app's global `fetch` is NOT React Native's `whatwg-fetch` polyfill —
 * Expo SDK 57 installs its own "Winter" fetch runtime
 * (`expo/src/winter/fetch`), which also monkey-patches `FormData.prototype`
 * (`expo/src/winter/FormData.ts`'s `installFormDataPatch`) to add
 * `.entries()`/`.get()`/`.set()`/etc. for React Server Components
 * compatibility. Critically, once that patch installs `FormData.prototype
 * .entries`, Winter's `convertFormDataAsync`
 * (`expo/src/winter/fetch/convertFormData.ts`) uses it directly and never
 * falls back to React Native's own `getParts()`-based part serialization.
 * `convertFormDataAsync` only recognizes an appended value as one of three
 * shapes: a `string`, an actual `instanceof Blob`, or an object with a
 * `.bytes` member (read via `await entry.bytes()`). Anything else throws
 * `Error('Unsupported FormDataPart implementation')` — confirmed by reading
 * this exact source in `node_modules/expo/src/winter/fetch/convertFormData.ts`,
 * and reproduced live: a plain `{ uri, name, type }` object (React Native's
 * own classic convention, and what this file used to build) satisfies
 * *none* of those three shapes, so it always hit this error here.
 *
 * A real `Blob` was tried first, which is why this function doesn't build
 * one: both ways of getting one — `expo-file-system`'s `File.slice()` and
 * `fetch(uri).then(r => r.blob())` — independently hit a *different*, also
 * real bug: React Native's core `Blob` constructor only supports composing
 * from existing Blobs or strings, and throws this project's other familiar
 * error ("Creating blobs from 'ArrayBuffer' and 'ArrayBufferView' are not
 * supported") whenever asked to build one from raw bytes — which is exactly
 * what `File.slice()` and the `fetch` polyfill's `Response.blob()` both do
 * internally.
 *
 * `expo-file-system`'s `File` class sidesteps both problems: it declares
 * `implements Blob` (so no TypeScript cast is needed to `form.append()` it),
 * but does not literally `extend Blob` — so `entry instanceof Blob` is
 * false for it in Winter's converter, and it instead lands on the `.bytes`
 * branch. `File.prototype.bytes()` is a genuine native module method
 * (`node_modules/expo-file-system/src/internal/NativeFileSystem.types.ts`)
 * that reads the file's real bytes from disk directly — no JS-side Blob or
 * ArrayBuffer construction anywhere in this path. `File.prototype.type` is
 * likewise a native-detected MIME type, which Winter's converter reads
 * directly for the part's Content-Type header — no separate type parameter
 * needed at the call site.
 */
export function localUploadFile(uri: string): File {
  return new File(uri);
}
