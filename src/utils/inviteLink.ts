/**
 * Challenge-invite deep-link parsing.
 *
 * The backend mints exactly one invite URL shape (`tasks.service.ts`,
 * `INVITE_URL_PREFIX`): a custom-scheme deep link `sidequest://tasks/invite/<token>`.
 * The token is an opaque, URL-safe `base64url` string (`randomBytes(24)`), so it
 * only ever contains `[A-Za-z0-9_-]`. We keep this parser deliberately tolerant of
 * the incidental variants a real URL can arrive in (a trailing slash, a query
 * string, an `https://` App-Links host if one is ever configured) but strict about
 * the path shape, so an unrelated deep link never resolves to a bogus token.
 */

/** The custom scheme + host + path the backend embeds in every invite link. */
const INVITE_PATH_SEGMENT = 'tasks/invite/';

/** URL-safe base64url alphabet — the only characters a real token can contain. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]+$/;

/**
 * Extracts the invite token from a full deep-link URL, or `null` when the URL is
 * not a challenge invite. Accepts both the custom-scheme form the backend emits
 * (`sidequest://tasks/invite/<token>`) and an `https://<host>/tasks/invite/<token>`
 * App-Links form, since either could be registered as an Android intent filter.
 */
export function parseInviteToken(url: string | null | undefined): string | null {
  if (!url) return null;

  // Strip the scheme+authority so both `sidequest://tasks/invite/x` and
  // `https://host/tasks/invite/x` reduce to the same `tasks/invite/x` tail. A
  // custom scheme has no `//` authority slashes in the RFC sense but Expo emits
  // them, so split on the first `://` and treat the remainder as the path body.
  const afterScheme = url.includes('://') ? url.slice(url.indexOf('://') + 3) : url;

  const idx = afterScheme.indexOf(INVITE_PATH_SEGMENT);
  if (idx === -1) return null;

  // Everything after `tasks/invite/`, trimmed of a trailing slash and any
  // `?query`/`#fragment` the OS may append.
  let token = afterScheme.slice(idx + INVITE_PATH_SEGMENT.length);
  token = token.split(/[?#/]/)[0];

  return token.length > 0 && TOKEN_PATTERN.test(token) ? token : null;
}
