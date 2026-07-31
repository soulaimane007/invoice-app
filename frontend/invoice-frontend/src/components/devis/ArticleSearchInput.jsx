import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import apiClient, { unwrap } from '../../api/client';

export default function ArticleSearchInput({ onSelect, placeholder = 'Search article...' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      apiClient.get('/articles/autocomplete', { params: { q: query } })
        .then((res) => setResults(unwrap(res)))
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-64 rounded-lg border border-slate-300 py-1.5 pl-7 pr-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute right-0 z-20 mt-1 w-72 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {results.map((article) => (
            <button
              key={article.id}
              type="button"
              onClick={() => { onSelect(article); setQuery(''); setResults([]); setOpen(false); }}
              className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              <span className="font-medium text-slate-900">{article.name}</span>
              <span className="text-xs text-slate-500">{article.reference} · {article.unit_price} MAD</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}