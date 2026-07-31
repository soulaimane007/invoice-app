import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatCurrency } from '../../utils/format';

export default function TopClientsWidget({ clients }) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <Trophy size={16} className="shrink-0 text-amber-500" />
        <h2 className="text-sm font-semibold text-slate-900">{t('dashboard.topClientsTitle')}</h2>
      </div>
      {clients.length === 0 ? (
        <p className="text-sm text-slate-400">{t('dashboard.noPaidInvoicesYet')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {clients.map((c, i) => (
            <li key={c.id}>
              <Link to="/clients" className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{c.name}</p>
                    <p className="truncate text-xs text-slate-400">{t('dashboard.invoiceCount', { count: c.invoice_count })}</p>
                  </div>
                </div>
                <span className="shrink-0 font-medium text-slate-700">{formatCurrency(c.total_revenue, language)} MAD</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}