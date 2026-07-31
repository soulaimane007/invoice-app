import { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../ui/Modal';
import ExpandableRow, { DetailRow } from '../ui/ExpandableRow';
import PerPageSelect from '../ui/PerPageSelect';
import apiClient, { unwrapPage } from '../../api/client';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
}

const paymentStatusStyles = {
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
};

function PaymentBadge({ value }) {
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${paymentStatusStyles[value] ?? 'bg-slate-100 text-slate-600'}`}>
      {value === 'partial' ? 'Partial' : value}
    </span>
  );
}

export default function ArticleHistoryModal({ open, onClose, article }) {
  const [lines, setLines] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSearch('');
      setDebouncedSearch('');
      setPage(1);
      setPerPage(10);
    }
  }, [open]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (open && article) {
      setLoading(true);
      apiClient
        .get(`/articles/${article.id}/history`, { params: { search: debouncedSearch || undefined, page, per_page: perPage } })
        .then((res) => {
          const { items, meta } = unwrapPage(res);
          setLines(items);
          setMeta(meta);
        })
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, article, debouncedSearch, page, perPage]);

  return (
    <Modal open={open} onClose={onClose} title={`History — ${article?.name ?? ''}`} maxWidth="max-w-2xl">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice reference, client, or matricule..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <PerPageSelect value={perPage} onChange={(n) => { setPerPage(n); setPage(1); }} options={[5, 10, 25, 50]} />
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : lines.length === 0 ? (
        <p className="text-sm text-slate-400">No invoices found for this article.</p>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border border-slate-200 lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Invoice</th>
                  <th className="px-3 py-2 font-medium">Client</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 text-right font-medium">Qty</th>
                  <th className="px-3 py-2 font-medium">Matricules</th>
                  <th className="px-3 py-2 font-medium">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lines.map((l) => (
                  <tr key={l.id}>
                    <td className="px-3 py-2 font-medium text-slate-900">{l.facture.reference}</td>
                    <td className="px-3 py-2 text-slate-600">{l.facture.client_name}</td>
                    <td className="px-3 py-2 text-slate-600">{formatDate(l.facture.date)}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{l.quantity}</td>
                    <td className="px-3 py-2 text-slate-600">{l.matricules.length > 0 ? l.matricules.join(', ') : '—'}</td>
                    <td className="px-3 py-2"><PaymentBadge value={l.facture.payment_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 lg:hidden">
            {lines.map((l) => (
              <ExpandableRow
                key={l.id}
                summary={
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-slate-900">{l.facture.reference}</span>
                      <PaymentBadge value={l.facture.payment_status} />
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-slate-500">{l.facture.client_name}</span>
                      <span className="shrink-0 text-xs text-slate-500">{formatDate(l.facture.date)}</span>
                    </div>
                  </div>
                }
                details={
                  <>
                    <DetailRow label="Quantity" value={l.quantity} />
                    <DetailRow label="Matricules" value={l.matricules.length > 0 ? l.matricules.join(', ') : '—'} />
                  </>
                }
              />
            ))}
          </div>
        </>
      )}

      {meta && meta.last_page > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
          <span>Page {meta.current_page} of {meta.last_page}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40">
              <ChevronLeft size={14} /> Prev
            </button>
            <button onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))} disabled={page >= meta.last_page} className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40">
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}