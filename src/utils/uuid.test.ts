import { generateUuid } from './uuid';

const V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('generateUuid', () => {
  const originalCrypto = globalThis.crypto;

  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      configurable: true,
      writable: true,
    });
  });

  function setCrypto(value: unknown): void {
    Object.defineProperty(globalThis, 'crypto', {
      value,
      configurable: true,
      writable: true,
    });
  }

  it('delegates to crypto.randomUUID when available', () => {
    setCrypto({ randomUUID: () => 'fixed-uuid-from-native' });
    expect(generateUuid()).toBe('fixed-uuid-from-native');
  });

  it('builds a valid v4 UUID from getRandomValues when randomUUID is absent', () => {
    setCrypto({
      getRandomValues: (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i += 1) arr[i] = i * 7;
        return arr;
      },
    });
    const id = generateUuid();
    expect(id).toMatch(V4_RE);
  });

  it('falls back to Math.random when no crypto is present', () => {
    setCrypto(undefined);
    const id = generateUuid();
    expect(id).toMatch(V4_RE);
  });

  it('produces distinct ids across calls in the Math.random path', () => {
    setCrypto(undefined);
    const ids = new Set(Array.from({ length: 50 }, () => generateUuid()));
    expect(ids.size).toBe(50);
  });
});
