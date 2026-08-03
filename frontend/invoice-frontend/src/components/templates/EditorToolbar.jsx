import { useCallback, useEffect, useRef, useState } from 'react';
import ConditionalBlockModal from './ConditionalBlockModal';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon, Code, Eraser, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Minus, Link as LinkIcon, Table as TableIcon, Image as ImageIcon, Undo, Redo,
  Palette, Highlighter,
} from 'lucide-react';

const COLORS = ['#181513', '#966c22', '#b3852a', '#dc2626', '#059669', '#2563eb'];
const HIGHLIGHTS = ['#f4e8c8', '#fde68a', '#bbf7d0', '#bfdbfe', '#fecaca'];
const CELL_COLORS = ['#fef3c7', '#fecaca', '#bbf7d0', '#bfdbfe', '#e9d5ff', '#f3f4f6'];

function getCellAttrs(editor) {
  if (editor.isActive('tableCell')) return editor.getAttributes('tableCell');
  if (editor.isActive('tableHeader')) return editor.getAttributes('tableHeader');
  return null;
}

function clearCellContent(editor) {
  const { $from } = editor.state.selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
      const start = $from.start(depth);
      const end = $from.end(depth);
      editor.chain().focus().setTextSelection({ from: start, to: end }).deleteSelection().run();
      return;
    }
  }
}

const BORDER_SIDE_LABELS = { top: 'Haut', right: 'Droite', bottom: 'Bas', left: 'Gauche' };

