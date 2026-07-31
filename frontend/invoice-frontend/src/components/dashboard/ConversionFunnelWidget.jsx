import { useTranslation } from 'react-i18next';
import { TrendingUp } from 'lucide-react';

const STATUS_STYLE = {
  draft: 'bg-slate-200',
  sent: 'bg-sky-300',
  accepted: 'bg-emerald-400',
  rejected: 'bg-red-300',
};

export default function ConversionFunnelWidget({ funnel }) {
  const { t } = useTranslation();

  const segments = [
    { key: 'draft', label: t('dashboard.statusDraft'), value: funnel.draft },
    { key: 'sent', label: t('dashboard.statusSent'), value: funnel.sent },
    { key: 'accepted', label: t('dashboard.statusAccepted'), value: funnel.accepted },
    { key: 'rejected', label: t('dashboard.statusRejected'), value: funnel.rejected },
  ];
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp size={18} className="shrink-0 text-indigo-600" />
        <h2 className="text-sm font-semibold text-slate-900">{t('dashboard.conversionTitle')}</h2>
      </div>

      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-3xl font-bold text-indigo-600">{funnel.conversion_rate}%</span>
        <span className="text-sm text-slate-500">{t('dashboard.conversionRate')}</span>
      </div>
      {funnel.average_days_to_convert !== null && (
        <p className="mt-1 text-xs text-slate-400">
          {t('dashboard.averageDaysToConvert', { days: funnel.average_days_to_convert })}
        </p>
      )}

      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
        {segments.map((s) => s.value > 0 && (
          <div key={s.key} className={STATUS_STYLE[s.key]} style={{ width: `${(s.value / total) * 100}%` }} title={`${s.label}: ${s.value}`} />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_STYLE[s.key]}`} />
            <span className="truncate">{s.label} ({s.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}