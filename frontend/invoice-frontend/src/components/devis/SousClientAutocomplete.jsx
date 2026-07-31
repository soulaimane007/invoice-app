import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import apiClient, { unwrap } from '../../api/client';

export default function SousClientAutocomplete({ clientId, value, onChange, onPick, disabled }) {
  const [allOptions, setAllOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!clientId) {
      setAllOptions([]);
      return;
    }
    apiClient.get(`/clients/${clientId}/sous-clients`)
      .then((res) => setAllOptions(unwrap(res)))
      .catch(() => setAllOptions([]));
  }, [clientId]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = value.trim()
    ? allOptions.filter((o) => o.name.toLowerCase().includes(value.trim().toLowerCase()))
    : allOptions;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          disabled={disabled}
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={disabled ? 'Pick a client first' : 'Search or type a new sous-client...'}
          className="w-full rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
        />
      </div>
      {open && !disabled && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { onPick(item); setOpen(false); }}
              className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              <span className="font-medium text-slate-900">{item.name}</span>
              {item.reference && <span className="text-xs text-slate-500">{item.reference}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}