import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import VerificationDetailScreen, {
  buildTimeline,
  type HistoryEntry,
  type VerificationDetail,
} from './VerificationDetailScreen';

jest.mock('react-native-reanimated', () => {
  const R = require('react');
  const { View, Text, ScrollView } = require('react-native');
  const pass = (Comp: unknown) =>
    R.forwardRef((props: Record<string, unknown>, ref: unknown) => {
      const { entering, exiting, layout, ...rest } = props;
      return R.createElement(Comp, { ...rest, ref });
    });
  const chain = (): unknown =>
    new Proxy(function () {}, { get: () => chain(), apply: () => chain() });
  return {
    __esModule: true,
    default: { View: pass(View), Text: pass(Text), ScrollView: pass(ScrollView), createAnimatedComponent: pass },
    FadeInDown: chain(),
  };
});

const DETAIL: VerificationDetail = {
  missionTitle: 'Street Type Safari',
  submittedAt: 'today · 9:12 AM',
  status: 'pending',
  xpPending: 40,
  proofThumbs: [
    { id: 't1', label: 'A' },
    { id: 't2', label: 'R' },
    { id: 't3', label: 'Q' },
  ],
};

const HISTORY: HistoryEntry[] = [
  { id: 'h1', missionTitle: 'New Drink Dare', when: 'Yesterday', xp: 20, status: 'approved', glyph: '☕' },
  { id: 'h2', missionTitle: 'Postcard, No Reason', when: 'Mon', xp: 15, status: 'rejected', glyph: '📮' },
];

async function renderScreen(overrides: Partial<React.ComponentProps<typeof VerificationDetailScreen>> = {}) {
  const props = {
    detail: DETAIL,
    history: HISTORY,
    onBack: jest.fn(),
    onHelp: jest.fn(),
    onRequestUpdate: jest.fn(),
    onDelete: jest.fn(),
    onResubmit: jest.fn(),
    onRetry: jest.fn(),
    ...overrides,
  };
  const result = await render(<VerificationDetailScreen {...props} />);
  return { ...props, ...result };
}

describe('VerificationDetailScreen', () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => cleanup());

  describe('rendering', () => {
    it('renders the mission, status badge, proof preview, timeline and history', async () => {
      await renderScreen();
      expect(screen.getByRole('header', { name: 'Street Type Safari' })).toBeTruthy();
      expect(screen.getByLabelText('3 submitted proof items')).toBeTruthy();
      expect(screen.getByText('XP on approval')).toBeTruthy();
      expect(screen.getByText('New Drink Dare')).toBeTruthy();
      expect(screen.getByText('Postcard, No Reason')).toBeTruthy();
    });

    it('renders the loading skeleton when isLoading', async () => {
      await renderScreen({ isLoading: true });
      expect(screen.getByLabelText('Loading verification')).toBeTruthy();
    });

    it('renders the empty state when no detail is supplied', async () => {
      await renderScreen({ detail: undefined });
      expect(screen.getByRole('header', { name: 'Nothing to verify yet' })).toBeTruthy();
    });

    it('shows the rejection reason and resubmit link for a rejected proof', async () => {
      await renderScreen({
        detail: { ...DETAIL, status: 'rejected', rejectionReason: 'The photo was too blurry to read.' },
      });
      expect(screen.getByText(/The photo was too blurry to read/)).toBeTruthy();
      expect(screen.getByLabelText('Resubmit proof')).toBeTruthy();
    });

    it('shows the earned XP framing for an approved proof', async () => {
      await renderScreen({ detail: { ...DETAIL, status: 'approved' } });
      expect(screen.getByText('XP earned')).toBeTruthy();
    });

    it('renders without a history section when history is empty (edge case)', async () => {
      await renderScreen({ history: [] });
      expect(screen.queryByText('Earlier')).toBeNull();
    });
  });

  describe('interactions', () => {
    it('calls onBack and onHelp from the top bar', async () => {
      const { onBack, onHelp } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Back to progress'));
      await fireEvent.press(screen.getByLabelText('Help with verification'));
      expect(onBack).toHaveBeenCalledTimes(1);
      expect(onHelp).toHaveBeenCalledTimes(1);
    });

    it('calls onRequestUpdate and onDelete', async () => {
      const { onRequestUpdate, onDelete } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Request review update'));
      await fireEvent.press(screen.getByLabelText('Delete this proof'));
      expect(onRequestUpdate).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('calls onResubmit from the rejection reason', async () => {
      const { onResubmit } = await renderScreen({
        detail: { ...DETAIL, status: 'rejected', rejectionReason: 'Too blurry.' },
      });
      await fireEvent.press(screen.getByLabelText('Resubmit proof'));
      expect(onResubmit).toHaveBeenCalledTimes(1);
    });

    it('calls onRetry from the empty-state button', async () => {
      const { onRetry } = await renderScreen({ detail: undefined });
      await fireEvent.press(screen.getByLabelText('Back to progress from empty state'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('falls back to onBack when the empty-state button has no onRetry', async () => {
      const { onBack } = await renderScreen({ detail: undefined, onRetry: undefined });
      await fireEvent.press(screen.getByLabelText('Back to progress from empty state'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('gives every interactive element a button role and a label', async () => {
      await renderScreen();
      screen.getAllByRole('button').forEach((btn) => {
        expect(btn.props.accessibilityLabel).toBeTruthy();
      });
    });
  });

  describe('buildTimeline', () => {
    it('marks the review node current while pending', () => {
      const steps = buildTimeline('pending');
      expect(steps.map((s) => s.state)).toEqual(['done', 'current', 'upcoming']);
    });

    it('marks the review node rejected when rejected', () => {
      const steps = buildTimeline('rejected');
      expect(steps[1].state).toBe('rejected');
      expect(steps[1].title).toBe('Rejected');
    });

    it('marks all nodes complete when approved', () => {
      const steps = buildTimeline('approved');
      expect(steps.map((s) => s.state)).toEqual(['done', 'done', 'done']);
    });
  });
});
