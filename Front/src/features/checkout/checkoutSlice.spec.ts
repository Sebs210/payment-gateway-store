import checkoutReducer, {
  selectProduct,
  setCustomerInfo,
  setCardInfo,
  setTransactionId,
  setStep,
  setLoading,
  setError,
  resetCheckout,
} from './checkoutSlice';

// Mock persistence
jest.mock('../../utils/persistence', () => ({
  loadState: jest.fn(() => null),
  saveState: jest.fn(),
  clearState: jest.fn(),
}));

describe('checkoutSlice', () => {
  const initialState = {
    step: 1,
    selectedProductId: null,
    quantity: 1,
    customerInfo: null,
    cardInfo: null,
    transactionId: null,
    loading: false,
    error: null,
  };

  it('should return initial state', () => {
    const state = checkoutReducer(undefined, { type: 'unknown' });
    expect(state.step).toBe(1);
    expect(state.selectedProductId).toBeNull();
  });

  it('should handle selectProduct', () => {
    const state = checkoutReducer(initialState, selectProduct({ productId: 'p1', quantity: 2 }));
    expect(state.selectedProductId).toBe('p1');
    expect(state.quantity).toBe(2);
    expect(state.step).toBe(2);
  });

  it('should handle setCustomerInfo', () => {
    const info = { email: 'a@b.com', fullName: 'Test', phone: '123', address: 'Addr', city: 'City' };
    const state = checkoutReducer(initialState, setCustomerInfo(info));
    expect(state.customerInfo).toEqual(info);
  });

  it('should handle setCardInfo and go to step 3', () => {
    const card = {
      number: '4242424242424242',
      cvc: '123',
      expMonth: '12',
      expYear: '28',
      cardHolder: 'Test',
      lastFour: '4242',
      brand: 'visa',
    };
    const state = checkoutReducer(initialState, setCardInfo(card));
    expect(state.cardInfo).toEqual(card);
    expect(state.step).toBe(3);
  });

  it('should handle setTransactionId', () => {
    const state = checkoutReducer(initialState, setTransactionId('txn-1'));
    expect(state.transactionId).toBe('txn-1');
  });

  it('should handle setStep', () => {
    const state = checkoutReducer(initialState, setStep(4));
    expect(state.step).toBe(4);
  });

  it('should handle setLoading', () => {
    const state = checkoutReducer(initialState, setLoading(true));
    expect(state.loading).toBe(true);
  });

  it('should handle setError', () => {
    const state = checkoutReducer(initialState, setError('Something broke'));
    expect(state.error).toBe('Something broke');
  });

  it('should handle resetCheckout', () => {
    const modified = { ...initialState, step: 4, selectedProductId: 'p1', transactionId: 'txn-1' };
    const state = checkoutReducer(modified, resetCheckout());
    expect(state.step).toBe(1);
    expect(state.selectedProductId).toBeNull();
    expect(state.transactionId).toBeNull();
  });
});
