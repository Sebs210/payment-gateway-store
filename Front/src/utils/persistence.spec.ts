import { saveState, loadState, clearState } from './persistence';
import type { PersistedState } from './persistence';

describe('persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockState: PersistedState = {
    step: 2,
    selectedProductId: 'prod-1',
    quantity: 1,
    customerInfo: {
      email: 'test@test.com',
      fullName: 'Test',
      phone: '123',
      address: 'Addr',
      city: 'City',
    },
    cardInfo: { lastFour: '4242', brand: 'visa', cardHolder: 'Test' },
    transactionId: null,
  };

  describe('saveState', () => {
    it('should save state to localStorage', () => {
      saveState(mockState);
      expect(localStorage.getItem('payment_checkout_state')).toBeTruthy();
    });
  });

  describe('loadState', () => {
    it('should load saved state', () => {
      saveState(mockState);
      const loaded = loadState();
      expect(loaded).toEqual(mockState);
    });

    it('should return null when no state exists', () => {
      expect(loadState()).toBeNull();
    });

    it('should return null on invalid JSON', () => {
      localStorage.setItem('payment_checkout_state', 'invalid');
      expect(loadState()).toBeNull();
    });
  });

  describe('clearState', () => {
    it('should clear saved state', () => {
      saveState(mockState);
      clearState();
      expect(loadState()).toBeNull();
    });
  });
});
