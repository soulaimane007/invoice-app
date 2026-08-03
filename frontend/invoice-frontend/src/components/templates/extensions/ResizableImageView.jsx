import { useCallback, useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

export default function ResizableImageView({ node, updateAttributes, selected }) {
  const [dragging, setDragging] = useState(false);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
    const startX = e.clientX;
    const startWidth = node.attrs.width || 300;

    function handleMouseMove(moveEvent) {
      const newWidth = Math.max(40, startWidth + (moveEvent.clientX - startX));
      updateAttributes({ width: newWidth });
    }
    function handleMouseUp() {
      setDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [node.attrs.width, updateAttributes]);

  return (
    <NodeViewWrapper as="span" className="relative inline-block leading-none">
      <img
        src={node.attrs.src}
        alt={node.attrs.alt || ''}
        style={{ width: `${node.attrs.width || 300}px`, height: 'auto' }}
        className={`align-bottom ${selected || dragging ? 'outline outline-2 outline-gold-500' : ''}`}
      />
      {selected && (
        <span
          onMouseDown={handleMouseDown}
          className="absolute bottom-0 right-0 h-3 w-3 cursor-se-resize rounded-tl bg-gold-500"
        />
      )}
    </NodeViewWrapper>
  );
}