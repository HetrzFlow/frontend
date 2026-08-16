'use client';
'use client';

import { useRef, useState } from 'react';

interface DragProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  threshold?: number; // default 5px
  offset?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
}

function Drag({
  children,
  className,
  onClick,
  threshold = 5,
  offset,
}: DragProps) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const elementRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    startPos.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
    isDragging.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons !== 1) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;

    // drag mode
    if (
      !isDragging.current &&
      (Math.abs(dx - pos.x) > threshold || Math.abs(dy - pos.y) > threshold)
    ) {
      isDragging.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    if (isDragging.current) {
      const el = elementRef.current;
      if (el) {
        const { offsetWidth, offsetHeight } = el;
        const offsetX =
          offset?.left !== undefined
            ? offset.left
            : offset?.right
              ? window.innerWidth - offset.right
              : 0;
        const maxX = window.innerWidth - offsetWidth - offsetX;
        const offsetY =
          offset?.top !== undefined
            ? offset.top
            : offset?.bottom
              ? window.innerHeight - offset.bottom
              : 0;
        const maxY = window.innerHeight - offsetHeight - offsetY;
        const newX = Math.max(0 - offsetX, Math.min(dx, maxX));
        const newY = Math.max(0 - offsetY, Math.min(dy, maxY));

        setPos({ x: newX, y: newY });
      } else {
        setPos({ x: dx, y: dy });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    // not drag, trigger click
    if (!isDragging.current && onClick) {
      if (e.target === e.currentTarget) {
        onClick();
      }
    }
  };

  return (
    <div
      ref={elementRef}
      className={className}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        touchAction: 'none',
      }}
    >
      {children}
    </div>
  );
}

export { Drag };
