import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import apiClient from '../../api/client';
import { useToast } from '../../contexts/ToastContext';

const emptyForm = { name: '', ice: '', address: '', phone: '', email: '', notes: '' };

export default function ClientFormModal({ open, onClose, client, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const isEdit = Boolean(client);

  useEffect(() => {
    if (open) {
      setForm(client ? {
        name: client.name ?? '',
        ice: client.ice ?? '',
        address: client.address ?? '',
        phone: client.phone ?? '',
        email: client.email ?? '',
        notes: client.notes ?? '',
      } : emptyForm);
      setErrors({});
    }
  }, [open, client]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      if (isEdit) {
        await apiClient.put(`/clients/${client.id}`, form);
        showToast('Client updated.');
      } else {
        await apiClient.post('/clients', form);
        showToast('Client created.');
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
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit client' : 'New client'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">ICE</label>
            <input
              value={form.ice}
              onChange={(e) => handleChange('ice', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {fieldError('ice') && <p className="mt-1 text-xs text-red-600">{fieldError('ice')}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
          <input
            value={form.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {fieldError('email') && <p className="mt-1 text-xs text-red-600">{fieldError('email')}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create client'}
          </button>
        </div>
      </form>
    </Modal>
  );
}