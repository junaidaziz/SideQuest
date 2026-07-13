import { apiRequest } from './apiClient';
import {
  createSetupIntent,
  listPaymentMethods,
  removePaymentMethod,
  setDefaultPaymentMethod,
} from './paymentApi';
import type { PaymentMethod, SetupIntentResponse } from '../types/api';

jest.mock('./apiClient');

const mockApiRequest = apiRequest as jest.Mock;

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

const SETUP_INTENT: SetupIntentResponse = {
  clientSecret: 'seti_123_secret_abc',
};

describe('paymentApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSetupIntent', () => {
    it('POSTs /payment/setup-intent with no body and returns the client secret', async () => {
      mockApiRequest.mockResolvedValueOnce(SETUP_INTENT);

      const result = await createSetupIntent();

      expect(mockApiRequest).toHaveBeenCalledWith('/payment/setup-intent', {
        method: 'POST',
      });
      expect(result).toEqual(SETUP_INTENT);
    });

    it('propagates an API rejection to the caller', async () => {
      mockApiRequest.mockRejectedValueOnce(new Error('502 Bad Gateway'));

      await expect(createSetupIntent()).rejects.toThrow('502 Bad Gateway');
    });
  });

  describe('listPaymentMethods', () => {
    it('GETs /payment/methods and returns the saved cards', async () => {
      mockApiRequest.mockResolvedValueOnce([VISA, MASTERCARD]);

      const result = await listPaymentMethods();

      expect(mockApiRequest).toHaveBeenCalledWith('/payment/methods');
      expect(result).toEqual([VISA, MASTERCARD]);
    });

    it('returns an empty list when the user has no saved cards', async () => {
      mockApiRequest.mockResolvedValueOnce([]);

      await expect(listPaymentMethods()).resolves.toEqual([]);
    });

    it('propagates an API rejection to the caller', async () => {
      mockApiRequest.mockRejectedValueOnce(new Error('401 Unauthorized'));

      await expect(listPaymentMethods()).rejects.toThrow('401 Unauthorized');
    });
  });

  describe('removePaymentMethod', () => {
    it('DELETEs the card by id and returns the remaining cards', async () => {
      mockApiRequest.mockResolvedValueOnce([MASTERCARD]);

      const result = await removePaymentMethod('pm_visa');

      expect(mockApiRequest).toHaveBeenCalledWith('/payment/methods/pm_visa', {
        method: 'DELETE',
      });
      expect(result).toEqual([MASTERCARD]);
    });

    it('propagates an API rejection to the caller', async () => {
      mockApiRequest.mockRejectedValueOnce(new Error('404 Not Found'));

      await expect(removePaymentMethod('pm_missing')).rejects.toThrow(
        '404 Not Found',
      );
    });
  });

  describe('setDefaultPaymentMethod', () => {
    it('PATCHes the default endpoint and returns the updated cards', async () => {
      mockApiRequest.mockResolvedValueOnce([
        { ...VISA, isDefault: false },
        { ...MASTERCARD, isDefault: true },
      ]);

      const result = await setDefaultPaymentMethod('pm_mc');

      expect(mockApiRequest).toHaveBeenCalledWith(
        '/payment/methods/pm_mc/default',
        { method: 'PATCH' },
      );
      expect(result[1].isDefault).toBe(true);
    });

    it('propagates an API rejection to the caller', async () => {
      mockApiRequest.mockRejectedValueOnce(new Error('502 Bad Gateway'));

      await expect(setDefaultPaymentMethod('pm_mc')).rejects.toThrow(
        '502 Bad Gateway',
      );
    });
  });
});
