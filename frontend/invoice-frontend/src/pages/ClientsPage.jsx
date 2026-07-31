import { useEffect, useState } from 'react';
import { Plus, Search, Eye, History, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient, { unwrapPage } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import ClientFormModal from '../components/clients/ClientFormModal';
import ClientDetailModal from '../components/clients/ClientDetailModal';
import ClientHistoryModal from '../components/clients/ClientHistoryModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ExpandableRow, { DetailRow } from '../components/ui/ExpandableRow';
import PerPageSelect from '../components/ui/PerPageSelect';
function formatCurrency(value) {
  return new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value ?? 0);
}



function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
}

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [meta, setMeta] = useState(null);
const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [detailClientId, setDetailClientId] = useState(null);
  const [historyClient, setHistoryClient] = useState(null);
  const [deletingClient, setDeletingClient] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  function loadClients() {
    setLoading(true);
    apiClient
.get('/clients', { params: { search: debouncedSearch || undefined, page, per_page: perPage } })      .then((res) => {
        const { items, meta } = unwrapPage(res);
        setClients(items);
        setMeta(meta);
      })
      .catch(() => showToast('Could not load clients.', 'error'))
      .finally(() => setLoading(false));
  }

useEffect(() => {
    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page, perPage]);

  function openCreate() {
    setEditingClient(null);
    setFormOpen(true);
  }

  function openEdit(client) {
    setEditingClient(client);
    setFormOpen(true);
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await apiClient.delete(`/clients/${deletingClient.id}`);
      showToast('Client deleted.');
      setDeletingClient(null);
      loadClients();
    } catch {
      showToast('Could not delete this client.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500">{meta?.total ?? 0} total</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus size={16} />
          New client
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, ICE, phone..."
          className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">ICE</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 text-right font-medium">Quotes</th>
                <th className="px-4 py-3 text-right font-medium">Invoices</th>
                <th className="px-4 py-3 text-right font-medium">Total billed</th>
                <th className="px-4 py-3 font-medium">Added</th>
                <th className="px-4 py-3 font-medium">Last activity</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-400">Loading...</td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-400">No clients found.</td></tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{client.name}</td>
                    <td className="px-4 py-3 text-slate-600">{client.ice || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{client.phone || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{client.email || '—'}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{client.devis_count ?? 0}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{client.factures_count ?? 0}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(client.total_billed)} MAD</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(client.created_at)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(client.last_activity)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setDetailClientId(client.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="View">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => setHistoryClient(client)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600" title="History">
                          <History size={16} />
                        </button>
                        <button onClick={() => openEdit(client)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600" title="Edit">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => setDeletingClient(client)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
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
          ) : clients.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-400">No clients found.</p>
          ) : (
            clients.map((client) => (
              <ExpandableRow
                key={client.id}
                summary={
                  <div>
                    <p className="truncate font-medium text-slate-900">{client.name}</p>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-slate-500">{client.phone || client.email || '—'}</span>
                      <span className="shrink-0 text-xs font-medium text-slate-600">{formatCurrency(client.total_billed)} MAD</span>
                    </div>
                  </div>
                }
                details={
                  <>
                    <DetailRow label="ICE" value={client.ice || '—'} />
                    <DetailRow label="Email" value={client.email || '—'} />
                    <DetailRow label="Quotes" value={client.devis_count ?? 0} />
                    <DetailRow label="Invoices" value={client.factures_count ?? 0} />
                    <DetailRow label="Added" value={formatDate(client.created_at)} />
                    <DetailRow label="Last activity" value={formatDate(client.last_activity)} />
                  </>
                }
                actions={
                  <>
                    <button onClick={() => setDetailClientId(client.id)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
                      <Eye size={14} /> View
                    </button>
                    <button onClick={() => setHistoryClient(client)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
                      <History size={14} /> History
                    </button>
                    <button onClick={() => openEdit(client)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50">
                      <Pencil size={14} /> Edit
                    </button>
                    <button onClick={() => setDeletingClient(client)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                      <Trash2 size={14} /> Delete
                    </button>
                  </>
                }
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

      <ClientFormModal open={formOpen} onClose={() => setFormOpen(false)} client={editingClient} onSaved={loadClients} />
      <ClientDetailModal open={Boolean(detailClientId)} onClose={() => setDetailClientId(null)} clientId={detailClientId} />
      <ClientHistoryModal open={Boolean(historyClient)} onClose={() => setHistoryClient(null)} client={historyClient} />
      <ConfirmDialog
        open={Boolean(deletingClient)}
        onClose={() => setDeletingClient(null)}
        onConfirm={confirmDelete}
        title="Delete client"
        message={`Are you sure you want to delete "${deletingClient?.name}"? This can't be undone.`}
        loading={deleting}
      />
    </div>
  );
}