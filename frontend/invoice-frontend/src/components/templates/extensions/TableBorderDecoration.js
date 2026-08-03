import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

const TableBorderDecoration = Extension.create({
  name: 'tableBorderDecoration',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('tableBorderDecoration'),
        props: {
          decorations(state) {
            const decorations = [];
            state.doc.descendants((node, pos) => {
              if (node.type.name !== 'table') {
                return;
              }

              const isBordered = node.attrs.class === 'tpl-bordered';
              const padding = node.attrs.cellPadding ?? '4';
              const styleParts = [`--tpl-cell-padding: ${padding}px`];

              const attrs = {};
              if (isBordered) {
                attrs.class = 'tpl-bordered';
                styleParts.push(`--tpl-border-width: ${node.attrs.borderWidth || '2'}px`);
              }
              attrs.style = styleParts.join(';');

              decorations.push(Decoration.node(pos, pos + node.nodeSize, attrs));
            });
            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

export default TableBorderDecoration;