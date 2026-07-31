import { buildReferencePreview } from '../../utils/referencePattern';

export default function ReferencePatternForm({ label, fieldPrefix, values, onChange }) {
  const key = (suffix) => `${fieldPrefix}_${suffix}`;
  const get = (suffix) => values[key(suffix)];

  function set(suffix, value) {
    onChange(key(suffix), value);
  }

  const includeYear = Boolean(get('include_year'));
  const hasPrefix = Boolean(get('prefix') && String(get('prefix')).trim() !== '');
  const showSeparator2 = includeYear && hasPrefix;

  const previewConfig = {
    prefix: get('prefix'),
    separator_1: get('separator_1'),
    include_year: includeYear,
    year_position: get('year_position'),
    number_digits: get('number_digits'),
    separator_2: get('separator_2'),
    start_number: get('start_number'),
  };

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">{label}</h3>

      <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-center">
        <span className="font-mono text-sm font-semibold text-indigo-700">
          {buildReferencePreview(previewConfig)}
        </span>
        <p className="mt-0.5 text-xs text-slate-400">Aperçu du prochain numéro</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Préfixe</label>
          <input
            value={get('prefix') ?? ''}
            onChange={(e) => set('prefix', e.target.value)}
            placeholder="ex. FAC (vide si aucun)"
            maxLength={20}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Séparateur 1</label>
          <input
            value={get('separator_1') ?? ''}
            onChange={(e) => set('separator_1', e.target.value)}
            placeholder="ex. -"
            maxLength={5}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={includeYear}
          onChange={(e) => set('include_year', e.target.checked)}
          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        Inclure l'année
      </label>

      {includeYear && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Position de l'année</label>
            <select
              value={get('year_position') ?? 'middle'}
              onChange={(e) => set('year_position', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="start">Au début</option>
              <option value="middle">Au milieu</option>
              <option value="end">À la fin</option>
            </select>
          </div>
          {showSeparator2 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Séparateur 2</label>
              <input
                value={get('separator_2') ?? ''}
                onChange={(e) => set('separator_2', e.target.value)}
                placeholder="ex. -"
                maxLength={5}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Nombre de chiffres</label>
          <input
            type="number" min="1" max="10"
            value={get('number_digits') ?? 6}
            onChange={(e) => set('number_digits', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Numéro de départ</label>
          <input
            type="number" min="1"
            value={get('start_number') ?? 1}
            onChange={(e) => set('start_number', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        S'applique à un nouveau compteur (nouvelle année, ou tout premier document). Ne renumérote jamais ce qui existe déjà.
      </p>

      <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={Boolean(get('reset_yearly'))}
          onChange={(e) => set('reset_yearly', e.target.checked)}
          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        Remise à zéro chaque année
      </label>
      <p className="mt-1 text-xs text-slate-400">
        {get('reset_yearly')
          ? "Le compteur repart du numéro de départ au 1er janvier de chaque année."
          : "Le compteur ne s'arrête jamais — il continue d'augmenter indéfiniment."}
      </p>
    </div>
  );
}