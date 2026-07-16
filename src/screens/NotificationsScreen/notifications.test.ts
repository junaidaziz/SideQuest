import { formatRelativeTime, iconForType } from './notifications';

describe('notifications helpers', () => {
  describe('iconForType', () => {
    it('returns a distinct icon per known type', () => {
      expect(iconForType('task_approved')).toBe('\u{1F389}');
      expect(iconForType('referral_reward_earned')).toBe('\u{1F381}');
      expect(iconForType('account_event')).toBe('\u{1F514}');
    });

    it('falls back to a generic bell for an unrecognized type', () => {
      // Forward-compatible with a type the backend adds before the client
      // updates its icon map.
      expect(iconForType('future_type' as never)).toBe('\u{1F514}');
    });
  });

  describe('formatRelativeTime', () => {
    const now = new Date('2026-07-16T12:00:00.000Z');

    it('shows "Just now" for under a minute', () => {
      expect(formatRelativeTime('2026-07-16T11:59:30.000Z', now)).toBe('Just now');
    });

    it('shows minutes for under an hour', () => {
      expect(formatRelativeTime('2026-07-16T11:45:00.000Z', now)).toBe('15m ago');
    });

    it('shows hours for under a day', () => {
      expect(formatRelativeTime('2026-07-16T09:00:00.000Z', now)).toBe('3h ago');
    });

    it('shows days for under a week', () => {
      expect(formatRelativeTime('2026-07-14T12:00:00.000Z', now)).toBe('2d ago');
    });

    it('falls back to a short date past a week', () => {
      expect(formatRelativeTime('2026-06-01T12:00:00.000Z', now)).toBe('Jun 1');
    });
  });
});
