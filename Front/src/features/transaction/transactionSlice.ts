import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Transaction } from '../../services/api';

interface TransactionState {
  current: Transaction | null;
}

const initialState: TransactionState = {
  current: null,
};

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    setTransaction(state, action: PayloadAction<Transaction>) {
      state.current = action.payload;
    },
    clearTransaction(state) {
      state.current = null;
    },
  },
});

export const { setTransaction, clearTransaction } = transactionSlice.actions;
export default transactionSlice.reducer;
