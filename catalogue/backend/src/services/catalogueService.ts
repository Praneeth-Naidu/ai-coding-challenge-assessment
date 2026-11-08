import { AppError } from '../domain/errors.js';
import { slugify, topRated, type Category, type Product } from '../domain/product.js';
import type { ProductSource } from '../ports/productSource.js';

export class CatalogueService {
  constructor(private readonly source: ProductSource, private readonly featuredIds: number[]) {
    if (featuredIds.length !== 5 || new Set(featuredIds).size !== 5) {
      throw new AppError(500, 'FEATURED_MISCONFIGURED', 'Exactly five unique featured product IDs must be configured.');
    }
  }

  async featured(): Promise<Product[]> {
    const products = await this.source.listProducts();
    const byId = new Map(products.map((product) => [product.id, product]));
    const featured = this.featuredIds.map((id) => byId.get(id));
    if (featured.some((product) => product === undefined)) {
      throw new AppError(500, 'FEATURED_MISCONFIGURED', 'A configured featured product does not exist.');
    }
    return featured as Product[];
  }

  async categories(): Promise<Category[]> {
    const names = await this.source.listCategories();
    return names.map((name) => ({ slug: slugify(name), name }));
  }

  async category(slug: string): Promise<{ category: Category; topRated: Product[]; more: Product[] }> {
    const products = await this.source.listProducts();
    const categoryName = [...new Set(products.map((product) => product.category))]
      .find((name) => slugify(name) === slug);
    if (!categoryName) throw new AppError(404, 'CATEGORY_NOT_FOUND', 'The requested category was not found.');

    const categoryProducts = products.filter((product) => product.category === categoryName);
    const top = topRated(categoryProducts, 3);
    const topIds = new Set(top.map((product) => product.id));
    return {
      category: { slug: slugify(categoryName), name: categoryName },
      topRated: top,
      more: categoryProducts.filter((product) => !topIds.has(product.id))
    };
  }

  async search(term: string): Promise<Product[]> {
    const normalized = term.trim().toLocaleLowerCase('en-US');
    if (!normalized) throw new AppError(400, 'SEARCH_TERM_REQUIRED', 'Enter a search term to find products.');
    const products = await this.source.listProducts();
    return products.filter((product) =>
      [product.title, product.description, product.category]
        .some((value) => value.toLocaleLowerCase('en-US').includes(normalized))
    );
  }

  async product(id: number): Promise<Product> {
    const product = await this.source.getProduct(id);
    if (!product) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'The requested product was not found.');
    return product;
  }
}
