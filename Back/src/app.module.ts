import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './infrastructure/config/configuration';

// Entities
import { Product } from './domain/entities/product.entity';
import { Customer } from './domain/entities/customer.entity';
import { Transaction } from './domain/entities/transaction.entity';
import { Delivery } from './domain/entities/delivery.entity';

// Ports
import { PRODUCT_REPOSITORY } from './domain/ports/product.repository.port';
import { CUSTOMER_REPOSITORY } from './domain/ports/customer.repository.port';
import { TRANSACTION_REPOSITORY } from './domain/ports/transaction.repository.port';
import { DELIVERY_REPOSITORY } from './domain/ports/delivery.repository.port';
import { PAYMENT_GATEWAY } from './domain/ports/payment-gateway.port';

// Adapters
import { ProductRepository } from './infrastructure/adapters/postgres/product.repository';
import { CustomerRepository } from './infrastructure/adapters/postgres/customer.repository';
import { TransactionRepository } from './infrastructure/adapters/postgres/transaction.repository';
import { DeliveryRepository } from './infrastructure/adapters/postgres/delivery.repository';
import { WompiPaymentAdapter } from './infrastructure/adapters/wompi/wompi-payment.adapter';

// Use Cases
import { CreateTransactionUseCase } from './domain/use-cases/create-transaction.use-case';
import { CompletePaymentUseCase } from './domain/use-cases/complete-payment.use-case';

// Controllers
import { ProductController } from './application/controllers/product.controller';
import { TransactionController } from './application/controllers/transaction.controller';

// Seeds
import { ProductSeed } from './infrastructure/database/seeds/product.seed';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.host'),
        port: config.get('database.port'),
        username: config.get('database.username'),
        password: config.get('database.password'),
        database: config.get('database.database'),
        entities: [Product, Customer, Transaction, Delivery],
        synchronize: true,
        ssl: config.get('database.host') !== 'localhost' ? { rejectUnauthorized: false } : false,
      }),
    }),
    TypeOrmModule.forFeature([Product, Customer, Transaction, Delivery]),
  ],
  controllers: [ProductController, TransactionController],
  providers: [
    { provide: PRODUCT_REPOSITORY, useClass: ProductRepository },
    { provide: CUSTOMER_REPOSITORY, useClass: CustomerRepository },
    { provide: TRANSACTION_REPOSITORY, useClass: TransactionRepository },
    { provide: DELIVERY_REPOSITORY, useClass: DeliveryRepository },
    { provide: PAYMENT_GATEWAY, useClass: WompiPaymentAdapter },
    CreateTransactionUseCase,
    CompletePaymentUseCase,
    ProductSeed,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly productSeed: ProductSeed) {}

  async onModuleInit() {
    await this.productSeed.seed();
  }
}
