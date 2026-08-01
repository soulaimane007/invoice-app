import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import apiClient from '../../api/client';
import { useToast } from '../../contexts/ToastContext';

const PERMISSIONS = [
  { key: 'can_edit_after_sent', label: 'Edit documents after they\'re issued', hint: "Devis once no longer a draft, and any invoice at all." },
  { key: 'can_delete_documents', label: 'Delete quotations and invoices', hint: "Off by default — deletions can't be undone." },
  { key: 'can_edit_reference', label: 'Change reference numbers', hint: "Editing the number on a document, the \"next reference\" shortcut, and the numbering pattern in Profile. Without this, all three show as read-only." },
  { key: 'can_edit_company_settings', label: 'Edit company settings', hint: "Name, address, logo, TVA rate, and other business info in Profile." },
  { key: 'can_delete_records', label: 'Delete clients and articles', hint: "Separate from deleting documents." },
];

export default function UserFormModal({ open, onClose, onSaved, user }) {
  const isEdit = Boolean(user);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [permissions, setPermissions] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (open) {
      setName(user?.name ?? '');
      setEmail(user?.email ?? '');
      setPassword('');
      setPasswordConfirmation('');
      setPermissions(Object.fromEntries(PERMISSIONS.map((p) => [p.key, Boolean(user?.[p.key])])));
      setErrors({});
    }
  }, [open, user]);

  function togglePermission(key) {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      if (isEdit) {
        await apiClient.put(`/users/${user.id}`, permissions);
        showToast('Permissions updated.');
      } else {
        await apiClient.post('/users', { name, email, password, password_confirmation: passwordConfirmation, ...permissions });
        showToast('User created.');
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {});
      } else {
        showToast(`Could not ${isEdit ? 'update' : 'create'} this user.`, 'error');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function fieldError(field) {
    return errors[field]?.[0];
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? `Permissions — ${user?.name}` : 'New user'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!isEdit && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
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
          </>
        )}

        <div className="rounded-lg border border-slate-200 p-3">
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Permissions</p>
          <div className="flex flex-col gap-2.5">
            {PERMISSIONS.map((p) => (
              <label key={p.key} className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(permissions[p.key])}
                  onChange={() => togglePermission(p.key)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  {p.label}
                  <span className="block text-xs text-slate-400">{p.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-1 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
            {submitting ? 'Saving...' : isEdit ? 'Save permissions' : 'Create user'}
          </button>
        </div>
      </form>
    </Modal>
  );
}