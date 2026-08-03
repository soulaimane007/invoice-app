import { Node, mergeAttributes } from '@tiptap/core';

const VariableNode = Node.create({
  name: 'variable',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      variableKey: { default: null, parseHTML: (el) => el.getAttribute('data-variable') },
      label: { default: '', parseHTML: (el) => el.getAttribute('data-label') || el.textContent },
      bold: { default: false, parseHTML: (el) => el.getAttribute('data-bold') === 'true' },
      italic: { default: false, parseHTML: (el) => el.getAttribute('data-italic') === 'true' },
      uppercase: { default: false, parseHTML: (el) => el.getAttribute('data-uppercase') === 'true' },
      fontSize: { default: null, parseHTML: (el) => el.getAttribute('data-font-size') || null },
      color: { default: null, parseHTML: (el) => el.getAttribute('data-color') || null },
      spellOut: { default: false, parseHTML: (el) => el.getAttribute('data-spell-out') === 'true' },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-variable]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const styleParts = [];
    if (node.attrs.fontSize) styleParts.push(`font-size:${node.attrs.fontSize}`);
    if (node.attrs.color) styleParts.push(`color:${node.attrs.color}`);

    const classes = ['tpl-variable-chip', 'inline-flex', 'items-center', 'rounded-md', 'bg-gold-100', 'px-1.5', 'py-0.5', 'mx-0.5', 'cursor-default', 'select-none', 'font-medium'];
    if (!node.attrs.fontSize) classes.push('text-xs');
    if (!node.attrs.color) classes.push('text-gold-800');
    if (node.attrs.bold) classes.push('font-bold');
    if (node.attrs.italic) classes.push('italic');
    if (node.attrs.uppercase) classes.push('uppercase');

    const attrs = {
      'data-variable': node.attrs.variableKey,
      'data-label': node.attrs.label,
      class: classes.join(' '),
    };
    if (node.attrs.bold) attrs['data-bold'] = 'true';
    if (node.attrs.italic) attrs['data-italic'] = 'true';
    if (node.attrs.uppercase) attrs['data-uppercase'] = 'true';
    if (node.attrs.fontSize) attrs['data-font-size'] = node.attrs.fontSize;
    if (node.attrs.color) attrs['data-color'] = node.attrs.color;
    if (node.attrs.spellOut) attrs['data-spell-out'] = 'true';
    if (styleParts.length) attrs.style = styleParts.join(';');

    return ['span', mergeAttributes(HTMLAttributes, attrs), node.attrs.label];
  },
});

export default VariableNode;