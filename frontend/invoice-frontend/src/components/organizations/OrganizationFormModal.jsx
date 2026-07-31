import { useState } from 'react';
import Modal from '../ui/Modal';
import apiClient from '../../api/client';
import { useToast } from '../../contexts/ToastContext';

export default function OrganizationFormModal({ open, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  function reset() {
    setName(''); setEmail(''); setPassword(''); setPasswordConfirmation(''); setErrors({});
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      await apiClient.post('/organizations', { name, email, password, password_confirmation: passwordConfirmation });
      showToast('Organization created.');
      reset();
      onSaved();
      onClose();
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {});
      } else {
        showToast('Could not create this organization.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function fieldError(field) {
    return errors[field]?.[0];
  }

  return (
    <Modal open={open} onClose={onClose} title="New organization">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Organization name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          {fieldError('name') && <p className="mt-1 text-xs text-red-600">{fieldError('name')}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          {fieldError('email') && <p className="mt-1 text-xs text-red-600">{fieldError('email')}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Confirm password</label>
            <input type="password" required value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
        </div>
        {fieldError('password') && <p className="text-xs text-red-600">{fieldError('password')}</p>}
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
            {submitting ? 'Creating...' : 'Create organization'}
          </button>
        </div>
      </form>
    </Modal>
  );
}