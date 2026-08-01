import { useEffect, useState } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, ShieldCheck, KeyRound, Ban, CheckCircle2 } from 'lucide-react';
import apiClient, { unwrapPage } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import ExpandableRow, { DetailRow } from '../components/ui/ExpandableRow';
import UserFormModal from '../components/users/UserFormModal';
import ResetPasswordModal from '../components/users/ResetPasswordModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
}

function StatusBadge({ active }) {
  return active
    ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Active</span>
    : <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">Deactivated</span>;
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resettingUser, setResettingUser] = useState(null);
  const [togglingUser, setTogglingUser] = useState(null);
  const [toggling, setToggling] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    const timeout = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  function load() {
    setLoading(true);
    apiClient.get('/users', { params: { search: debouncedSearch || undefined, page } })
      .then((res) => {
        const { items, meta } = unwrapPage(res);
        setUsers(items);
        setMeta(meta);
      })
      .catch(() => showToast('Could not load users.', 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page]);

  function openCreate() {
    setEditingUser(null);
    setFormOpen(true);
  }

  function openPermissions(user) {
    setEditingUser(user);
    setFormOpen(true);
  }

  async function confirmToggle() {
    setToggling(true);
    try {
      await apiClient.put(`/users/${togglingUser.id}/active`);
      showToast(togglingUser.is_active ? 'User deactivated.' : 'User reactivated.');
      setTogglingUser(null);
      load();
    } catch {
      showToast('Could not update this account.', 'error');
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500">{meta?.total ?? 0} total — everyone with access shares full visibility within your organization.</p>
        </div>
        <button onClick={openCreate} className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          <Plus size={16} /> New user
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..."
          className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Added</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No users yet.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3"><StatusBadge active={u.is_active} /></td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openPermissions(u)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600" title="Permissions">
                          <ShieldCheck size={16} />
                        </button>
                        <button onClick={() => setResettingUser(u)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600" title="Reset password">
                          <KeyRound size={16} />
                        </button>
                        <button onClick={() => setTogglingUser(u)} className={`rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 ${u.is_active ? 'hover:text-red-600' : 'hover:text-emerald-600'}`} title={u.is_active ? 'Deactivate' : 'Reactivate'}>
                          {u.is_active ? <Ban size={16} /> : <CheckCircle2 size={16} />}
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
          ) : users.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-400">No users yet.</p>
          ) : (
            users.map((u) => (
              <ExpandableRow
                key={u.id}
                summary={
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-slate-900">{u.name}</span>
                      <span className="shrink-0"><StatusBadge active={u.is_active} /></span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{u.email}</p>
                  </div>
                }
                details={<DetailRow label="Added" value={formatDate(u.created_at)} />}
                actions={
                  <>
                    <button onClick={() => openPermissions(u)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50">
                      <ShieldCheck size={14} /> Permissions
                    </button>
                    <button onClick={() => setResettingUser(u)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
                      <KeyRound size={14} /> Reset password
                    </button>
                    <button onClick={() => setTogglingUser(u)} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-slate-100 ${u.is_active ? 'text-red-600' : 'text-emerald-600'}`}>
                      {u.is_active ? <Ban size={14} /> : <CheckCircle2 size={14} />} {u.is_active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </>
                }
              />
            ))
          )}
        </div>

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
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
      </div>

      <UserFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={load} user={editingUser} />
      <ResetPasswordModal open={Boolean(resettingUser)} onClose={() => setResettingUser(null)} endpoint={resettingUser ? `/users/${resettingUser.id}/password` : ''} subjectName={resettingUser?.name} />
      <ConfirmDialog
        open={Boolean(togglingUser)}
        onClose={() => setTogglingUser(null)}
        onConfirm={confirmToggle}
        title={togglingUser?.is_active ? 'Deactivate user' : 'Reactivate user'}
        message={togglingUser?.is_active
          ? `"${togglingUser?.name}" will immediately lose access to the app. You can reactivate them at any time.`
          : `"${togglingUser?.name}" will regain access to the app.`}
        confirmLabel={togglingUser?.is_active ? 'Deactivate' : 'Reactivate'}
        danger={Boolean(togglingUser?.is_active)}
        loading={toggling}
      />
    </div>
  );
}