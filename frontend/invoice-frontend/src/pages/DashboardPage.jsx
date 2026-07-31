import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, FileSpreadsheet, Users, Package, Wallet, Clock, AlertTriangle, TrendingUp as TrendingUpIcon, Boxes } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '../api/client';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency } from '../utils/format';
import KpiCard from '../components/dashboard/KpiCard';
import DailyRevenueChart from '../components/dashboard/DailyRevenueChart';
import AttentionWidget from '../components/dashboard/AttentionWidget';
import PaymentStatusDonut from '../components/dashboard/PaymentStatusDonut';
import ConversionFunnelWidget from '../components/dashboard/ConversionFunnelWidget';
import TopClientsWidget from '../components/dashboard/TopClientsWidget';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [stats, setStats] = useState(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    apiClient.get('/dashboard')
      .then((res) => setStats(res.data))
      .catch(() => setHasError(true));
  }, []);

  const currency = (value) => `${formatCurrency(value, language)} MAD`;

  if (hasError) return <p className="text-sm text-red-600">{t('dashboard.loadError')}</p>;
  if (!stats) return <p className="text-sm text-slate-500">{t('common.loading')}</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{t('dashboard.title')}</h1>
        <p className="text-sm text-slate-500">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t('dashboard.invoices')} value={stats.totals.invoices} icon={FileText} accent="bg-indigo-50 text-indigo-600" />
        <KpiCard label={t('dashboard.quotations')} value={stats.totals.quotations} icon={FileSpreadsheet} accent="bg-amber-50 text-amber-600" />
        <KpiCard
          label={t('dashboard.clients')} value={stats.totals.clients} icon={Users} accent="bg-emerald-50 text-emerald-600"
          subtitle={stats.new_clients_this_month > 0 ? t('dashboard.newClientsThisMonth', { count: stats.new_clients_this_month }) : null}
        />
        <KpiCard label={t('dashboard.articles')} value={stats.totals.articles} icon={Package} accent="bg-sky-50 text-sky-600" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t('dashboard.totalRevenue')} value={currency(stats.revenue.total)} icon={Wallet} accent="bg-emerald-50 text-emerald-600"
          subtitle={t('dashboard.averageInvoice', { amount: currency(stats.revenue.average_invoice_value) })}
        />
        <KpiCard
          label={t('dashboard.thisMonth')} value={currency(stats.revenue.this_month)} icon={TrendingUpIcon} accent="bg-indigo-50 text-indigo-600"
          trend={stats.revenue.month_over_month_change} subtitle={t('dashboard.vsLastMonth')}
        />
        <KpiCard
          label={t('dashboard.outstanding')} value={currency(stats.revenue.outstanding)} icon={Clock} accent="bg-amber-50 text-amber-600"
          subtitle={stats.revenue.average_days_to_payment !== null ? t('dashboard.daysToPayment', { days: Math.round(stats.revenue.average_days_to_payment) }) : null}
        />
        <KpiCard label={t('dashboard.overdue')} value={currency(stats.revenue.overdue)} icon={AlertTriangle} accent="bg-red-50 text-red-600" />
      </div>

      <AttentionWidget
        overdueInvoices={stats.attention.overdue_invoices}
        pendingQuotations={stats.attention.pending_quotations}
        lowStockArticles={stats.attention.low_stock_articles}
      />

      <DailyRevenueChart />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PaymentStatusDonut breakdown={stats.payment_status_breakdown} />
        <ConversionFunnelWidget funnel={stats.devis_funnel} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopClientsWidget clients={stats.top_clients} />

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">{t('dashboard.bestSellingTitle')}</h2>
          {stats.best_selling_articles.length === 0 ? (
            <p className="text-sm text-slate-400">{t('dashboard.notEnoughData')}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {stats.best_selling_articles.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 text-sm last:border-0">
                  <span className="truncate text-slate-800">{a.name}</span>
                  <span className="shrink-0 font-medium text-slate-600">{a.total_sold} {t('dashboard.sold')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUpIcon size={18} className="shrink-0 text-indigo-600" />
          <h2 className="text-sm font-semibold text-slate-900">{t('dashboard.yearlyTrendTitle')}</h2>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.monthly_revenue}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={45} />
              <Tooltip formatter={(value) => currency(value)} />
              <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">{t('dashboard.latestInvoicesTitle')}</h2>
          {stats.latest_invoices.length === 0 ? (
            <p className="text-sm text-slate-400">{t('dashboard.noInvoicesYet')}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {stats.latest_invoices.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 text-sm last:border-0">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{f.reference}</p>
                    <p className="truncate text-xs text-slate-500">{f.client_name}</p>
                    {f.sous_client_name && (
                      <p className="truncate text-xs italic text-indigo-600">{f.sous_client_name}{f.sous_client_reference ? ` — ${f.sous_client_reference}` : ''}</p>
                    )}
                  </div>
                  <span className="shrink-0 font-medium text-slate-700">{currency(f.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">{t('dashboard.latestQuotationsTitle')}</h2>
          {stats.latest_quotations.length === 0 ? (
            <p className="text-sm text-slate-400">{t('dashboard.noQuotationsYet')}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {stats.latest_quotations.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 text-sm last:border-0">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{d.reference}</p>
                    <p className="truncate text-xs text-slate-500">{d.client_name}</p>
                    {d.sous_client_name && (
                      <p className="truncate text-xs italic text-indigo-600">{d.sous_client_name}{d.sous_client_reference ? ` — ${d.sous_client_reference}` : ''}</p>
                    )}
                  </div>
                  <span className="shrink-0 font-medium text-slate-700">{currency(d.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {stats.dead_stock_articles.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Boxes size={16} className="shrink-0 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900">{t('dashboard.deadStockTitle')}</h2>
          </div>
          <ul className="flex flex-wrap gap-2">
            {stats.dead_stock_articles.map((a) => (
              <li key={a.id}>
                <Link to="/articles" className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50">
                  {a.name} ({t('dashboard.inStock', { count: a.quantity_in_stock })})
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}