import { ProductController } from './product.controller';
import { ProductRepositoryPort } from '../../domain/ports/product.repository.port';

describe('ProductController', () => {
  let controller: ProductController;
  let productRepo: jest.Mocked<ProductRepositoryPort>;

  const mockProducts = [
    { id: '1', name: 'Product 1', description: 'Desc 1', priceCents: 10000, imageUrl: 'url1', stock: 5, createdAt: new Date() },
    { id: '2', name: 'Product 2', description: 'Desc 2', priceCents: 20000, imageUrl: 'url2', stock: 0, createdAt: new Date() },
  ];

  beforeEach(() => {
    productRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      updateStock: jest.fn(),
    };
    controller = new ProductController(productRepo);
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      productRepo.findAll.mockResolvedValue(mockProducts);
      const result = await controller.findAll();
      expect(result).toEqual(mockProducts);
      expect(productRepo.findAll).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return product by id', async () => {
      productRepo.findById.mockResolvedValue(mockProducts[0]);
      const result = await controller.findById('1');
      expect(result).toEqual(mockProducts[0]);
    });

    it('should return error when product not found', async () => {
      productRepo.findById.mockResolvedValue(null);
      const result = await controller.findById('nonexistent');
      expect(result).toEqual({ error: 'Product not found' });
    });
  });
});
