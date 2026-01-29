export type CardBrand = 'visa' | 'mastercard' | 'unknown';

export const detectCardBrand = (number: string): CardBrand => {
  const cleaned = number.replace(/\s/g, '');
  if (/^4/.test(cleaned)) return 'visa';
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard';
  return 'unknown';
};

export const luhnCheck = (number: string): boolean => {
  const cleaned = number.replace(/\s/g, '');
  if (!/^\d+$/.test(cleaned) || cleaned.length < 13) return false;

  let sum = 0;
  let isEven = false;
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
};

export const formatCardNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, '').slice(0, 16);
  return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
};

export const formatExpiry = (value: string): string => {
  const cleaned = value.replace(/\D/g, '').slice(0, 4);
  if (cleaned.length >= 3) {
    return cleaned.slice(0, 2) + '/' + cleaned.slice(2);
  }
  return cleaned;
};

export const validateExpiry = (month: string, year: string): boolean => {
  const m = parseInt(month, 10);
  const y = parseInt('20' + year, 10);
  if (m < 1 || m > 12) return false;
  const now = new Date();
  const expDate = new Date(y, m);
  return expDate > now;
};
