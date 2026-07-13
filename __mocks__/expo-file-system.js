/**
 * Manual mock for expo-file-system's class-based File/Directory API (the
 * native module can't load under Jest). Mirrors just enough of the real
 * `File` class's URI-derived behavior — `.name` (basename), `.extension`
 * (with leading dot), `.type` (extension-derived MIME guess, standing in for
 * native detection), and `.slice(start, end, contentType)` — for code that
 * constructs `new File(uri)` to inspect the picked file without touching the
 * real filesystem.
 *
 * `slice()` deliberately does NOT default a missing `contentType` to
 * anything sensible — it passes whatever it's given straight to `Blob`,
 * exactly like the real implementation (expo-file-system/src/File.ts).
 * An earlier version of this mock hardcoded a non-empty type regardless of
 * arguments, which made it impossible for a test to catch production code
 * that forgets to pass the file's real MIME type through (a real bug this
 * mock previously masked — see proofApi.ts's submitPhotoProof for the fix).
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
  }

  slice(start, end, contentType) {
    return new Blob([], { type: contentType });
  }
}

class Directory {
  constructor(uri) {
    this.uri = uri;
  }
}

module.exports = { File, Directory };
