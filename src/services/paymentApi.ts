import { apiRequest } from './apiClient';
import type { PaymentMethod, SetupIntentResponse } from '../types/api';

/**
 * Payment-methods-on-file client. Every call is JWT-guarded server-side and
 * scoped to the calling user. This is add/view/remove/default a card for
 * future use — there is deliberately NO charge/checkout call here, because no
 * billing flow exists anywhere in the product.
 *
 * The mutating calls (`removePaymentMethod`, `setDefaultPaymentMethod`) return
 * the *remaining* list so the screen can render straight from the response
 * without a follow-up refetch. `createSetupIntent` returns a one-shot client
 * secret consumed by the on-device Stripe PaymentSheet.
 */

/**
 * Creates a Stripe SetupIntent for registering a new card and returns its
 * `clientSecret` for the mobile PaymentSheet. Side-effecting (may provision a
 * Stripe customer server-side), so it's a POST with no body.
 */
export function createSetupIntent(): Promise<SetupIntentResponse> {
  return apiRequest<SetupIntentResponse>('/payment/setup-intent', {
    method: 'POST',
  });
}

/** Lists the authenticated user's saved cards. */
export function listPaymentMethods(): Promise<PaymentMethod[]> {
  return apiRequest<PaymentMethod[]>('/payment/methods');
}

/**
 * Detaches a saved card by its Stripe PaymentMethod id and returns the
 * remaining cards.
 */
export function removePaymentMethod(id: string): Promise<PaymentMethod[]> {
  return apiRequest<PaymentMethod[]>(`/payment/methods/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Marks a saved card as the customer's default and returns the full list with
 * the new default flagged.
 */
export function setDefaultPaymentMethod(id: string): Promise<PaymentMethod[]> {
  return apiRequest<PaymentMethod[]>(`/payment/methods/${id}/default`, {
    method: 'PATCH',
  });
}
