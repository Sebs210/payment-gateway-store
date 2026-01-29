import { useState } from 'react';
import type { Product } from '../../services/api';

interface ProductCardProps {
  product: Product;
  onBuy: (productId: string, quantity: number) => void;
}

const formatPrice = (cents: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(cents / 100);
};

export default function ProductCard({ product, onBuy }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const outOfStock = product.stock === 0;

  return (
    <div className="group bg-white rounded-2xl shadow-md hover:shadow-2xl overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.03] animate-fade-in">
      <div className="relative w-full h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        {outOfStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white/90 px-6 py-3 rounded-full">
              <span className="text-gray-900 font-bold text-base">Out of Stock</span>
            </div>
          </div>
        )}
        {!outOfStock && product.stock < 10 && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            Only {product.stock} left
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors">{product.name}</h3>
        <p className="text-gray-600 text-sm mt-2 flex-1 line-clamp-2 leading-relaxed">{product.description}</p>

        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-primary font-bold text-2xl">{formatPrice(product.priceCents)}</span>
          <span className="text-gray-500 text-sm flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            {product.stock} in stock
          </span>
        </div>

        {!outOfStock && (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary transition-colors">
              <button
                className="px-4 py-2 text-lg font-bold text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="px-4 py-2 text-sm font-semibold min-w-[3rem] text-center border-x-2 border-gray-200">{quantity}</span>
              <button
                className="px-4 py-2 text-lg font-bold text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              onClick={() => onBuy(product.id, quantity)}
              className="flex-1 bg-gradient-to-r from-primary to-primary-light text-white py-2.5 px-4 rounded-xl font-bold hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Buy Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export { formatPrice };
