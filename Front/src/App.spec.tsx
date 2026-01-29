import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import productsReducer from './features/products/productsSlice';
import checkoutReducer from './features/checkout/checkoutSlice';
import transactionReducer from './features/transaction/transactionSlice';
import App from './App';

jest.mock('./services/api', () => ({
  fetchProducts: jest.fn().mockResolvedValue([]),
}));

jest.mock('./utils/persistence', () => ({
  loadState: jest.fn(() => null),
  saveState: jest.fn(),
  clearState: jest.fn(),
}));

const createStore = (step = 1) =>
  configureStore({
    reducer: { products: productsReducer, checkout: checkoutReducer, transaction: transactionReducer },
    preloadedState: {
      products: { items: [], loading: false, error: null },
      checkout: { step, selectedProductId: null, quantity: 1, customerInfo: null, cardInfo: null, transactionId: null, loading: false, error: null },
      transaction: { current: null },
    },
  });

describe('App', () => {
  it('should render product page at step 1', () => {
    const store = createStore(1);
    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );
    expect(screen.getByText('Tech Store')).toBeInTheDocument();
  });

  it('should render credit card modal at step 2', () => {
    const store = createStore(2);
    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );
    expect(screen.getByText('Payment Details')).toBeInTheDocument();
  });

  it('should not render modal at step 1', () => {
    const store = createStore(1);
    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );
    expect(screen.queryByText('Payment Details')).not.toBeInTheDocument();
  });
});
