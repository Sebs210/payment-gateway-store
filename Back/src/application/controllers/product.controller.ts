import { Controller, Get, Param, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PRODUCT_REPOSITORY } from '../../domain/ports/product.repository.port';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: ProductRepositoryPort,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all products with stock' })
  async findAll() {
    return this.productRepo.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  async findById(@Param('id') id: string) {
    const product = await this.productRepo.findById(id);
    if (!product) {
      return { error: 'Product not found' };
    }
    return product;
  }
}
