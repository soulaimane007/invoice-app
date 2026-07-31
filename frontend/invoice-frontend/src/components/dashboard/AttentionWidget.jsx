import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Clock, PackageX } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatCurrency } from '../../utils/format';

function Column({ icon: Icon, iconColor, title, count, emptyLabel, children }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Icon size={16} className={`shrink-0 ${iconColor}`} />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {count > 0 && <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">{count}</span>}
      </div>
      {count === 0 ? (
        <p className="text-xs text-slate-400">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col gap-2">{children}</ul>
      )}
    </div>
  );
}

export default function AttentionWidget({ overdueInvoices, pendingQuotations, lowStockArticles }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const currency = (value) => `${formatCurrency(value, language)} MAD`;
  const nothingToShow = overdueInvoices.length === 0 && pendingQuotations.length === 0 && lowStockArticles.length === 0;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 sm:p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">{t('dashboard.attentionTitle')}</h2>
      {nothingToShow ? (
        <p className="text-sm text-slate-500">{t('dashboard.nothingToShow')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Column icon={AlertCircle} iconColor="text-red-500" title={t('dashboard.overdueInvoices')} count={overdueInvoices.length} emptyLabel={t('dashboard.noOverdueInvoices')}>
            {overdueInvoices.map((f) => (
              <li key={f.id}>
                <Link to={`/factures/${f.id}`} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{f.reference}</p>
                    <p className="truncate text-xs text-slate-500">{f.client_name} · {t('dashboard.daysOverdue', { days: f.days_overdue })}</p>
                  </div>
                  <span className="shrink-0 font-medium text-red-600">{currency(f.remaining_balance)}</span>
                </Link>
              </li>
            ))}
          </Column>

          <Column icon={Clock} iconColor="text-amber-500" title={t('dashboard.pendingQuotations')} count={pendingQuotations.length} emptyLabel={t('dashboard.noPendingQuotations')}>
            {pendingQuotations.map((d) => (
              <li key={d.id}>
                <Link to={`/devis/${d.id}`} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{d.reference}</p>
                    <p className="truncate text-xs text-slate-500">{d.client_name} · {t('dashboard.pendingSince', { days: d.days_pending })}</p>
                  </div>
                  <span className="shrink-0 font-medium text-slate-700">{currency(d.total)}</span>
                </Link>
              </li>
            ))}
          </Column>

          <Column icon={PackageX} iconColor="text-orange-500" title={t('dashboard.lowStock')} count={lowStockArticles.length} emptyLabel={t('dashboard.noLowStock')}>
            {lowStockArticles.map((a) => (
              <li key={a.id}>
                <Link to="/articles" className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{a.name}</p>
                    <p className="truncate text-xs text-slate-500">{a.reference}</p>
                  </div>
                  <span className="shrink-0 font-medium text-orange-600">{t('dashboard.unitsLeft', { count: a.quantity_in_stock })}</span>
                </Link>
              </li>
            ))}
          </Column>
        </div>
      )}
    </div>
  );
}