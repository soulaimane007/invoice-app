import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import apiClient, { unwrap } from '../../api/client';
import MatriculeSlotInput from '../facture/MatriculeSlotInput';
import ReferenceNumberField from './ReferenceNumberField';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function ConvertToInvoiceModal({ open, onClose, devisId, onConverted }) {
  const [devis, setDevis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [date, setDate] = useState(todayISO());
  const [clientIce, setClientIce] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [lineMatricules, setLineMatricules] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [referenceError, setReferenceError] = useState('');

  useEffect(() => {
    if (open && devisId) {
      setLoading(true);
      setDate(todayISO());
      setClientIce('');
      setDueDate('');
      setLineMatricules({});
      setError('');
      setReferenceError('');
      Promise.all([
        apiClient.get(`/devis/${devisId}`),
        apiClient.get('/facture/next-reference'),
      ]).then(([devisRes, refRes]) => {
        setDevis(unwrap(devisRes));
        setReferenceNumber(String(refRes.data.number));
      }).finally(() => setLoading(false));
    } else {
      setDevis(null);
    }
  }, [open, devisId]);

  function updateLineMatricule(lineId, index, value) {
    setLineMatricules((prev) => {
      const current = [...(prev[lineId] || [])];
      current[index] = value;
      return { ...prev, [lineId]: current };
    });
  }

  async function handleConfirm() {
    setSubmitting(true);
    setError('');
    setReferenceError('');
    try {
      const res = await apiClient.post(`/devis/${devisId}/convert`, {
        reference_number: referenceNumber ? parseInt(referenceNumber, 10) : null,
        date,
        client_ice: clientIce || undefined,
        due_date: dueDate || undefined,
        line_matricules: lineMatricules,
      });
      onConverted(unwrap(res), res.data.stock_warnings || []);
    } catch (err) {
      if (err.response?.status === 422 && err.response.data.errors?.reference_number) {
        setReferenceError(err.response.data.errors.reference_number[0]);
      } else {
        setError(err.response?.data?.message ?? 'Could not convert this quotation.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const needsIce = devis && !devis.client?.ice;

  return (
    <Modal open={open} onClose={onClose} title={devis ? `Convert ${devis.reference} to an invoice` : 'Convert to invoice'} maxWidth="max-w-lg">
      {loading || !devis ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-600">
            Client, articles, quantities, prices and comments are copied over automatically. Only fill in what's missing below.
          </p>
          {devis.sous_client && (
            <p className="mb-4 -mt-2 text-xs text-slate-500">
              Sous-client <span className="font-medium text-indigo-600">
                {devis.sous_client.name}{devis.sous_client.reference ? ` — ${devis.sous_client.reference}` : ''}
              </span> carries over too.
            </p>
          )}

          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <ReferenceNumberField documentType="facture" value={referenceNumber} onChange={setReferenceNumber} error={referenceError} />
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Invoice date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
            {needsIce && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Client ICE (missing on this client)</label>
                <input
                  value={clientIce}
                  onChange={(e) => setClientIce(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {devis.lines.filter((l) => l.article_id).length > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <p className="mb-2 text-xs font-medium text-slate-500">Matricules (optionnel)</p>
                <div className="flex max-h-56 flex-col gap-3 overflow-y-auto">
                  {devis.lines.filter((l) => l.article_id).map((line) => {
                    const slotCount = Math.max(0, Math.floor(line.quantity));
                    if (slotCount === 0) return null;
                    return (
                      <div key={line.id}>
                        <p className="mb-1 text-xs text-slate-600">{line.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from({ length: slotCount }).map((_, i) => (
                            <div key={i} className="min-w-[5.5rem] flex-1">
                              <MatriculeSlotInput
                                articleId={line.article_id}
                                value={lineMatricules[line.id]?.[i] ?? ''}
                                onChange={(v) => updateLineMatricule(line.id, i, v)}
                                placeholder={`Unité ${i + 1}`}
                                excludeValues={(lineMatricules[line.id] || []).filter((_, idx) => idx !== i)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="mt-2 flex justify-end gap-2">
              <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {submitting ? 'Converting...' : 'Convert to invoice'}
              </button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}