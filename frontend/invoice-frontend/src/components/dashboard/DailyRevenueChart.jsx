import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatCurrency, formatMonthLabel } from '../../utils/format';

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function DailyRevenueChart() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [month, setMonth] = useState(currentMonthValue());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient.get('/dashboard/daily-revenue', { params: { month } })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [month]);

  const currency = (value) => `${formatCurrency(value, language)} MAD`;
  // Chronological order stays left-to-right even in Arabic — flipping a
  // time axis reads as confusing regardless of interface language.
  const chartMinWidth = data ? Math.max(500, data.days.length * 26) : 500;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="shrink-0 text-indigo-600" />
          <h2 className="text-sm font-semibold text-slate-900">
            {t('dashboard.dailyRevenueTitle')} — <span className="capitalize">{formatMonthLabel(month, language)}</span>
          </h2>
        </div>
        <input
          type="month"
          value={month}
          max={currentMonthValue()}
          onChange={(e) => setMonth(e.target.value)}
          dir="ltr"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {data && (
        <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div>
            <span className="text-slate-500">{t('dashboard.invoicedThisMonth')} : </span>
            <span className="font-semibold text-slate-900">{currency(data.totals.invoiced)}</span>
          </div>
          <div>
            <span className="text-slate-500">{t('dashboard.collectedThisMonth')} : </span>
            <span className="font-semibold text-emerald-600">{currency(data.totals.collected)}</span>
          </div>
        </div>
      )}

      <div className="h-72 overflow-x-auto">
        {loading || !data ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">{t('common.loading')}</div>
        ) : (
          <div style={{ minWidth: chartMinWidth, height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.days}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={45} />
                <Tooltip
                  formatter={(value, name) => [currency(value), name === 'invoiced' ? t('dashboard.invoicedLegend') : t('dashboard.collectedLegend')]}
                  labelFormatter={(day) => `${t('common.date')} ${day}`}
                />
                <Legend formatter={(value) => (value === 'invoiced' ? t('dashboard.invoicedLegend') : t('dashboard.collectedLegend'))} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="invoiced" fill="#c7d2fe" radius={[3, 3, 0, 0]} />
                <Bar dataKey="collected" fill="#4f46e5" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}