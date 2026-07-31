import { useEffect, useRef, useState } from 'react';
import apiClient, { unwrap } from '../../api/client';

export default function MatriculeSlotInput({ articleId, value, onChange, placeholder, excludeValues = [] }) {
  const [rawResults, setRawResults] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!articleId || !value.trim()) {
      setRawResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      apiClient.get(`/articles/${articleId}/matricules/autocomplete`, { params: { q: value } })
        .then((res) => setRawResults(unwrap(res)))
        .catch(() => setRawResults([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [articleId, value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recomputed on every render (not stored in state), so it always
  // reflects whatever the sibling fields currently hold, even if this
  // field itself didn't just refetch.
  const results = rawResults.filter((m) => !excludeValues.includes(m.matricule));

  return (
    <div ref={containerRef} className="relative">
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-32 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {results.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => { onChange(m.matricule); setOpen(false); }}
              className="block w-full truncate px-2 py-1 text-left text-xs hover:bg-slate-50"
            >
              {m.matricule}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}