import { render, screen, fireEvent } from '@testing-library/react';
import ProductCard, { formatPrice } from './ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    description: 'Test Description',
    priceCents: 15000000,
    imageUrl: 'https://example.com/image.jpg',
    stock: 10,
  };

  const onBuy = jest.fn();

  beforeEach(() => {
    onBuy.mockClear();
  });

  it('should render product name and description', () => {
    render(<ProductCard product={mockProduct} onBuy={onBuy} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('should display stock count', () => {
    render(<ProductCard product={mockProduct} onBuy={onBuy} />);
    expect(screen.getByText('10 in stock')).toBeInTheDocument();
  });

  it('should render buy button when in stock', () => {
    render(<ProductCard product={mockProduct} onBuy={onBuy} />);
    expect(screen.getByText('Pay with credit card')).toBeInTheDocument();
  });

  it('should show out of stock when stock is 0', () => {
    render(<ProductCard product={{ ...mockProduct, stock: 0 }} onBuy={onBuy} />);
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    expect(screen.queryByText('Pay with credit card')).not.toBeInTheDocument();
  });

  it('should call onBuy with product id and quantity', () => {
    render(<ProductCard product={mockProduct} onBuy={onBuy} />);
    fireEvent.click(screen.getByText('Pay with credit card'));
    expect(onBuy).toHaveBeenCalledWith('1', 1);
  });

  it('should increase quantity when + is clicked', () => {
    render(<ProductCard product={mockProduct} onBuy={onBuy} />);
    fireEvent.click(screen.getByText('+'));
    fireEvent.click(screen.getByText('Pay with credit card'));
    expect(onBuy).toHaveBeenCalledWith('1', 2);
  });

  it('should decrease quantity when - is clicked', () => {
    render(<ProductCard product={mockProduct} onBuy={onBuy} />);
    fireEvent.click(screen.getByText('+'));
    fireEvent.click(screen.getByText('+'));
    fireEvent.click(screen.getByText('-'));
    fireEvent.click(screen.getByText('Pay with credit card'));
    expect(onBuy).toHaveBeenCalledWith('1', 2);
  });

  it('should not go below quantity 1', () => {
    render(<ProductCard product={mockProduct} onBuy={onBuy} />);
    fireEvent.click(screen.getByText('-'));
    fireEvent.click(screen.getByText('Pay with credit card'));
    expect(onBuy).toHaveBeenCalledWith('1', 1);
  });
});

describe('formatPrice', () => {
  it('should format price in COP', () => {
    const formatted = formatPrice(15000000);
    expect(formatted).toContain('150.000');
  });

  it('should handle zero', () => {
    const formatted = formatPrice(0);
    expect(formatted).toContain('0');
  });
});
