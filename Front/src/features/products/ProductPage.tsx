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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 animate-fade-in">
      <header className="bg-gradient-to-r from-primary to-primary-light text-white py-8 px-4 shadow-xl">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <div>
              <h1 className="text-3xl font-bold">Tech Store</h1>
              <p className="text-sm text-white/90 mt-1">Find the best tech products</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-600 font-medium">Loading products...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 rounded-xl p-5 text-center shadow-sm">
            <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} onBuy={handleBuy} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
