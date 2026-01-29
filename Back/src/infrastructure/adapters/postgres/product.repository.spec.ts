import { ProductRepository } from './product.repository';
import { Repository } from 'typeorm';
import { Product } from '../../../domain/entities/product.entity';

describe('ProductRepository', () => {
  let repository: ProductRepository;
  let mockRepo: jest.Mocked<Repository<Product>>;

  const mockProduct: Product = {
    id: '1',
    name: 'Test',
    description: 'Desc',
    priceCents: 10000,
    imageUrl: 'url',
    stock: 10,
    createdAt: new Date(),
  };

  beforeEach(() => {
    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    } as any;
    repository = new ProductRepository(mockRepo);
  });

  describe('findAll', () => {
    it('should return all products ordered by creation date', async () => {
      mockRepo.find.mockResolvedValue([mockProduct]);
      const result = await repository.findAll();
      expect(result).toEqual([mockProduct]);
      expect(mockRepo.find).toHaveBeenCalledWith({ order: { createdAt: 'ASC' } });
    });
  });

  describe('findById', () => {
    it('should return product by id', async () => {
      mockRepo.findOne.mockResolvedValue(mockProduct);
      const result = await repository.findById('1');
      expect(result).toEqual(mockProduct);
    });

    it('should return null for non-existent product', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await repository.findById('bad');
      expect(result).toBeNull();
    });
  });

  describe('updateStock', () => {
    it('should decrease stock by quantity', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockProduct, stock: 10 });
      mockRepo.save.mockImplementation(async (p) => p as any);
      const result = await repository.updateStock('1', 3);
      expect(result.stock).toBe(7);
    });

    it('should return null if product not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await repository.updateStock('bad', 1);
      expect(result).toBeNull();
    });
  });
});
