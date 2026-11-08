import { Link, NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Category } from '../api/types.js';
import { SearchBar } from './SearchBar.js';

export function Layout({ categories, onSearch, children }: { categories: Category[]; onSearch: (term: string) => void; children: ReactNode }) {
  return (
    <>
      <header className="site-header">
        <div className="page-shell header-inner">
          <Link className="brand" to="/" aria-label="Northstar home"><span className="brand-mark">N</span> northstar</Link>
          <nav className="category-nav" aria-label="Product categories">
            {categories.map((category) => <NavLink key={category.slug} data-testid="category-link" to={`/category/${category.slug}`}>{category.name}</NavLink>)}
          </nav>
          <div className="header-search">
            <SearchBar onSearch={onSearch} />
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="site-footer"><div className="page-shell">Northstar Catalogue <span aria-hidden="true">·</span> Considered goods, thoughtfully curated.</div></footer>
    </>
  );
}
