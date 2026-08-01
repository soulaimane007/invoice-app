import { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ScrollText } from 'lucide-react';
import apiClient, { unwrapPage } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ExpandableRow, { DetailRow } from '../components/ui/ExpandableRow';

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('fr-FR');
}

function describeLog(log) {
  const label = log.subject_label || '';
  const meta = log.metadata || {};
  switch (log.action) {
    case 'devis.created': return `Created quotation ${label}`;
    case 'devis.updated': {
      const parts = [];
      if (meta.reference_changed) parts.push(`reference changed from ${meta.reference_changed.from} to ${meta.reference_changed.to}`);
      if (meta.status_changed) parts.push(`status changed from ${meta.status_changed.from} to ${meta.status_changed.to}`);
      return `Edited quotation ${label}${parts.length ? ' — ' + parts.join(', ') : ''}`;
    }
    case 'devis.deleted': return `Deleted quotation ${label}`;
    case 'devis.converted': return `Converted quotation ${label} to invoice ${meta.facture_reference ?? ''}`;
    case 'devis.duplicated': return `Duplicated quotation ${meta.original_reference ?? ''} as ${label}`;
    case 'facture.created': return `Created invoice ${label}`;
    case 'facture.updated': {
      const parts = [];
      if (meta.reference_changed) parts.push(`reference changed from ${meta.reference_changed.from} to ${meta.reference_changed.to}`);
      return `Edited invoice ${label}${parts.length ? ' — ' + parts.join(', ') : ''}`;
    }
    case 'facture.deleted': return `Deleted invoice ${label}`;
    case 'facture.payment_recorded': return `Recorded payment on invoice ${label} — ${meta.status ?? ''}, ${meta.amount_paid ?? ''} MAD`;
    case 'user.created': return `Created user ${label}`;
    case 'user.permissions_updated': return `Updated permissions for user ${label}`;
    case 'user.password_reset': return `Reset password for user ${label}`;
    case 'user.deactivated': return `Deactivated user ${label}`;
    case 'user.activated': return `Reactivated user ${label}`;
    case 'organization.created': return `Created organization ${label}`;
    case 'organization.password_reset': return `Reset password for organization ${label}`;
    case 'organization.deactivated': return `Deactivated organization ${label}`;
    case 'organization.activated': return `Reactivated organization ${label}`;
    default: return `${log.action}${label ? ' — ' + label : ''}`;
  }
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const isDeveloper = user?.role === 'developer';

  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const timeout = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    apiClient.get('/audit-logs', { params: { search: debouncedSearch || undefined, page } })
      .then((res) => {
        const { items, meta } = unwrapPage(res);
        setLogs(items);
        setMeta(meta);
      })
      .catch(() => showToast('Could not load activity logs.', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
          <ScrollText size={22} className="text-indigo-600" /> Activity log
        </h1>
        <p className="text-sm text-slate-500">
          {meta?.total ?? 0} total — {isDeveloper ? 'across every organization.' : 'everything done within your organization.'}
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by person or document..."
          className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                {isDeveloper && <th className="px-4 py-3 font-medium">Organization</th>}
                <th className="px-4 py-3 font-medium">Who</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={isDeveloper ? 4 : 3} className="px-4 py-10 text-center text-slate-400">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={isDeveloper ? 4 : 3} className="px-4 py-10 text-center text-slate-400">No activity recorded yet.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDateTime(log.created_at)}</td>
                    {isDeveloper && <td className="px-4 py-3 text-slate-600">{log.organization?.name ?? '—'}</td>}
                    <td className="px-4 py-3 text-slate-600">
                      {log.actor_name ?? 'Unknown'}
                      {log.actor_role && <span className="ml-1 text-xs text-slate-400">({log.actor_role})</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-800">{describeLog(log)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden">
          {loading ? (
            <p className="px-4 py-10 text-center text-sm text-slate-400">Loading...</p>
          ) : logs.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-400">No activity recorded yet.</p>
          ) : (
            logs.map((log) => (
              <ExpandableRow
                key={log.id}
                summary={
                  <div>
                    <p className="truncate text-slate-800">{describeLog(log)}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{log.actor_name ?? 'Unknown'} · {formatDateTime(log.created_at)}</p>
                  </div>
                }
                details={isDeveloper ? <DetailRow label="Organization" value={log.organization?.name ?? '—'} /> : null}
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
    </div>
  );
}