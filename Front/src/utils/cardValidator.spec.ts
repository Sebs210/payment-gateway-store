import {
  detectCardBrand,
  luhnCheck,
  formatCardNumber,
  formatExpiry,
  validateExpiry,
} from './cardValidator';

describe('cardValidator', () => {
  describe('detectCardBrand', () => {
    it('should detect Visa', () => {
      expect(detectCardBrand('4242424242424242')).toBe('visa');
      expect(detectCardBrand('4111 1111 1111 1111')).toBe('visa');
    });

    it('should detect MasterCard', () => {
      expect(detectCardBrand('5500000000000004')).toBe('mastercard');
      expect(detectCardBrand('5100000000000000')).toBe('mastercard');
      expect(detectCardBrand('2221000000000000')).toBe('mastercard');
    });

    it('should return unknown for other cards', () => {
      expect(detectCardBrand('3782822463100050')).toBe('unknown');
      expect(detectCardBrand('')).toBe('unknown');
    });
  });

  describe('luhnCheck', () => {
    it('should validate correct card numbers', () => {
      expect(luhnCheck('4242424242424242')).toBe(true);
      expect(luhnCheck('4111111111111111')).toBe(true);
    });

    it('should reject invalid card numbers', () => {
      expect(luhnCheck('1234567890123456')).toBe(false);
      expect(luhnCheck('0000000000000000')).toBe(true); // luhn valid
    });

    it('should reject non-numeric and short strings', () => {
      expect(luhnCheck('abc')).toBe(false);
      expect(luhnCheck('123')).toBe(false);
      expect(luhnCheck('')).toBe(false);
    });

    it('should handle spaces in number', () => {
      expect(luhnCheck('4242 4242 4242 4242')).toBe(true);
    });
  });

  describe('formatCardNumber', () => {
    it('should format card number in groups of 4', () => {
      expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
    });

    it('should remove non-digits', () => {
      expect(formatCardNumber('4242-4242')).toBe('4242 4242');
    });

    it('should limit to 16 digits', () => {
      expect(formatCardNumber('42424242424242421234')).toBe('4242 4242 4242 4242');
    });
  });

  describe('formatExpiry', () => {
    it('should format as MM/YY', () => {
      expect(formatExpiry('1228')).toBe('12/28');
    });

    it('should handle partial input', () => {
      expect(formatExpiry('12')).toBe('12');
      expect(formatExpiry('1')).toBe('1');
    });

    it('should strip non-digits', () => {
      expect(formatExpiry('12/28')).toBe('12/28');
    });
  });

  describe('validateExpiry', () => {
    it('should accept future dates', () => {
      expect(validateExpiry('12', '30')).toBe(true);
    });

    it('should reject past dates', () => {
      expect(validateExpiry('01', '20')).toBe(false);
    });

    it('should reject invalid months', () => {
      expect(validateExpiry('13', '30')).toBe(false);
      expect(validateExpiry('00', '30')).toBe(false);
    });
  });
});
