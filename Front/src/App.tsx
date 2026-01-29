import { useAppSelector } from './app/hooks';
import ProductPage from './features/products/ProductPage';
import CreditCardModal from './features/checkout/CreditCardModal';
import SummaryBackdrop from './features/summary/SummaryBackdrop';
import TransactionResult from './features/transaction/TransactionResult';

export default function App() {
  const step = useAppSelector((s) => s.checkout.step);

  return (
    <>
      <ProductPage />
      {step === 2 && <CreditCardModal />}
      {step === 3 && <SummaryBackdrop />}
      {step === 4 && <TransactionResult />}
    </>
  );
}
