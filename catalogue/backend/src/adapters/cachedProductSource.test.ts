import { describe, expect, it, vi } from 'vitest';
import type { Product } from '../domain/product.js';
import type { ProductSource } from '../ports/productSource.js';
import { CachedProductSource } from './cachedProductSource.js';

const sample: Product = {
  id: 1, title: 'One', price: 1, description: 'One', category: 'x', image: '', rating: { rate: 4, count: 2 }
};

function source(overrides: Partial<ProductSource> = {}): ProductSource {
  return {
    listProducts: vi.fn(async () => [sample]),
    getProduct: vi.fn(async () => sample),
    listCategories: vi.fn(async () => ['x']),
    ...overrides
  };
}

describe('CachedProductSource', () => {
  it('serves repeated reads from the cache', async () => {
    const inner = source();
    const cached = new CachedProductSource(inner, 30, () => 1_000);
    await cached.listProducts();
    await cached.listProducts();
    expect(inner.listProducts).toHaveBeenCalledTimes(1);
  });

  it('reloads after expiry', async () => {
    let now = 1_000;
    const inner = source();
    const cached = new CachedProductSource(inner, 1, () => now);
    await cached.listProducts();
    now = 2_001;
    await cached.listProducts();
    expect(inner.listProducts).toHaveBeenCalledTimes(2);
  });

  it('does not cache a failed load', async () => {
    const listProducts = vi.fn<() => Promise<Product[]>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([sample]);
    const inner = source({ listProducts });
    const cached = new CachedProductSource(inner, 30, () => 1_000);
    await expect(cached.listProducts()).rejects.toThrow('offline');
    await expect(cached.listProducts()).resolves.toEqual([sample]);
    expect(listProducts).toHaveBeenCalledTimes(2);
  });
});
