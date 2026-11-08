import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { Product } from '../domain/product.js';
import type { ProductSource } from '../ports/productSource.js';
import { ProductsSchema } from './productSchema.js';

const DEFAULT_FIXTURE_PATH = fileURLToPath(new URL('../../fixtures/products.json', import.meta.url));

export class FixtureProductSource implements ProductSource {
  constructor(private readonly fixturePath = DEFAULT_FIXTURE_PATH) {}

  async listProducts(): Promise<Product[]> {
    const content = await readFile(this.fixturePath, 'utf8');
    const parsed = ProductsSchema.safeParse(JSON.parse(content) as unknown);
    if (!parsed.success) throw new Error(`Invalid product fixture: ${parsed.error.message}`);
    return parsed.data;
  }

  async getProduct(id: number): Promise<Product | null> {
    const products = await this.listProducts();
    return products.find((product) => product.id === id) ?? null;
  }

  async listCategories(): Promise<string[]> {
    const products = await this.listProducts();
    return [...new Set(products.map((product) => product.category))];
  }
}
