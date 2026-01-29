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
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-primary to-primary-light animate-fade-in">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Payment Summary</h2>
        <button
          onClick={() => dispatch(setStep(2))}
          className="text-white/80 hover:text-white text-sm font-medium hover:scale-105 transition-transform"
        >
          Back
        </button>
      </div>

      {/* Product preview section */}
      <div className="px-6 py-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex gap-4 items-center">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-20 h-20 object-cover rounded-xl shadow-md"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-base truncate">{product.name}</h3>
            <p className="text-white/70 text-sm mt-1">Quantity: {quantity}</p>
            <p className="text-white/70 text-sm">Card: •••• {cardInfo.lastFour}</p>
          </div>
        </div>
        <div className="mt-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5">
          <p className="text-white/90 text-sm">
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {customerInfo.address}, {customerInfo.city}
          </p>
        </div>
      </div>

      {/* Order details card */}
      <div className="flex-1 bg-white rounded-t-[2rem] p-6 shadow-2xl overflow-y-auto animate-slide-up">
        <h3 className="font-bold text-gray-900 text-lg mb-6">Order Details</h3>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">
                {product.name} x{quantity}
              </span>
              <span className="font-semibold text-gray-900">{formatPrice(amountCents)}</span>
            </div>
            <div className="h-px bg-gray-200" />
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Base Fee</span>
              <span className="font-medium text-gray-900">{formatPrice(baseFeeCents)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Delivery Fee</span>
              <span className="font-medium text-gray-900">{formatPrice(deliveryFeeCents)}</span>
            </div>
            <div className="h-px bg-gray-300 mt-2" />
            <div className="flex justify-between items-center pt-1">
              <span className="font-bold text-gray-900 text-lg">Total</span>
              <span className="font-bold text-primary text-xl">{formatPrice(totalCents)}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl p-4 text-sm font-medium animate-scale-in">
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full mt-6 bg-gradient-to-r from-secondary to-secondary-light text-white py-4 rounded-xl font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Pay {formatPrice(totalCents)}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
