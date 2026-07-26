import { File } from 'expo-file-system';
import { apiRequest } from './apiClient';
import type { MediaVariant, UserProfile } from '../types/api';

/** Mirrors the backend's `MediaPurpose` enum (`prisma/schema.prisma`). */
export type MediaPurpose = 'AVATAR' | 'PROOF' | 'TASK_ATTACHMENT';

/** Mirrors the backend's `MediaStatus` enum. */
export type MediaStatus = 'PENDING_UPLOAD' | 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';

export interface CreateMediaUploadRequest {
  purpose: MediaPurpose;
  fileName: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  relatedEntityId?: string;
}

export interface CreateMediaUploadResponse {
  mediaId: string;
  uploadUrl: string;
  objectKey: string;
  requiredHeaders?: Record<string, string>;
  expiresAt: string;
}

export interface MediaAssetResponse {
  id: string;
  purpose: MediaPurpose;
  status: MediaStatus;
  variants: MediaVariant[];
  createdAt: string;
}

/** Step 1 of the direct-to-S3 flow — see `mediaApi`'s module doc for the full sequence. */
export function createMediaUpload(
  request: CreateMediaUploadRequest,
): Promise<CreateMediaUploadResponse> {
  return apiRequest<CreateMediaUploadResponse>('/media/uploads', { method: 'POST', body: request });
}

/**
 * Step 2: PUTs the file's raw bytes directly to S3/CloudFront — NOT via
 * `apiRequest` (this never touches the SideQuest backend; no base URL
 * prefix, no auth header, no JSON body). Throws with the presigned URL's own
 * error response text on a non-2xx status, since that's a storage-provider
 * error, not one of this app's own `ApiError` shapes.
 *
 * `additionalHeaders` (from `CreateMediaUploadResponse.requiredHeaders`)
 * must be merged in on top of `Content-Type` — today the backend only ever
 * populates that one header, so this is a no-op in practice, but a
 * presigned URL's signature can bind other headers too (e.g. a checksum or
 * SSE header), and silently dropping any of those would turn into an opaque
 * `SignatureDoesNotMatch` the moment the backend starts sending one.
 */
export async function putFileToPresignedUrl(
  uploadUrl: string,
  bytes: Uint8Array,
  contentType: string,
  additionalHeaders?: Record<string, string>,
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { ...additionalHeaders, 'Content-Type': contentType },
    body: new Uint8Array(bytes),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Upload to storage failed (${response.status}): ${detail || 'no detail'}`);
  }
}

/** Step 3: confirms the upload landed — the backend re-verifies it via a real HeadObject call. */
export function confirmMediaUpload(mediaId: string): Promise<MediaAssetResponse> {
  return apiRequest<MediaAssetResponse>(`/media/uploads/${mediaId}/complete`, { method: 'POST' });
}

export function getMediaAsset(mediaId: string): Promise<MediaAssetResponse> {
  return apiRequest<MediaAssetResponse>(`/media/${mediaId}`);
}

export function deleteMediaAsset(mediaId: string): Promise<void> {
  return apiRequest<void>(`/media/${mediaId}`, { method: 'DELETE' });
}

/** Points the caller's avatar at an already-`READY` `AVATAR`-purpose media asset. */
export function setAvatarFromMedia(mediaId: string): Promise<UserProfile> {
  return apiRequest<UserProfile>('/users/me/avatar/media', { method: 'POST', body: { mediaId } });
}

const POLL_INTERVAL_MS = 700;
const POLL_TIMEOUT_MS = 20_000;

/**
 * Step 4: variant generation runs as a background job on the backend
 * (BullMQ), so the asset is almost never `READY` the instant `confirmUpload`
 * returns — poll until it is (or fails, or this gives up). A `FAILED` status
 * or a timeout both throw, since neither leaves anything the caller can do
 * with the media id.
 */
export async function waitForMediaReady(
  mediaId: string,
  { intervalMs = POLL_INTERVAL_MS, timeoutMs = POLL_TIMEOUT_MS } = {},
): Promise<MediaAssetResponse> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const asset = await getMediaAsset(mediaId);
    if (asset.status === 'READY') return asset;
    if (asset.status === 'FAILED') {
      throw new Error('Image processing failed. Please try a different photo.');
    }
    if (Date.now() >= deadline) {
      throw new Error('Image processing is taking longer than expected. Please try again.');
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

/**
 * The full direct-to-S3 avatar upload flow, replacing the legacy
 * Multer-mediated `POST /users/me/avatar` for new uploads (see
 * `avatarApi.ts` — kept for backward compatibility, not called by any
 * screen anymore). Reads the file's real size/MIME type from disk via
 * `expo-file-system`'s `File` (the same class `localUploadFile.ts` uses for
 * the legacy path, for the same reason: it's the one reliable source of
 * truth for a local picker URI's actual bytes/type on this platform) rather
 * than trusting whatever `expo-image-picker`'s result asset happened to
 * report, which is inconsistently populated across platforms.
 */
export async function uploadAvatarViaMediaPipeline(photoUri: string): Promise<UserProfile> {
  const file = new File(photoUri);
  const mimeType = file.type;
  if (!mimeType) {
    throw new Error('Could not determine the photo\'s file type.');
  }

  const authorization = await createMediaUpload({
    purpose: 'AVATAR',
    fileName: file.name,
    mimeType,
    fileSize: file.size,
  });

  const bytes = await file.bytes();
  await putFileToPresignedUrl(
    authorization.uploadUrl,
    bytes,
    mimeType,
    authorization.requiredHeaders,
  );
  await confirmMediaUpload(authorization.mediaId);
  await waitForMediaReady(authorization.mediaId);
  return setAvatarFromMedia(authorization.mediaId);
}
