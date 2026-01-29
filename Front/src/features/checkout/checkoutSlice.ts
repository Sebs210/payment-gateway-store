import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loadState, saveState, clearState, PersistedState } from '../../utils/persistence';

export interface CustomerInfo {
  email: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
}

export interface CardInfo {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
  lastFour: string;
  brand: string;
}

interface CheckoutState {
  step: number; // 1=product, 2=card/delivery, 3=summary, 4=result, 5=back to products
  selectedProductId: string | null;
  quantity: number;
  customerInfo: CustomerInfo | null;
  cardInfo: CardInfo | null;
  transactionId: string | null;
  loading: boolean;
  error: string | null;
}

const persisted = loadState();

const initialState: CheckoutState = {
  step: persisted?.step || 1,
  selectedProductId: persisted?.selectedProductId || null,
  quantity: persisted?.quantity || 1,
  customerInfo: persisted?.customerInfo || null,
  cardInfo: null, // Never persist full card info
  transactionId: persisted?.transactionId || null,
  loading: false,
  error: null,
};

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    selectProduct(state, action: PayloadAction<{ productId: string; quantity: number }>) {
      state.selectedProductId = action.payload.productId;
      state.quantity = action.payload.quantity;
      state.step = 2;
      persistCheckout(state);
    },
    setCustomerInfo(state, action: PayloadAction<CustomerInfo>) {
      state.customerInfo = action.payload;
      persistCheckout(state);
    },
    setCardInfo(state, action: PayloadAction<CardInfo>) {
      state.cardInfo = action.payload;
      state.step = 3;
      persistCheckout(state);
    },
    setTransactionId(state, action: PayloadAction<string>) {
      state.transactionId = action.payload;
      persistCheckout(state);
    },
    setStep(state, action: PayloadAction<number>) {
      state.step = action.payload;
      persistCheckout(state);
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    resetCheckout(state) {
      state.step = 1;
      state.selectedProductId = null;
      state.quantity = 1;
      state.customerInfo = null;
      state.cardInfo = null;
      state.transactionId = null;
      state.loading = false;
      state.error = null;
      clearState();
    },
  },
});

function persistCheckout(state: CheckoutState) {
  const toPersist: PersistedState = {
    step: state.step,
    selectedProductId: state.selectedProductId,
    quantity: state.quantity,
    customerInfo: state.customerInfo,
    cardInfo: state.cardInfo
      ? { lastFour: state.cardInfo.lastFour, brand: state.cardInfo.brand, cardHolder: state.cardInfo.cardHolder }
      : null,
    transactionId: state.transactionId,
  };
  saveState(toPersist);
}

export const {
  selectProduct,
  setCustomerInfo,
  setCardInfo,
  setTransactionId,
  setStep,
  setLoading,
  setError,
  resetCheckout,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;
