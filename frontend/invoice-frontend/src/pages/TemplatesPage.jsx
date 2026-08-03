import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Star, Pencil, Trash2, Copy, LayoutTemplate, Download, Upload } from 'lucide-react';
import apiClient, { unwrap } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import ConfirmDialog from '../components/ui/ConfirmDialog';

export default function TemplatesPage() {
  const [tab, setTab] = useState('devis');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const importInputRef = useRef(null);

  function load() {
    setLoading(true);
    apiClient.get('/document-templates', { params: { document_type: tab } })
      .then((res) => setTemplates(res.data.data ?? res.data))
      .catch(() => showToast('Could not load templates.', 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function handleExport(template) {
    try {
      const res = await apiClient.get(`/document-templates/${template.id}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${template.name}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast("Impossible d'exporter ce modèle.", 'error');
    }
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await apiClient.post('/document-templates/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('Modèle importé.');
      load();
    } catch (err) {
      showToast(err.response?.data?.message ?? "Impossible d'importer ce fichier.", 'error');
    } finally {
      e.target.value = '';
    }
  }

  async function handleDuplicate(template) {
    try {
      const res = await apiClient.get(`/document-templates/${template.id}`);
      const full = unwrap(res);
      await apiClient.post('/document-templates', {
        document_type: full.document_type,
        name: `${full.name} (copie)`,
        content: full.content,
        is_default: false,
      });
      showToast('Template duplicated.');
      load();
    } catch {
      showToast('Could not duplicate this template.', 'error');
    }
  }

  async function confirmDelete() {
    setDeletingBusy(true);
    try {
      await apiClient.delete(`/document-templates/${deleting.id}`);
      showToast('Template deleted.');
      setDeleting(null);
      load();
    } catch {
      showToast('Could not delete this template.', 'error');
    } finally {
      setDeletingBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-noir-900">
            <LayoutTemplate size={22} className="text-gold-600" /> Modèles de documents
          </h1>
          <p className="text-sm text-noir-500">Créez vos propres mises en page pour vos devis et factures.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => importInputRef.current?.click()} className="flex items-center justify-center gap-2 rounded-lg border border-noir-300 px-4 py-2 text-sm font-medium text-noir-700 hover:bg-noir-50">
            <Upload size={16} /> Importer
          </button>
          <input ref={importInputRef} type="file" accept=".json,application/json" onChange={handleImportFile} className="hidden" />
          <Link to={`/templates/new?type=${tab}`} className="flex items-center justify-center gap-2 rounded-lg bg-gold-600 px-4 py-2 text-sm font-medium text-white hover:bg-gold-500">
            <Plus size={16} /> Nouveau modèle
          </Link>
        </div>
      </div>

      <div className="flex gap-1">
        {['devis', 'facture'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-4 py-1.5 text-sm font-medium ${tab === t ? 'bg-gold-100 text-gold-800' : 'text-noir-500 hover:bg-noir-100'}`}>
            {t === 'devis' ? 'Devis' : 'Factures'}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-noir-200 bg-white">
        {loading ? (
          <p className="px-4 py-10 text-center text-sm text-noir-400">Loading...</p>
        ) : templates.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-noir-400">
            Aucun modèle pour {tab === 'devis' ? 'les devis' : 'les factures'} — le modèle intégré de l'application sera utilisé par défaut.
          </p>
        ) : (
          <div className="divide-y divide-noir-100">
            {templates.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  {t.is_default && <Star size={14} className="shrink-0 fill-gold-400 text-gold-500" />}
                  <span className="truncate font-medium text-noir-900">{t.name}</span>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => navigate(`/templates/${t.id}/edit`)} className="rounded-lg p-1.5 text-noir-400 hover:bg-noir-100 hover:text-gold-700" title="Modifier">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDuplicate(t)} className="rounded-lg p-1.5 text-noir-400 hover:bg-noir-100 hover:text-gold-700" title="Dupliquer">
                    <Copy size={16} />
                  </button>
                  <button onClick={() => handleExport(t)} className="rounded-lg p-1.5 text-noir-400 hover:bg-noir-100 hover:text-gold-700" title="Exporter (fichier .json)">
                    <Download size={16} />
                  </button>
                  <button onClick={() => setDeleting(t)} className="rounded-lg p-1.5 text-noir-400 hover:bg-noir-100 hover:text-red-600" title="Supprimer">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Supprimer le modèle"
        message={`Êtes-vous sûr de vouloir supprimer "${deleting?.name}" ? Cette action est irréversible.`}
        loading={deletingBusy}
      />
    </div>
  );
}