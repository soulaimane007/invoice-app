import { Node, mergeAttributes } from '@tiptap/core';

// Wraps a single inline variable chip, not a whole paragraph — for cases
// like "Quantité Unité" sharing one line, where only Unité should be
// conditional. wrapIn() doesn't work on a single-atom selection (verified
// separately), so this is applied via a direct transaction from the
// toolbar rather than the standard wrap command.
const ConditionalInlineNode = Node.create({
  name: 'conditionalInline',
  group: 'inline',
  inline: true,
  content: 'inline*',

  addAttributes() {
    return {
      conditionVar: { default: null, parseHTML: (el) => el.getAttribute('data-condition-var'), renderHTML: () => ({}) },
      conditionOp: { default: 'eq', parseHTML: (el) => el.getAttribute('data-condition-op'), renderHTML: () => ({}) },
      conditionValue: { default: '', parseHTML: (el) => el.getAttribute('data-condition-value'), renderHTML: () => ({}) },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-condition-var]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, {
      'data-condition-var': node.attrs.conditionVar,
      'data-condition-op': node.attrs.conditionOp,
      'data-condition-value': node.attrs.conditionValue,
      class: 'tpl-conditional-inline',
    }), 0];
  },
});

export default ConditionalInlineNode;