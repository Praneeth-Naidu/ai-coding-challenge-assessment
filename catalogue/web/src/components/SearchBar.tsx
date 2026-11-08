import { useState, type FormEvent } from 'react';

export function SearchBar({ initialValue = '', onSearch }: { initialValue?: string; onSearch: (term: string) => void }) {
  const [term, setTerm] = useState(initialValue);
  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSearch(term.trim());
  }
  return (
    <form className="search-form" role="search" onSubmit={submit}>
      <label className="honeypot" htmlFor="catalogue-search">Search products</label>
      <input id="catalogue-search" data-testid="search-input" value={term} onChange={(event) => setTerm(event.target.value)}
        placeholder="Search the catalogue" aria-label="Search products" />
      <button className="button" data-testid="search-button" type="submit">Search</button>
    </form>
  );
}
