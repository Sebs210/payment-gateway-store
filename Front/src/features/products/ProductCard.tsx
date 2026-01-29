import { useState } from 'react';
import { Product } from '../../services/api';

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
    <div className="bg-surface rounded-2xl shadow-md overflow-hidden flex flex-col transition-transform hover:scale-[1.02]">
      <div className="relative w-full h-48 bg-gray-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {outOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-lg text-text">{product.name}</h3>
        <p className="text-text-muted text-sm mt-1 flex-1 line-clamp-2">{product.description}</p>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-primary font-bold text-xl">{formatPrice(product.priceCents)}</span>
          <span className="text-text-muted text-sm">{product.stock} in stock</span>
        </div>

        {!outOfStock && (
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                className="px-3 py-1 text-lg font-bold text-primary hover:bg-gray-100 rounded-l-lg"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </button>
              <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">{quantity}</span>
              <button
                className="px-3 py-1 text-lg font-bold text-primary hover:bg-gray-100 rounded-r-lg"
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              >
                +
              </button>
            </div>

            <button
              onClick={() => onBuy(product.id, quantity)}
              className="flex-1 bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary-light transition-colors text-sm"
            >
              Pay with credit card
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export { formatPrice };
