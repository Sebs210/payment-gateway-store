import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import productsReducer from './productsSlice';
import checkoutReducer from '../checkout/checkoutSlice';
import transactionReducer from '../transaction/transactionSlice';
import ProductPage from './ProductPage';

jest.mock('../../services/api', () => ({
  fetchProducts: jest.fn().mockResolvedValue([
    { id: '1', name: 'Mock Product', description: 'Desc', priceCents: 5000000, imageUrl: 'url', stock: 5 },
  ]),
}));

jest.mock('../../utils/persistence', () => ({
  loadState: jest.fn(() => null),
  saveState: jest.fn(),
  clearState: jest.fn(),
}));

const createStore = (preloadedState?: any) =>
  configureStore({
    reducer: { products: productsReducer, checkout: checkoutReducer, transaction: transactionReducer },
    preloadedState,
  });

describe('ProductPage', () => {
  it('should render header', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <ProductPage />
      </Provider>,
    );
    expect(screen.getByText('Tech Store')).toBeInTheDocument();
  });

  it('should show loading spinner initially', () => {
    const store = createStore({ products: { items: [], loading: true, error: null }, checkout: { step: 1, selectedProductId: null, quantity: 1, customerInfo: null, cardInfo: null, transactionId: null, loading: false, error: null }, transaction: { current: null } });
    render(
      <Provider store={store}>
        <ProductPage />
      </Provider>,
    );
    // Spinner is a div with animate-spin class
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('should dispatch loadProducts on mount', () => {
    const store = createStore();
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    render(
      <Provider store={store}>
        <ProductPage />
      </Provider>,
    );
    expect(dispatchSpy).toHaveBeenCalled();
  });

  it('should render products after loading', async () => {
    const store = createStore({
      products: {
        items: [{ id: '1', name: 'Loaded Product', description: 'D', priceCents: 1000000, imageUrl: 'u', stock: 3 }],
        loading: false,
        error: null,
      },
      checkout: { step: 1, selectedProductId: null, quantity: 1, customerInfo: null, cardInfo: null, transactionId: null, loading: false, error: null },
      transaction: { current: null },
    });
    render(
      <Provider store={store}>
        <ProductPage />
      </Provider>,
    );
    expect(screen.getByText('Loaded Product')).toBeInTheDocument();
  });
});
