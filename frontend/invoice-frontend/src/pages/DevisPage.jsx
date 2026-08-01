import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Pencil, Trash2, Download, Copy, ArrowRightLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient, { unwrap, unwrapPage } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ConvertToInvoiceModal from '../components/devis/ConvertToInvoiceModal';
import EditableNextReference from '../components/devis/EditableNextReference';
import ExpandableRow, { DetailRow } from '../components/ui/ExpandableRow';
import PerPageSelect from '../components/ui/PerPageSelect';
import { useAuth } from '../contexts/AuthContext';
import { canEditDocument, canDeleteDocuments } from '../utils/permissions';
import { formatStockWarning } from '../utils/stockWarnings';

function formatCurrency(value) {
  return new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value ?? 0);
}
function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
}

const statusStyles = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-sky-100 text-sky-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function DevisPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [devis, setDevis] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [deletingDevis, setDeletingDevis] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [convertingDevis, setConvertingDevis] = useState(null);
  const [nextReference, setNextReference] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  function loadDevis() {
    setLoading(true);
    apiClient
      .get('/devis', { params: { search: debouncedSearch || undefined, status: statusFilter || undefined, sort_by: 'reference', sort_dir: 'desc', page, per_page: perPage } })
      .then((res) => {
        const { items, meta } = unwrapPage(res);
        setDevis(items);
        setMeta(meta);
      })
      .catch(() => showToast('Could not load quotations.', 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadDevis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, page, perPage]);

  useEffect(() => {
    apiClient.get('/devis/next-reference').then((res) => setNextReference(res.data)).catch(() => {});
  }, []);

  async function confirmDelete() {
    setDeleting(true);
    try {
      await apiClient.delete(`/devis/${deletingDevis.id}`);
      showToast('Quotation deleted.');
      setDeletingDevis(null);
      loadDevis();
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Could not delete this quotation.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  async function handleDuplicate(item) {
    try {
      const res = await apiClient.post(`/devis/${item.id}/duplicate`);
      const created = unwrap(res);
      showToast('Quotation duplicated.');
      navigate(`/devis/${created.id}`);
    } catch {
      showToast('Could not duplicate this quotation.', 'error');
    }
  }

  async function handleDownload(item) {
    try {
      const res = await apiClient.get(`/devis/${item.id}/pdf`, { responseType: 'blob' });
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

  function renderActions(item, mobile) {
    const cls = mobile
      ? 'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-slate-100'
      : 'rounded-lg p-1.5 hover:bg-slate-100';
    const iconSize = mobile ? 14 : 16;
    const canEdit = canEditDocument(user, item, { isDevis: true });
    const canDelete = canDeleteDocuments(user);

    return (
      <>
        <button onClick={() => navigate(`/devis/${item.id}`)} className={`${cls} text-slate-600`} title="View">
          <Eye size={iconSize} /> {mobile && 'View'}
        </button>
        {!item.is_converted && canEdit && (
          <button onClick={() => navigate(`/devis/${item.id}/edit`)} className={`${cls} text-indigo-600`} title="Edit">
            <Pencil size={iconSize} /> {mobile && 'Edit'}
          </button>
        )}
        <button onClick={() => handleDownload(item)} className={`${cls} text-slate-600`} title="Download PDF">
          <Download size={iconSize} /> {mobile && 'PDF'}
        </button>
        <button onClick={() => handleDuplicate(item)} className={`${cls} text-slate-600`} title="Duplicate">
          <Copy size={iconSize} /> {mobile && 'Duplicate'}
        </button>
        {!item.is_converted && (
          <button onClick={() => setConvertingDevis(item)} className={`${cls} text-emerald-600`} title="Convert to invoice">
            <ArrowRightLeft size={iconSize} /> {mobile && 'Convert'}
          </button>
        )}
        {!item.is_converted && canDelete && (
          <button onClick={() => setDeletingDevis(item)} className={`${cls} text-red-600`} title="Delete">
            <Trash2 size={iconSize} /> {mobile && 'Delete'}
          </button>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Devis</h1>
          <p className="text-sm text-slate-500">{meta?.total ?? 0} total</p>
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <EditableNextReference documentType="devis" value={nextReference} onChange={setNextReference} />
          <Link
            to="/devis/new"
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus size={16} />
            New quotation
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reference or client..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">Loading...</td></tr>
              ) : devis.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No quotations found.</td></tr>
              ) : (
                devis.map((item) => (
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
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[item.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {item.status}
                      </span>
                      {item.is_converted && (
                        <span className="ml-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">Converted</span>
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
          ) : devis.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-400">No quotations found.</p>
          ) : (
            devis.map((item) => (
              <ExpandableRow
                key={item.id}
                summary={
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-slate-900">{item.reference}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[item.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {item.status}
                      </span>
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
                    {item.sous_client && (
                      <DetailRow label="Sous-client" value={`${item.sous_client.name}${item.sous_client.reference ? ' — ' + item.sous_client.reference : ''}`} />
                    )}
                    {item.is_converted && <DetailRow label="Converted" value="Yes" />}
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
        open={Boolean(deletingDevis)}
        onClose={() => setDeletingDevis(null)}
        onConfirm={confirmDelete}
        title="Delete quotation"
        message={`Are you sure you want to delete "${deletingDevis?.reference}"? This can't be undone.`}
        loading={deleting}
      />

      <ConvertToInvoiceModal
        open={Boolean(convertingDevis)}
        devisId={convertingDevis?.id}
        onClose={() => setConvertingDevis(null)}
        onConverted={(facture, warnings) => {
          setConvertingDevis(null);
          showToast(`Converted to invoice ${facture.reference}.`);
          (warnings || []).forEach((w) => showToast(formatStockWarning(w), 'warning'));
          navigate(`/factures/${facture.id}`, { state: { stockWarnings: warnings || [] } });
        }}
      />
    </div>
  );
}