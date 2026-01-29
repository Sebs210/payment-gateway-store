import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import productsReducer from '../products/productsSlice';
import checkoutReducer from '../checkout/checkoutSlice';
import transactionReducer from './transactionSlice';
import TransactionResult from './TransactionResult';

jest.mock('../../services/api', () => ({
  fetchProducts: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../utils/persistence', () => ({
  loadState: jest.fn(() => null),
  saveState: jest.fn(),
  clearState: jest.fn(),
}));

const mockTransaction = {
  id: 'txn-1',
  reference: 'TXN-ABC12345',
  customerId: 'c1',
  productId: 'p1',
  quantity: 1,
  amountCents: 10000000,
  baseFeeCents: 500000,
  deliveryFeeCents: 1000000,
  totalCents: 11500000,
  status: 'APPROVED',
  gatewayTransactionId: 'wompi-123',
};

const createStore = (transaction: any = mockTransaction) =>
  configureStore({
    reducer: { products: productsReducer, checkout: checkoutReducer, transaction: transactionReducer },
    preloadedState: {
      products: { items: [], loading: false, error: null },
      checkout: { step: 4, selectedProductId: null, quantity: 1, customerInfo: null, cardInfo: null, transactionId: 'txn-1', loading: false, error: null },
      transaction: { current: transaction },
    },
  });

describe('TransactionResult', () => {
  it('should render approved status', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <TransactionResult />
      </Provider>,
    );
    expect(screen.getByText('Payment Approved')).toBeInTheDocument();
  });

  it('should render declined status', () => {
    const store = createStore({ ...mockTransaction, status: 'DECLINED' });
    render(
      <Provider store={store}>
        <TransactionResult />
      </Provider>,
    );
    expect(screen.getByText('Payment Declined')).toBeInTheDocument();
  });

  it('should render error status', () => {
    const store = createStore({ ...mockTransaction, status: 'ERROR' });
    render(
      <Provider store={store}>
        <TransactionResult />
      </Provider>,
    );
    expect(screen.getByText('Payment Error')).toBeInTheDocument();
  });

  it('should display transaction reference', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <TransactionResult />
      </Provider>,
    );
    expect(screen.getByText('TXN-ABC12345')).toBeInTheDocument();
  });

  it('should display gateway transaction id', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <TransactionResult />
      </Provider>,
    );
    expect(screen.getByText(/wompi-123/)).toBeInTheDocument();
  });

  it('should reset on back to store click', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <TransactionResult />
      </Provider>,
    );
    fireEvent.click(screen.getByText('Back to Store'));
    expect(store.getState().transaction.current).toBeNull();
    expect(store.getState().checkout.step).toBe(1);
  });

  it('should return null when no transaction', () => {
    const store = createStore(null);
    const { container } = render(
      <Provider store={store}>
        <TransactionResult />
      </Provider>,
    );
    expect(container.innerHTML).toBe('');
  });

  it('should render pending status', () => {
    const store = createStore({ ...mockTransaction, status: 'PENDING' });
    render(
      <Provider store={store}>
        <TransactionResult />
      </Provider>,
    );
    expect(screen.getByText('Payment Pending')).toBeInTheDocument();
  });

  it('should render voided status', () => {
    const store = createStore({ ...mockTransaction, status: 'VOIDED' });
    render(
      <Provider store={store}>
        <TransactionResult />
      </Provider>,
    );
    expect(screen.getByText('Payment Voided')).toBeInTheDocument();
  });
});
