import type { Product } from '../domain/product.js';

export interface ProductSource {
  listProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | null>;
  listCategories(): Promise<string[]>;
}
