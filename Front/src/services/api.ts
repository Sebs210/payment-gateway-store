import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export interface Product {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  stock: number;
}

export interface CreateTransactionRequest {
  productId: string;
  quantity: number;
  customerEmail: string;
  customerFullName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
}

export interface Transaction {
  id: string;
  reference: string;
  customerId: string;
  productId: string;
  quantity: number;
  amountCents: number;
  baseFeeCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  status: string;
  gatewayTransactionId: string | null;
  product?: Product;
}

export interface CompletePaymentRequest {
  cardToken: string;
  installments: number;
  acceptanceToken: string;
  acceptPersonalAuth: string;
}

export interface TokenizeCardRequest {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
}

export const fetchProducts = () => api.get<Product[]>('/products').then((r) => r.data);

export const createTransaction = (data: CreateTransactionRequest) =>
  api.post<Transaction>('/transactions', data).then((r) => r.data);

export const completePayment = (transactionId: string, data: CompletePaymentRequest) =>
  api.post<Transaction>(`/transactions/${transactionId}/pay`, data).then((r) => r.data);

export const getTransaction = (id: string) =>
  api.get<Transaction>(`/transactions/${id}`).then((r) => r.data);

export const tokenizeCard = (data: TokenizeCardRequest) =>
  api.post<{ tokenId: string; brand: string }>('/transactions/tokenize', data).then((r) => r.data);

export const getAcceptanceToken = () =>
  api.get<{ acceptanceToken: string; acceptPersonalAuth: string; permalink: string }>('/transactions/acceptance/token').then((r) => r.data);

export default api;
