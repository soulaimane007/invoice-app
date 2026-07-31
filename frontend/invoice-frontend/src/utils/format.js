const LOCALE_MAP = { en: 'en-US', fr: 'fr-MA' };

export function formatCurrency(value, language = 'fr') {
  const locale = LOCALE_MAP[language] || 'fr-MA';
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value ?? 0);
}

export function formatDate(value, language = 'fr') {
  if (!value) return '—';
  const locale = LOCALE_MAP[language] || 'fr-MA';
  return new Date(value).toLocaleDateString(locale);
}

export function formatMonthLabel(monthValue, language = 'fr') {
  const [year, month] = monthValue.split('-').map(Number);
  const locale = LOCALE_MAP[language] || 'fr-MA';
  return new Date(year, month - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}