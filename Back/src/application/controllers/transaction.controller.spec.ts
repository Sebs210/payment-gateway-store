import { HttpException } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { CreateTransactionUseCase } from '../../domain/use-cases/create-transaction.use-case';
import { CompletePaymentUseCase } from '../../domain/use-cases/complete-payment.use-case';
import { PaymentGatewayPort } from '../../domain/ports/payment-gateway.port';
import { TransactionRepositoryPort } from '../../domain/ports/transaction.repository.port';
import { TransactionStatus } from '../../domain/entities/transaction.entity';
import { Result } from '../../domain/use-cases/result';

describe('TransactionController', () => {
  let controller: TransactionController;
  let createUseCase: jest.Mocked<CreateTransactionUseCase>;
  let completeUseCase: jest.Mocked<CompletePaymentUseCase>;
  let paymentGateway: jest.Mocked<PaymentGatewayPort>;
  let transactionRepo: jest.Mocked<TransactionRepositoryPort>;

  const mockTransaction = {
    id: 'txn-1',
    reference: 'TXN-ABC',
    customerId: 'cust-1',
    productId: 'prod-1',
    quantity: 1,
    amountCents: 10000000,
    baseFeeCents: 500000,
    deliveryFeeCents: 1000000,
    totalCents: 11500000,
    status: TransactionStatus.PENDING,
    gatewayTransactionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: { id: 'cust-1', email: 'test@test.com', fullName: 'Test', phone: '123', address: 'Addr', city: 'City', createdAt: new Date() },
    product: { id: 'prod-1', name: 'Product', description: '', priceCents: 10000000, imageUrl: '', stock: 10, createdAt: new Date() },
  };

  beforeEach(() => {
    createUseCase = { execute: jest.fn() } as any;
    completeUseCase = { execute: jest.fn() } as any;
    paymentGateway = {
      tokenizeCard: jest.fn(),
      getAcceptanceToken: jest.fn(),
      createTransaction: jest.fn(),
      getTransaction: jest.fn(),
    };
    transactionRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByReference: jest.fn(),
      updateStatus: jest.fn(),
    };
    controller = new TransactionController(createUseCase, completeUseCase, paymentGateway, transactionRepo);
  });

  describe('create', () => {
    it('should return created transaction', async () => {
      createUseCase.execute.mockResolvedValue(Result.ok(mockTransaction));
      const result = await controller.create({
        productId: 'prod-1',
        quantity: 1,
        customerEmail: 'test@test.com',
        customerFullName: 'Test',
        customerPhone: '123',
        customerAddress: 'Addr',
        customerCity: 'City',
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should throw on failure', async () => {
      createUseCase.execute.mockResolvedValue(Result.fail('Product not found'));
      await expect(
        controller.create({
          productId: 'bad',
          quantity: 1,
          customerEmail: 'test@test.com',
          customerFullName: 'Test',
          customerPhone: '123',
          customerAddress: 'Addr',
          customerCity: 'City',
        }),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('pay', () => {
    it('should return updated transaction', async () => {
      completeUseCase.execute.mockResolvedValue(Result.ok({ ...mockTransaction, status: TransactionStatus.APPROVED }));
      const result = await controller.pay('txn-1', {
        cardToken: 'tok_123',
        installments: 1,
        acceptanceToken: 'acc',
        acceptPersonalAuth: 'auth',
      });
      expect(result.status).toBe(TransactionStatus.APPROVED);
    });

    it('should throw on failure', async () => {
      completeUseCase.execute.mockResolvedValue(Result.fail('Transaction not found'));
      await expect(
        controller.pay('bad-id', {
          cardToken: 'tok',
          installments: 1,
          acceptanceToken: 'acc',
          acceptPersonalAuth: 'auth',
        }),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('findById', () => {
    it('should return transaction', async () => {
      transactionRepo.findById.mockResolvedValue(mockTransaction);
      const result = await controller.findById('txn-1');
      expect(result).toEqual(mockTransaction);
    });

    it('should throw when not found', async () => {
      transactionRepo.findById.mockResolvedValue(null);
      await expect(controller.findById('bad')).rejects.toThrow(HttpException);
    });
  });

  describe('tokenize', () => {
    it('should return token', async () => {
      paymentGateway.tokenizeCard.mockResolvedValue({ tokenId: 'tok_123', brand: 'VISA' });
      const result = await controller.tokenize({
        number: '4242424242424242',
        cvc: '123',
        expMonth: '12',
        expYear: '28',
        cardHolder: 'Test',
      });
      expect(result.tokenId).toBe('tok_123');
    });

    it('should throw on tokenization failure', async () => {
      paymentGateway.tokenizeCard.mockRejectedValue(new Error('Invalid card'));
      await expect(
        controller.tokenize({
          number: '0000',
          cvc: '123',
          expMonth: '12',
          expYear: '28',
          cardHolder: 'Test',
        }),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('getAcceptanceToken', () => {
    it('should return acceptance tokens', async () => {
      paymentGateway.getAcceptanceToken.mockResolvedValue({
        acceptanceToken: 'acc',
        acceptPersonalAuth: 'auth',
        permalink: 'http://link',
      });
      const result = await controller.getAcceptanceToken();
      expect(result.acceptanceToken).toBe('acc');
    });
  });
});
