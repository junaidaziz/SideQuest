import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import CommunityScreen, { PREVIEW_DISCOVERIES, whenPressed } from './CommunityScreen';

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: View };
});

async function renderScreen(overrides: Partial<React.ComponentProps<typeof CommunityScreen>> = {}) {
  const onBack = jest.fn();
  const onOpenGuidelines = jest.fn();
  const onOpenQuest = jest.fn();
  const utils = await render(
    <CommunityScreen
      onBack={onBack}
      onOpenGuidelines={onOpenGuidelines}
      onOpenQuest={onOpenQuest}
      {...overrides}
    />,
  );
  return { ...utils, onBack, onOpenGuidelines, onOpenQuest };
}

describe('CommunityScreen', () => {
  afterEach(cleanup);

  describe('rendering', () => {
    it('renders the preview honesty banner', async () => {
      await renderScreen();
      expect(screen.getByLabelText(/Community is a design preview/)).toBeTruthy();
    });

    it('renders every sample discovery framed as preview', async () => {
      await renderScreen();
      PREVIEW_DISCOVERIES.forEach((d) => {
        expect(screen.getByLabelText(`Try quest: ${d.title}`)).toBeTruthy();
      });
      expect(screen.getAllByText('Preview').length).toBeGreaterThanOrEqual(PREVIEW_DISCOVERIES.length);
    });

    it('marks the Nearby tab disabled', async () => {
      await renderScreen();
      const nearby = screen.getByLabelText(/Nearby, unavailable until approximate location/);
      expect(nearby.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('interactions', () => {
    it('selects the Inspiration tab', async () => {
      await renderScreen();
      fireEvent.press(screen.getByLabelText('Inspiration'));
      expect(screen.getByLabelText('Inspiration').props.accessibilityState.selected).toBe(true);
    });

    it('fires onOpenQuest with the discovery id', async () => {
      const { onOpenQuest } = await renderScreen();
      fireEvent.press(screen.getByLabelText(`Try quest: ${PREVIEW_DISCOVERIES[0].title}`));
      expect(onOpenQuest).toHaveBeenCalledWith(PREVIEW_DISCOVERIES[0].id);
    });

    it('fires onOpenGuidelines and onBack', async () => {
      const { onOpenGuidelines, onBack } = await renderScreen();
      fireEvent.press(screen.getByLabelText('Community guidelines and reporting'));
      fireEvent.press(screen.getByLabelText('Back to explore'));
      expect(onOpenGuidelines).toHaveBeenCalledTimes(1);
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('gives every button and tab a label', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Back to explore')).toBeTruthy());
      [...screen.getAllByRole('button'), ...screen.getAllByRole('tab')].forEach((b) => {
        expect(b.props.accessibilityLabel).toBeTruthy();
      });
    });

    it('whenPressed returns style only when pressed', () => {
      const s = { opacity: 0.5 };
      expect(whenPressed(true, s)).toBe(s);
      expect(whenPressed(false, s)).toBeNull();
    });
  });
});
