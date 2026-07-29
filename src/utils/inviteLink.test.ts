import { parseInviteToken } from './inviteLink';

describe('parseInviteToken', () => {
  it('extracts the token from the backend custom-scheme deep link', () => {
    expect(parseInviteToken('sidequest://tasks/invite/abc123')).toBe('abc123');
  });

  it('accepts a base64url token with - and _ characters', () => {
    expect(parseInviteToken('sidequest://tasks/invite/aB-9_zQ')).toBe('aB-9_zQ');
  });

  it('extracts the token from an https App-Links form', () => {
    expect(parseInviteToken('https://sidequest.app/tasks/invite/xyz789')).toBe('xyz789');
  });

  it('trims a trailing slash', () => {
    expect(parseInviteToken('sidequest://tasks/invite/tok/')).toBe('tok');
  });

  it('strips a query string', () => {
    expect(parseInviteToken('sidequest://tasks/invite/tok?ref=sms')).toBe('tok');
  });

  it('strips a fragment', () => {
    expect(parseInviteToken('sidequest://tasks/invite/tok#top')).toBe('tok');
  });

  it('returns null for a non-invite deep link', () => {
    expect(parseInviteToken('sidequest://referrals/invite/CODE1')).toBeNull();
    expect(parseInviteToken('sidequest://tasks/other/tok')).toBeNull();
    expect(parseInviteToken('sidequest://today')).toBeNull();
  });

  it('returns null when the token segment is empty', () => {
    expect(parseInviteToken('sidequest://tasks/invite/')).toBeNull();
    expect(parseInviteToken('sidequest://tasks/invite/?x=1')).toBeNull();
  });

  it('returns null for null, undefined, and empty input', () => {
    expect(parseInviteToken(null)).toBeNull();
    expect(parseInviteToken(undefined)).toBeNull();
    expect(parseInviteToken('')).toBeNull();
  });

  it('returns null for a token containing illegal characters', () => {
    // A path segment that decodes to spaces/dots isn't a real base64url token.
    expect(parseInviteToken('sidequest://tasks/invite/has space')).toBeNull();
    expect(parseInviteToken('sidequest://tasks/invite/a.b')).toBeNull();
  });
});
