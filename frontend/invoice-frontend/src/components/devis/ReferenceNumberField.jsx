import { useEffect, useState } from 'react';
import apiClient, { unwrap } from '../../api/client';
import { buildReferencePreview } from '../../utils/referencePattern';
import { useAuth } from '../../contexts/AuthContext';
import { canEditReference } from '../../utils/permissions';

export default function ReferenceNumberField({ documentType, value, onChange, error, label = 'Reference' }) {
  const { user } = useAuth();
  const editable = canEditReference(user);
  const [patternConfig, setPatternConfig] = useState(null);

  useEffect(() => {
    apiClient.get('/company-settings').then((res) => {
      const c = unwrap(res);
      const p = `${documentType}_ref`;
      setPatternConfig({
        prefix: c[`${p}_prefix`],
        separator_1: c[`${p}_separator_1`],
        include_year: c[`${p}_include_year`],
        year_position: c[`${p}_year_position`],
        number_digits: c[`${p}_number_digits`],
        separator_2: c[`${p}_separator_2`],
      });
    });
  }, [documentType]);

  const preview = patternConfig && value
    ? buildReferencePreview({ ...patternConfig, start_number: value })
    : '—';

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-noir-500">{label}</label>
      <div className="mb-1 truncate rounded-lg bg-noir-100 px-3 py-2 font-mono text-sm text-noir-700">
        {preview}
      </div>
      {editable ? (
        <input
          type="number"
          min="1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir="ltr"
          className="w-full rounded-lg border border-noir-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
        />
      ) : (
        <div className="w-full rounded-lg border border-noir-200 bg-noir-50 px-3 py-2 text-sm text-noir-500" dir="ltr">
          {value || '—'}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}