import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchProducts } from '../api/client.js';
import { ProductGrid } from '../components/ProductGrid.js';
import { SearchBar } from '../components/SearchBar.js';
import { EmptyState, ErrorMessage, Loading } from '../components/StateViews.js';
import { useAsync } from '../hooks/useAsync.js';

export default function SearchPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const term = params.get('q')?.trim() ?? '';
  const { data: products, error, loading, reload } = useAsync(() => term ? searchProducts(term) : Promise.resolve([]), [term]);
  return (
    <div className="page-shell page-content">
      <div className="page-heading"><span className="eyebrow">Find your next favourite</span><h1>Search the catalogue</h1><p>Search by product name, description or category.</p></div>
      <div className="search-page-form"><SearchBar initialValue={term} onSearch={(value) => navigate(value ? `/search?q=${encodeURIComponent(value)}` : '/search')} /></div>
      {term && <div className="section-heading"><div><h2>Results for “{term}”</h2></div></div>}
      {!term && <EmptyState message="Enter a search term to find products." />}
      {term && loading && <Loading label="Searching the catalogue…" />}
      {term && error && <ErrorMessage message={error.message} onRetry={reload} />}
      {term && products && products.length > 0 && <ProductGrid products={products} testId="search-results" />}
      {term && products && products.length === 0 && <EmptyState />}
    </div>
  );
}
