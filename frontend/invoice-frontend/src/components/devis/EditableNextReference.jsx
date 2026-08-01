import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import apiClient from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { canEditReference } from '../../utils/permissions';

export default function EditableNextReference({ documentType, value, onChange }) {
  const { user } = useAuth();
  const editable = canEditReference(user);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  function startEdit() {
    setDraft(String(value?.number ?? ''));
    setEditing(true);
  }

  async function handleSave() {
    const number = parseInt(draft, 10);
    if (!number || number < 1) {
      showToast('Enter a valid number.', 'error');
      return;
    }
    setSaving(true);
    try {
      const endpoint = documentType === 'devis' ? '/devis/next-reference' : '/facture/next-reference';
      const res = await apiClient.put(endpoint, { number });
      onChange(res.data);
      setEditing(false);
      showToast('Next reference updated.');
    } catch (err) {
      const specific = err.response?.data?.errors?.number?.[0];
      showToast(specific ?? err.response?.data?.message ?? 'Could not update this reference.', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!value) return null;

  if (!editable) {
    return (
      <span className="text-xs text-slate-400">
        Next: <span className="font-mono text-slate-600">{value.reference}</span>
      </span>
    );
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-400">Next:</span>
        <input
          type="number"
          min="1"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
          dir="ltr"
          className="w-20 rounded border border-slate-300 px-1.5 py-0.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button onClick={handleSave} disabled={saving} className="rounded p-1 text-emerald-600 hover:bg-emerald-50">
          <Check size={13} />
        </button>
        <button onClick={() => setEditing(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100">
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <span className="flex items-center gap-1 text-xs text-slate-400">
      Next: <span className="font-mono text-slate-600">{value.reference}</span>
      <button onClick={startEdit} className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600" title="Edit next reference">
        <Pencil size={12} />
      </button>
    </span>
  );
}