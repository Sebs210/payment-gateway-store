import { DeliveryRepository } from './delivery.repository';
import { Repository } from 'typeorm';
import { Delivery, DeliveryStatus } from '../../../domain/entities/delivery.entity';

describe('DeliveryRepository', () => {
  let repository: DeliveryRepository;
  let mockRepo: jest.Mocked<Repository<Delivery>>;

  const mockDelivery = {
    id: '1',
    transactionId: 'txn-1',
    customerId: 'cust-1',
    address: 'Addr',
    city: 'City',
    status: DeliveryStatus.PENDING,
    createdAt: new Date(),
  } as Delivery;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    } as any;
    repository = new DeliveryRepository(mockRepo);
  });

  describe('create', () => {
    it('should create and save delivery', async () => {
      mockRepo.create.mockReturnValue(mockDelivery);
      mockRepo.save.mockResolvedValue(mockDelivery);
      const result = await repository.create({ transactionId: 'txn-1', address: 'Addr', city: 'City' });
      expect(result).toEqual(mockDelivery);
    });
  });

  describe('findByTransactionId', () => {
    it('should find delivery by transaction id', async () => {
      mockRepo.findOne.mockResolvedValue(mockDelivery);
      const result = await repository.findByTransactionId('txn-1');
      expect(result).toEqual(mockDelivery);
    });

    it('should return null if not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await repository.findByTransactionId('bad');
      expect(result).toBeNull();
    });
  });
});
