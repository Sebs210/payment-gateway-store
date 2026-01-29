import { ProductSeed } from './product.seed';
import { Repository } from 'typeorm';
import { Product } from '../../../domain/entities/product.entity';

describe('ProductSeed', () => {
  let seed: ProductSeed;
  let mockRepo: jest.Mocked<Repository<Product>>;

  beforeEach(() => {
    mockRepo = {
      count: jest.fn(),
      create: jest.fn((p) => p as any),
      save: jest.fn(async (p) => p),
    } as any;
    seed = new ProductSeed(mockRepo);
  });

  it('should seed products when database is empty', async () => {
    mockRepo.count.mockResolvedValue(0);
    await seed.seed();
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('should not seed when products already exist', async () => {
    mockRepo.count.mockResolvedValue(5);
    await seed.seed();
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});
