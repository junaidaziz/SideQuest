import { localFileToBlob } from './localFileBlob';

jest.mock('expo-file-system');

function fetchResponse(blob: Blob) {
  return { blob: () => Promise.resolve(blob) } as Response;
}

describe('localFileToBlob', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = jest.fn();
  });

  it('fetches the local URI and returns a real Blob, not via File.slice()', async () => {
    const rawBlob = new Blob(['fake-bytes'], { type: '' });
    (globalThis.fetch as jest.Mock).mockResolvedValue(fetchResponse(rawBlob));

    const { blob, name } = await localFileToBlob('file:///tmp/capture.jpg');

    expect(globalThis.fetch).toHaveBeenCalledWith('file:///tmp/capture.jpg');
    expect(blob).toBeInstanceOf(Blob);
    expect(name).toBe('capture.jpg');
  });

  it("stamps the file's native-detected MIME type onto the blob, regardless of what fetch's Response reports", async () => {
    // The mocked expo-file-system File derives type from the URI extension
    // (image/jpeg for .jpg); the raw fetched blob deliberately carries a
    // different/empty type here to prove the explicit re-slice is what sets
    // the final type, not whatever fetch happened to report.
    const rawBlob = new Blob(['fake-bytes'], { type: '' });
    (globalThis.fetch as jest.Mock).mockResolvedValue(fetchResponse(rawBlob));

    const { blob } = await localFileToBlob('file:///tmp/capture.jpg');

    expect(blob.type).toBe('image/jpeg');
  });

  it('handles a URI with no file extension (empty MIME type) without throwing', async () => {
    const rawBlob = new Blob(['fake-bytes'], { type: '' });
    (globalThis.fetch as jest.Mock).mockResolvedValue(fetchResponse(rawBlob));

    const { blob, name } = await localFileToBlob('file:///tmp/capture');

    expect(blob.type).toBe('');
    expect(name).toBe('capture');
  });

  it('derives the filename from the source URI for a PNG', async () => {
    const rawBlob = new Blob(['fake-bytes'], { type: '' });
    (globalThis.fetch as jest.Mock).mockResolvedValue(fetchResponse(rawBlob));

    const { blob, name } = await localFileToBlob('file:///tmp/capture.png');

    expect(blob.type).toBe('image/png');
    expect(name).toBe('capture.png');
  });

  it('propagates a fetch failure rather than swallowing it', async () => {
    (globalThis.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

    await expect(localFileToBlob('file:///tmp/capture.jpg')).rejects.toThrow('network down');
  });
});
