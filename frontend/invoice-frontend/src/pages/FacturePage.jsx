import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Pencil, Trash2, Download, Copy, Wallet, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import apiClient, { unwrap, unwrapPage } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import SortableHeader from '../components/ui/SortableHeader';
import RecordPaymentModal from '../components/facture/RecordPaymentModal';
import ExpandableRow, { DetailRow } from '../components/ui/ExpandableRow';
import PerPageSelect from '../components/ui/PerPageSelect';
import EditableNextReference from '../components/devis/EditableNextReference';

function formatCurrency(value) {
  return new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value ?? 0);
}
function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
}

const statusStyles = {
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
};

export default function FacturePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [factures, setFactures] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('reference');
  const [sortDir, setSortDir] = useState('desc');
  const [nextReference, setNextReference] = useState(null);
  const [loading, setLoading] = useState(true);

  const [deletingFacture, setDeletingFacture] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [payingFacture, setPayingFacture] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  function loadFactures() {
    setLoading(true);
    apiClient
      .get('/facture', {
        params: {
          search: debouncedSearch || undefined,
          payment_status: statusFilter || undefined,
          sort_by: sortBy,
          sort_dir: sortDir,
          page,
          per_page: perPage,
        },
      })
      .then((res) => {
        const { items, meta } = unwrapPage(res);
        setFactures(items);
        setMeta(meta);
      })
      .catch(() => showToast('Could not load invoices.', 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadFactures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, sortBy, sortDir, page, perPage]);

  useEffect(() => {
    apiClient.get('/facture/next-reference').then((res) => setNextReference(res.data)).catch(() => {});
  }, []);

  function handleSort(key) {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
    setPage(1);
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await apiClient.delete(`/facture/${deletingFacture.id}`);
      showToast('Invoice deleted.');
      setDeletingFacture(null);
      loadFactures();
    } catch {
      showToast('Could not delete this invoice.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  async function handleDownload(item) {
    try {
      const res = await apiClient.get(`/facture/${item.id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${item.reference}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast('Could not download the PDF.', 'error');
    }
  }

  async function handleCopy(item) {
    try {
      const res = await apiClient.get(`/facture/${item.id}`);
      navigate('/factures/new', { state: { copyFrom: unwrap(res) } });
    } catch {
      showToast('Could not copy this invoice.', 'error');
    }
  }

  function renderActions(item, mobile) {
    const cls = mobile
      ? 'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-slate-100'
      : 'rounded-lg p-1.5 hover:bg-slate-100';
    const iconSize = mobile ? 14 : 16;

    return (
      <>
        <button onClick={() => navigate(`/factures/${item.id}`)} className={`${cls} text-slate-600`} title="View">
          <Eye size={iconSize} /> {mobile && 'View'}
        </button>
        <button onClick={() => navigate(`/factures/${item.id}/edit`)} className={`${cls} text-indigo-600`} title="Edit">
          <Pencil size={iconSize} /> {mobile && 'Edit'}
        </button>
        <button onClick={() => handleDownload(item)} className={`${cls} text-slate-600`} title="Download PDF">
          <Download size={iconSize} /> {mobile && 'PDF'}
        </button>
        <button onClick={() => handleCopy(item)} className={`${cls} text-slate-600`} title="Copy">
          <Copy size={iconSize} /> {mobile && 'Copy'}
        </button>
        {item.payment_status !== 'paid' && (
          <button onClick={() => setPayingFacture(item)} className={`${cls} text-emerald-600`} title="Record payment">
            <Wallet size={iconSize} /> {mobile && 'Record payment'}
          </button>
        )}
        <button onClick={() => setDeletingFacture(item)} className={`${cls} text-red-600`} title="Delete">
          <Trash2 size={iconSize} /> {mobile && 'Delete'}
        </button>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Factures</h1>
          <p className="text-sm text-slate-500">{meta?.total ?? 0} total</p>
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <EditableNextReference documentType="facture" value={nextReference} onChange={setNextReference} />
          <Link to="/factures/new" className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <Plus size={16} />
            New invoice
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reference, client, sous-client, matricule..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All payment statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partially paid</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <SortableHeader label="Reference" sortKey="reference" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 font-medium">Client</th>
                <SortableHeader label="Date" sortKey="date" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Total" sortKey="total" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} align="right" />
                <SortableHeader label="Paid" sortKey="amount_paid" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} align="right" />
                <SortableHeader label="Payment" sortKey="payment_status" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Loading...</td></tr>
              ) : factures.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No invoices found.</td></tr>
              ) : (
                factures.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{item.reference}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{item.client?.name}</div>
                      {item.sous_client && (
                        <div className="text-xs italic text-indigo-600">
                          {item.sous_client.name}{item.sous_client.reference ? ` — ${item.sous_client.reference}` : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(item.date)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.total)} MAD</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.amount_paid)} MAD</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[item.payment_status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {item.payment_status === 'partial' ? 'Partial' : item.payment_status}
                      </span>
                      {item.is_overdue && (
                        <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                          <AlertCircle size={11} /> Overdue
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">{renderActions(item, false)}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden">
          {loading ? (
            <p className="px-4 py-10 text-center text-sm text-slate-400">Loading...</p>
          ) : factures.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-400">No invoices found.</p>
          ) : (
            factures.map((item) => (
              <ExpandableRow
                key={item.id}
                summary={
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-slate-900">{item.reference}</span>
                      <div className="flex shrink-0 items-center gap-1">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[item.payment_status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {item.payment_status === 'partial' ? 'Partial' : item.payment_status}
                        </span>
                        {item.is_overdue && <AlertCircle size={13} className="text-red-500" />}
                      </div>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-slate-500">{item.client?.name}</span>
                      <span className="shrink-0 text-xs font-medium text-slate-700">{formatCurrency(item.total)} MAD</span>
                    </div>
                  </div>
                }
                details={
                  <>
                    <DetailRow label="Date" value={formatDate(item.date)} />
                    <DetailRow label="Paid" value={`${formatCurrency(item.amount_paid)} MAD`} />
                    <DetailRow label="Remaining" value={`${formatCurrency(item.remaining_balance)} MAD`} />
                    {item.sous_client && (
                      <DetailRow label="Sous-client" value={`${item.sous_client.name}${item.sous_client.reference ? ' — ' + item.sous_client.reference : ''}`} />
                    )}
                  </>
                }
                actions={renderActions(item, true)}
              />
            ))
          )}
        </div>

        {meta && meta.total > 0 && (
          <div className="flex flex-col items-start justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <PerPageSelect value={perPage} onChange={(n) => { setPerPage(n); setPage(1); }} />
              <span>Page {meta.current_page} of {meta.last_page}</span>
            </div>
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
      </div>

      <ConfirmDialog
        open={Boolean(deletingFacture)}
        onClose={() => setDeletingFacture(null)}
        onConfirm={confirmDelete}
        title="Delete invoice"
        message={`Are you sure you want to delete "${deletingFacture?.reference}"? This can't be undone.`}
        loading={deleting}
      />
      <RecordPaymentModal open={Boolean(payingFacture)} facture={payingFacture} onClose={() => setPayingFacture(null)} onSaved={loadFactures} />
    </div>
  );
}