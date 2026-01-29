import { useState } from 'react';
import { useAppDispatch } from '../../app/hooks';
import { setCardInfo, setCustomerInfo, setStep } from './checkoutSlice';
import {
  detectCardBrand,
  luhnCheck,
  formatCardNumber,
  formatExpiry,
  validateExpiry,
  CardBrand,
} from '../../utils/cardValidator';

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
    `w-full px-3 py-2.5 border rounded-lg text-sm outline-none transition-colors ${
      errors[field] ? 'border-error bg-red-50' : 'border-gray-300 focus:border-primary'
    }`;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md my-4 max-h-[95vh] overflow-y-auto">
        <div className="bg-primary text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-bold">Payment Details</h2>
          <button onClick={() => dispatch(setStep(1))} className="text-white/80 hover:text-white text-xl">
            &times;
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Card Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-text flex items-center gap-2">
              Credit Card
              {brand !== 'unknown' && (
                <img src={brandLogos[brand]} alt={brand} className="h-6" />
              )}
            </h3>

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
          <div className="space-y-3 pt-2 border-t border-gray-200">
            <h3 className="font-semibold text-text">Delivery Information</h3>

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
            onClick={handleSubmit}
            className="w-full bg-primary text-white py-3 rounded-lg font-bold text-base hover:bg-primary-light transition-colors"
          >
            Continue to Summary
          </button>
        </div>
      </div>
    </div>
  );
}
