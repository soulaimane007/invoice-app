import { Table } from '@tiptap/extension-table';

const BorderedTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: null,
        parseHTML: (el) => el.getAttribute('class'),
        renderHTML: (attrs) => (attrs.class ? { class: attrs.class } : {}),
      },
      borderWidth: {
        default: '2',
        parseHTML: (el) => el.getAttribute('data-border-width') || '2',
        renderHTML: (attrs) => ({ 'data-border-width': attrs.borderWidth }),
      },
      cellPadding: {
        default: '4',
        parseHTML: (el) => el.getAttribute('data-cell-padding') || '4',
        renderHTML: (attrs) => ({ 'data-cell-padding': attrs.cellPadding }),
      },
      stackLines: {
        default: false,
        parseHTML: (el) => el.getAttribute('data-stack-lines') === 'true',
        renderHTML: (attrs) => (attrs.stackLines ? { 'data-stack-lines': 'true' } : {}),
      },
    };
  },
});

export default BorderedTable;