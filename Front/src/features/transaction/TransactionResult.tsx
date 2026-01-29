import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { resetCheckout } from '../checkout/checkoutSlice';
import { clearTransaction } from './transactionSlice';
import { loadProducts } from '../products/productsSlice';
import { formatPrice } from '../products/ProductCard';

const statusConfig: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  APPROVED: { color: 'text-green-700', bg: 'bg-green-50', label: 'Payment Approved', icon: '✓' },
  DECLINED: { color: 'text-red-700', bg: 'bg-red-50', label: 'Payment Declined', icon: '✗' },
  ERROR: { color: 'text-red-700', bg: 'bg-red-50', label: 'Payment Error', icon: '!' },
  PENDING: { color: 'text-yellow-700', bg: 'bg-yellow-50', label: 'Payment Pending', icon: '⏳' },
  VOIDED: { color: 'text-gray-700', bg: 'bg-gray-50', label: 'Payment Voided', icon: '⊘' },
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
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-lg w-full max-w-md overflow-hidden">
        <div className={`${config.bg} px-6 py-8 text-center`}>
          <div className={`w-16 h-16 ${config.color} bg-white rounded-full flex items-center justify-center mx-auto text-3xl font-bold shadow-sm`}>
            {config.icon}
          </div>
          <h2 className={`text-xl font-bold mt-4 ${config.color}`}>{config.label}</h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Reference</span>
              <span className="font-mono font-medium">{transaction.reference}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Product Amount</span>
              <span className="font-medium">{formatPrice(transaction.amountCents)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Base Fee</span>
              <span className="font-medium">{formatPrice(transaction.baseFeeCents)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Delivery Fee</span>
              <span className="font-medium">{formatPrice(transaction.deliveryFeeCents)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-bold text-primary">{formatPrice(transaction.totalCents)}</span>
            </div>
          </div>

          {transaction.gatewayTransactionId && (
            <p className="text-xs text-text-muted text-center">
              Transaction ID: {transaction.gatewayTransactionId}
            </p>
          )}

          <button
            onClick={handleBackToStore}
            className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-light transition-colors"
          >
            Back to Store
          </button>
        </div>
      </div>
    </div>
  );
}
