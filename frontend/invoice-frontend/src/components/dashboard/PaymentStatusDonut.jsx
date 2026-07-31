import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatCurrency } from '../../utils/format';

const COLORS = { unpaid: '#ef4444', partial: '#f59e0b', paid: '#10b981' };

export default function PaymentStatusDonut({ breakdown }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const LABELS = {
    unpaid: t('dashboard.paymentUnpaid'),
    partial: t('dashboard.paymentPartial'),
    paid: t('dashboard.paymentPaid'),
  };

  const data = Object.entries(breakdown)
    .map(([status, { count, total }]) => ({ status, count, total, name: LABELS[status] }))
    .filter((d) => d.count > 0);

  const totalCount = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">{t('dashboard.paymentBreakdownTitle')}</h2>
      {totalCount === 0 ? (
        <p className="text-sm text-slate-400">{t('dashboard.noInvoicesYet')}</p>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {data.map((d) => (
                  <Cell key={d.status} fill={COLORS[d.status]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name, props) => [`${value} — ${formatCurrency(props.payload.total, language)} MAD`, name]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}