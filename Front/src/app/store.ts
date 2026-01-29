import { configureStore } from '@reduxjs/toolkit';
import productsReducer from '../features/products/productsSlice';
import checkoutReducer from '../features/checkout/checkoutSlice';
import transactionReducer from '../features/transaction/transactionSlice';

export const store = configureStore({
  reducer: {
    products: productsReducer,
    checkout: checkoutReducer,
    transaction: transactionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
