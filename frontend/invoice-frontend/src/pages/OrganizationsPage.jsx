import { useEffect, useState } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, KeyRound, Ban, CheckCircle2 } from 'lucide-react';
import apiClient, { unwrapPage } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import ExpandableRow, { DetailRow } from '../components/ui/ExpandableRow';
import OrganizationFormModal from '../components/organizations/OrganizationFormModal';
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

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [resettingOrg, setResettingOrg] = useState(null);
  const [togglingOrg, setTogglingOrg] = useState(null);
  const [toggling, setToggling] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const timeout = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  function load() {
    setLoading(true);
    apiClient.get('/organizations', { params: { search: debouncedSearch || undefined, page } })
      .then((res) => {
        const { items, meta } = unwrapPage(res);
        setOrganizations(items);
        setMeta(meta);
      })
      .catch(() => showToast('Could not load organizations.', 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page]);

  async function confirmToggle() {
    setToggling(true);
    try {
      await apiClient.put(`/organizations/${togglingOrg.id}/active`);
      showToast(togglingOrg.is_active ? 'Organization deactivated.' : 'Organization reactivated.');
      setTogglingOrg(null);
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
          <h1 className="text-2xl font-semibold text-slate-900">Organizations</h1>
          <p className="text-sm text-slate-500">{meta?.total ?? 0} total</p>
        </div>
        <button onClick={() => setFormOpen(true)} className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          <Plus size={16} /> New organization
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
                <th className="px-4 py-3 text-right font-medium">Clients</th>
                <th className="px-4 py-3 text-right font-medium">Devis</th>
                <th className="px-4 py-3 text-right font-medium">Factures</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">Loading...</td></tr>
              ) : organizations.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">No organizations yet.</td></tr>
              ) : (
                organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{org.name}</td>
                    <td className="px-4 py-3 text-slate-600">{org.email}</td>
                    <td className="px-4 py-3"><StatusBadge active={org.is_active} /></td>
                    <td className="px-4 py-3 text-right text-slate-600">{org.clients_count ?? 0}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{org.devis_count ?? 0}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{org.factures_count ?? 0}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(org.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setResettingOrg(org)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600" title="Reset password">
                          <KeyRound size={16} />
                        </button>
                        <button onClick={() => setTogglingOrg(org)} className={`rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 ${org.is_active ? 'hover:text-red-600' : 'hover:text-emerald-600'}`} title={org.is_active ? 'Deactivate' : 'Reactivate'}>
                          {org.is_active ? <Ban size={16} /> : <CheckCircle2 size={16} />}
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
          ) : organizations.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-400">No organizations yet.</p>
          ) : (
            organizations.map((org) => (
              <ExpandableRow
                key={org.id}
                summary={
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-slate-900">{org.name}</span>
                      <span className="shrink-0"><StatusBadge active={org.is_active} /></span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{org.email}</p>
                  </div>
                }
                details={
                  <>
                    <DetailRow label="Clients" value={org.clients_count ?? 0} />
                    <DetailRow label="Devis" value={org.devis_count ?? 0} />
                    <DetailRow label="Factures" value={org.factures_count ?? 0} />
                    <DetailRow label="Created" value={formatDate(org.created_at)} />
                  </>
                }
                actions={
                  <>
                    <button onClick={() => setResettingOrg(org)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
                      <KeyRound size={14} /> Reset password
                    </button>
                    <button onClick={() => setTogglingOrg(org)} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-slate-100 ${org.is_active ? 'text-red-600' : 'text-emerald-600'}`}>
                      {org.is_active ? <Ban size={14} /> : <CheckCircle2 size={14} />} {org.is_active ? 'Deactivate' : 'Reactivate'}
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

      <OrganizationFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={load} />
      <ResetPasswordModal open={Boolean(resettingOrg)} onClose={() => setResettingOrg(null)} endpoint={resettingOrg ? `/organizations/${resettingOrg.id}/password` : ''} subjectName={resettingOrg?.name} />
      <ConfirmDialog
        open={Boolean(togglingOrg)}
        onClose={() => setTogglingOrg(null)}
        onConfirm={confirmToggle}
        title={togglingOrg?.is_active ? 'Deactivate organization' : 'Reactivate organization'}
        message={togglingOrg?.is_active
          ? `"${togglingOrg?.name}" AND every one of its users will immediately lose access. You can reactivate at any time.`
          : `"${togglingOrg?.name}" and its users will regain access.`}
        confirmLabel={togglingOrg?.is_active ? 'Deactivate' : 'Reactivate'}
        danger={Boolean(togglingOrg?.is_active)}
        loading={toggling}
      />
    </div>
  );
}