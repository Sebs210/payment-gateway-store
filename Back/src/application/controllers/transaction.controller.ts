import { Controller, Post, Get, Param, Body, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateTransactionDto } from '../dtos/create-transaction.dto';
import { CompletePaymentDto } from '../dtos/complete-payment.dto';
import { TokenizeCardDto } from '../dtos/tokenize-card.dto';
import { CreateTransactionUseCase } from '../../domain/use-cases/create-transaction.use-case';
import { CompletePaymentUseCase } from '../../domain/use-cases/complete-payment.use-case';
import { PAYMENT_GATEWAY } from '../../domain/ports/payment-gateway.port';
import type { PaymentGatewayPort } from '../../domain/ports/payment-gateway.port';
import { TRANSACTION_REPOSITORY } from '../../domain/ports/transaction.repository.port';
import type { TransactionRepositoryPort } from '../../domain/ports/transaction.repository.port';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly completePaymentUseCase: CompletePaymentUseCase,
    @Inject(PAYMENT_GATEWAY) private readonly paymentGateway: PaymentGatewayPort,
    @Inject(TRANSACTION_REPOSITORY) private readonly transactionRepo: TransactionRepositoryPort,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction in PENDING status' })
  async create(@Body() dto: CreateTransactionDto) {
    const result = await this.createTransactionUseCase.execute({
      productId: dto.productId,
      quantity: dto.quantity,
      customerEmail: dto.customerEmail,
      customerFullName: dto.customerFullName,
      customerPhone: dto.customerPhone,
      customerAddress: dto.customerAddress,
      customerCity: dto.customerCity,
    });

    if (result.isFailure()) {
      throw new HttpException(result.getError(), HttpStatus.BAD_REQUEST);
    }

    return result.getValue();
  }

  @Post(':id/pay')
  @ApiOperation({ summary: 'Complete payment for a transaction via payment gateway' })
  async pay(@Param('id') id: string, @Body() dto: CompletePaymentDto) {
    const result = await this.completePaymentUseCase.execute({
      transactionId: id,
      cardToken: dto.cardToken,
      installments: dto.installments,
      acceptanceToken: dto.acceptanceToken,
      acceptPersonalAuth: dto.acceptPersonalAuth,
    });

    if (result.isFailure()) {
      throw new HttpException(result.getError(), HttpStatus.BAD_REQUEST);
    }

    return result.getValue();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  async findById(@Param('id') id: string) {
    const transaction = await this.transactionRepo.findById(id);
    if (!transaction) {
      throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
    }
    return transaction;
  }

  @Post('tokenize')
  @ApiOperation({ summary: 'Tokenize a credit card via payment gateway' })
  async tokenize(@Body() dto: TokenizeCardDto) {
    try {
      return await this.paymentGateway.tokenizeCard(dto);
    } catch (error) {
      const detail = error.response?.data || error.message || 'Unknown error';
      console.error('Tokenization error:', JSON.stringify(detail));
      throw new HttpException(
        { message: 'Card tokenization failed', detail },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('acceptance/token')
  @ApiOperation({ summary: 'Get payment gateway acceptance tokens' })
  async getAcceptanceToken() {
    return this.paymentGateway.getAcceptanceToken();
  }
}
