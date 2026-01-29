import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  PaymentGatewayPort,
  TokenizeCardDto,
  CreateGatewayTransactionDto,
  GatewayTransactionResponse,
} from '../../../domain/ports/payment-gateway.port';

@Injectable()
export class WompiPaymentAdapter implements PaymentGatewayPort {
  private readonly baseUrl: string;
  private readonly publicKey: string;
  private readonly privateKey: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('PAYMENT_GATEWAY_API_URL', 'https://api-sandbox.co.uat.wompi.dev/v1');
    this.publicKey = this.config.get<string>('PAYMENT_GATEWAY_PUBLIC_KEY', 'pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7');
    this.privateKey = this.config.get<string>('PAYMENT_GATEWAY_PRIVATE_KEY', 'prv_stagtest_5i0ZGIGiFcDQifYsXxvsny7Y37tKqFWg');
  }

  async tokenizeCard(card: TokenizeCardDto): Promise<{ tokenId: string; brand: string }> {
    const response = await axios.post(
      `${this.baseUrl}/tokens/cards`,
      {
        number: card.number,
        cvc: card.cvc,
        exp_month: card.expMonth,
        exp_year: card.expYear,
        card_holder: card.cardHolder,
      },
      {
        headers: {
          Authorization: `Bearer ${this.publicKey}`,
        },
      },
    );

    return {
      tokenId: response.data.data.id,
      brand: response.data.data.brand,
    };
  }

  async getAcceptanceToken(): Promise<{ acceptanceToken: string; acceptPersonalAuth: string; permalink: string }> {
    const response = await axios.get(`${this.baseUrl}/merchants/${this.publicKey}`);
    const data = response.data.data;

    return {
      acceptanceToken: data.presigned_acceptance.acceptance_token,
      acceptPersonalAuth: data.presigned_personal_data_auth.acceptance_token,
      permalink: data.presigned_acceptance.permalink,
    };
  }

  async createTransaction(data: CreateGatewayTransactionDto): Promise<GatewayTransactionResponse> {
    const response = await axios.post(
      `${this.baseUrl}/transactions`,
      {
        amount_in_cents: data.amountInCents,
        currency: data.currency,
        customer_email: data.customerEmail,
        reference: data.reference,
        payment_method: {
          type: data.paymentMethod.type,
          installments: data.paymentMethod.installments,
          token: data.paymentMethod.token,
        },
        acceptance_token: data.acceptanceToken,
        accept_personal_auth: data.acceptPersonalAuth,
      },
      {
        headers: {
          Authorization: `Bearer ${this.privateKey}`,
        },
      },
    );

    const txData = response.data.data;
    return {
      id: txData.id,
      status: txData.status,
      reference: txData.reference,
      amountInCents: txData.amount_in_cents,
    };
  }

  async getTransaction(transactionId: string): Promise<GatewayTransactionResponse> {
    const response = await axios.get(`${this.baseUrl}/transactions/${transactionId}`, {
      headers: {
        Authorization: `Bearer ${this.privateKey}`,
      },
    });

    const txData = response.data.data;
    return {
      id: txData.id,
      status: txData.status,
      reference: txData.reference,
      amountInCents: txData.amount_in_cents,
    };
  }
}
