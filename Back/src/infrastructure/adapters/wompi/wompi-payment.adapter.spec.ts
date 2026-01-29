import { ConfigService } from '@nestjs/config';
import { WompiPaymentAdapter } from './wompi-payment.adapter';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WompiPaymentAdapter', () => {
  let adapter: WompiPaymentAdapter;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string, defaultValue?: string) => defaultValue),
    } as any;
    adapter = new WompiPaymentAdapter(configService);
  });

  describe('tokenizeCard', () => {
    it('should call payment gateway API and return token', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          data: { id: 'tok_123', brand: 'VISA', last_four: '4242', expires_at: '2025-12-31' },
        },
      });

      const result = await adapter.tokenizeCard({
        number: '4242424242424242',
        cvc: '123',
        expMonth: '12',
        expYear: '28',
        cardHolder: 'Test User',
      });

      expect(result.tokenId).toBe('tok_123');
      expect(result.brand).toBe('VISA');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/tokens/cards'),
        expect.objectContaining({ number: '4242424242424242' }),
        expect.any(Object),
      );
    });
  });

  describe('getAcceptanceToken', () => {
    it('should return acceptance tokens', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          data: {
            presigned_acceptance: { acceptance_token: 'acc_tok', permalink: 'http://link', type: 'END_USER_POLICY' },
            presigned_personal_data_auth: { acceptance_token: 'auth_tok', permalink: 'http://link2', type: 'PERSONAL_DATA_AUTH' },
          },
        },
      });

      const result = await adapter.getAcceptanceToken();
      expect(result.acceptanceToken).toBe('acc_tok');
      expect(result.acceptPersonalAuth).toBe('auth_tok');
    });
  });

  describe('createTransaction', () => {
    it('should create transaction via payment gateway', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          data: { id: 'wompi-1', status: 'APPROVED', reference: 'TXN-ABC', amount_in_cents: 11500000 },
        },
      });

      const result = await adapter.createTransaction({
        amountInCents: 11500000,
        currency: 'COP',
        customerEmail: 'test@test.com',
        reference: 'TXN-ABC',
        paymentMethod: { type: 'CARD', installments: 1, token: 'tok_123' },
        acceptanceToken: 'acc',
        acceptPersonalAuth: 'auth',
      });

      expect(result.id).toBe('wompi-1');
      expect(result.status).toBe('APPROVED');
    });
  });

  describe('getTransaction', () => {
    it('should fetch transaction by id', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          data: { id: 'wompi-1', status: 'APPROVED', reference: 'TXN-ABC', amount_in_cents: 11500000 },
        },
      });

      const result = await adapter.getTransaction('wompi-1');
      expect(result.id).toBe('wompi-1');
      expect(result.status).toBe('APPROVED');
    });
  });
});
