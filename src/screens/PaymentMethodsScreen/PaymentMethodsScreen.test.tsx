import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PaymentMethodsScreen, {
  cardAccessibilityLabel,
  formatBrand,
  formatExpiry,
  whenPressed,
} from './PaymentMethodsScreen';
import {
  createSetupIntent,
  listPaymentMethods,
  removePaymentMethod,
  setDefaultPaymentMethod,
} from '../../services/paymentApi';
import type { PaymentMethod, UserProfile } from '../../types/api';

jest.mock('../../services/paymentApi');

/**
 * PaymentMethodsScreen gates its card-management UI behind a signed-in
 * (non-guest) user — see the GuestPrompt fallback in the component. Mocked
 * the same way ProfileScreen's tests mock the store, defaulting to a
 * signed-in user so every existing test below exercises the real screen; a
 * dedicated describe block flips this to a guest to cover the fallback.
 */
let mockIsGuest = false;
jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (s: { user: UserProfile | null }) => unknown) =>
    selector({
      user: { id: 'user-1', email: 'a@example.com', displayName: 'A', isGuest: mockIsGuest, avatarUrl: null },
    }),
}));

// Stripe's native hook is mocked to controllable spies so the add-card flow can
// be driven without a native PaymentSheet. PaymentSheetError mirrors the real
// enum so the "user cancelled" branch can be exercised by code, not string.
const mockInitPaymentSheet = jest.fn();
const mockPresentPaymentSheet = jest.fn();
jest.mock('@stripe/stripe-react-native', () => ({
  useStripe: () => ({
    initPaymentSheet: mockInitPaymentSheet,
    presentPaymentSheet: mockPresentPaymentSheet,
  }),
  PaymentSheetError: { Failed: 'Failed', Canceled: 'Canceled', Timeout: 'Timeout' },
}));

const mockList = listPaymentMethods as jest.MockedFunction<typeof listPaymentMethods>;
const mockCreateSetupIntent = createSetupIntent as jest.MockedFunction<
  typeof createSetupIntent
>;
const mockRemove = removePaymentMethod as jest.MockedFunction<typeof removePaymentMethod>;
const mockSetDefault = setDefaultPaymentMethod as jest.MockedFunction<
  typeof setDefaultPaymentMethod
>;

const VISA: PaymentMethod = {
  id: 'pm_visa',
  brand: 'visa',
  last4: '4242',
  expMonth: 12,
  expYear: 2028,
  isDefault: true,
};

const MASTERCARD: PaymentMethod = {
  id: 'pm_mc',
  brand: 'mastercard',
  last4: '4444',
  expMonth: 1,
  expYear: 2030,
  isDefault: false,
};

async function renderScreen(
  overrides: Partial<React.ComponentProps<typeof PaymentMethodsScreen>> = {},
) {
  const onBack = jest.fn();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  await render(
    <QueryClientProvider client={queryClient}>
      <PaymentMethodsScreen onBack={onBack} {...overrides} />
    </QueryClientProvider>,
  );
  return { onBack };
}

/** Fires a press, then invokes the Nth Alert action's onPress synchronously. */
async function pressAlertAction(label: string, actionIndex: number) {
  const alertSpy = jest.spyOn(Alert, 'alert');
  await fireEvent.press(screen.getByLabelText(label));
  const buttons = alertSpy.mock.calls[0]?.[2];
  await buttons?.[actionIndex]?.onPress?.();
  alertSpy.mockRestore();
}

