import { useEffect, useState } from 'react';
import { Plus, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../ui/Modal';
import apiClient, { unwrap } from '../../api/client';
import { useToast } from '../../contexts/ToastContext';

const PER_PAGE = 8;

export default function ArticleMatriculesModal({ open, onClose, article }) {
  const [allMatricules, setAllMatricules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [newMatricule, setNewMatricule] = useState('');
  const [adding, setAdding] = useState(false);
  const { showToast } = useToast();

  function load() {
    setLoading(true);
    apiClient.get(`/articles/${article.id}/matricules`)
      .then((res) => setAllMatricules(unwrap(res)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (open && article) {
      setNewMatricule('');
      setSearch('');
      setPage(1);
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, article]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newMatricule.trim()) return;
    setAdding(true);
    try {
      await apiClient.post(`/articles/${article.id}/matricules`, { matricule: newMatricule.trim() });
      setNewMatricule('');
      showToast('Matricule added.');
      load();
    } catch (err) {
      showToast(err.response?.data?.errors?.matricule?.[0] ?? 'Could not add this matricule.', 'error');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(matriculeId) {
    try {
      await apiClient.delete(`/article-matricules/${matriculeId}`);
      showToast('Matricule deleted.');
      load();
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Could not delete this matricule.', 'error');
    }
  }


  const filtered = allMatricules.filter((m) =>
    m.matricule.toLowerCase().includes(search.trim().toLowerCase())
  );
  const lastPage = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <Modal open={open} onClose={onClose} title={`Matricules — ${article?.name ?? ''}`} maxWidth="max-w-lg">
      <form onSubmit={handleAdd} className="mb-3 flex gap-2">
        <input
          value={newMatricule}
          onChange={(e) => setNewMatricule(e.target.value)}
          placeholder="New matricule..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button type="submit" disabled={adding} className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
          <Plus size={15} /> Add
        </button>
      </form>

      <div className="relative mb-3">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search matricules..."
          className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-400">
          {allMatricules.length === 0 ? 'No matricules registered for this article yet.' : 'No matricules match your search.'}
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {pageItems.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <span className="font-medium text-slate-800">{m.matricule}</span>
              <div className="flex items-center gap-2">
                {m.is_invoiced ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    Invoiced{m.facture_reference ? ` — ${m.facture_reference}` : ''}
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Available</span>
                )}
                {!m.is_invoiced && (
                  <button onClick={() => handleDelete(m.id)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600" title="Delete">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length > PER_PAGE && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
          <span>Page {page} of {lastPage}</span>
          <div className="flex gap-1.5">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 disabled:opacity-40">
              <ChevronLeft size={12} /> Prev
            </button>
            <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page >= lastPage} className="flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 disabled:opacity-40">
              Next <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}