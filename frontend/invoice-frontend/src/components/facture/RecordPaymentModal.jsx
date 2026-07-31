import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import apiClient from '../../api/client';
import { useToast } from '../../contexts/ToastContext';

function formatCurrency(value) {
  return new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value ?? 0);
}

export default function RecordPaymentModal({ open, onClose, facture, onSaved }) {
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [amountPaid, setAmountPaid] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (open && facture) {
      setPaymentStatus(facture.payment_status ?? 'unpaid');
      setAmountPaid(String(facture.amount_paid ?? 0));
    }
  }, [open, facture]);

  if (!facture) return null;

  function markFullyPaid() {
    setPaymentStatus('paid');
    setAmountPaid(String(facture.total));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
    await apiClient.put(`/facture/${facture.id}/payment`, {
        payment_status: paymentStatus,
        amount_paid: parseFloat(amountPaid) || 0,
      });
      showToast('Payment updated.');
      onSaved();
      onClose();
    } catch {
      showToast('Could not update payment.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Record payment — ${facture.reference}`} maxWidth="max-w-sm">
      <p className="mb-4 text-sm text-slate-600">
        Invoice total: <span className="font-medium text-slate-900">{formatCurrency(facture.total)} MAD</span>
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Payment status</label>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partially paid</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Amount paid (MAD)</label>
          <input
            type="number" step="0.01" min="0"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <button type="button" onClick={markFullyPaid} className="text-left text-sm font-medium text-indigo-600 hover:text-indigo-700">
          Mark as fully paid
        </button>

        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}