import { Node, mergeAttributes } from '@tiptap/core';

const PLACEHOLDER_SRC = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="70" viewBox="0 0 160 70"><rect width="160" height="70" fill="#f4e8c8" stroke="#cea23c" stroke-width="2" stroke-dasharray="4"/><text x="80" y="40" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#966c22">Logo entreprise</text></svg>'
);

const VariableImageNode = Node.create({
  name: 'variableImage',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      variableKey: { default: 'company_logo', parseHTML: (el) => el.getAttribute('data-variable-image') },
      width: { default: '150px', parseHTML: (el) => el.style.width || '150px' },
    };
  },

  parseHTML() {
    return [{ tag: 'img[data-variable-image]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'img',
      mergeAttributes(HTMLAttributes, {
        'data-variable-image': node.attrs.variableKey,
        src: PLACEHOLDER_SRC,
        style: `width: ${node.attrs.width}; height: auto;`,
        alt: 'Logo entreprise',
      }),
    ];
  },
});

export default VariableImageNode;