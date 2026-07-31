import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import apiClient, { unwrap } from '../../api/client';

export default function ClientAutocomplete({ value, onChange, onPick }) {
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!value || !value.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      apiClient.get('/clients/autocomplete', { params: { q: value } })
        .then((res) => setResults(unwrap(res)))
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [value]);

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
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search or type a new client name..."
          className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {results.map((client) => (
            <button
              key={client.id}
              type="button"
              onClick={() => { onPick(client); setResults([]); setOpen(false); }}
              className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              <span className="font-medium text-slate-900">{client.name}</span>
              <span className="text-xs text-slate-500">{client.email || client.phone || client.ice || 'No contact info'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}