import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from '../../../domain/entities/delivery.entity';
import { DeliveryRepositoryPort } from '../../../domain/ports/delivery.repository.port';

@Injectable()
export class DeliveryRepository implements DeliveryRepositoryPort {
  constructor(
    @InjectRepository(Delivery)
    private readonly repo: Repository<Delivery>,
  ) {}

  async create(data: Partial<Delivery>): Promise<Delivery> {
    const delivery = this.repo.create(data);
    return this.repo.save(delivery);
  }

  async findByTransactionId(transactionId: string): Promise<Delivery | null> {
    return this.repo.findOne({ where: { transactionId } });
  }
}
