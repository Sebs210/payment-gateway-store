import { useState } from 'react';
import { useAppDispatch } from '../../app/hooks';
import { setCardInfo, setCustomerInfo, setStep } from './checkoutSlice';
import {
  detectCardBrand,
  luhnCheck,
  formatCardNumber,
  formatExpiry,
  validateExpiry,
} from '../../utils/cardValidator';
import type { CardBrand } from '../../utils/cardValidator';

const brandLogos: Record<CardBrand, string> = {
  visa: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg',
  mastercard: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg',
  unknown: '',
};

interface FormData {
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  cvc: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function CreditCardModal() {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState<FormData>({
    cardNumber: '',
    cardHolder: '',
    expiry: '',
    cvc: '',
    email: '',
    fullName: '',
    phone: '',
    address: '',
    city: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const brand = detectCardBrand(form.cardNumber);

  const handleChange = (field: keyof FormData, value: string) => {
    let processed = value;
    if (field === 'cardNumber') processed = formatCardNumber(value);
    if (field === 'expiry') processed = formatExpiry(value);
    if (field === 'cvc') processed = value.replace(/\D/g, '').slice(0, 4);
    if (field === 'phone') processed = value.replace(/[^\d+\-\s()]/g, '');

    setForm((prev) => ({ ...prev, [field]: processed }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const rawNumber = form.cardNumber.replace(/\s/g, '');

    if (!rawNumber || rawNumber.length < 13) {
      newErrors.cardNumber = 'Enter a valid card number';
    } else if (!luhnCheck(rawNumber)) {
      newErrors.cardNumber = 'Invalid card number';
    }

    if (!form.cardHolder.trim()) newErrors.cardHolder = 'Required';
    if (!form.expiry || form.expiry.length < 5) {
      newErrors.expiry = 'Enter MM/YY';
    } else {
      const [month, year] = form.expiry.split('/');
      if (!validateExpiry(month, year)) newErrors.expiry = 'Card expired or invalid';
    }
    if (!form.cvc || form.cvc.length < 3) newErrors.cvc = 'Enter CVC';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Valid email required';
    if (!form.fullName.trim()) newErrors.fullName = 'Required';
    if (!form.phone.trim()) newErrors.phone = 'Required';
    if (!form.address.trim()) newErrors.address = 'Required';
    if (!form.city.trim()) newErrors.city = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const [expMonth, expYear] = form.expiry.split('/');
    const rawNumber = form.cardNumber.replace(/\s/g, '');

    dispatch(
      setCustomerInfo({
        email: form.email,
        fullName: form.fullName,
        phone: form.phone,
        address: form.address,
        city: form.city,
      }),
    );

    dispatch(
      setCardInfo({
        number: rawNumber,
        cvc: form.cvc,
        expMonth,
        expYear,
        cardHolder: form.cardHolder,
        lastFour: rawNumber.slice(-4),
        brand,
      }),
    );
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3 border-2 rounded-xl text-sm outline-none transition-all ${
      errors[field]
        ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
        : 'border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20'
    }`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md my-4 max-h-[95vh] overflow-y-auto animate-scale-in">
        <div className="bg-gradient-to-r from-primary to-primary-light text-white px-6 py-5 rounded-t-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <h2 className="text-xl font-bold">Payment Details</h2>
          </div>
          <button
            onClick={() => dispatch(setStep(1))}
            className="text-white/80 hover:text-white hover:scale-110 transition-all text-2xl w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Card Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Credit Card
              </h3>
              {brand !== 'unknown' && (
                <img src={brandLogos[brand]} alt={brand} className="h-7 opacity-80" />
              )}
            </div>

            <div>
              <input
                type="text"
                placeholder="Card Number"
                value={form.cardNumber}
                onChange={(e) => handleChange('cardNumber', e.target.value)}
                className={inputClass('cardNumber')}
                inputMode="numeric"
              />
              {errors.cardNumber && <p className="text-error text-xs mt-1">{errors.cardNumber}</p>}
            </div>

            <div>
              <input
                type="text"
                placeholder="Card Holder Name"
                value={form.cardHolder}
                onChange={(e) => handleChange('cardHolder', e.target.value)}
                className={inputClass('cardHolder')}
              />
              {errors.cardHolder && <p className="text-error text-xs mt-1">{errors.cardHolder}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={form.expiry}
                  onChange={(e) => handleChange('expiry', e.target.value)}
                  className={inputClass('expiry')}
                  inputMode="numeric"
                />
                {errors.expiry && <p className="text-error text-xs mt-1">{errors.expiry}</p>}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="CVC"
                  value={form.cvc}
                  onChange={(e) => handleChange('cvc', e.target.value)}
                  className={inputClass('cvc')}
                  inputMode="numeric"
                />
                {errors.cvc && <p className="text-error text-xs mt-1">{errors.cvc}</p>}
              </div>
            </div>
          </div>

          {/* Delivery Section */}
          <div className="space-y-4 pt-2 border-t-2 border-gray-100">
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Delivery Information
            </h3>

            <div>
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={inputClass('email')}
              />
              {errors.email && <p className="text-error text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <input
                type="text"
                placeholder="Full Name"
                value={form.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                className={inputClass('fullName')}
              />
              {errors.fullName && <p className="text-error text-xs mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <input
                type="tel"
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={inputClass('phone')}
              />
              {errors.phone && <p className="text-error text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
              <input
                type="text"
                placeholder="Delivery Address"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className={inputClass('address')}
              />
              {errors.address && <p className="text-error text-xs mt-1">{errors.address}</p>}
            </div>

            <div>
              <input
                type="text"
                placeholder="City"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className={inputClass('city')}
              />
              {errors.city && <p className="text-error text-xs mt-1">{errors.city}</p>}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-primary to-primary-light text-white py-4 rounded-xl font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            Continue to Summary
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
