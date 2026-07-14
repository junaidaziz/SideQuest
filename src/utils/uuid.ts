/**
 * RFC-4122 v4 UUID generator used for offline-queue item ids, which double as
 * the `Idempotency-Key` sent to the backend on replay (M23.4). Prefers the
 * platform crypto RNG when present (Hermes exposes `crypto.getRandomValues` on
 * newer Expo SDKs); falls back to `Math.random` otherwise. Collision resistance
 * here only needs to hold within a single device's short queue, so the fallback
 * is acceptable — the key's job is deduping *this* device's own retries, not
 * being globally unique across the fleet.
 */
export function generateUuid(): string {
  const cryptoRef: Crypto | undefined = (globalThis as { crypto?: Crypto }).crypto;

  if (cryptoRef?.randomUUID) {
    return cryptoRef.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (cryptoRef?.getRandomValues) {
    cryptoRef.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // Per RFC 4122 §4.4: set the version (4) and variant (10xx) bits.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex: string[] = [];
  for (let i = 0; i < 256; i += 1) {
    hex.push((i + 0x100).toString(16).slice(1));
  }
  const b = bytes;
  return (
    `${hex[b[0]]}${hex[b[1]]}${hex[b[2]]}${hex[b[3]]}-` +
    `${hex[b[4]]}${hex[b[5]]}-` +
    `${hex[b[6]]}${hex[b[7]]}-` +
    `${hex[b[8]]}${hex[b[9]]}-` +
    `${hex[b[10]]}${hex[b[11]]}${hex[b[12]]}${hex[b[13]]}${hex[b[14]]}${hex[b[15]]}`
  );
}
