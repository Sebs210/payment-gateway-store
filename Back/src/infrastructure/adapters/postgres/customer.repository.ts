import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../../../domain/entities/customer.entity';
import { CustomerRepositoryPort } from '../../../domain/ports/customer.repository.port';

@Injectable()
export class CustomerRepository implements CustomerRepositoryPort {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
  ) {}

  async create(data: Partial<Customer>): Promise<Customer> {
    const customer = this.repo.create(data);
    return this.repo.save(customer);
  }

  async findById(id: string): Promise<Customer | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return this.repo.findOne({ where: { email } });
  }
}
