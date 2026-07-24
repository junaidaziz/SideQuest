import { localFilePart } from './localFilePart';

jest.mock('expo-file-system');

describe('localFilePart', () => {
  it('builds a plain { uri, name, type } object — not a Blob', () => {
    const part = localFilePart('file:///tmp/capture.jpg');

    expect(part).toEqual({
      uri: 'file:///tmp/capture.jpg',
      name: 'capture.jpg',
      type: 'image/jpeg',
    });
    expect(part).not.toBeInstanceOf(Blob);
  });

  it('derives the correct MIME type for a PNG', () => {
    const part = localFilePart('file:///tmp/capture.png');

    expect(part.type).toBe('image/png');
    expect(part.name).toBe('capture.png');
  });

  it('handles a URI with no file extension (empty MIME type) without throwing', () => {
    const part = localFilePart('file:///tmp/capture');

    expect(part.type).toBe('');
    expect(part.name).toBe('capture');
  });

  it('preserves the original URI unchanged', () => {
    const part = localFilePart('file:///var/mobile/tmp/some-asset.jpeg');

    expect(part.uri).toBe('file:///var/mobile/tmp/some-asset.jpeg');
  });
});
