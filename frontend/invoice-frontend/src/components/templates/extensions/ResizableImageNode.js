import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ResizableImageView from './ResizableImageView';

// Extends the base Image extension — only user-uploaded, fixed images
// (letterhead art, a stamp, a signature) go through this. The company
// logo variable is a completely separate node (VariableImageNode).
const ResizableImageNode = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 300,
        parseHTML: (el) => {
          const w = el.style.width || el.getAttribute('width');
          return w ? parseInt(w, 10) : 300;
        },
        renderHTML: (attrs) => ({ style: `width: ${attrs.width}px; height: auto;` }),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

export default ResizableImageNode;