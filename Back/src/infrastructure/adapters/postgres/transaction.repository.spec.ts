import { TransactionRepository } from './transaction.repository';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus } from '../../../domain/entities/transaction.entity';

describe('TransactionRepository', () => {
  let repository: TransactionRepository;
  let mockRepo: jest.Mocked<Repository<Transaction>>;

  const mockTxn = {
    id: '1',
    reference: 'TXN-ABC',
    customerId: 'c1',
    productId: 'p1',
    quantity: 1,
    amountCents: 10000000,
    baseFeeCents: 500000,
    deliveryFeeCents: 1000000,
    totalCents: 11500000,
    status: TransactionStatus.PENDING,
    gatewayTransactionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Transaction;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    } as any;
    repository = new TransactionRepository(mockRepo);
  });

  describe('create', () => {
    it('should create and save transaction', async () => {
      mockRepo.create.mockReturnValue(mockTxn);
      mockRepo.save.mockResolvedValue(mockTxn);
      const result = await repository.create({ reference: 'TXN-ABC' });
      expect(result).toEqual(mockTxn);
    });
  });

  describe('findById', () => {
    it('should find with relations', async () => {
      mockRepo.findOne.mockResolvedValue(mockTxn);
      const result = await repository.findById('1');
      expect(result).toEqual(mockTxn);
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: '1' }, relations: ['customer', 'product'] });
    });
  });

  describe('findByReference', () => {
    it('should find by reference', async () => {
      mockRepo.findOne.mockResolvedValue(mockTxn);
      const result = await repository.findByReference('TXN-ABC');
      expect(result).toEqual(mockTxn);
    });
  });

  describe('updateStatus', () => {
    it('should update status and gateway id', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockTxn });
      mockRepo.save.mockImplementation(async (t) => t as any);
      const result = await repository.updateStatus('1', TransactionStatus.APPROVED, 'gateway-1');
      expect(result.status).toBe(TransactionStatus.APPROVED);
      expect(result.gatewayTransactionId).toBe('gateway-1');
    });

    it('should return null if not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await repository.updateStatus('bad', TransactionStatus.APPROVED);
      expect(result).toBeNull();
    });
  });
});
