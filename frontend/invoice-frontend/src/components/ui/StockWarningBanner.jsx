import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

function formatQty(value) {
  return Number.isInteger(value) ? value : value.toFixed(2);
}

export default function StockWarningBanner({ warnings }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !warnings || warnings.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-800">
            Stock insuffisant pour {warnings.length} article{warnings.length > 1 ? 's' : ''} — la facture a quand même été enregistrée
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {warnings.map((w, i) => (
              <li key={i} className="text-sm text-amber-700">
                <span className="font-medium">{w.article}</span> — demandé : {formatQty(w.requested)}, disponible avant vente : {formatQty(w.available_before)}.
                {' '}Stock désormais à <span className="font-medium">{formatQty(w.resulting_stock)}</span>.
              </li>
            ))}
          </ul>
        </div>
        <button onClick={() => setDismissed(true)} className="shrink-0 rounded p-1 text-amber-500 hover:bg-amber-100" title="Fermer">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}