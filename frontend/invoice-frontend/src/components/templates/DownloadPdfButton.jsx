import { useEffect, useRef, useState } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import apiClient from '../../api/client';
import { useToast } from '../../contexts/ToastContext';

export default function DownloadPdfButton({ documentType, documentId, reference, className, mobile = false }) {
  const [templates, setTemplates] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    apiClient.get('/document-templates', { params: { document_type: documentType } })
      .then((res) => setTemplates(res.data.data ?? res.data))
      .catch(() => {});
  }, [documentType]);

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function download(templateId) {
    setMenuOpen(false);
    try {
      const url = `/${documentType === 'devis' ? 'devis' : 'facture'}/${documentId}/pdf`;
      const res = await apiClient.get(url, { params: templateId ? { template_id: templateId } : undefined, responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `${reference}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      showToast('Could not download the PDF.', 'error');
    }
  }

  const defaultTemplate = templates.find((t) => t.is_default);

  if (templates.length === 0) {
    return (
      <button onClick={() => download(null)} className={className} title="Download PDF">
        <Download size={mobile ? 14 : 16} /> {mobile && 'PDF'}
      </button>
    );
  }

  return (
    <div className="relative inline-flex" ref={menuRef}>
      <button onClick={() => download(defaultTemplate?.id ?? null)} className={className} title="Download PDF">
        <Download size={mobile ? 14 : 16} /> {mobile && 'PDF'}
      </button>
      <button onClick={() => setMenuOpen((o) => !o)} className={`${className} !px-0.5`} title="Choose template">
        <ChevronDown size={12} />
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          <button onClick={() => download(null)} className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
            Modèle par défaut de l'application
          </button>
          {templates.map((t) => (
            <button key={t.id} onClick={() => download(t.id)} className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
              {t.name}{t.is_default ? ' (défaut)' : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}