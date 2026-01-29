import { Delivery } from '../entities/delivery.entity';

export const DELIVERY_REPOSITORY = 'DELIVERY_REPOSITORY';

export interface DeliveryRepositoryPort {
  create(delivery: Partial<Delivery>): Promise<Delivery>;
  findByTransactionId(transactionId: string): Promise<Delivery | null>;
}
