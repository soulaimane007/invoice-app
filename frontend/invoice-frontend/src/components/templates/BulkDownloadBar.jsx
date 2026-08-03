import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import apiClient from '../../api/client';
import { useToast } from '../../contexts/ToastContext';

export default function BulkDownloadBar({ documentType, selectedIds, onClear }) {
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState('');
  const [downloading, setDownloading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    apiClient.get('/document-templates', { params: { document_type: documentType } })
      .then((res) => {
        const list = res.data.data ?? res.data;
        setTemplates(list);
        const def = list.find((t) => t.is_default);
        setTemplateId(def ? String(def.id) : list[0] ? String(list[0].id) : '');
      })
      .catch(() => {});
  }, [documentType]);

  if (selectedIds.length === 0) return null;

  async function handleDownload() {
    if (!templateId) {
      showToast('Veuillez choisir un modèle.', 'error');
      return;
    }
    setDownloading(true);
    try {
      const url = documentType === 'devis' ? '/devis/bulk-pdf' : '/facture/bulk-pdf';
      const res = await apiClient.post(url, { ids: selectedIds, template_id: templateId }, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', documentType === 'devis' ? 'devis.pdf' : 'factures.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      showToast('Le téléchargement groupé a échoué.', 'error');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 rounded-xl border border-gold-300 bg-gold-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm text-gold-800">
        <button onClick={onClear} className="rounded p-0.5 hover:bg-gold-100" title="Annuler la sélection">
          <X size={15} />
        </button>
        <span className="font-medium">{selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}</span>
      </div>
      <div className="flex w-full items-center gap-2 sm:w-auto">
        {templates.length === 0 ? (
          <span className="text-xs text-gold-700">Créez d'abord un modèle pour ce type de document (Templates).</span>
        ) : (
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="flex-1 rounded-lg border border-gold-300 bg-white px-3 py-1.5 text-sm sm:flex-none"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}{t.is_default ? ' (défaut)' : ''}</option>
            ))}
          </select>
        )}
        <button
          onClick={handleDownload}
          disabled={downloading || templates.length === 0}
          className="flex items-center gap-1.5 rounded-lg bg-gold-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-gold-500 disabled:opacity-60"
        >
          <Download size={15} /> {downloading ? 'Génération...' : 'Télécharger'}
        </button>
      </div>
    </div>
  );
}