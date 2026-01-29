import transactionReducer, { setTransaction, clearTransaction } from './transactionSlice';

describe('transactionSlice', () => {
  const mockTransaction = {
    id: 'txn-1',
    reference: 'TXN-ABC',
    customerId: 'c1',
    productId: 'p1',
    quantity: 1,
    amountCents: 10000000,
    baseFeeCents: 500000,
    deliveryFeeCents: 1000000,
    totalCents: 11500000,
    status: 'APPROVED',
    gatewayTransactionId: 'wompi-1',
  };

  it('should return initial state', () => {
    const state = transactionReducer(undefined, { type: 'unknown' });
    expect(state.current).toBeNull();
  });

  it('should handle setTransaction', () => {
    const state = transactionReducer(undefined, setTransaction(mockTransaction));
    expect(state.current).toEqual(mockTransaction);
  });

  it('should handle clearTransaction', () => {
    const withTx = transactionReducer(undefined, setTransaction(mockTransaction));
    const state = transactionReducer(withTx, clearTransaction());
    expect(state.current).toBeNull();
  });
});
