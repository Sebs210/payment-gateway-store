import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { resetCheckout } from '../checkout/checkoutSlice';
import { clearTransaction } from './transactionSlice';
import { loadProducts } from '../products/productsSlice';
import { formatPrice } from '../products/ProductCard';

// SVG Icons
const CheckIcon = () => (
  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const BanIcon = () => (
  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </svg>
);

const statusConfig: Record<string, { color: string; bg: string; label: string; icon: React.ReactElement }> = {
  APPROVED: { color: 'text-green-600', bg: 'bg-gradient-to-br from-green-50 to-green-100', label: 'Payment Approved', icon: <CheckIcon /> },
  DECLINED: { color: 'text-red-600', bg: 'bg-gradient-to-br from-red-50 to-red-100', label: 'Payment Declined', icon: <XIcon /> },
  ERROR: { color: 'text-red-600', bg: 'bg-gradient-to-br from-red-50 to-red-100', label: 'Payment Error', icon: <AlertIcon /> },
  PENDING: { color: 'text-amber-600', bg: 'bg-gradient-to-br from-amber-50 to-amber-100', label: 'Payment Pending', icon: <ClockIcon /> },
  VOIDED: { color: 'text-gray-600', bg: 'bg-gradient-to-br from-gray-50 to-gray-100', label: 'Payment Voided', icon: <BanIcon /> },
};

export default function TransactionResult() {
  const dispatch = useAppDispatch();
  const transaction = useAppSelector((s) => s.transaction.current);

  if (!transaction) return null;

  const config = statusConfig[transaction.status] || statusConfig.ERROR;

  const handleBackToStore = () => {
    dispatch(clearTransaction());
    dispatch(resetCheckout());
    dispatch(loadProducts());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-scale-in">
        <div className={`${config.bg} px-6 py-12 text-center relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12" />
          </div>
          <div className={`w-20 h-20 ${config.color} bg-white rounded-full flex items-center justify-center mx-auto shadow-lg relative z-10 animate-bounce-in`}>
            {config.icon}
          </div>
          <h2 className={`text-2xl font-bold mt-6 ${config.color} relative z-10`}>{config.label}</h2>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Reference</span>
              <span className="font-mono font-semibold text-gray-900 text-xs">{transaction.reference}</span>
            </div>
            <div className="h-px bg-gray-200" />
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Product Amount</span>
              <span className="font-semibold text-gray-900">{formatPrice(transaction.amountCents)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Base Fee</span>
              <span className="font-semibold text-gray-900">{formatPrice(transaction.baseFeeCents)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Delivery Fee</span>
              <span className="font-semibold text-gray-900">{formatPrice(transaction.deliveryFeeCents)}</span>
            </div>
            <div className="h-px bg-gray-300 my-2" />
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-900 text-lg">Total</span>
              <span className="font-bold text-primary text-xl">{formatPrice(transaction.totalCents)}</span>
            </div>
          </div>

          {transaction.gatewayTransactionId && (
            <p className="text-xs text-gray-500 text-center bg-gray-50 rounded-lg py-2 px-3">
              Transaction ID: <span className="font-mono">{transaction.gatewayTransactionId}</span>
            </p>
          )}

          <button
            onClick={handleBackToStore}
            className="w-full bg-gradient-to-r from-primary to-primary-light text-white py-4 rounded-xl font-bold text-base hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Back to Store
          </button>
        </div>
      </div>
    </div>
  );
}
