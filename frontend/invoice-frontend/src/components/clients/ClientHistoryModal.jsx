import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../ui/Modal';
import ExpandableRow from '../ui/ExpandableRow';
import PerPageSelect from '../ui/PerPageSelect';
import apiClient, { unwrapPage } from '../../api/client';

function formatCurrency(value) {
  return new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value ?? 0);
}
function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
}

const devisStatusStyles = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-sky-100 text-sky-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};
const paymentStatusStyles = {
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
};

function StatusPill({ type, value }) {
  if (type === 'devis') {
    return (
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${devisStatusStyles[value] ?? 'bg-slate-100 text-slate-600'}`}>
        {value}
      </span>
    );
  }
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${paymentStatusStyles[value] ?? 'bg-slate-100 text-slate-600'}`}>
      {value === 'partial' ? 'Partial' : value}
    </span>
  );
}

function DocumentTable({ type, title, rows, meta, page, setPage, search, setSearch, onRowClick, emptyLabel }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">{title} ({meta?.total ?? rows.length})</h3>
      <div className="relative mb-2">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by reference..."
          className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">{emptyLabel}</p>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border border-slate-200 sm:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Reference</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                  <th className="px-3 py-2 font-medium">{type === 'devis' ? 'Status' : 'Payment'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} onClick={() => onRowClick(row)} className="cursor-pointer hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-900">{row.reference}</td>
                    <td className="px-3 py-2 text-slate-600">{formatDate(row.date)}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{formatCurrency(row.total)} MAD</td>
                    <td className="px-3 py-2"><StatusPill type={type} value={type === 'devis' ? row.status : row.payment_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 sm:hidden">
            {rows.map((row) => (
              <ExpandableRow
                key={row.id}
                summary={
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-slate-900">{row.reference}</span>
                      <StatusPill type={type} value={type === 'devis' ? row.status : row.payment_status} />
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-slate-500">{formatDate(row.date)}</span>
                      <span className="shrink-0 text-xs font-medium text-slate-700">{formatCurrency(row.total)} MAD</span>
                    </div>
                  </div>
                }
                actions={
                  <button onClick={() => onRowClick(row)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50">
                    Open →
                  </button>
                }
              />
            ))}
          </div>
        </>
      )}
      {meta && meta.last_page > 1 && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
          <span>Page {meta.current_page} of {meta.last_page}</span>
          <div className="flex gap-1.5">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 disabled:opacity-40">
              <ChevronLeft size={12} /> Prev
            </button>
            <button onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))} disabled={page >= meta.last_page} className="flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 disabled:opacity-40">
              Next <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientHistoryModal({ open, onClose, client }) {
  const navigate = useNavigate();
  const [perPage, setPerPage] = useState(10);

  const [devis, setDevis] = useState([]);
  const [devisMeta, setDevisMeta] = useState(null);
  const [devisPage, setDevisPage] = useState(1);
  const [devisSearch, setDevisSearch] = useState('');
  const [devisDebounced, setDevisDebounced] = useState('');

  const [factures, setFactures] = useState([]);
  const [facturesMeta, setFacturesMeta] = useState(null);
  const [facturesPage, setFacturesPage] = useState(1);
  const [facturesSearch, setFacturesSearch] = useState('');
  const [facturesDebounced, setFacturesDebounced] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setPerPage(10);
      setDevisPage(1); setDevisSearch(''); setDevisDebounced('');
      setFacturesPage(1); setFacturesSearch(''); setFacturesDebounced('');
    }
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => { setDevisDebounced(devisSearch); setDevisPage(1); }, 350);
    return () => clearTimeout(t);
  }, [devisSearch]);

  useEffect(() => {
    const t = setTimeout(() => { setFacturesDebounced(facturesSearch); setFacturesPage(1); }, 350);
    return () => clearTimeout(t);
  }, [facturesSearch]);

  useEffect(() => {
    if (open && client) {
      setLoading(true);
      apiClient
        .get('/devis', { params: { client_id: client.id, search: devisDebounced || undefined, page: devisPage, per_page: perPage } })
        .then((res) => {
          const { items, meta } = unwrapPage(res);
          setDevis(items);
          setDevisMeta(meta);
        })
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client, devisDebounced, devisPage, perPage]);

  useEffect(() => {
    if (open && client) {
      apiClient
        .get('/facture', { params: { client_id: client.id, search: facturesDebounced || undefined, page: facturesPage, per_page: perPage } })
        .then((res) => {
          const { items, meta } = unwrapPage(res);
          setFactures(items);
          setFacturesMeta(meta);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client, facturesDebounced, facturesPage, perPage]);

  function goTo(path) {
    onClose();
    navigate(path);
  }

  function handlePerPageChange(n) {
    setPerPage(n);
    setDevisPage(1);
    setFacturesPage(1);
  }

  return (
    <Modal open={open} onClose={onClose} title={`History — ${client?.name ?? ''}`} maxWidth="max-w-3xl">
      <div className="mb-4 flex items-center justify-end gap-2">
        <span className="text-xs text-slate-500">Rows per list:</span>
        <PerPageSelect value={perPage} onChange={handlePerPageChange} options={[5, 10, 25, 50]} />
      </div>

      {loading && devis.length === 0 && factures.length === 0 ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <div className="flex flex-col gap-6">
          <DocumentTable
            type="devis"
            title="Quotations"
            rows={devis}
            meta={devisMeta}
            page={devisPage}
            setPage={setDevisPage}
            search={devisSearch}
            setSearch={setDevisSearch}
            onRowClick={(row) => goTo(`/devis/${row.id}`)}
            emptyLabel="No quotations found."
          />

          <DocumentTable
            type="facture"
            title="Invoices"
            rows={factures}
            meta={facturesMeta}
            page={facturesPage}
            setPage={setFacturesPage}
            search={facturesSearch}
            setSearch={setFacturesSearch}
            onRowClick={(row) => goTo(`/factures/${row.id}`)}
            emptyLabel="No invoices found."
          />
        </div>
      )}
    </Modal>
  );
}