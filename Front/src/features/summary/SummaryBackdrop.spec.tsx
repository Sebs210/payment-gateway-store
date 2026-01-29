import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import productsReducer from '../products/productsSlice';
import checkoutReducer from '../checkout/checkoutSlice';
import transactionReducer from '../transaction/transactionSlice';
import SummaryBackdrop from './SummaryBackdrop';

jest.mock('../../services/api', () => ({
  fetchProducts: jest.fn(),
  createTransaction: jest.fn(),
  tokenizeCard: jest.fn(),
  getAcceptanceToken: jest.fn(),
  completePayment: jest.fn(),
}));

jest.mock('../../utils/persistence', () => ({
  loadState: jest.fn(() => null),
  saveState: jest.fn(),
  clearState: jest.fn(),
}));

const mockProduct = { id: 'p1', name: 'Test Product', description: 'D', priceCents: 10000000, imageUrl: 'u', stock: 10 };

const createStore = (overrides: any = {}) =>
  configureStore({
    reducer: { products: productsReducer, checkout: checkoutReducer, transaction: transactionReducer },
    preloadedState: {
      products: { items: [mockProduct], loading: false, error: null },
      checkout: {
        step: 3,
        selectedProductId: 'p1',
        quantity: 1,
        customerInfo: { email: 'a@b.com', fullName: 'Test', phone: '123', address: 'Addr', city: 'City' },
        cardInfo: { number: '4242424242424242', cvc: '123', expMonth: '12', expYear: '30', cardHolder: 'Test', lastFour: '4242', brand: 'visa' },
        transactionId: null,
        loading: false,
        error: null,
        ...overrides,
      },
      transaction: { current: null },
    },
  });

describe('SummaryBackdrop', () => {
  it('should render payment summary', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <SummaryBackdrop />
      </Provider>,
    );
    expect(screen.getByText('Payment Summary')).toBeInTheDocument();
    expect(screen.getByText('Order Details')).toBeInTheDocument();
  });

  it('should show product info', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <SummaryBackdrop />
      </Provider>,
    );
    expect(screen.getAllByText(/Test Product/).length).toBeGreaterThan(0);
    expect(screen.getByText(/4242.*VISA/i)).toBeInTheDocument();
  });

  it('should display fees breakdown', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <SummaryBackdrop />
      </Provider>,
    );
    expect(screen.getByText('Base Fee')).toBeInTheDocument();
    expect(screen.getByText('Delivery Fee')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('should render pay button', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <SummaryBackdrop />
      </Provider>,
    );
    const payButton = screen.getByRole('button', { name: /Pay/ });
    expect(payButton).toBeInTheDocument();
  });

  it('should show error message', () => {
    const store = createStore({ error: 'Payment failed' });
    render(
      <Provider store={store}>
        <SummaryBackdrop />
      </Provider>,
    );
    expect(screen.getByText('Payment failed')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    const store = createStore({ loading: true });
    render(
      <Provider store={store}>
        <SummaryBackdrop />
      </Provider>,
    );
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('should return null if no product selected', () => {
    const store = createStore({ selectedProductId: null });
    const { container } = render(
      <Provider store={store}>
        <SummaryBackdrop />
      </Provider>,
    );
    expect(container.innerHTML).toBe('');
  });

  it('should return null if no customer info', () => {
    const store = createStore({ customerInfo: null });
    const { container } = render(
      <Provider store={store}>
        <SummaryBackdrop />
      </Provider>,
    );
    expect(container.innerHTML).toBe('');
  });

  it('should return null if no card info', () => {
    const store = createStore({ cardInfo: null });
    const { container } = render(
      <Provider store={store}>
        <SummaryBackdrop />
      </Provider>,
    );
    expect(container.innerHTML).toBe('');
  });
});