function CellToolsRow({ editor }) {
  const cellAttrs = getCellAttrs(editor);
  const isInCell = cellAttrs !== null;
  const currentWidth = cellAttrs?.colwidth?.[0] ?? '';
  const hiddenSides = (cellAttrs?.hiddenBorders || '').split(',').filter(Boolean);

  function setColumnWidth(value) {
    const n = parseInt(value, 10);
    editor.chain().focus().setCellAttribute('colwidth', n ? [n] : null).run();
  }

  function toggleBorderSide(side) {
    const next = hiddenSides.includes(side) ? hiddenSides.filter((s) => s !== side) : [...hiddenSides, side];
    editor.chain().focus().setCellAttribute('hiddenBorders', next.length ? next.join(',') : null).run();
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-t border-noir-200 px-3 py-1.5">
      <span className="text-xs font-medium text-noir-400">Cellule :</span>

      <div className="flex items-center gap-1">
        <input
          type="number" min="20" max="800"
          value={currentWidth}
          onChange={(e) => setColumnWidth(e.target.value)}
          disabled={!isInCell}
          placeholder="Largeur"
          title="Largeur précise de la colonne, en pixels — équivalent à faire glisser sa bordure."
          className="w-20 rounded-md border border-noir-200 bg-white px-1.5 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-30"
        />
        <span className="text-[10px] text-noir-400">px</span>
      </div>

      <TableToolButton onClick={() => editor.chain().focus().mergeCells().run()} disabled={!editor.can().mergeCells()}>
        Fusionner
      </TableToolButton>
      <TableToolButton onClick={() => editor.chain().focus().splitCell().run()} disabled={!editor.can().splitCell()}>
        Diviser
      </TableToolButton>
      <TableToolButton onClick={() => clearCellContent(editor)} disabled={!isInCell} title="Vide le contenu de la cellule — la structure du tableau reste intacte.">
        Vider la cellule
      </TableToolButton>
      <TableToolButton
        onClick={() => editor.chain().focus().toggleHeaderCell().run()}
        disabled={!editor.can().toggleHeaderCell()}
        active={editor.isActive('tableHeader')}
      >
        Cellule d'en-tête
      </TableToolButton>
      <TableToolButton
        onClick={() => editor.chain().focus().setCellAttribute('spanAllLines', !cellAttrs?.spanAllLines).run()}
        disabled={!isInCell}
        active={cellAttrs?.spanAllLines}
        title="Masque les lignes de séparation entre les copies de cette cellule une fois la facture générée — chaque ligne garde ses propres données réelles, seule la bordure entre elles disparaît."
      >
        Fusionner sur les futures lignes
      </TableToolButton>

      <div className="group relative">
        <TableToolButton disabled={!isInCell}>Couleur de fond</TableToolButton>
        <div className="absolute left-0 top-full z-20 hidden gap-1 rounded-lg border border-noir-200 bg-white p-1.5 shadow-lg group-hover:flex">
          {CELL_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => editor.chain().focus().setCellAttribute('backgroundColor', c).run()} className="h-5 w-5 rounded-full border border-noir-200" style={{ backgroundColor: c }} />
          ))}
          <button type="button" onClick={() => editor.chain().focus().setCellAttribute('backgroundColor', null).run()} className="flex h-5 w-5 items-center justify-center rounded-full border border-noir-200 text-[9px] text-noir-500" title="Aucune">
            ✕
          </button>
        </div>
      </div>

      <div className="flex items-center gap-0.5 rounded-md border border-noir-200 p-0.5">
        <span className="px-1 text-[10px] text-noir-400">Masquer bordure :</span>
        {['top', 'right', 'bottom', 'left'].map((side) => (
          <button
            key={side}
            type="button"
            onClick={() => toggleBorderSide(side)}
            disabled={!isInCell}
            title={`${hiddenSides.includes(side) ? 'Réafficher' : 'Masquer'} la bordure ${BORDER_SIDE_LABELS[side].toLowerCase()} de cette cellule uniquement`}
            className={`rounded px-1.5 py-0.5 text-[10px] disabled:opacity-30 ${hiddenSides.includes(side) ? 'bg-gold-100 text-gold-800' : 'text-noir-600'}`}
          >
            {BORDER_SIDE_LABELS[side]}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-0.5 rounded-md border border-noir-200 p-0.5">
        {['top', 'middle', 'bottom'].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => editor.chain().focus().setCellAttribute('verticalAlign', v).run()}
            disabled={!isInCell}
            title={`Aligner le contenu en ${v === 'top' ? 'haut' : v === 'middle' ? 'milieu' : 'bas'} de la cellule`}
            className={`rounded px-1.5 py-0.5 text-[10px] disabled:opacity-30 ${cellAttrs?.verticalAlign === v ? 'bg-gold-100 text-gold-800' : 'text-noir-600'}`}
          >
            {v === 'top' ? 'Haut' : v === 'middle' ? 'Milieu' : 'Bas'}
          </button>
        ))}
      </div>
    </div>
  );
}
const FONT_FAMILIES = [
  { label: 'Police par défaut', value: '' },
  { label: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
  { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
  { label: 'Courier New', value: "'Courier New', Courier, monospace" },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'DejaVu Sans', value: "'DejaVu Sans', sans-serif" },
];

function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-md p-1.5 text-noir-600 hover:bg-noir-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent ${active ? 'bg-gold-100 text-gold-800' : ''}`}
    >
      {children}
    </button>
  );
}

function TableToolButton({ onClick, disabled, danger, active, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-md border px-2 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-30 ${
        danger ? 'border-red-200 text-red-600 hover:bg-red-50'
          : active ? 'border-gold-400 bg-gold-100 text-gold-800'
          : 'border-noir-200 text-noir-600 hover:bg-noir-100'
      }`}
    >
      {children}
    </button>
  );
}

function FontFamilySelect({ editor }) {
  const current = editor.getAttributes('textStyle').fontFamily || '';
  return (
    <select
      value={current}
      onChange={(e) => {
        if (e.target.value) editor.chain().focus().setFontFamily(e.target.value).run();
        else editor.chain().focus().unsetFontFamily().run();
      }}
      title="Police de caractères"
      className="rounded-md border border-noir-200 bg-white px-2 py-1 text-xs"
    >
      {FONT_FAMILIES.map((f) => <option key={f.label} value={f.value}>{f.label}</option>)}
    </select>
  );
}

