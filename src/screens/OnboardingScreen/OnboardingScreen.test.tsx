import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import OnboardingScreen, { type OnboardingSelections } from './OnboardingScreen';

/**
 * NOTE: @testing-library/react-native v14 (React 19 concurrent renderer) makes
 * `render` and `fireEvent` async — every call is awaited. Inactive carousel
 * steps are hidden from accessibility, so the default queries only ever see the
 * step currently on screen; that is what makes the navigation assertions real.
 */

const STEP_CTA = [
  'Next: continue to step 2',
  'Next: continue to step 3',
  'Next: continue to step 4',
  'Find my missions',
] as const;

async function advance(optionLabel: string, ctaLabel: string): Promise<void> {
  // Await the selection so `handleNext` reads the committed `selections` state
  // before it decides whether to advance (RTL v14 fireEvent is async).
  await fireEvent.press(screen.getByLabelText(optionLabel));
  await fireEvent.press(screen.getByLabelText(ctaLabel));
}

describe('OnboardingScreen', () => {
  describe('rendering', () => {
    it('renders the first step heading, subtitle and progress on mount', async () => {
      await render(<OnboardingScreen />);
      expect(screen.getByText('Who are you going with?')).toBeTruthy();
      expect(screen.getByText('Pick your crew for today')).toBeTruthy();
      expect(screen.getByText('1 of 4')).toBeTruthy();
    });

    it('renders every option for the first step', async () => {
      await render(<OnboardingScreen />);
      ['Solo', 'Partner', 'Friends', 'Family', 'Kids Mode'].forEach((label) => {
        expect(screen.getByLabelText(label)).toBeTruthy();
      });
    });

    it('keeps later steps hidden from accessibility until reached', async () => {
      await render(<OnboardingScreen />);
      expect(screen.queryByText('How much time do you have?')).toBeNull();
      expect(screen.queryByText('2 of 4')).toBeNull();
    });

    it('does not show the loading overlay before completion', async () => {
      await render(<OnboardingScreen />);
      expect(screen.queryByLabelText('Finding your missions')).toBeNull();
    });
  });

  describe('interactions', () => {
    it('marks an option as checked when selected', async () => {
      await render(<OnboardingScreen />);
      expect(screen.getByLabelText('Solo').props.accessibilityState.checked).toBe(false);
      await fireEvent.press(screen.getByLabelText('Solo'));
      expect(screen.getByLabelText('Solo').props.accessibilityState.checked).toBe(true);
    });

    it('keeps the Next button disabled until a selection is made', async () => {
      await render(<OnboardingScreen />);
      expect(
        screen.getByLabelText(STEP_CTA[0]).props.accessibilityState.disabled,
      ).toBe(true);
      await fireEvent.press(screen.getByLabelText('Partner'));
      expect(
        screen.getByLabelText(STEP_CTA[0]).props.accessibilityState.disabled,
      ).toBe(false);
    });

    it('replaces the previous selection when another option is chosen', async () => {
      await render(<OnboardingScreen />);
      await fireEvent.press(screen.getByLabelText('Solo'));
      await fireEvent.press(screen.getByLabelText('Friends'));
      expect(screen.getByLabelText('Solo').props.accessibilityState.checked).toBe(false);
      expect(screen.getByLabelText('Friends').props.accessibilityState.checked).toBe(true);
    });

    it('advances to the next step after selecting and pressing Next', async () => {
      await render(<OnboardingScreen />);
      await advance('Solo', STEP_CTA[0]);
      expect(screen.getByText('How much time do you have?')).toBeTruthy();
      expect(screen.getByText('2 of 4')).toBeTruthy();
      // Previous step is now hidden.
      expect(screen.queryByText('Who are you going with?')).toBeNull();
    });

    it('does nothing when Next is pressed with no selection', async () => {
      await render(<OnboardingScreen />);
      await fireEvent.press(screen.getByLabelText(STEP_CTA[0]));
      expect(screen.getByText('1 of 4')).toBeTruthy();
      expect(screen.queryByText('How much time do you have?')).toBeNull();
    });

    it('walks through all four steps and reveals the loading overlay with chips', async () => {
      await render(<OnboardingScreen />);
      await advance('Solo', STEP_CTA[0]);
      await advance('30 minutes', STEP_CTA[1]);
      await advance('City', STEP_CTA[2]);
      await advance('Free only', STEP_CTA[3]);

      expect(screen.getByLabelText('Finding your missions')).toBeTruthy();
      expect(screen.getByText('Solo')).toBeTruthy();
      expect(screen.getByText('30 min')).toBeTruthy();
      expect(screen.getByText('City')).toBeTruthy();
      expect(screen.getByText('Free')).toBeTruthy();
    });

    it('calls onComplete with all selections after the loading delay', async () => {
      const onComplete = jest.fn();
      await render(<OnboardingScreen onComplete={onComplete} />);
      await advance('Partner', STEP_CTA[0]);
      await advance('15 minutes', STEP_CTA[1]);
      await advance('Nature', STEP_CTA[2]);
      await advance('No limit', STEP_CTA[3]);

      expect(onComplete).not.toHaveBeenCalled();
      const expected: OnboardingSelections = {
        0: 'Partner',
        1: '15 min',
        2: 'Nature',
        3: 'No limit',
      };
      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(expected), {
        timeout: 3500,
        interval: 150,
      });
    });

    it('does not throw when completing without an onComplete handler', async () => {
      await render(<OnboardingScreen />);
      await advance('Solo', STEP_CTA[0]);
      await advance('30 minutes', STEP_CTA[1]);
      await advance('Anywhere', STEP_CTA[2]);
      await advance('Under $10', STEP_CTA[3]);
      expect(screen.getByLabelText('Finding your missions')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('exposes the question heading with a header role', async () => {
      await render(<OnboardingScreen />);
      expect(screen.getByText('Who are you going with?').props.accessibilityRole).toBe(
        'header',
      );
    });

    it('gives every visible option a radio role and a checked state', async () => {
      await render(<OnboardingScreen />);
      const options = screen.getAllByRole('radio');
      expect(options.length).toBe(5);
      options.forEach((node) => {
        expect(node.props.accessibilityState).toHaveProperty('checked');
        expect(node.props.accessibilityLabel).toBeTruthy();
      });
    });

    it('labels the primary CTA with a button role and disabled state', async () => {
      await render(<OnboardingScreen />);
      const next = screen.getByLabelText(STEP_CTA[0]);
      expect(next.props.accessibilityRole).toBe('button');
      expect(next.props.accessibilityState.disabled).toBe(true);
    });

    it('marks the loading overlay as a polite live region', async () => {
      await render(<OnboardingScreen />);
      await advance('Solo', STEP_CTA[0]);
      await advance('30 minutes', STEP_CTA[1]);
      await advance('City', STEP_CTA[2]);
      await advance('Free only', STEP_CTA[3]);
      expect(
        screen.getByLabelText('Finding your missions').props.accessibilityLiveRegion,
      ).toBe('polite');
    });

    it('hides the last step from accessibility once loading starts (Android TalkBack parity)', async () => {
      // accessibilityViewIsModal traps VoiceOver to the overlay on iOS, but has
      // no effect on Android — the step behind it must be explicitly hidden too,
      // or TalkBack could still swipe-navigate to and activate its CTA button.
      await render(<OnboardingScreen />);
      await advance('Solo', STEP_CTA[0]);
      await advance('30 minutes', STEP_CTA[1]);
      await advance('City', STEP_CTA[2]);
      await advance('Free only', STEP_CTA[3]);

      expect(screen.getByLabelText('Finding your missions')).toBeTruthy();
      expect(screen.queryByLabelText(STEP_CTA[3])).toBeNull();
      expect(
        screen.getByLabelText(STEP_CTA[3], { includeHiddenElements: true }),
      ).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('renders the final step CTA label as "Find My Missions"', async () => {
      await render(<OnboardingScreen />);
      await advance('Solo', STEP_CTA[0]);
      await advance('30 minutes', STEP_CTA[1]);
      await advance('City', STEP_CTA[2]);
      expect(screen.getByText('Find My Missions')).toBeTruthy();
      expect(screen.getByText('4 of 4')).toBeTruthy();
    });

    it('does not enable the final CTA until the last step is answered', async () => {
      await render(<OnboardingScreen />);
      await advance('Solo', STEP_CTA[0]);
      await advance('30 minutes', STEP_CTA[1]);
      await advance('City', STEP_CTA[2]);
      const cta = screen.getByLabelText(STEP_CTA[3]);
      expect(cta.props.accessibilityState.disabled).toBe(true);
    });
  });
});
