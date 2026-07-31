import { useTranslation } from 'react-i18next';

export default function PlaceholderPage({ title, message }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-24 text-center">
      <h1 className="text-lg font-semibold text-slate-900">{title ?? t('common.notFound')}</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">{message ?? t('common.notFoundMessage')}</p>
    </div>
  );
}