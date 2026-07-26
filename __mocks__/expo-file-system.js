/**
 * Manual mock for expo-file-system's class-based File/Directory API (the
 * native module can't load under Jest). Mirrors just enough of the real
 * `File` class's URI-derived behavior — `.name` (basename), `.extension`
 * (with leading dot), `.type` (extension-derived MIME guess, standing in for
 * native detection), `.slice(start, end, contentType)`, and `.bytes()` — for
 * code that constructs `new File(uri)` to inspect the picked file without
 * touching the real filesystem.
 *
 * `slice()` deliberately does NOT default a missing `contentType` to
 * anything sensible — it passes whatever it's given straight to `Blob`,
 * exactly like the real implementation (expo-file-system/src/File.ts).
 * An earlier version of this mock hardcoded a non-empty type regardless of
 * arguments, which made it impossible for a test to catch production code
 * that forgets to pass the file's real MIME type through (a real bug this
 * mock previously masked — see proofApi.ts's submitPhotoProof for the fix).
 *
 * `bytes()` mirrors the real `File.prototype.bytes()` — a genuine native
 * module method (`NativeFileSystem.types.ts`'s `bytes(): Promise<Uint8Array>`)
 * that Expo's own "Winter" fetch runtime (`expo/src/winter/fetch/convertFormData.ts`)
 * calls directly when serializing a FormData part whose value isn't a string
 * or a real `Blob` but does have a `.bytes` member — see
 * `localUploadFile.ts` for why appending the raw `File` instance (not
 * `.slice()`'d into a Blob) is what actually works with this app's fetch.
 *
 * `size` is a fixed placeholder (real `File.size` reads the actual on-disk
 * byte count natively) — used by `mediaApi.ts`'s direct-to-S3 upload flow to
 * populate `CreateMediaUploadRequest.fileSize`.
 */
class File {
  constructor(uri) {
    this.uri = uri;
    const basename = uri.split('/').pop() ?? '';
    this.name = basename;
    const extMatch = /\.[^.]+$/.exec(basename);
    this.extension = extMatch ? extMatch[0] : '';
    const ext = this.extension.replace(/^\./, '').toLowerCase();
    this.type =
      ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext ? 'image/jpeg' : '';
    this.size = 12345;
  }

  slice(start, end, contentType) {
    return new Blob([], { type: contentType });
  }

  async bytes() {
    return new Uint8Array([1, 2, 3]);
  }

  bytesSync() {
    return new Uint8Array([1, 2, 3]);
  }
}

class Directory {
  constructor(uri) {
    this.uri = uri;
  }
}

module.exports = { File, Directory };
