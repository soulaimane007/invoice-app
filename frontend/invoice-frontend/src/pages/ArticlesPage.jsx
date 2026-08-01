import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight, Package, TrendingDown, Boxes, Wallet, AlertTriangle, Barcode, History } from 'lucide-react';
import apiClient, { unwrapPage } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import ArticleFormModal from '../components/articles/ArticleFormModal';
import ArticleMatriculesModal from '../components/articles/ArticleMatriculesModal';
import ArticleHistoryModal from '../components/articles/ArticleHistoryModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ExpandableRow, { DetailRow } from '../components/ui/ExpandableRow';
import PerPageSelect from '../components/ui/PerPageSelect';
import { useAuth } from '../contexts/AuthContext';
import { canDeleteRecords } from '../utils/permissions';
function formatCurrency(value) {
  return new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value ?? 0);
}

function StockValue({ quantity }) {
  if (quantity < 0) {
    return (
      <span className="inline-flex items-center gap-1 font-medium text-red-600">
        <AlertTriangle size={13} />
        {quantity}
      </span>
    );
  }
  return quantity;
}

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className={`rounded-lg p-1.5 ${accent}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function StatusBadge({ article }) {
  if (!article.is_active) {
    return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Inactive</span>;
  }
  if (article.is_low_stock) {
    return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Low stock</span>;
  }
  return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">In stock</span>;
}

export default function ArticlesPage() {
   const { user } = useAuth();
  const canDelete = canDeleteRecords(user);
  const [articles, setArticles] = useState([]);
  const [meta, setMeta] = useState(null);
  const [stats, setStats] = useState(null);
const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [matriculeArticle, setMatriculeArticle] = useState(null);
  const [historyArticle, setHistoryArticle] = useState(null);
  const [deletingArticle, setDeletingArticle] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  function loadArticles() {
    setLoading(true);
    apiClient
.get('/articles', { params: { search: debouncedSearch || undefined, low_stock: lowStockOnly || undefined, page, per_page: perPage } })      .then((res) => {
        const { items, meta } = unwrapPage(res);
        setArticles(items);
        setMeta(meta);
      })
      .catch(() => showToast('Could not load articles.', 'error'))
      .finally(() => setLoading(false));
  }

  function loadStats() {
    apiClient.get('/articles/stats').then((res) => setStats(res.data)).catch(() => {});
  }

useEffect(() => {
    loadArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, lowStockOnly, page, perPage]);

  useEffect(() => {
    loadStats();
  }, []);

  function openCreate() {
    setEditingArticle(null);
    setFormOpen(true);
  }

  function openEdit(article) {
    setEditingArticle(article);
    setFormOpen(true);
  }

  function handleSaved() {
    loadArticles();
    loadStats();
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await apiClient.delete(`/articles/${deletingArticle.id}`);
      showToast('Article deleted.');
      setDeletingArticle(null);
      loadArticles();
      loadStats();
    } catch {
      showToast('Could not delete this article.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Articles</h1>
          <p className="text-sm text-slate-500">{meta?.total ?? 0} total</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus size={16} />
          New article
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Total articles" value={stats.total_articles} icon={Package} accent="bg-indigo-50 text-indigo-600" />
          <StatCard label="Total stock" value={stats.total_stock} icon={Boxes} accent="bg-sky-50 text-sky-600" />
          <StatCard label="Stock value" value={`${formatCurrency(stats.stock_value)} MAD`} icon={Wallet} accent="bg-emerald-50 text-emerald-600" />
          <StatCard label="Total sold" value={stats.total_sold} icon={TrendingDown} accent="bg-amber-50 text-amber-600" />
          <StatCard label="Low stock" value={stats.low_stock_count} icon={AlertTriangle} accent="bg-red-50 text-red-600" />
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, reference, category..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1); }}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Low stock only
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 text-right font-medium">Unit price</th>
                <th className="px-4 py-3 text-right font-medium">In stock</th>
                <th className="px-4 py-3 text-right font-medium">Sold</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">Loading...</td></tr>
              ) : articles.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">No articles found.</td></tr>
              ) : (
                articles.map((article) => (
                  <tr key={article.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{article.name}</td>
                    <td className="px-4 py-3 text-slate-600">{article.reference}</td>
                    <td className="px-4 py-3 text-slate-600">{article.category || '—'}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(article.unit_price)} MAD</td>
<td className="px-4 py-3 text-right text-slate-600"><StockValue quantity={article.quantity_in_stock} /></td>                    <td className="px-4 py-3 text-right text-slate-600">{article.quantity_sold}</td>
                    <td className="px-4 py-3"><StatusBadge article={article} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setHistoryArticle(article)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600" title="History">
                          <History size={16} />
                        </button>
                        <button onClick={() => setMatriculeArticle(article)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600" title="Matricules">
                          <Barcode size={16} />
                        </button>
                        <button onClick={() => openEdit(article)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600" title="Edit">
                          <Pencil size={16} />
                        </button>
                             {canDelete && (
                        <button onClick={() => setDeletingArticle(article)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600" title="Delete">
                          <Trash2 size={16} />
                        </button>)}
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
          ) : articles.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-400">No articles found.</p>
          ) : (
            articles.map((article) => (
              <ExpandableRow
                key={article.id}
                summary={
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-slate-900">{article.name}</span>
                      <span className="shrink-0"><StatusBadge article={article} /></span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-slate-500">{article.reference}</span>
<span className="shrink-0 text-xs text-slate-500"><StockValue quantity={article.quantity_in_stock} /> in stock</span>                    </div>
                  </div>
                }
                details={
                  <>
                    <DetailRow label="Category" value={article.category || '—'} />
                    <DetailRow label="Unit price" value={`${formatCurrency(article.unit_price)} MAD`} />
                    <DetailRow label="Sold" value={article.quantity_sold} />
                  </>
                }
                actions={
                  <>
                    <button onClick={() => setHistoryArticle(article)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
                      <History size={14} /> History
                    </button>
                    <button onClick={() => setMatriculeArticle(article)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
                      <Barcode size={14} /> Matricules
                    </button>
                    <button onClick={() => openEdit(article)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50">
                      <Pencil size={14} /> Edit
                    </button>
                    {canDelete && (
                    <button onClick={() => setDeletingArticle(article)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                      <Trash2 size={14} /> Delete
                    </button>        )}
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

      <ArticleFormModal open={formOpen} onClose={() => setFormOpen(false)} article={editingArticle} onSaved={handleSaved} />
      <ArticleMatriculesModal open={Boolean(matriculeArticle)} onClose={() => setMatriculeArticle(null)} article={matriculeArticle} />
      <ArticleHistoryModal open={Boolean(historyArticle)} onClose={() => setHistoryArticle(null)} article={historyArticle} />
      <ConfirmDialog
        open={Boolean(deletingArticle)}
        onClose={() => setDeletingArticle(null)}
        onConfirm={confirmDelete}
        title="Delete article"
        message={`Are you sure you want to delete "${deletingArticle?.name}"? This can't be undone.`}
        loading={deleting}
      />
    </div>
  );
}