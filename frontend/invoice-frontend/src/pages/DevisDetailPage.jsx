import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Download, Copy, ArrowRightLeft, Trash2 } from 'lucide-react';
import apiClient, { unwrap } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ConvertToInvoiceModal from '../components/devis/ConvertToInvoiceModal';
import { formatStockWarning } from '../utils/stockWarnings';
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
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-sky-100 text-sky-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function DevisDetailPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [devis, setDevis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  function load() {
    setLoading(true);
    apiClient.get(`/devis/${id}`)
      .then((res) => setDevis(unwrap(res)))
      .catch(() => showToast('Could not load this quotation.', 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiClient.delete(`/devis/${id}`);
      showToast('Quotation deleted.');
      navigate('/devis');
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Could not delete this quotation.', 'error');
      setDeleting(false);
    }
  }

  async function handleDuplicate() {
    try {
      const res = await apiClient.post(`/devis/${id}/duplicate`);
      showToast('Quotation duplicated.');
      navigate(`/devis/${unwrap(res).id}`);
    } catch {
      showToast('Could not duplicate this quotation.', 'error');
    }
  }

  if (loading || !devis) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/devis')} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-900">{devis.reference}</h1>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[devis.status] ?? 'bg-slate-100 text-slate-600'}`}>
                {devis.status}
              </span>
              {devis.is_converted && (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">Converted</span>
              )}
            </div>
            <p className="text-sm text-slate-500">{formatDate(devis.date)}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {!devis.is_converted && canEditDocument(user, devis, { isDevis: true }) && (
            <button onClick={() => navigate(`/devis/${id}/edit`)} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Pencil size={15} /> Edit
            </button>
          )}
          <DownloadPdfButton documentType="devis" documentId={id} reference={devis.reference} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" mobile />
          <button onClick={handleDuplicate} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Copy size={15} /> Duplicate
          </button>
          {!devis.is_converted && (
            <button onClick={() => setConvertOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              <ArrowRightLeft size={15} /> Convert to invoice
            </button>
          )}
          {!devis.is_converted && canDeleteDocuments(user) && (
            <button onClick={() => setDeleteOpen(true)} className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-2 text-xs font-semibold uppercase text-slate-500">Client</h2>
          <p className="font-medium text-slate-900">{devis.client.name}</p>
          {devis.sous_client && (
            <p className="text-sm italic text-indigo-600">
              {devis.sous_client.name}{devis.sous_client.reference ? ` — ${devis.sous_client.reference}` : ''}
            </p>
          )}
          {devis.client.address && <p className="text-sm text-slate-600">{devis.client.address}</p>}
          {devis.client.phone && <p className="text-sm text-slate-600">{devis.client.phone}</p>}
          {devis.client.email && <p className="text-sm text-slate-600">{devis.client.email}</p>}
          {devis.client.ice && <p className="text-sm text-slate-600">ICE: {devis.client.ice}</p>}
        </div>
        {devis.comment && (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-2 text-xs font-semibold uppercase text-slate-500">Comment</h2>
            <p className="text-sm text-slate-600">{devis.comment}</p>
          </div>
        )}
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
              {devis.lines.map((line) => (
                <tr key={line.id}>
                  <td className="py-2.5 text-slate-800">{line.description}</td>
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
              <span>{formatCurrency(devis.subtotal)} MAD</span>
            </div>
            
            <div className="flex justify-between border-b border-slate-100 py-1.5 text-slate-600">
              <span>TVA</span>
              <span>{formatCurrency(devis.tax_total)} MAD</span>
            </div>
            <div className="flex justify-between pt-2 text-base font-semibold text-slate-900">
              <span>Total</span>
              <span>{formatCurrency(devis.total)} MAD</span>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete quotation"
        message={`Are you sure you want to delete "${devis.reference}"? This can't be undone.`}
        loading={deleting}
      />
      <ConvertToInvoiceModal
        open={convertOpen}
        devisId={devis?.id}
        onClose={() => setConvertOpen(false)}
        onConverted={(facture, warnings) => {
          setConvertOpen(false);
          showToast(`Converted to invoice ${facture.reference}.`);
          (warnings || []).forEach((w) => showToast(formatStockWarning(w), 'warning'));
          navigate(`/factures/${facture.id}`, { state: { stockWarnings: warnings || [] } });
        }}
      />
    </div>
  );
}