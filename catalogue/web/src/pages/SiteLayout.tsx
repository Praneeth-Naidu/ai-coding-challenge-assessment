import { useNavigate, Outlet } from 'react-router-dom';
import { getCategories } from '../api/client.js';
import { Layout } from '../components/Layout.js';
import { useAsync } from '../hooks/useAsync.js';

export default function SiteLayout() {
  const navigate = useNavigate();
  const { data: categories } = useAsync(getCategories, []);
  return (
    <Layout categories={categories ?? []} onSearch={(term) => navigate(term ? `/search?q=${encodeURIComponent(term)}` : '/search')}>
      <Outlet />
    </Layout>
  );
}
