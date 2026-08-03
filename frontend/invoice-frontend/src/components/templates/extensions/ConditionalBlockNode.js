import { Node, mergeAttributes } from '@tiptap/core';

const ConditionalBlockNode = Node.create({
  name: 'conditionalBlock',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      conditionVar: { default: null, parseHTML: (el) => el.getAttribute('data-condition-var'), renderHTML: () => ({}) },
      conditionOp: { default: 'gt', parseHTML: (el) => el.getAttribute('data-condition-op'), renderHTML: () => ({}) },
      conditionValue: { default: '', parseHTML: (el) => el.getAttribute('data-condition-value'), renderHTML: () => ({}) },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-condition-var]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-condition-var': node.attrs.conditionVar,
      'data-condition-op': node.attrs.conditionOp,
      'data-condition-value': node.attrs.conditionValue,
      class: 'tpl-conditional-block',
    }), 0];
  },
});

export default ConditionalBlockNode;