import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import apiClient, { unwrap } from '../../api/client';

function formatCurrency(value) {
  return new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value ?? 0);
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
}

export default function ClientDetailModal({ open, onClose, clientId }) {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && clientId) {
      setLoading(true);
      apiClient.get(`/clients/${clientId}`)
        .then((res) => setClient(unwrap(res)))
        .finally(() => setLoading(false));
    } else {
      setClient(null);
    }
  }, [open, clientId]);

  return (
    <Modal open={open} onClose={onClose} title="Client details">
      {loading || !client ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{client.name}</h3>
            {client.ice && <p className="text-sm text-slate-500">ICE: {client.ice}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Address</p>
              <p className="text-slate-900">{client.address || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500">Phone</p>
              <p className="text-slate-900">{client.phone || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500">Email</p>
              <p className="text-slate-900">{client.email || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500">Added</p>
              <p className="text-slate-900">{formatDate(client.created_at)}</p>
            </div>
          </div>

          {client.notes && (
            <div className="text-sm">
              <p className="text-slate-500">Notes</p>
              <p className="text-slate-900">{client.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-lg font-semibold text-slate-900">{client.devis_count}</p>
              <p className="text-xs text-slate-500">Quotations</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-lg font-semibold text-slate-900">{client.factures_count}</p>
              <p className="text-xs text-slate-500">Invoices</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-lg font-semibold text-slate-900">{formatCurrency(client.total_billed)}</p>
              <p className="text-xs text-slate-500">Total billed (MAD)</p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}