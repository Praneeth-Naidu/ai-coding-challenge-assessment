import { z } from 'zod';
import { AppError } from '../domain/errors.js';
import type { Product } from '../domain/product.js';
import type { ProductSource } from '../ports/productSource.js';
import { ProductSchema, ProductsSchema } from './productSchema.js';

const ProductsCategoriesSchema = z.array(z.string().min(1));

export class FakeStoreProductSource implements ProductSource {
  constructor(private readonly baseUrl: string) {}

  async listProducts(): Promise<Product[]> {
    const payload = await this.request('/products');
    const parsed = ProductsSchema.safeParse(payload);
    if (!parsed.success) {
      throw new AppError(502, 'UPSTREAM_INVALID_RESPONSE', 'The product provider returned an invalid catalogue.');
    }
    return parsed.data;
  }

  async getProduct(id: number): Promise<Product | null> {
    const payload = await this.request(`/products/${id}`, true);
    if (payload === null) return null;
    const parsed = ProductSchema.safeParse(payload);
    if (!parsed.success) {
      throw new AppError(502, 'UPSTREAM_INVALID_RESPONSE', 'The product provider returned an invalid product.');
    }
    return parsed.data;
  }

  async listCategories(): Promise<string[]> {
    const payload = await this.request('/products/categories');
    const parsed = ProductsCategoriesSchema.safeParse(payload);
    if (!parsed.success) {
      throw new AppError(502, 'UPSTREAM_INVALID_RESPONSE', 'The product provider returned invalid categories.');
    }
    return parsed.data;
  }

  private async request(path: string, allowNotFound = false): Promise<unknown> {
    try {
      const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}${path}`, {
        signal: AbortSignal.timeout(5_000),
        headers: { accept: 'application/json' }
      });
      if (allowNotFound && response.status === 404) return null;
      if (!response.ok) {
        throw new AppError(502, 'UPSTREAM_UNAVAILABLE', `The product provider returned HTTP ${response.status}.`);
      }
      return await response.json() as unknown;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(502, 'UPSTREAM_UNAVAILABLE', 'The product provider could not be reached.');
    }
  }
}

