import { CompletePaymentUseCase, CompletePaymentInput } from './complete-payment.use-case';
import { TransactionRepositoryPort } from '../ports/transaction.repository.port';
import { PaymentGatewayPort } from '../ports/payment-gateway.port';
import { ProductRepositoryPort } from '../ports/product.repository.port';
import { DeliveryRepositoryPort } from '../ports/delivery.repository.port';
import { CustomerRepositoryPort } from '../ports/customer.repository.port';
import { TransactionStatus } from '../entities/transaction.entity';

describe('CompletePaymentUseCase', () => {
  let useCase: CompletePaymentUseCase;
  let transactionRepo: jest.Mocked<TransactionRepositoryPort>;
  let paymentGateway: jest.Mocked<PaymentGatewayPort>;
  let productRepo: jest.Mocked<ProductRepositoryPort>;
  let deliveryRepo: jest.Mocked<DeliveryRepositoryPort>;
  let customerRepo: jest.Mocked<CustomerRepositoryPort>;

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

  const input: CompletePaymentInput = {
    transactionId: 'txn-1',
    cardToken: 'tok_123',
    installments: 1,
    acceptanceToken: 'acc_123',
    acceptPersonalAuth: 'auth_123',
  };

  beforeEach(() => {
    transactionRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByReference: jest.fn(),
      updateStatus: jest.fn(),
    };
    paymentGateway = {
      tokenizeCard: jest.fn(),
      getAcceptanceToken: jest.fn(),
      createTransaction: jest.fn(),
      getTransaction: jest.fn(),
    };
    productRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      updateStock: jest.fn(),
    };
    deliveryRepo = {
      create: jest.fn(),
      findByTransactionId: jest.fn(),
    };
    customerRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };
    useCase = new CompletePaymentUseCase(transactionRepo, paymentGateway, productRepo, deliveryRepo, customerRepo);
  });

  it('should fail if transaction not found', async () => {
    transactionRepo.findById.mockResolvedValue(null);
    const result = await useCase.execute(input);
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('Transaction not found');
  });

  it('should fail if transaction is not PENDING', async () => {
    transactionRepo.findById.mockResolvedValue({ ...mockTransaction, status: TransactionStatus.APPROVED });
    const result = await useCase.execute(input);
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('Transaction is not in PENDING status');
  });

  it('should handle payment gateway errors', async () => {
    transactionRepo.findById.mockResolvedValue(mockTransaction);
    paymentGateway.createTransaction.mockRejectedValue(new Error('Gateway down'));
    transactionRepo.updateStatus.mockResolvedValue({ ...mockTransaction, status: TransactionStatus.ERROR });

    const result = await useCase.execute(input);
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toContain('Payment gateway error');
    expect(transactionRepo.updateStatus).toHaveBeenCalledWith(mockTransaction.id, TransactionStatus.ERROR);
  });

  it('should update stock and create delivery on APPROVED', async () => {
    transactionRepo.findById.mockResolvedValue(mockTransaction);
    paymentGateway.createTransaction.mockResolvedValue({
      id: 'wompi-123',
      status: 'APPROVED',
      reference: 'TXN-ABC',
      amountInCents: 11500000,
    });
    transactionRepo.updateStatus.mockResolvedValue({ ...mockTransaction, status: TransactionStatus.APPROVED, gatewayTransactionId: 'wompi-123' });
    customerRepo.findById.mockResolvedValue(mockTransaction.customer);
    productRepo.updateStock.mockResolvedValue(mockTransaction.product);
    deliveryRepo.create.mockResolvedValue({} as any);

    const result = await useCase.execute(input);
    expect(result.isOk()).toBe(true);
    expect(productRepo.updateStock).toHaveBeenCalledWith('prod-1', 1);
    expect(deliveryRepo.create).toHaveBeenCalled();
  });

  it('should NOT update stock on DECLINED', async () => {
    transactionRepo.findById.mockResolvedValue(mockTransaction);
    paymentGateway.createTransaction.mockResolvedValue({
      id: 'wompi-123',
      status: 'DECLINED',
      reference: 'TXN-ABC',
      amountInCents: 11500000,
    });
    transactionRepo.updateStatus.mockResolvedValue({ ...mockTransaction, status: TransactionStatus.DECLINED });

    const result = await useCase.execute(input);
    expect(result.isOk()).toBe(true);
    expect(productRepo.updateStock).not.toHaveBeenCalled();
    expect(deliveryRepo.create).not.toHaveBeenCalled();
  });

  it('should call payment gateway with correct parameters', async () => {
    transactionRepo.findById.mockResolvedValue(mockTransaction);
    paymentGateway.createTransaction.mockResolvedValue({
      id: 'wompi-123',
      status: 'PENDING',
      reference: 'TXN-ABC',
      amountInCents: 11500000,
    });
    transactionRepo.updateStatus.mockResolvedValue(mockTransaction);

    await useCase.execute(input);
    expect(paymentGateway.createTransaction).toHaveBeenCalledWith({
      amountInCents: 11500000,
      currency: 'COP',
      customerEmail: 'test@test.com',
      reference: 'TXN-ABC',
      paymentMethod: { type: 'CARD', installments: 1, token: 'tok_123' },
      acceptanceToken: 'acc_123',
      acceptPersonalAuth: 'auth_123',
    });
  });
});
