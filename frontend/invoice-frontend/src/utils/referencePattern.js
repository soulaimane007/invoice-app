// Mirrors ReferenceGeneratorService::build() in the backend exactly —
// kept in sync by hand since it's a small, self-contained pure function
// and this lets the settings form preview update instantly with no
// network round-trip.
export function buildReferencePreview(config, year = new Date().getFullYear()) {
  const hasPrefix = Boolean(config.prefix && String(config.prefix).trim() !== '');
  const includeYear = Boolean(config.include_year);
  const digits = Math.max(1, parseInt(config.number_digits, 10) || 1);
  const number = String(config.start_number || 1).padStart(digits, '0');
  const sep1 = config.separator_1 ?? '';
  const sep2 = config.separator_2 ?? '';
  const prefix = config.prefix ?? '';

  if (!includeYear) {
    return hasPrefix ? `${prefix}${sep1}${number}` : number;
  }

  if (hasPrefix) {
    if (config.year_position === 'start') return `${year}${sep1}${prefix}${sep2}${number}`;
    if (config.year_position === 'end') return `${prefix}${sep1}${number}${sep2}${year}`;
    return `${prefix}${sep1}${year}${sep2}${number}`;
  }

  if (config.year_position === 'end') return `${number}${sep1}${year}`;
  return `${year}${sep1}${number}`;
}