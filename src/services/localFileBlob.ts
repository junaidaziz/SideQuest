import { File } from 'expo-file-system';

/**
 * Builds a real `Blob` from a local file:// URI for multipart upload —
 * NOT via `expo-file-system`'s `File.slice()`. That hits a confirmed,
 * unresolved upstream bug (expo/expo#40144): its `Blob` construction reads
 * the file into an `ArrayBuffer` and passes that to `new Blob([...])`, which
 * React Native's core `Blob` constructor does not support ("Creating blobs
 * from 'ArrayBuffer' and 'ArrayBufferView' are not supported") — reproduced
 * here on a gallery-picked photo on iOS.
 *
 * `fetch(uri).then(r => r.blob())` sidesteps this: React Native's fetch/XHR
 * blob support is backed directly by the native BlobModule, not by an
 * ArrayBuffer intermediate, so it doesn't hit the same code path. This is
 * the long-established, pre-`expo-file-system`-File-API pattern for
 * uploading a locally picked file in React Native.
 *
 * The fetched blob's `type` isn't reliably set for a local `file://`
 * request, so it's re-sliced with the file's own native-detected MIME type
 * — `Blob.prototype.slice()` on an already-real `Blob` is a different,
 * unaffected code path from the broken `File.slice()` above. Passing the
 * type through explicitly (not defaulting) matches this codebase's existing
 * discipline: an empty MIME type is silently rejected by the backend's
 * `ALLOWED_IMAGE_MIME_TYPES` filter.
 */
export async function localFileToBlob(uri: string): Promise<{ blob: Blob; name: string }> {
  const file = new File(uri);
  const response = await fetch(uri);
  const rawBlob = await response.blob();
  const blob = rawBlob.slice(0, rawBlob.size, file.type);
  return { blob, name: file.name };
}
