import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Download, Copy, Trash2, Wallet, AlertCircle, FileSpreadsheet } from 'lucide-react';
import apiClient, { unwrap } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import RecordPaymentModal from '../components/facture/RecordPaymentModal';
import StockWarningBanner from '../components/ui/StockWarningBanner';
import { useAuth } from '../contexts/AuthContext';
import { canEditDocument, canDeleteDocuments } from '../utils/permissions';
import DownloadPdfButton from '../components/templates/DownloadPdfButton';

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

export default function FactureDetailPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [facture, setFacture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const incomingWarnings = location.state?.stockWarnings ?? [];

  function load() {
    setLoading(true);
    apiClient.get(`/facture/${id}`)
      .then((res) => setFacture(unwrap(res)))
      .catch(() => showToast('Could not load this invoice.', 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiClient.delete(`/facture/${id}`);
      showToast('Invoice deleted.');
      navigate('/factures');
    } catch {
      showToast('Could not delete this invoice.', 'error');
      setDeleting(false);
    }
  }

  if (loading || !facture) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      {incomingWarnings.length > 0 && <StockWarningBanner warnings={incomingWarnings} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/factures')} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-900">{facture.reference}</h1>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[facture.payment_status] ?? 'bg-slate-100 text-slate-600'}`}>
                {facture.payment_status === 'partial' ? 'Partial' : facture.payment_status}
              </span>
              {facture.is_overdue && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                  <AlertCircle size={11} /> Overdue
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">
              {formatDate(facture.date)}{facture.due_date && ` · Due ${formatDate(facture.due_date)}`}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {canEditDocument(user, facture) && (
            <button onClick={() => navigate(`/factures/${id}/edit`)} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Pencil size={15} /> Edit
            </button>
          )}
          <DownloadPdfButton documentType="facture" documentId={id} reference={facture.reference} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" mobile />
          <button onClick={() => navigate('/factures/new', { state: { copyFrom: facture } })} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Copy size={15} /> Copy
          </button>
          {facture.payment_status !== 'paid' && (
            <button onClick={() => setPayOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              <Wallet size={15} /> Record payment
            </button>
          )}
          {canDeleteDocuments(user) && (
            <button onClick={() => setDeleteOpen(true)} className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {facture.devis_id && (
        <Link to={`/devis/${facture.devis_id}`} className="flex w-fit items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100">
          <FileSpreadsheet size={14} /> Converted from a quotation — view it
        </Link>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-2 text-xs font-semibold uppercase text-slate-500">Client</h2>
          <p className="font-medium text-slate-900">{facture.client.name}</p>
          {facture.sous_client && (
            <p className="text-sm italic text-indigo-600">
              {facture.sous_client.name}{facture.sous_client.reference ? ` — ${facture.sous_client.reference}` : ''}
            </p>
          )}
          {facture.client.address && <p className="text-sm text-slate-600">{facture.client.address}</p>}
          {facture.client.phone && <p className="text-sm text-slate-600">{facture.client.phone}</p>}
          {facture.client.email && <p className="text-sm text-slate-600">{facture.client.email}</p>}
          {facture.client.ice && <p className="text-sm text-slate-600">ICE: {facture.client.ice}</p>}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-2 text-xs font-semibold uppercase text-slate-500">Payment</h2>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Amount paid</span>
            <span className="font-medium text-slate-900">{formatCurrency(facture.amount_paid)} MAD</span>
          </div>
          <div className="mt-1 flex justify-between text-sm text-slate-600">
            <span>Remaining balance</span>
            <span className="font-medium text-slate-900">{formatCurrency(facture.remaining_balance)} MAD</span>
          </div>
          {facture.comment && (
            <>
              <h2 className="mb-1 mt-4 text-xs font-semibold uppercase text-slate-500">Comment</h2>
              <p className="text-sm text-slate-600">{facture.comment}</p>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase text-slate-500">Products</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 font-medium">Description</th>
                <th className="px-2 py-2 text-right font-medium">Qty</th>
                <th className="px-2 py-2 text-right font-medium">Unit price</th>
                <th className="px-2 py-2 font-medium">Unit</th>
                <th className="px-2 py-2 text-right font-medium">TVA</th>
                <th className="py-2 text-right font-medium">Total HT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {facture.lines.map((line) => (
                <tr key={line.id}>
                  <td className="py-2.5 text-slate-800">
                    <div>{line.description}</div>
                    {line.matricules?.length > 0 && (
                      <div className="mt-0.5 text-xs text-slate-400">
                        Matricules : {line.matricules.map((m) => m.matricule).join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right text-slate-600">{line.quantity}</td>
                  <td className="px-2 py-2.5 text-right text-slate-600">{formatCurrency(line.unit_price)}</td>
                  <td className="px-2 py-2.5 text-slate-600">{line.unit}</td>
                  <td className="px-2 py-2.5 text-right text-slate-600">{line.tva_rate}%</td>
                  <td className="py-2.5 text-right font-medium text-slate-800">{formatCurrency(line.total_ht)} MAD</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <div className="w-full max-w-xs text-sm">
            <div className="flex justify-between border-b border-slate-100 py-1.5 text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(facture.subtotal)} MAD</span>
            </div>
          
            <div className="flex justify-between border-b border-slate-100 py-1.5 text-slate-600">
              <span>TVA</span>
              <span>{formatCurrency(facture.tax_total)} MAD</span>
            </div>
            <div className="flex justify-between pt-2 text-base font-semibold text-slate-900">
              <span>Total</span>
              <span>{formatCurrency(facture.total)} MAD</span>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} title="Delete invoice" message={`Are you sure you want to delete "${facture.reference}"? This can't be undone.`} loading={deleting} />
      <RecordPaymentModal open={payOpen} facture={facture} onClose={() => setPayOpen(false)} onSaved={load} />
    </div>
  );
}