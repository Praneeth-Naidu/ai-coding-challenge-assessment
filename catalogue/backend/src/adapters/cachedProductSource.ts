import type { Product } from '../domain/product.js';
import type { ProductSource } from '../ports/productSource.js';

type CacheEntry<T> = { value: T; expiresAt: number };

/** A small TTL decorator. Failed loads are never cached. */
export class CachedProductSource implements ProductSource {
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  constructor(
    private readonly inner: ProductSource,
    private readonly ttlSeconds: number,
    private readonly clock: () => number = Date.now
  ) {}

  listProducts(): Promise<Product[]> {
    return this.cached('products', () => this.inner.listProducts());
  }

  getProduct(id: number): Promise<Product | null> {
    return this.listProducts().then((products) => products.find((product) => product.id === id) ?? null);
  }

  listCategories(): Promise<string[]> {
    return this.cached('categories', () => this.inner.listCategories());
  }

  private async cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (entry && entry.expiresAt > this.clock()) return entry.value;

    const value = await loader();
    if (this.ttlSeconds > 0) {
      this.cache.set(key, { value, expiresAt: this.clock() + this.ttlSeconds * 1_000 });
    }
    return value;
  }
}
