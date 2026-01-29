import { Transaction, TransactionStatus } from '../entities/transaction.entity';

export const TRANSACTION_REPOSITORY = 'TRANSACTION_REPOSITORY';

export interface TransactionRepositoryPort {
  create(transaction: Partial<Transaction>): Promise<Transaction>;
  findById(id: string): Promise<Transaction | null>;
  findByReference(reference: string): Promise<Transaction | null>;
  updateStatus(id: string, status: TransactionStatus, gatewayTransactionId?: string): Promise<Transaction | null>;
}
