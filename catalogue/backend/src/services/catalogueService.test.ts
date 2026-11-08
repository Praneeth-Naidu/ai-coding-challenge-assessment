import { describe, expect, it } from 'vitest';
import { AppError } from '../domain/errors.js';
import type { Product } from '../domain/product.js';
import type { ProductSource } from '../ports/productSource.js';
import { CatalogueService } from './catalogueService.js';

const products: Product[] = [
  { id: 1, title: 'Alpha Phone', price: 10, description: 'Fast handset', category: 'electronics', image: '', rating: { rate: 4.5, count: 10 } },
  { id: 2, title: 'Beta Phone', price: 20, description: 'Camera', category: 'electronics', image: '', rating: { rate: 4.9, count: 2 } },
  { id: 3, title: 'Gamma Phone', price: 30, description: 'Fast camera', category: 'electronics', image: '', rating: { rate: 4.5, count: 30 } },
  { id: 4, title: 'Delta Phone', price: 40, description: 'Budget', category: 'electronics', image: '', rating: { rate: 3.8, count: 4 } },
  { id: 5, title: 'Epsilon Shirt', price: 50, description: 'Cotton', category: "men's clothing", image: '', rating: { rate: 4.2, count: 5 } },
  { id: 6, title: 'Zeta Shirt', price: 60, description: 'Premium', category: "men's clothing", image: '', rating: { rate: 4.7, count: 5 } }
];

function fakeSource(): ProductSource {
  return {
    listProducts: async () => products,
    getProduct: async (id) => products.find((item) => item.id === id) ?? null,
    listCategories: async () => ['electronics', "men's clothing"]
  };
}

const service = (): CatalogueService => new CatalogueService(fakeSource(), [3, 1, 2, 4, 6]);

describe('CatalogueService', () => {
  it('returns featured products in configured order', async () => {
    expect((await service().featured()).map((item) => item.id)).toEqual([3, 1, 2, 4, 6]);
  });

  it('splits a category into top three and the remaining products without duplicates', async () => {
    const result = await service().category('electronics');
    expect(result.topRated.map((item) => item.id)).toEqual([2, 3, 1]);
    expect(result.more.map((item) => item.id)).toEqual([4]);
    expect([...result.topRated, ...result.more].map((item) => item.id)).toHaveLength(4);
  });

  it('searches case-insensitively across title, description and category', async () => {
    expect((await service().search('PHONE')).map((item) => item.id)).toEqual([1, 2, 3, 4]);
    expect((await service().search('premium')).map((item) => item.id)).toEqual([6]);
    expect((await service().search('mens-clothing')).length).toBe(0);
    expect((await service().search('clothing')).map((item) => item.id)).toEqual([5, 6]);
  });

  it('rejects blank search terms', async () => {
    await expect(service().search('  ')).rejects.toMatchObject({ code: 'SEARCH_TERM_REQUIRED', status: 400 });
  });

  it('returns 404 for unknown categories and products', async () => {
    await expect(service().category('unknown')).rejects.toBeInstanceOf(AppError);
    await expect(service().product(999)).rejects.toMatchObject({ code: 'PRODUCT_NOT_FOUND', status: 404 });
  });

  it('rejects featured configuration with a missing ID', async () => {
    await expect(new CatalogueService(fakeSource(), [1, 2, 3, 4, 999]).featured())
      .rejects.toMatchObject({ code: 'FEATURED_MISCONFIGURED', status: 500 });
  });
});
