import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export default function SortableHeader({ label, sortKey, currentSort, currentDir, onSort, align = 'left' }) {
  const isActive = currentSort === sortKey;

  return (
    <th
      onClick={() => onSort(sortKey)}
      className={`cursor-pointer select-none px-4 py-3 font-medium hover:text-slate-700 ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      <span className={`inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        {label}
        {isActive ? (
          currentDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
        ) : (
          <ChevronsUpDown size={13} className="opacity-40" />
        )}
      </span>
    </th>
  );
}