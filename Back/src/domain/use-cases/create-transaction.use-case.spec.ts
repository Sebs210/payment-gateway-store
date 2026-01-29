import { CreateTransactionUseCase, CreateTransactionInput } from './create-transaction.use-case';
import { ProductRepositoryPort } from '../ports/product.repository.port';
import { CustomerRepositoryPort } from '../ports/customer.repository.port';
import { TransactionRepositoryPort } from '../ports/transaction.repository.port';
import { TransactionStatus } from '../entities/transaction.entity';

describe('CreateTransactionUseCase', () => {
  let useCase: CreateTransactionUseCase;
  let productRepo: jest.Mocked<ProductRepositoryPort>;
  let customerRepo: jest.Mocked<CustomerRepositoryPort>;
  let transactionRepo: jest.Mocked<TransactionRepositoryPort>;

  const mockProduct = {
    id: 'prod-1',
    name: 'Test Product',
    description: 'Desc',
    priceCents: 10000000,
    imageUrl: 'http://img.com/test.jpg',
    stock: 10,
    createdAt: new Date(),
  };

  const mockCustomer = {
    id: 'cust-1',
    email: 'test@test.com',
    fullName: 'Test User',
    phone: '123456',
    address: 'Street 1',
    city: 'Bogota',
    createdAt: new Date(),
  };

  const input: CreateTransactionInput = {
    productId: 'prod-1',
    quantity: 1,
    customerEmail: 'test@test.com',
    customerFullName: 'Test User',
    customerPhone: '123456',
    customerAddress: 'Street 1',
    customerCity: 'Bogota',
  };

  beforeEach(() => {
    productRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      updateStock: jest.fn(),
    };
    customerRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };
    transactionRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByReference: jest.fn(),
      updateStatus: jest.fn(),
    };
    useCase = new CreateTransactionUseCase(productRepo, customerRepo, transactionRepo);
  });

  it('should fail if product not found', async () => {
    productRepo.findById.mockResolvedValue(null);
    const result = await useCase.execute(input);
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('Product not found');
  });

  it('should fail if insufficient stock', async () => {
    productRepo.findById.mockResolvedValue({ ...mockProduct, stock: 0 });
    const result = await useCase.execute(input);
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('Insufficient stock');
  });

  it('should create new customer if not found', async () => {
    productRepo.findById.mockResolvedValue(mockProduct);
    customerRepo.findByEmail.mockResolvedValue(null);
    customerRepo.create.mockResolvedValue(mockCustomer);
    transactionRepo.create.mockResolvedValue({
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
      customer: mockCustomer,
      product: mockProduct,
    });

    const result = await useCase.execute(input);
    expect(result.isOk()).toBe(true);
    expect(customerRepo.create).toHaveBeenCalled();
  });

  it('should use existing customer if found', async () => {
    productRepo.findById.mockResolvedValue(mockProduct);
    customerRepo.findByEmail.mockResolvedValue(mockCustomer);
    transactionRepo.create.mockResolvedValue({
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
      customer: mockCustomer,
      product: mockProduct,
    });

    const result = await useCase.execute(input);
    expect(result.isOk()).toBe(true);
    expect(customerRepo.create).not.toHaveBeenCalled();
  });

  it('should calculate correct amounts', async () => {
    productRepo.findById.mockResolvedValue(mockProduct);
    customerRepo.findByEmail.mockResolvedValue(mockCustomer);
    transactionRepo.create.mockImplementation(async (data) => ({
      id: 'txn-1',
      reference: 'TXN-ABC',
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: mockCustomer,
      product: mockProduct,
    } as any));

    await useCase.execute({ ...input, quantity: 2 });
    expect(transactionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amountCents: 20000000,
        baseFeeCents: 500000,
        deliveryFeeCents: 1000000,
        totalCents: 21500000,
      }),
    );
  });

  it('should create transaction with PENDING status', async () => {
    productRepo.findById.mockResolvedValue(mockProduct);
    customerRepo.findByEmail.mockResolvedValue(mockCustomer);
    transactionRepo.create.mockImplementation(async (data) => ({
      id: 'txn-1',
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: mockCustomer,
      product: mockProduct,
    } as any));

    await useCase.execute(input);
    expect(transactionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: TransactionStatus.PENDING,
      }),
    );
  });
});
