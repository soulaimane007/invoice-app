import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function ExpandableRow({ summary, details, actions }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0 flex-1">{summary}</div>
        <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
          {details && <dl className="flex flex-col gap-2">{details}</dl>}
          {actions && <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3">{actions}</div>}
        </div>
      )}
    </div>
  );
}

export function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}