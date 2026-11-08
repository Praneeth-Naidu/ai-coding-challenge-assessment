import type { Product } from '../api/types.js';
import { ProductTile } from './ProductTile.js';

export function ProductGrid({ products, testId }: { products: Product[]; testId: string }) {
  return (
    <div className="product-grid" data-testid={testId}>
      {products.map((product) => <ProductTile key={product.id} product={product} />)}
    </div>
  );
}
