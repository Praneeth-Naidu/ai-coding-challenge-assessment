import { useParams } from 'react-router-dom';
import { getCategory } from '../api/client.js';
import { ProductGrid } from '../components/ProductGrid.js';
import { EmptyState, ErrorMessage, Loading } from '../components/StateViews.js';
import { useAsync } from '../hooks/useAsync.js';

export default function CategoryPage() {
  const { slug = '' } = useParams();
  const { data, error, loading, reload } = useAsync(() => getCategory(slug), [slug]);
  return (
    <div className="page-shell page-content">
      {loading && <Loading label="Loading this collection…" />}
      {error && <ErrorMessage message={error.message} onRetry={reload} />}
      {data && <>
        <div className="page-heading"><span className="eyebrow">Browse by collection</span><h1>{data.category.name}</h1></div>
        <section className="section">
          <div className="section-heading"><div><h2>Top rated in {data.category.name}</h2><p>Leading the collection by customer rating.</p></div></div>
          {data.topRated.length ? <ProductGrid products={data.topRated} testId="category-top-rated" /> : <EmptyState />}
        </section>
        <section className="section">
          <div className="section-heading"><div><h2>More in {data.category.name}</h2><p>More to discover from this collection.</p></div></div>
          {data.more.length ? <ProductGrid products={data.more} testId="category-more" /> : <EmptyState message="There are no additional products in this collection." />}
        </section>
      </>}
    </div>
  );
}
