const STORAGE_KEY = 'payment_checkout_state';

export interface PersistedState {
  step: number;
  selectedProductId: string | null;
  quantity: number;
  customerInfo: {
    email: string;
    fullName: string;
    phone: string;
    address: string;
    city: string;
  } | null;
  cardInfo: {
    lastFour: string;
    brand: string;
    cardHolder: string;
  } | null;
  transactionId: string | null;
}

export const saveState = (state: PersistedState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable
  }
};

export const loadState = (): PersistedState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
};

export const clearState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
};
