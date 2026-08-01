import { useState } from 'react';
import Modal from '../ui/Modal';
import apiClient from '../../api/client';
import { useToast } from '../../contexts/ToastContext';

export default function ResetPasswordModal({ open, onClose, endpoint, subjectName }) {
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  function reset() {
    setPassword('');
    setPasswordConfirmation('');
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await apiClient.put(endpoint, { password, password_confirmation: passwordConfirmation });
      showToast('Password reset.');
      reset();
      onClose();
    } catch (err) {
      setError(err.response?.data?.errors?.password?.[0] ?? err.response?.data?.message ?? 'Could not reset this password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={`Reset password — ${subjectName ?? ''}`} maxWidth="max-w-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <p className="text-sm text-slate-500">Set a new password for this account. Share it with them directly — they can change it themselves afterward from their own Profile.</p>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">New password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Confirm new password</label>
          <input type="password" required value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="mt-1 flex justify-end gap-2">
          <button type="button" onClick={() => { reset(); onClose(); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
            {submitting ? 'Saving...' : 'Reset password'}
          </button>
        </div>
      </form>
    </Modal>
  );
}