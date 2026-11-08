import { Route, Routes } from 'react-router-dom';
import SiteLayout from './pages/SiteLayout.js';
import HomePage from './pages/HomePage.js';
import CategoryPage from './pages/CategoryPage.js';
import SearchPage from './pages/SearchPage.js';
import ProductPage from './pages/ProductPage.js';

export function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="*" element={<main className="page-shell page-content"><h1>Page not found</h1><p>This catalogue page does not exist.</p></main>} />
      </Route>
    </Routes>
  );
}
