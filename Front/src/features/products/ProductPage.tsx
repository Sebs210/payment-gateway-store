import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { loadProducts } from './productsSlice';
import { selectProduct } from '../checkout/checkoutSlice';
import ProductCard from './ProductCard';

export default function ProductPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.products);

  useEffect(() => {
    dispatch(loadProducts());
  }, [dispatch]);

  const handleBuy = (productId: string, quantity: number) => {
    dispatch(selectProduct({ productId, quantity }));
  };

  return (
    <div className="min-h-screen bg-bg">
      <header className="bg-primary text-white py-6 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">Tech Store</h1>
          <p className="text-sm opacity-80 mt-1">Find the best tech products</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-error rounded-lg p-4 text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} onBuy={handleBuy} />
          ))}
        </div>
      </main>
    </div>
  );
}
