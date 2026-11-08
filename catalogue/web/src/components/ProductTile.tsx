import { Link } from 'react-router-dom';
import type { Product } from '../api/types.js';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function ProductTile({ product }: { product: Product }) {
  return (
    <Link className="product-tile" to={`/product/${product.id}`} data-testid="product-tile">
      <div className="product-image-wrap">
        <img className="product-image" src={product.image || '/images/product-placeholder.svg'} alt={product.title}
          onError={(event) => { event.currentTarget.src = '/images/product-placeholder.svg'; }} />
      </div>
      <div className="product-tile-copy">
        <span className="product-category">{product.category}</span>
        <h3 data-testid="product-card-title">{product.title}</h3>
        <div className="product-meta">
          <span className="product-price">{money.format(product.price)}</span>
          <span className="product-rating" aria-label={`${product.rating.rate} out of 5 stars`}>★ {product.rating.rate.toFixed(1)}</span>
        </div>
      </div>
    </Link>
  );
}
