import { getFeatured } from '../api/client.js';
import { ProductGrid } from '../components/ProductGrid.js';
import { EmptyState, ErrorMessage, Loading } from '../components/StateViews.js';
import { useAsync } from '../hooks/useAsync.js';

export default function HomePage() {
  const { data: products, error, loading, reload } = useAsync(getFeatured, []);
  return (
    <div className="page-shell">
      <section className="hero">
        <div>
          <span className="eyebrow">The considered edit</span>
          <h1>Good things.<br />Chosen well.</h1>
          <p>A focused collection of useful, well-loved pieces for the way you live and work.</p>
        </div>
        <div className="hero-art" aria-hidden="true"><div className="hero-art-mark">N</div></div>
      </section>
      <section className="section">
        <div className="section-heading"><div><span className="eyebrow">A few favourites</span><h2>Top rated</h2></div><p>Five pieces worth a closer look.</p></div>
        {loading && <Loading label="Finding the favourites…" />}
        {error && <ErrorMessage message={error.message} onRetry={reload} />}
        {products && products.length > 0 && <ProductGrid products={products} testId="featured-products" />}
        {products && products.length === 0 && <EmptyState message="Featured products are not available yet." />}
      </section>
    </div>
  );
}
