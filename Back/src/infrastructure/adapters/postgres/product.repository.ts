import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../../domain/entities/product.entity';
import { ProductRepositoryPort } from '../../../domain/ports/product.repository.port';

@Injectable()
export class ProductRepository implements ProductRepositoryPort {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  async findAll(): Promise<Product[]> {
    return this.repo.find({ order: { createdAt: 'ASC' } });
  }

  async findById(id: string): Promise<Product | null> {
    return this.repo.findOne({ where: { id } });
  }

  async updateStock(id: string, quantity: number): Promise<Product | null> {
    const product = await this.repo.findOne({ where: { id } });
    if (!product) return null;
    product.stock = product.stock - quantity;
    return this.repo.save(product);
  }
}
