import { Inject, Injectable } from '@nestjs/common';
import { Result } from './result';
import { Transaction, TransactionStatus } from '../entities/transaction.entity';
import { TRANSACTION_REPOSITORY, TransactionRepositoryPort } from '../ports/transaction.repository.port';
import { PAYMENT_GATEWAY, PaymentGatewayPort } from '../ports/payment-gateway.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';
import { DELIVERY_REPOSITORY, DeliveryRepositoryPort } from '../ports/delivery.repository.port';
import { CUSTOMER_REPOSITORY, CustomerRepositoryPort } from '../ports/customer.repository.port';

export interface CompletePaymentInput {
  transactionId: string;
  cardToken: string;
  installments: number;
  acceptanceToken: string;
  acceptPersonalAuth: string;
}

@Injectable()
export class CompletePaymentUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly transactionRepo: TransactionRepositoryPort,
    @Inject(PAYMENT_GATEWAY) private readonly paymentGateway: PaymentGatewayPort,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: ProductRepositoryPort,
    @Inject(DELIVERY_REPOSITORY) private readonly deliveryRepo: DeliveryRepositoryPort,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepo: CustomerRepositoryPort,
  ) {}

  async execute(input: CompletePaymentInput): Promise<Result<Transaction>> {
    // Step 1: Find transaction
    const transaction = await this.transactionRepo.findById(input.transactionId);
    if (!transaction) {
      return Result.fail('Transaction not found');
    }
    if (transaction.status !== TransactionStatus.PENDING) {
      return Result.fail('Transaction is not in PENDING status');
    }

    // Step 2: Call payment gateway to create payment
    let gatewayResponse;
    try {
      gatewayResponse = await this.paymentGateway.createTransaction({
        amountInCents: transaction.totalCents,
        currency: 'COP',
        customerEmail: transaction.customer.email,
        reference: transaction.reference,
        paymentMethod: {
          type: 'CARD',
          installments: input.installments,
          token: input.cardToken,
        },
        acceptanceToken: input.acceptanceToken,
        acceptPersonalAuth: input.acceptPersonalAuth,
      });
    } catch (error) {
      await this.transactionRepo.updateStatus(transaction.id, TransactionStatus.ERROR);
      return Result.fail(`Payment gateway error: ${error.message || 'Unknown error'}`);
    }

    // Step 3: Map gateway status to our status
    const statusMap: Record<string, TransactionStatus> = {
      APPROVED: TransactionStatus.APPROVED,
      DECLINED: TransactionStatus.DECLINED,
      ERROR: TransactionStatus.ERROR,
      VOIDED: TransactionStatus.VOIDED,
      PENDING: TransactionStatus.PENDING,
    };
    const newStatus = statusMap[gatewayResponse.status] || TransactionStatus.PENDING;

    // Step 4: Update transaction
    const updatedTransaction = await this.transactionRepo.updateStatus(
      transaction.id,
      newStatus,
      gatewayResponse.id,
    );

    // Step 5: If approved, update stock and create delivery
    if (newStatus === TransactionStatus.APPROVED) {
      await this.productRepo.updateStock(transaction.productId, transaction.quantity);

      const customer = await this.customerRepo.findById(transaction.customerId);
      if (customer) {
        await this.deliveryRepo.create({
          transactionId: transaction.id,
          customerId: customer.id,
          address: customer.address,
          city: customer.city,
        });
      }
    }

    return Result.ok(updatedTransaction);
  }
}
