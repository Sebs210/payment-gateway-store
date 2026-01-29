import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus } from '../../../domain/entities/transaction.entity';
import { TransactionRepositoryPort } from '../../../domain/ports/transaction.repository.port';

@Injectable()
export class TransactionRepository implements TransactionRepositoryPort {
  constructor(
    @InjectRepository(Transaction)
    private readonly repo: Repository<Transaction>,
  ) {}

  async create(data: Partial<Transaction>): Promise<Transaction> {
    const transaction = this.repo.create(data);
    return this.repo.save(transaction);
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.repo.findOne({ where: { id }, relations: ['customer', 'product'] });
  }

  async findByReference(reference: string): Promise<Transaction | null> {
    return this.repo.findOne({ where: { reference }, relations: ['customer', 'product'] });
  }

  async updateStatus(
    id: string,
    status: TransactionStatus,
    gatewayTransactionId?: string,
  ): Promise<Transaction | null> {
    const transaction = await this.repo.findOne({ where: { id }, relations: ['customer', 'product'] });
    if (!transaction) return null;
    transaction.status = status;
    if (gatewayTransactionId) {
      transaction.gatewayTransactionId = gatewayTransactionId;
    }
    return this.repo.save(transaction);
  }
}
