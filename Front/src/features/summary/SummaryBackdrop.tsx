import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  setStep,
  setTransactionId,
  setLoading,
  setError,
} from '../checkout/checkoutSlice';
import { setTransaction } from '../transaction/transactionSlice';
import {
  createTransaction,
  tokenizeCard,
  getAcceptanceToken,
  completePayment,
} from '../../services/api';
import { formatPrice } from '../products/ProductCard';

export default function SummaryBackdrop() {
  const dispatch = useAppDispatch();
  const { selectedProductId, quantity, customerInfo, cardInfo, loading, error } =
    useAppSelector((s) => s.checkout);
  const products = useAppSelector((s) => s.products.items);

  const product = products.find((p) => p.id === selectedProductId);

  if (!product || !customerInfo || !cardInfo) return null;

  const amountCents = product.priceCents * quantity;
  const baseFeeCents = 500000;
  const deliveryFeeCents = 1000000;
  const totalCents = amountCents + baseFeeCents + deliveryFeeCents;

  const handlePay = async () => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      // Step 1: Create pending transaction in backend
      const transaction = await createTransaction({
        productId: product.id,
        quantity,
        customerEmail: customerInfo.email,
        customerFullName: customerInfo.fullName,
        customerPhone: customerInfo.phone,
        customerAddress: customerInfo.address,
        customerCity: customerInfo.city,
      });
      dispatch(setTransactionId(transaction.id));

      // Step 2: Tokenize card via backend (which calls payment gateway)
      const { tokenId } = await tokenizeCard({
        number: cardInfo.number,
        cvc: cardInfo.cvc,
        expMonth: cardInfo.expMonth,
        expYear: cardInfo.expYear,
        cardHolder: cardInfo.cardHolder,
      });

      // Step 3: Get acceptance tokens
      const { acceptanceToken, acceptPersonalAuth } = await getAcceptanceToken();

      // Step 4: Complete payment via payment gateway
      const result = await completePayment(transaction.id, {
        cardToken: tokenId,
        installments: 1,
        acceptanceToken,
        acceptPersonalAuth,
      });

      dispatch(setTransaction(result));
      dispatch(setStep(4));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment failed. Please try again.';
      dispatch(setError(msg));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop back layer */}
      <div className="bg-primary text-white px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Payment Summary</h2>
        <button onClick={() => dispatch(setStep(2))} className="text-white/80 hover:text-white text-sm">
          Back
        </button>
      </div>

      <div className="bg-primary/10 px-6 py-3">
        <p className="text-sm text-text-muted">Product: <strong className="text-text">{product.name}</strong></p>
        <p className="text-sm text-text-muted mt-1">Card: **** {cardInfo.lastFour} ({cardInfo.brand.toUpperCase()})</p>
        <p className="text-sm text-text-muted mt-1">Deliver to: {customerInfo.address}, {customerInfo.city}</p>
      </div>

      {/* Front layer */}
      <div className="flex-1 bg-surface rounded-t-3xl -mt-1 p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] overflow-y-auto">
        <h3 className="font-bold text-text text-lg mb-4">Order Details</h3>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-text-muted">
              {product.name} x{quantity}
            </span>
            <span className="font-medium">{formatPrice(amountCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Base Fee</span>
            <span className="font-medium">{formatPrice(baseFeeCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Delivery Fee</span>
            <span className="font-medium">{formatPrice(deliveryFeeCents)}</span>
          </div>
          <div className="border-t border-gray-200 pt-3 flex justify-between">
            <span className="font-bold text-text text-lg">Total</span>
            <span className="font-bold text-primary text-lg">{formatPrice(totalCents)}</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-error rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full mt-6 bg-secondary text-white py-3.5 rounded-xl font-bold text-base hover:bg-secondary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ${formatPrice(totalCents)}`
          )}
        </button>
      </div>
    </div>
  );
}
