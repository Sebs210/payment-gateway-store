import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Result } from './result';
import { Transaction, TransactionStatus } from '../entities/transaction.entity';
import { PRODUCT_REPOSITORY } from '../ports/product.repository.port';
import type { ProductRepositoryPort } from '../ports/product.repository.port';
import { CUSTOMER_REPOSITORY } from '../ports/customer.repository.port';
import type { CustomerRepositoryPort } from '../ports/customer.repository.port';
import { TRANSACTION_REPOSITORY } from '../ports/transaction.repository.port';
import type { TransactionRepositoryPort } from '../ports/transaction.repository.port';

export interface CreateTransactionInput {
  productId: string;
  quantity: number;
  customerEmail: string;
  customerFullName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
}

const BASE_FEE_CENTS = 500000; // $5,000 COP base fee
const DELIVERY_FEE_CENTS = 1000000; // $10,000 COP delivery fee

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: ProductRepositoryPort,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepo: CustomerRepositoryPort,
    @Inject(TRANSACTION_REPOSITORY) private readonly transactionRepo: TransactionRepositoryPort,
  ) {}

  async execute(input: CreateTransactionInput): Promise<Result<Transaction>> {
    // Step 1: Validate product exists and has stock
    const product = await this.productRepo.findById(input.productId);
    if (!product) {
      return Result.fail('Product not found');
    }
    if (product.stock < input.quantity) {
      return Result.fail('Insufficient stock');
    }

    // Step 2: Find or create customer
    let customer = await this.customerRepo.findByEmail(input.customerEmail);
    if (!customer) {
      customer = await this.customerRepo.create({
        email: input.customerEmail,
        fullName: input.customerFullName,
        phone: input.customerPhone,
        address: input.customerAddress,
        city: input.customerCity,
      });
    }

    // Step 3: Calculate amounts
    const amountCents = product.priceCents * input.quantity;
    const totalCents = amountCents + BASE_FEE_CENTS + DELIVERY_FEE_CENTS;

    // Step 4: Create transaction in PENDING
    const reference = `TXN-${uuidv4().substring(0, 8).toUpperCase()}`;
    const transaction = await this.transactionRepo.create({
      reference,
      customerId: customer.id,
      productId: product.id,
      quantity: input.quantity,
      amountCents,
      baseFeeCents: BASE_FEE_CENTS,
      deliveryFeeCents: DELIVERY_FEE_CENTS,
      totalCents,
      status: TransactionStatus.PENDING,
    });

    return Result.ok(transaction);
  }
}
