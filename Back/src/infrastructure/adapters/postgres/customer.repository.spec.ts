import { CustomerRepository } from './customer.repository';
import { Repository } from 'typeorm';
import { Customer } from '../../../domain/entities/customer.entity';

describe('CustomerRepository', () => {
  let repository: CustomerRepository;
  let mockRepo: jest.Mocked<Repository<Customer>>;

  const mockCustomer: Customer = {
    id: '1',
    email: 'test@test.com',
    fullName: 'Test User',
    phone: '123',
    address: 'Addr',
    city: 'City',
    createdAt: new Date(),
  };

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    } as any;
    repository = new CustomerRepository(mockRepo);
  });

  describe('create', () => {
    it('should create and save a customer', async () => {
      mockRepo.create.mockReturnValue(mockCustomer);
      mockRepo.save.mockResolvedValue(mockCustomer);
      const result = await repository.create({ email: 'test@test.com', fullName: 'Test User' });
      expect(result).toEqual(mockCustomer);
      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find customer by id', async () => {
      mockRepo.findOne.mockResolvedValue(mockCustomer);
      const result = await repository.findById('1');
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('findByEmail', () => {
    it('should find customer by email', async () => {
      mockRepo.findOne.mockResolvedValue(mockCustomer);
      const result = await repository.findByEmail('test@test.com');
      expect(result).toEqual(mockCustomer);
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { email: 'test@test.com' } });
    });

    it('should return null if not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await repository.findByEmail('missing@test.com');
      expect(result).toBeNull();
    });
  });
});
