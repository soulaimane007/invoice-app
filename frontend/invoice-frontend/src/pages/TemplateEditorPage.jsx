import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, FontFamily, FontSize } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import CharacterCount from '@tiptap/extension-character-count';
import BorderedTable from '../components/templates/extensions/BorderedTableNode';
import TableBorderDecoration from '../components/templates/extensions/TableBorderDecoration';
import TableRow from '@tiptap/extension-table-row';
import { StyledTableCell, StyledTableHeader, CellStyleDecoration } from '../components/templates/extensions/CellStyleExtension';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import apiClient, { unwrap } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import EditorToolbar from '../components/templates/EditorToolbar';
import VariablePalette from '../components/templates/VariablePalette';
import VariableNode from '../components/templates/extensions/VariableNode';
import VariableImageNode from '../components/templates/extensions/VariableImageNode';
import ResizableImageNode from '../components/templates/extensions/ResizableImageNode';
import ConditionalBlockNode from '../components/templates/extensions/ConditionalBlockNode';
import ConditionalInlineNode from '../components/templates/extensions/ConditionalInlineNode';
import { getDefaultTemplateContent } from '../utils/defaultTemplateContent';
import { PAGE_FORMATS } from '../utils/pageFormats';

export default function TemplateEditorPage() {
  const { id } = useParams();

  // Loads the exact same stylesheet the PDF reads directly from disk —
  // this is what actually guarantees the editor/Aperçu and the download
  // match, instead of two hand-maintained copies that can drift apart.
  useEffect(() => {
    const backendOrigin = (apiClient.defaults.baseURL || '').replace(/\/api\/?$/, '');
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${backendOrigin}/template-print.css`;
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const initialType = searchParams.get('type') === 'facture' ? 'facture' : 'devis';
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [documentType, setDocumentType] = useState(initialType);
  const [pageFormat, setPageFormat] = useState('A4');
  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      CharacterCount,
      BorderedTable.configure({ resizable: true }),
      TableBorderDecoration,
      TableRow,
      StyledTableHeader,
      StyledTableCell,
      CellStyleDecoration,
      VariableNode,
      VariableImageNode,
      ResizableImageNode,
      ConditionalBlockNode,
      ConditionalInlineNode,
    ],
    content: isEdit ? '<p></p>' : getDefaultTemplateContent(initialType),
  });

  useEffect(() => {
    if (isEdit && editor) {
      apiClient.get(`/document-templates/${id}`)
        .then((res) => {
          const template = unwrap(res);
          setDocumentType(template.document_type);
          setPageFormat(template.page_format || 'A4');
          setName(template.name);
          setIsDefault(template.is_default);
          if (editor.isDestroyed) return;
          try {
            editor.commands.setContent(template.content);
          } catch (contentErr) {
            console.error('setContent failed on the saved template:', contentErr);
            console.log('Raw saved content:', template.content);
            showToast('Template found, but its saved content failed to load — see console.', 'error');
          }
        })
        .catch((err) => {
          console.error('Fetching the template failed:', err);
          console.error('HTTP status:', err.response?.status, 'Response body:', err.response?.data);
          showToast('Could not load this template.', 'error');
        })
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, id, editor]);

  async function handleSave() {
    if (!name.trim()) {
      showToast('Please give this template a name.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = { document_type: documentType, page_format: pageFormat, name: name.trim(), content: editor.getHTML(), is_default: isDefault };
      console.log('[Save] Contains a conditional block?', payload.content.includes('data-condition-var'));
      console.log('[Save] Full content being sent:', payload.content);
      if (isEdit) {
        await apiClient.put(`/document-templates/${id}`, payload);
        showToast('Template updated.');
      } else {
        await apiClient.post('/document-templates', payload);
        showToast('Template created.');
      }
      navigate('/templates');
    } catch (err) {
      if (err.response?.status === 422) {
        const msg = Object.values(err.response.data.errors ?? {})[0]?.[0];
        showToast(msg ?? 'Please fix the errors and try again.', 'error');
      } else {
        showToast('Could not save this template.', 'error');
      }
    } finally {
      setSaving(false);
    }
  }

  async function togglePreview() {
    if (previewMode) {
      setPreviewMode(false);
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await apiClient.post('/document-templates/preview', {
        document_type: documentType,
        content: editor.getHTML(),
      });
      setPreviewHtml(res.data.html);
      setPreviewMode(true);
    } catch {
      showToast('Could not generate the preview.', 'error');
    } finally {
      setPreviewLoading(false);
    }
  }

  if (loading || !editor) {
    return <p className="text-sm text-noir-500">Loading...</p>;
  }

  const format = PAGE_FORMATS[pageFormat] ?? PAGE_FORMATS.A4;

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col gap-4 lg:h-[calc(100vh-4rem)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => navigate('/templates')} className="-m-2 rounded-lg p-2 text-noir-500 hover:bg-noir-100">
            <ArrowLeft size={18} />
          </button>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du modèle"
            className="rounded-lg border border-noir-300 px-3 py-2 text-sm font-medium focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          />
          {!isEdit && (
            <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="rounded-lg border border-noir-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500">
              <option value="devis">Devis</option>
              <option value="facture">Facture</option>
            </select>
          )}
          <select value={pageFormat} onChange={(e) => setPageFormat(e.target.value)} className="rounded-lg border border-noir-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500">
            {Object.entries(PAGE_FORMATS).map(([key, f]) => (
              <option key={key} value={key}>{f.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-sm text-noir-600">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="rounded border-noir-300 text-gold-600 focus:ring-gold-500" />
            Modèle par défaut
          </label>
          <button
            onClick={togglePreview}
            disabled={previewLoading}
            className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-60 ${previewMode ? 'border-gold-400 bg-gold-100 text-gold-800' : 'border-noir-300 text-noir-700 hover:bg-noir-50'}`}
          >
            <Eye size={15} /> {previewLoading ? 'Génération...' : previewMode ? "Retour à l'édition" : 'Aperçu'}
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-gold-600 px-4 py-2 text-sm font-medium text-white hover:bg-gold-500 disabled:opacity-60">
            <Save size={15} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-noir-200 bg-noir-100">
        {!previewMode && <VariablePalette documentType={documentType} editor={editor} />}
        <div className="flex flex-1 flex-col overflow-hidden">
          {!previewMode && <EditorToolbar editor={editor} documentType={documentType} />}
          {previewMode && (
            <div className="border-b border-gold-300 bg-gold-50 px-4 py-2 text-sm text-gold-800">
              Aperçu généré avec des données de test, via le même moteur que le téléchargement réel — rien ici n'est réel, votre modèle n'a pas été modifié.
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-8">
            <div
              className="mx-auto bg-white shadow-md"
              style={{ width: `${format.widthMm}mm`, minHeight: `${format.heightMm}mm`, padding: '15mm' }}
            >
              {previewMode ? (
                <div className="tpl-print-content" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              ) : (
                <EditorContent editor={editor} className="tpl-page-content tpl-print-content" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}