import { ArrowUp, ArrowDown } from 'lucide-react';

export default function KpiCard({ label, value, icon: Icon, accent, trend, subtitle }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-slate-500">{label}</span>
        <span className={`shrink-0 rounded-lg p-2 ${accent}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 truncate text-2xl font-semibold text-slate-900">{value}</p>
      {(trend !== undefined && trend !== null) || subtitle ? (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {trend !== undefined && trend !== null && (
            <span className={`flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              {Math.abs(trend)}%
            </span>
          )}
          {subtitle && <span className="truncate text-xs text-slate-400">{subtitle}</span>}
        </div>
      ) : null}
    </div>
  );
}