function getCurrentBlockType(editor) {
  if (editor.isActive('heading', { level: 1 })) return '1';
  if (editor.isActive('heading', { level: 2 })) return '2';
  if (editor.isActive('heading', { level: 3 })) return '3';
  if (editor.isActive('blockquote')) return 'quote';
  if (editor.isActive('codeBlock')) return 'code';
  return 'p';
}

export default function EditorToolbar({ editor, documentType }) {
  const fileInputRef = useRef(null);
  const [conditionModalOpen, setConditionModalOpen] = useState(false);
  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick((t) => t + 1), []);

  // Keeps active-state highlighting, the font-size readout, and the
  // block-type dropdown accurate to wherever the cursor currently is —
  // without this, the toolbar only reflects state from when it first
  // mounted, not from where you've since clicked or typed.
  useEffect(() => {
    if (!editor) return undefined;
    editor.on('selectionUpdate', forceUpdate);
    editor.on('transaction', forceUpdate);
    return () => {
      editor.off('selectionUpdate', forceUpdate);
      editor.off('transaction', forceUpdate);
    };
  }, [editor, forceUpdate]);

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => editor.chain().focus().setImage({ src: reader.result }).run();
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleSetLink() {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL du lien', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  function applyFontSize(value) {
    const n = parseInt(value, 10);
    if (!n || n < 1) editor.chain().focus().unsetFontSize().run();
    else editor.chain().focus().setFontSize(`${n}px`).run();
  }

  if (!editor) return null;

  const currentFontSize = editor.getAttributes('textStyle').fontSize;
  const currentFontSizeNumber = currentFontSize ? parseInt(currentFontSize, 10) : '';
  const wordCount = editor.storage.characterCount?.words?.() ?? 0;
  const charCount = editor.storage.characterCount?.characters?.() ?? 0;

  return (
    <div className="border-b border-noir-200 bg-noir-50">
      <div className="flex flex-wrap items-center gap-1 px-3 py-2">
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Annuler"><Undo size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Rétablir"><Redo size={16} /></ToolbarButton>
        <span className="mx-1 h-5 w-px bg-noir-200" />

        <select
          value={getCurrentBlockType(editor)}
          onChange={(e) => {
            const v = e.target.value;
            if (v === 'p') editor.chain().focus().setParagraph().run();
            else if (v === 'quote') editor.chain().focus().toggleBlockquote().run();
            else if (v === 'code') editor.chain().focus().toggleCodeBlock().run();
            else editor.chain().focus().toggleHeading({ level: Number(v) }).run();
          }}
          className="rounded-md border border-noir-200 bg-white px-2 py-1 text-xs"
        >
          <option value="p">Texte</option>
          <option value="1">Titre 1</option>
          <option value="2">Titre 2</option>
          <option value="3">Titre 3</option>
          <option value="quote">Citation</option>
          <option value="code">Bloc de code</option>
        </select>

        <FontFamilySelect editor={editor} />

        <div className="flex items-center gap-1">
          <input
            type="number"
            min="1"
            max="200"
            value={currentFontSizeNumber}
            onChange={(e) => applyFontSize(e.target.value)}
            placeholder="Taille"
            title="Taille du texte en pixels"
            className="w-16 rounded-md border border-noir-200 bg-white px-1.5 py-1 text-xs"
          />
          <span className="text-[10px] text-noir-400">px</span>
        </div>
        <span className="mx-1 h-5 w-px bg-noir-200" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Gras"><Bold size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italique"><Italic size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Souligné"><UnderlineIcon size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Barré"><Strikethrough size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Indice"><SubscriptIcon size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Exposant"><SuperscriptIcon size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Code en ligne"><Code size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Effacer la mise en forme"><Eraser size={16} /></ToolbarButton>
        <span className="mx-1 h-5 w-px bg-noir-200" />

        <div className="group relative">
          <ToolbarButton title="Couleur du texte"><Palette size={16} /></ToolbarButton>
          <div className="absolute left-0 top-full z-20 hidden gap-1 rounded-lg border border-noir-200 bg-white p-1.5 shadow-lg group-hover:flex">
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => editor.chain().focus().setColor(c).run()} className="h-5 w-5 rounded-full border border-noir-200" style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <div className="group relative">
          <ToolbarButton title="Surlignage"><Highlighter size={16} /></ToolbarButton>
          <div className="absolute left-0 top-full z-20 hidden gap-1 rounded-lg border border-noir-200 bg-white p-1.5 shadow-lg group-hover:flex">
            {HIGHLIGHTS.map((c) => (
              <button key={c} type="button" onClick={() => editor.chain().focus().setHighlight({ color: c }).run()} className="h-5 w-5 rounded-full border border-noir-200" style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <span className="mx-1 h-5 w-px bg-noir-200" />

        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Aligner à gauche"><AlignLeft size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centrer"><AlignCenter size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Aligner à droite"><AlignRight size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justifier"><AlignJustify size={16} /></ToolbarButton>
        <span className="mx-1 h-5 w-px bg-noir-200" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Liste à puces"><List size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Liste numérotée"><ListOrdered size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Ligne de séparation"><Minus size={16} /></ToolbarButton>
        <ToolbarButton onClick={handleSetLink} active={editor.isActive('link')} title="Insérer un lien"><LinkIcon size={16} /></ToolbarButton>
        {editor.isActive('conditionalBlock') ? (
          <button
            type="button"
            onClick={() => editor.chain().focus().lift('conditionalBlock').run()}
            className="rounded-md border border-gold-300 bg-gold-100 px-2 py-1 text-xs font-medium text-gold-800 hover:bg-gold-200"
          >
            Retirer (tout le paragraphe)
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setConditionModalOpen(true)}
            className="rounded-md border border-gold-300 bg-gold-50 px-2 py-1 text-xs font-medium text-gold-800 hover:bg-gold-100"
            title="S'applique à tout le paragraphe où se trouve le curseur — s'il contient plusieurs variables, elles seront toutes concernées ensemble."
          >
            Condition (tout le paragraphe)
          </button>
        )}
        <span className="mx-1 h-5 w-px bg-noir-200" />

        <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run()} title="Insérer un tableau"><TableIcon size={16} /></ToolbarButton>
        <ToolbarButton onClick={() => fileInputRef.current?.click()} title="Insérer une image"><ImageIcon size={16} /></ToolbarButton>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-noir-200 px-3 py-1.5">
        <span className="text-xs font-medium text-noir-400">Tableau :</span>
        <TableToolButton
          onClick={() => editor.chain().focus().updateAttributes('table', { class: editor.getAttributes('table').class === 'tpl-bordered' ? null : 'tpl-bordered' }).run()}
          disabled={!editor.isActive('table')}
          active={editor.getAttributes('table').class === 'tpl-bordered'}
          title="Off : repère en pointillés, invisible au téléchargement. On : bordure réelle, visible dans le PDF final."
        >
          Bordures visibles
        </TableToolButton>
        {editor.isActive('table') && (
          <span className={`text-xs font-semibold ${editor.getAttributes('table').class === 'tpl-bordered' ? 'text-emerald-600' : 'text-noir-400'}`}>
            {editor.getAttributes('table').class === 'tpl-bordered' ? '✓ Ce tableau sera visible' : 'Ce tableau restera invisible'}
          </span>
        )}
        {editor.isActive('table') && editor.getAttributes('table').class === 'tpl-bordered' && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-noir-400">Épaisseur :</span>
            <input
              type="number" min="1" max="10"
              value={editor.getAttributes('table').borderWidth || '2'}
              onChange={(e) => editor.chain().focus().updateAttributes('table', { borderWidth: e.target.value }).run()}
              className="w-14 rounded-md border border-noir-200 bg-white px-1.5 py-1 text-xs"
            />
            <span className="text-[10px] text-noir-400">px</span>
          </div>
        )}
        {editor.isActive('table') && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-noir-400">Espacement des lignes :</span>
            <input
              type="number" min="0" max="30"
              value={editor.getAttributes('table').cellPadding ?? '4'}
              onChange={(e) => editor.chain().focus().updateAttributes('table', { cellPadding: e.target.value }).run()}
              title="Contrôle la hauteur/l'espace de chaque ligne — s'applique aussi aux lignes qui seront générées lors de la création d'une vraie facture."
              className="w-14 rounded-md border border-noir-200 bg-white px-1.5 py-1 text-xs"
            />
            <span className="text-[10px] text-noir-400">px</span>
          </div>
        )}
        <TableToolButton
          onClick={() => editor.chain().focus().updateAttributes('table', { stackLines: !editor.getAttributes('table').stackLines }).run()}
          disabled={!editor.isActive('table')}
          active={editor.getAttributes('table').stackLines}
          title="Au lieu de créer une nouvelle ligne par article, empile toutes les valeurs de cette colonne dans la même cellule, séparées par un retour à la ligne."
        >
          Empiler dans la cellule
        </TableToolButton>
        <span className="mx-0.5 h-4 w-px bg-noir-200" />
        <TableToolButton onClick={() => editor.chain().focus().addRowBefore().run()} disabled={!editor.can().addRowBefore()}>+ Ligne (haut)</TableToolButton>
        <TableToolButton onClick={() => editor.chain().focus().addRowAfter().run()} disabled={!editor.can().addRowAfter()}>+ Ligne (bas)</TableToolButton>
        <TableToolButton onClick={() => editor.chain().focus().deleteRow().run()} disabled={!editor.can().deleteRow()} danger>− Ligne</TableToolButton>
        <TableToolButton onClick={() => editor.chain().focus().addColumnBefore().run()} disabled={!editor.can().addColumnBefore()}>+ Col. (gauche)</TableToolButton>
        <TableToolButton onClick={() => editor.chain().focus().addColumnAfter().run()} disabled={!editor.can().addColumnAfter()}>+ Col. (droite)</TableToolButton>
        <TableToolButton onClick={() => editor.chain().focus().deleteColumn().run()} disabled={!editor.can().deleteColumn()} danger>− Colonne</TableToolButton>
        <TableToolButton onClick={() => editor.chain().focus().toggleHeaderRow().run()} disabled={!editor.can().toggleHeaderRow()}>Ligne d'en-tête</TableToolButton>
        <TableToolButton onClick={() => editor.chain().focus().deleteTable().run()} disabled={!editor.can().deleteTable()} danger>Supprimer le tableau</TableToolButton>
        <span className="ml-auto text-xs text-noir-400">{wordCount} mots · {charCount} caractères</span>
      </div>

      <CellToolsRow editor={editor} />
      <VariableToolsRow editor={editor} documentType={documentType} />
      <ConditionalBlockModal
        open={conditionModalOpen}
        onClose={() => setConditionModalOpen(false)}
        documentType={documentType}
        onConfirm={(attrs) => editor.chain().focus().wrapIn('conditionalBlock', attrs).run()}
      />
    </div>
  );
}
function VariableToolsRow({ editor, documentType }) {
  const isVariableSelected = editor.isActive('variable');
  const attrs = isVariableSelected ? editor.getAttributes('variable') : {};
  const isInsideCondition = editor.isActive('conditionalInline');
  const [conditionModalOpen, setConditionModalOpen] = useState(false);

  function wrapVariableInCondition(conditionAttrs) {
    editor.chain().focus().command(({ tr, state }) => {
      const { selection } = state;
      if (!selection.node || selection.node.type.name !== 'variable') {
        return false;
      }
      const variableNode = selection.node;
      const pos = selection.from;
      const wrapped = state.schema.nodes.conditionalInline.create(conditionAttrs, variableNode);
      tr.replaceWith(pos, pos + variableNode.nodeSize, wrapped);
      return true;
    }).run();
  }

  function unwrapVariableFromCondition() {
    editor.chain().focus().command(({ tr, state }) => {
      const { $from } = state.selection;
      for (let depth = $from.depth; depth > 0; depth--) {
        const node = $from.node(depth);
        if (node.type.name === 'conditionalInline') {
          const pos = $from.before(depth);
          tr.replaceWith(pos, pos + node.nodeSize, node.content);
          return true;
        }
      }
      return false;
    }).run();
  }

  function applyAndReselect(newAttrs) {
    const { from } = editor.state.selection;
    editor.chain().focus().updateAttributes('variable', newAttrs).setNodeSelection(from).run();
  }

  function toggle(key) {
    applyAndReselect({ [key]: !attrs[key] });
  }
  function setSize(value) {
    const n = parseInt(value, 10);
    applyAndReselect({ fontSize: n ? `${n}px` : null });
  }
  function setColor(value) {
    applyAndReselect({ color: value || null });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-t border-noir-200 px-3 py-1.5">
      <span className="text-xs font-medium text-noir-400">Variable sélectionnée :</span>
      <TableToolButton onClick={() => toggle('bold')} disabled={!isVariableSelected} active={attrs.bold}>Gras</TableToolButton>
      <TableToolButton onClick={() => toggle('italic')} disabled={!isVariableSelected} active={attrs.italic}>Italique</TableToolButton>
      <TableToolButton onClick={() => toggle('uppercase')} disabled={!isVariableSelected} active={attrs.uppercase}>MAJUSCULES</TableToolButton>
      <TableToolButton
        onClick={() => toggle('spellOut')}
        disabled={!isVariableSelected}
        active={attrs.spellOut}
        title="Uniquement pour les variables numériques (montants, quantités...) — sans effet sur du texte."
      >
        Écrire en lettres
      </TableToolButton>
      <div className="flex items-center gap-1">
        <input
          type="number" min="1" max="200"
          value={attrs.fontSize ? parseInt(attrs.fontSize, 10) : ''}
          onChange={(e) => setSize(e.target.value)}
          disabled={!isVariableSelected}
          placeholder="Taille"
          className="w-16 rounded-md border border-noir-200 bg-white px-1.5 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-30"
        />
        <span className="text-[10px] text-noir-400">px</span>
      </div>
      <input
        type="color"
        value={attrs.color || '#181513'}
        onChange={(e) => setColor(e.target.value)}
        disabled={!isVariableSelected}
        title="Couleur de la variable"
        className="h-6 w-8 cursor-pointer rounded border border-noir-200 disabled:cursor-not-allowed disabled:opacity-30"
      />
      <div className="flex items-center gap-0.5 rounded-md border border-noir-200 p-0.5">
        {[
          { value: 'left', Icon: AlignLeft },
          { value: 'center', Icon: AlignCenter },
          { value: 'right', Icon: AlignRight },
        ].map(({ value, Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => editor.chain().focus().setTextAlign(value).run()}
            disabled={!isVariableSelected}
            title={`Aligne le paragraphe contenant cette variable à ${value === 'left' ? 'gauche' : value === 'center' ? 'gauche' : 'droite'}`}
            className={`rounded p-1 disabled:cursor-not-allowed disabled:opacity-30 ${editor.isActive({ textAlign: value }) ? 'bg-gold-100 text-gold-800' : 'text-noir-600 hover:bg-noir-100'}`}
          >
            <Icon size={13} />
          </button>
        ))}
      </div>
      {isInsideCondition ? (
        <TableToolButton onClick={unwrapVariableFromCondition} active>Retirer (cette variable)</TableToolButton>
      ) : (
        <TableToolButton
          onClick={() => setConditionModalOpen(true)}
          disabled={!isVariableSelected}
          title="S'applique uniquement à la variable actuellement sélectionnée ci-dessus — les autres variables du même paragraphe ne sont jamais concernées."
        >
          Condition (cette variable seulement)
        </TableToolButton>
      )}
      {!isVariableSelected && <span className="text-xs text-noir-400">Cliquez sur une variable pour la mettre en forme.</span>}
      <ConditionalBlockModal
        open={conditionModalOpen}
        onClose={() => setConditionModalOpen(false)}
        documentType={documentType}
        onConfirm={wrapVariableInCondition}
      />
    </div>
  );
}