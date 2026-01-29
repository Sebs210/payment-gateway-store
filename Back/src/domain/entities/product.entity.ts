import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('int')
  priceCents: number;

  @Column()
  imageUrl: string;

  @Column('int')
  stock: number;

  @CreateDateColumn()
  createdAt: Date;
}
