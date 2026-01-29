import productsReducer, { loadProducts } from './productsSlice';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('../../services/api', () => ({
  fetchProducts: jest.fn(),
}));

import { fetchProducts } from '../../services/api';
const mockedFetch = fetchProducts as jest.MockedFunction<typeof fetchProducts>;

describe('productsSlice', () => {
  const mockProducts = [
    { id: '1', name: 'Product 1', description: 'Desc', priceCents: 10000, imageUrl: 'url', stock: 5 },
  ];

  it('should return initial state', () => {
    const state = productsReducer(undefined, { type: 'unknown' });
    expect(state).toEqual({ items: [], loading: false, error: null });
  });

  it('should handle loadProducts.pending', () => {
    const state = productsReducer(undefined, loadProducts.pending(''));
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should handle loadProducts.fulfilled', () => {
    const state = productsReducer(undefined, loadProducts.fulfilled(mockProducts, ''));
    expect(state.loading).toBe(false);
    expect(state.items).toEqual(mockProducts);
  });

  it('should handle loadProducts.rejected', () => {
    const state = productsReducer(
      undefined,
      loadProducts.rejected(new Error('Network error'), ''),
    );
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Network error');
  });

  it('should fetch products via async thunk', async () => {
    mockedFetch.mockResolvedValue(mockProducts);
    const store = configureStore({ reducer: { products: productsReducer } });
    await store.dispatch(loadProducts());
    expect(store.getState().products.items).toEqual(mockProducts);
  });
});
