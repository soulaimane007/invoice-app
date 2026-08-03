import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import BaseTableCell from '@tiptap/extension-table-cell';
import BaseTableHeader from '@tiptap/extension-table-header';

const cellStyleAttributes = {
  backgroundColor: {
    default: null,
    parseHTML: (el) => el.style.backgroundColor || null,
    renderHTML: (attrs) => (attrs.backgroundColor ? { style: `background-color:${attrs.backgroundColor}` } : {}),
  },
  verticalAlign: {
    default: null,
    parseHTML: (el) => el.style.verticalAlign || null,
    renderHTML: (attrs) => (attrs.verticalAlign ? { style: `vertical-align:${attrs.verticalAlign}` } : {}),
  },
  hiddenBorders: {
    default: null,
    parseHTML: (el) => el.getAttribute('data-hidden-borders') || null,
    // No inline style here on purpose — the editor shows a dashed guide
    // via the decoration below (CSS classes), and the real "none" only
    // gets written in when the backend generates the actual PDF.
    renderHTML: (attrs) => (attrs.hiddenBorders ? { 'data-hidden-borders': attrs.hiddenBorders } : {}),
  },
  // Explicit opt-in only — the backend's repeating-row logic treats a
  // cell as "stays merged across every future generated line" ONLY when
  // this is true. Everything else always repeats normally by default,
  // whether or not it happens to contain a variable.
  spanAllLines: {
    default: false,
    parseHTML: (el) => el.getAttribute('data-span-all-lines') === 'true',
    renderHTML: (attrs) => (attrs.spanAllLines ? { 'data-span-all-lines': 'true' } : {}),
  },
};

export const StyledTableCell = BaseTableCell.extend({
  addAttributes() {
    return { ...this.parent?.(), ...cellStyleAttributes };
  },
});

export const StyledTableHeader = BaseTableHeader.extend({
  addAttributes() {
    return { ...this.parent?.(), ...cellStyleAttributes };
  },
});

export const CellStyleDecoration = Extension.create({
  name: 'cellStyleDecoration',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('cellStyleDecoration'),
        props: {
          decorations(state) {
            const decorations = [];
            state.doc.descendants((node, pos) => {
              if (node.type.name !== 'tableCell' && node.type.name !== 'tableHeader') {
                return;
              }
              const styles = [];
              if (node.attrs.backgroundColor) styles.push(`background-color:${node.attrs.backgroundColor}`);
              if (node.attrs.verticalAlign) styles.push(`vertical-align:${node.attrs.verticalAlign}`);

              const classes = [];
              if (node.attrs.spanAllLines) classes.push('tpl-span-all-lines');
              const hiddenSides = (node.attrs.hiddenBorders || '').split(',').filter(Boolean);
              hiddenSides.forEach((side) => classes.push(`tpl-hidden-border-${side}`));

              const attrs = {};
              if (styles.length) attrs.style = styles.join(';');
              if (classes.length) attrs.class = classes.join(' ');

              if (Object.keys(attrs).length) {
                decorations.push(Decoration.node(pos, pos + node.nodeSize, attrs));
              }
            });
            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});