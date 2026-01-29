import axios from 'axios';

jest.mock('axios', () => {
  const instance = {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  };
  return {
    create: jest.fn(() => instance),
    __instance: instance,
  };
});

const mockInstance = (axios as any).__instance;

// Re-import after mock
import * as apiModule from './api';

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchProducts', () => {
    it('should call GET /products', async () => {
      const products = [{ id: '1', name: 'Test' }];
      mockInstance.get.mockResolvedValue({ data: products });
      const result = await apiModule.fetchProducts();
      expect(mockInstance.get).toHaveBeenCalledWith('/products');
      expect(result).toEqual(products);
    });
  });

  describe('createTransaction', () => {
    it('should call POST /transactions', async () => {
      const txn = { id: 'txn-1' };
      mockInstance.post.mockResolvedValue({ data: txn });
      const result = await apiModule.createTransaction({ productId: 'p1', quantity: 1 });
      expect(mockInstance.post).toHaveBeenCalledWith('/transactions', expect.any(Object));
      expect(result).toEqual(txn);
    });
  });

  describe('completePayment', () => {
    it('should call POST /transactions/:id/pay', async () => {
      const txn = { id: 'txn-1', status: 'APPROVED' };
      mockInstance.post.mockResolvedValue({ data: txn });
      const result = await apiModule.completePayment('txn-1', { cardToken: 'tok' });
      expect(mockInstance.post).toHaveBeenCalledWith('/transactions/txn-1/pay', expect.any(Object));
      expect(result).toEqual(txn);
    });
  });

  describe('getTransaction', () => {
    it('should call GET /transactions/:id', async () => {
      const txn = { id: 'txn-1' };
      mockInstance.get.mockResolvedValue({ data: txn });
      const result = await apiModule.getTransaction('txn-1');
      expect(mockInstance.get).toHaveBeenCalledWith('/transactions/txn-1');
      expect(result).toEqual(txn);
    });
  });

  describe('tokenizeCard', () => {
    it('should call POST /transactions/tokenize', async () => {
      const token = { tokenId: 'tok_123', brand: 'VISA' };
      mockInstance.post.mockResolvedValue({ data: token });
      const result = await apiModule.tokenizeCard({ number: '4242' });
      expect(mockInstance.post).toHaveBeenCalledWith('/transactions/tokenize', expect.any(Object));
      expect(result).toEqual(token);
    });
  });

  describe('getAcceptanceToken', () => {
    it('should call GET /transactions/acceptance/token', async () => {
      const tokens = { acceptanceToken: 'acc', acceptPersonalAuth: 'auth', permalink: 'link' };
      mockInstance.get.mockResolvedValue({ data: tokens });
      const result = await apiModule.getAcceptanceToken();
      expect(mockInstance.get).toHaveBeenCalledWith('/transactions/acceptance/token');
      expect(result).toEqual(tokens);
    });
  });
});
