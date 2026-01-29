export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';

export interface TokenizeCardDto {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
}

export interface CreateGatewayTransactionDto {
  amountInCents: number;
  currency: string;
  customerEmail: string;
  reference: string;
  paymentMethod: {
    type: string;
    installments: number;
    token: string;
  };
  acceptanceToken: string;
  acceptPersonalAuth: string;
  signature?: string;
}

export interface GatewayTransactionResponse {
  id: string;
  status: string;
  reference: string;
  amountInCents: number;
}

export interface PaymentGatewayPort {
  tokenizeCard(card: TokenizeCardDto): Promise<{ tokenId: string; brand: string }>;
  getAcceptanceToken(): Promise<{ acceptanceToken: string; acceptPersonalAuth: string; permalink: string }>;
  createTransaction(data: CreateGatewayTransactionDto): Promise<GatewayTransactionResponse>;
  getTransaction(transactionId: string): Promise<GatewayTransactionResponse>;
}
