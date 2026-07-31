import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import UnitInput from '../ui/UnitInput';
import apiClient from '../../api/client';
import { useToast } from '../../contexts/ToastContext';

const emptyForm = {
  name: '', reference: '', category: '', description: '', unit: 'Unité',
  unit_price: '', tva_rate: '20', quantity_in_stock: '0',
  stock_alert_threshold: '5', is_active: true,
};

export default function ArticleFormModal({ open, onClose, article, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const isEdit = Boolean(article);

  useEffect(() => {
    if (open) {
      setForm(article ? {
        name: article.name ?? '',
        reference: article.reference ?? '',
        category: article.category ?? '',
        description: article.description ?? '',
        unit: article.unit ?? 'Unité',
        unit_price: String(article.unit_price ?? ''),
        tva_rate: String(article.tva_rate ?? '20'),
        quantity_in_stock: String(article.quantity_in_stock ?? '0'),
        stock_alert_threshold: String(article.stock_alert_threshold ?? '5'),
        is_active: article.is_active ?? true,
      } : emptyForm);
      setErrors({});
    }
  }, [open, article]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    const payload = {
      ...form,
      unit_price: parseFloat(form.unit_price) || 0,
      tva_rate: parseFloat(form.tva_rate) || 0,
      quantity_in_stock: parseInt(form.quantity_in_stock, 10) || 0,
      stock_alert_threshold: parseInt(form.stock_alert_threshold, 10) || 0,
    };

    try {
      if (isEdit) {
        await apiClient.put(`/articles/${article.id}`, payload);
        showToast('Article updated.');
      } else {
        await apiClient.post('/articles', payload);
        showToast('Article created.');
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {});
      } else {
        showToast('Something went wrong. Please try again.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function fieldError(field) {
    return errors[field]?.[0];
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit article' : 'New article'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {fieldError('name') && <p className="mt-1 text-xs text-red-600">{fieldError('name')}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Reference *</label>
            <input
              required
              value={form.reference}
              onChange={(e) => handleChange('reference', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {fieldError('reference') && <p className="mt-1 text-xs text-red-600">{fieldError('reference')}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
            <input
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Unit</label>
            <UnitInput
              value={form.unit}
              onChange={(v) => handleChange('unit', v)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-slate-400">Used to pre-fill the line description when this article is picked on a quote or invoice.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Unit price (MAD) *</label>
            <input
              type="number" step="0.01" min="0" required
              value={form.unit_price}
              onChange={(e) => handleChange('unit_price', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {fieldError('unit_price') && <p className="mt-1 text-xs text-red-600">{fieldError('unit_price')}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">TVA rate (%) *</label>
            <input
              type="number" step="0.01" min="0" max="100" required
              value={form.tva_rate}
              onChange={(e) => handleChange('tva_rate', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Quantity in stock *</label>
            <input
              type="number" min="0" required
              value={form.quantity_in_stock}
              onChange={(e) => handleChange('quantity_in_stock', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {fieldError('quantity_in_stock') && <p className="mt-1 text-xs text-red-600">{fieldError('quantity_in_stock')}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Low stock alert below</label>
            <input
              type="number" min="0"
              value={form.stock_alert_threshold}
              onChange={(e) => handleChange('stock_alert_threshold', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => handleChange('is_active', e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Active (shows up when adding lines to a quote or invoice)
        </label>

        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
            {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create article'}
          </button>
        </div>
      </form>
    </Modal>
  );
}