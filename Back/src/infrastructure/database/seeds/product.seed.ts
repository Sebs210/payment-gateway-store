import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../../domain/entities/product.entity';

@Injectable()
export class ProductSeed {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async seed() {
    const count = await this.productRepo.count();
    if (count > 0) return;

    const products: Partial<Product>[] = [
      {
        name: 'Wireless Bluetooth Headphones',
        description: 'Premium wireless headphones with active noise cancellation, 30-hour battery life, and comfortable over-ear design. Perfect for music lovers and remote workers.',
        priceCents: 15000000,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        stock: 25,
      },
      {
        name: 'Smart Fitness Watch',
        description: 'Advanced fitness tracker with heart rate monitor, GPS, sleep tracking, and 7-day battery life. Water resistant up to 50 meters.',
        priceCents: 25000000,
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
        stock: 15,
      },
      {
        name: 'Portable Bluetooth Speaker',
        description: 'Compact waterproof speaker with 360° sound, 12-hour playtime, and built-in microphone. Ideal for outdoor adventures.',
        priceCents: 8000000,
        imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500',
        stock: 40,
      },
      {
        name: 'Mechanical Gaming Keyboard',
        description: 'RGB backlit mechanical keyboard with Cherry MX switches, programmable macros, and aircraft-grade aluminum frame.',
        priceCents: 12000000,
        imageUrl: 'https://images.unsplash.com/photo-1541140532154-b024d1c0c78e?w=500',
        stock: 30,
      },
      {
        name: 'USB-C Hub Adapter',
        description: 'Multi-port USB-C hub with HDMI 4K, 3 USB 3.0 ports, SD card reader, and 100W power delivery pass-through.',
        priceCents: 6500000,
        imageUrl: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=500',
        stock: 50,
      },
      {
        name: 'Wireless Charging Pad',
        description: 'Fast wireless charger compatible with all Qi-enabled devices. Sleek minimalist design with LED indicator and overheat protection.',
        priceCents: 4500000,
        imageUrl: 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?w=500',
        stock: 60,
      },
    ];

    await this.productRepo.save(products.map((p) => this.productRepo.create(p)));
    console.log('Products seeded successfully');
  }
}
