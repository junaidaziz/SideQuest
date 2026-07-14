import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PaymentMethodsRoute from '../../app/payment-methods';
import { listPaymentMethods } from '../../src/services/paymentApi';
import type { UserProfile } from '../../src/types/api';

// expo-router's `router` is the navigation seam this thin wrapper exists to
// bind — mock it so the route can be tested without a real navigation tree.
const mockBack = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: { back: () => mockBack(), replace: (href: string) => mockReplace(href) },
}));

// The real screen pulls the Stripe native hook and the payment API — stub both
// so the route renders headlessly and we can exercise the actual Back button
// it hands its `onBack` prop to.
jest.mock('@stripe/stripe-react-native', () => ({
  useStripe: () => ({
    initPaymentSheet: jest.fn(),
    presentPaymentSheet: jest.fn(),
  }),
  PaymentSheetError: { Failed: 'Failed', Canceled: 'Canceled', Timeout: 'Timeout' },
}));
jest.mock('../../src/services/paymentApi');

// The route redirects a guest before PaymentMethodsScreen ever mounts (see
// the guard in payment-methods.tsx) — default to a signed-in user so the
// existing render/back tests exercise the real screen; a dedicated test
// flips this to a guest to cover the redirect.
let mockIsGuest = false;
jest.mock('../../src/store/authStore', () => ({
  useAuthStore: (selector: (s: { user: UserProfile | null }) => unknown) =>
    selector({
      user: { id: 'user-1', email: 'a@example.com', displayName: 'A', isGuest: mockIsGuest, avatarUrl: null },
    }),
}));

const mockList = listPaymentMethods as jest.MockedFunction<typeof listPaymentMethods>;

function renderRoute() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PaymentMethodsRoute />
    </QueryClientProvider>,
  );
}

describe('PaymentMethodsRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsGuest = false;
    mockList.mockResolvedValue([]);
  });

  it('renders the PaymentMethodsScreen', async () => {
    renderRoute();
    await waitFor(() =>
      expect(screen.getByText('Payment Methods')).toBeTruthy(),
    );
  });

  it('routes the Back button through router.back()', async () => {
    renderRoute();
    await waitFor(() => expect(screen.getByLabelText('Back')).toBeTruthy());
    await fireEvent.press(screen.getByLabelText('Back'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('redirects a guest to /home instead of rendering the screen', async () => {
    mockIsGuest = true;
    renderRoute();
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/home'));
    expect(screen.queryByText('Payment Methods')).toBeNull();
  });
});