describe('PaymentMethodsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsGuest = false;
    mockList.mockResolvedValue([VISA, MASTERCARD]);
    mockCreateSetupIntent.mockResolvedValue({ clientSecret: 'seti_1_secret' });
    mockInitPaymentSheet.mockResolvedValue({});
    mockPresentPaymentSheet.mockResolvedValue({});
    mockRemove.mockResolvedValue([VISA]);
    mockSetDefault.mockResolvedValue([
      { ...VISA, isDefault: false },
      { ...MASTERCARD, isDefault: true },
    ]);
  });

  describe('rendering', () => {
    it('renders the saved cards with brand, last4 and expiry', async () => {
      await renderScreen();
      await waitFor(() =>
        expect(screen.getByText('Visa •••• 4242')).toBeTruthy(),
      );
      expect(screen.getByText('Mastercard •••• 4444')).toBeTruthy();
      expect(screen.getByText('Expires 12/28')).toBeTruthy();
      expect(screen.getByText('Expires 01/30')).toBeTruthy();
    });

    it('flags the default card with a badge', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('DEFAULT')).toBeTruthy());
    });

    it('renders a loading skeleton while the list is in flight', async () => {
      mockList.mockReturnValue(new Promise(() => {}));
      await renderScreen();
      await waitFor(() =>
        expect(screen.getByLabelText('Loading your saved cards')).toBeTruthy(),
      );
    });

    it('renders the empty state when there are no saved cards', async () => {
      mockList.mockResolvedValue([]);
      await renderScreen();
      await waitFor(() =>
        expect(screen.getByText('No saved cards yet')).toBeTruthy(),
      );
      // The add-card button is still available from the empty state.
      expect(screen.getByLabelText('Add a card')).toBeTruthy();
    });

    it('renders an error state when the list query fails', async () => {
      mockList.mockRejectedValue(new Error('502 Bad Gateway'));
      await renderScreen();
      await waitFor(() =>
        expect(screen.getByText("Couldn't load your cards")).toBeTruthy(),
      );
      // The add-card button is hidden in the error state.
      expect(screen.queryByLabelText('Add a card')).toBeNull();
    });

    it('retries the list when "Try again" is pressed', async () => {
      mockList.mockRejectedValueOnce(new Error('down'));
      await renderScreen();
      await waitFor(() =>
        expect(screen.getByText("Couldn't load your cards")).toBeTruthy(),
      );
      mockList.mockResolvedValueOnce([VISA]);
      await fireEvent.press(screen.getByLabelText('Try again'));
      await waitFor(() => expect(screen.getByText('Visa •••• 4242')).toBeTruthy());
    });
  });

  describe('navigation', () => {
    it('calls onBack when the back button is pressed', async () => {
      const { onBack } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Back'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('does not throw when back is pressed without a handler', async () => {
      await renderScreen({ onBack: undefined });
      expect(() =>
        fireEvent.press(screen.getByLabelText('Back')),
      ).not.toThrow();
    });
  });

  describe('add-card flow', () => {
    it('runs the SetupIntent + PaymentSheet flow and refetches on success', async () => {
      mockList.mockResolvedValueOnce([VISA]);
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Add a card')).toBeTruthy());

      mockList.mockResolvedValueOnce([VISA, MASTERCARD]);
      await fireEvent.press(screen.getByLabelText('Add a card'));

      await waitFor(() => expect(mockCreateSetupIntent).toHaveBeenCalledTimes(1));
      expect(mockInitPaymentSheet).toHaveBeenCalledWith({
        merchantDisplayName: 'SideQuest',
        setupIntentClientSecret: 'seti_1_secret',
      });
      expect(mockPresentPaymentSheet).toHaveBeenCalledTimes(1);
      await waitFor(() =>
        expect(screen.getByText('Mastercard •••• 4444')).toBeTruthy(),
      );
    });

    it('surfaces an error when initPaymentSheet fails', async () => {
      mockInitPaymentSheet.mockResolvedValueOnce({ error: { code: 'Failed', message: 'no' } });
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Add a card')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Add a card'));
      await waitFor(() =>
        expect(
          screen.getByText("Couldn't start card setup. Please try again."),
        ).toBeTruthy(),
      );
      expect(mockPresentPaymentSheet).not.toHaveBeenCalled();
    });

    it('surfaces an error when the sheet fails to complete', async () => {
      mockPresentPaymentSheet.mockResolvedValueOnce({
        error: { code: 'Failed', message: 'boom' },
      });
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Add a card')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Add a card'));
      await waitFor(() =>
        expect(
          screen.getByText("Couldn't save that card. Please try again."),
        ).toBeTruthy(),
      );
    });

    it('does not surface an error when the user cancels the sheet', async () => {
      mockPresentPaymentSheet.mockResolvedValueOnce({
        error: { code: 'Canceled', message: 'user cancelled' },
      });
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Add a card')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Add a card'));
      await waitFor(() => expect(mockPresentPaymentSheet).toHaveBeenCalled());
      expect(
        screen.queryByText("Couldn't save that card. Please try again."),
      ).toBeNull();
    });

    it('surfaces an error when createSetupIntent throws', async () => {
      mockCreateSetupIntent.mockRejectedValueOnce(new Error('502'));
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Add a card')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Add a card'));
      await waitFor(() =>
        expect(
          screen.getByText("Couldn't save that card. Please try again."),
        ).toBeTruthy(),
      );
    });
  });

  describe('set-default action', () => {
    it('promotes a non-default card and updates the badges', async () => {
      await renderScreen();
      await waitFor(() =>
        expect(screen.getByText('Mastercard •••• 4444')).toBeTruthy(),
      );
      await fireEvent.press(
        screen.getByLabelText('Set Mastercard ending 4444 as default'),
      );
      await waitFor(() => expect(mockSetDefault).toHaveBeenCalledWith('pm_mc'));
      // Mastercard now carries the default treatment; its "set default" button is gone.
      await waitFor(() =>
        expect(
          screen.queryByLabelText('Set Mastercard ending 4444 as default'),
        ).toBeNull(),
      );
    });

    it('does not offer a set-default control on the default card', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Visa •••• 4242')).toBeTruthy());
      expect(
        screen.queryByLabelText('Set Visa ending 4242 as default'),
      ).toBeNull();
    });

    it('surfaces an error when setting the default fails', async () => {
      mockSetDefault.mockRejectedValueOnce(new Error('502'));
      await renderScreen();
      await waitFor(() =>
        expect(screen.getByText('Mastercard •••• 4444')).toBeTruthy(),
      );
      await fireEvent.press(
        screen.getByLabelText('Set Mastercard ending 4444 as default'),
      );
      await waitFor(() =>
        expect(
          screen.getByText(
            "Couldn't update your default card. Please try again.",
          ),
        ).toBeTruthy(),
      );
    });
  });

  describe('remove action', () => {
    it('confirms then removes the card', async () => {
      await renderScreen();
      await waitFor(() =>
        expect(screen.getByText('Mastercard •••• 4444')).toBeTruthy(),
      );
      mockRemove.mockResolvedValueOnce([VISA]);
      // Alert buttons: [Cancel, Remove] — index 1 is the destructive confirm.
      await pressAlertAction('Remove Mastercard ending 4444', 1);
      await waitFor(() => expect(mockRemove).toHaveBeenCalledWith('pm_mc'));
      await waitFor(() =>
        expect(screen.queryByText('Mastercard •••• 4444')).toBeNull(),
      );
    });

    it('does not remove when the confirmation is cancelled', async () => {
      await renderScreen();
      await waitFor(() =>
        expect(screen.getByText('Mastercard •••• 4444')).toBeTruthy(),
      );
      await pressAlertAction('Remove Mastercard ending 4444', 0);
      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('surfaces an error when removal fails', async () => {
      mockRemove.mockRejectedValueOnce(new Error('404'));
      await renderScreen();
      await waitFor(() =>
        expect(screen.getByText('Mastercard •••• 4444')).toBeTruthy(),
      );
      await pressAlertAction('Remove Visa ending 4242', 1);
      await waitFor(() =>
        expect(
          screen.getByText("Couldn't remove that card. Please try again."),
        ).toBeTruthy(),
      );
    });
  });

  describe('accessibility', () => {
    it('gives every interactive element a button role and a label', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Visa •••• 4242')).toBeTruthy());
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((btn) => {
        expect(btn.props.accessibilityLabel).toBeTruthy();
      });
    });

    it('exposes the header as a header role', async () => {
      await renderScreen();
      expect(
        screen.getByText('Payment Methods').props.accessibilityRole,
      ).toBe('header');
    });

    it('labels each card row for screen readers', async () => {
      await renderScreen();
      await waitFor(() =>
        expect(
          screen.getByLabelText('Visa ending 4242, expires 12/28, default card'),
        ).toBeTruthy(),
      );
      expect(
        screen.getByLabelText('Mastercard ending 4444, expires 01/30'),
      ).toBeTruthy();
    });
  });

  describe('formatBrand', () => {
    it('title-cases a simple brand slug', () => {
      expect(formatBrand('visa')).toBe('Visa');
    });

    it('title-cases a multi-word underscore slug', () => {
      expect(formatBrand('american_express')).toBe('American Express');
    });

    it('falls back to "Card" for an empty brand', () => {
      expect(formatBrand('   ')).toBe('Card');
    });
  });

  describe('formatExpiry', () => {
    it('zero-pads the month and shows a two-digit year', () => {
      expect(formatExpiry(1, 2030)).toBe('01/30');
    });

    it('handles a two-digit month', () => {
      expect(formatExpiry(12, 2028)).toBe('12/28');
    });
  });

  describe('whenPressed', () => {
    it('returns the given style only while pressed', () => {
      const s = { opacity: 0.5 };
      expect(whenPressed(true, s)).toBe(s);
      expect(whenPressed(false, s)).toBeNull();
    });
  });

  describe('cardAccessibilityLabel', () => {
    it('includes the default marker for the default card', () => {
      expect(cardAccessibilityLabel(VISA)).toBe(
        'Visa ending 4242, expires 12/28, default card',
      );
    });

    it('omits the default marker for a non-default card', () => {
      expect(cardAccessibilityLabel(MASTERCARD)).toBe(
        'Mastercard ending 4444, expires 01/30',
      );
    });
  });

  describe('guest fallback', () => {
    beforeEach(() => {
      mockIsGuest = true;
    });

    it('shows a guest prompt instead of the card-management UI', async () => {
      await renderScreen();

      expect(
        screen.getByText('Create an account to add a payment method'),
      ).toBeTruthy();
      expect(screen.queryByLabelText('Add a card')).toBeNull();
      expect(mockList).not.toHaveBeenCalled();
    });

    it('the guest prompt back button fires onBack', async () => {
      const { onBack } = await renderScreen();

      fireEvent.press(screen.getByLabelText('Go back'));

      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });
});
