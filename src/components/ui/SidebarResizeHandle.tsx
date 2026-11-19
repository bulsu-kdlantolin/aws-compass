import React, { useState, useEffect, useRef } from 'react';

export interface SidebarResizeHandleProps {
  sidebarWidth: number;
  onWidthChange: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
  className?: string;
}

export const SidebarResizeHandle: React.FC<SidebarResizeHandleProps> = ({
  sidebarWidth,
  onWidthChange,
  minWidth = 260,
  maxWidth = 560,
  defaultWidth = 320,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ pointerId: number; startX: number; startWidth: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startWidth: sidebarWidth,
    };
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onWidthChange(defaultWidth);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStartRef.current;
    if (!isDragging || drag?.pointerId !== e.pointerId) return;
    const delta = e.clientX - drag.startX;
    const maxAvailable =
      typeof window !== 'undefined'
        ? Math.min(maxWidth, Math.max(window.innerWidth - 340, minWidth))
        : maxWidth;
    const targetWidth = Math.min(
      Math.max(drag.startWidth + delta, minWidth),
      maxAvailable
    );
    onWidthChange(Math.round(targetWidth));
  };

  const finishPointerDrag = (pointerId?: number) => {
    if (pointerId !== undefined && dragStartRef.current?.pointerId !== pointerId) return;
    dragStartRef.current = null;
    setIsDragging(false);
  };

  useEffect(() => {
    const handleWindowBlur = () => {
      dragStartRef.current = null;
      setIsDragging(false);
    };

    if (isDragging) {
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
      window.addEventListener('blur', handleWindowBlur);
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isDragging]);

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 40 : 10;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onWidthChange(Math.max(sidebarWidth - step, minWidth));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const maxAvailable =
        typeof window !== 'undefined'
          ? Math.min(maxWidth, Math.max(window.innerWidth - 340, minWidth))
          : maxWidth;
      onWidthChange(Math.min(sidebarWidth + step, maxAvailable));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onWidthChange(minWidth);
    } else if (e.key === 'End') {
      e.preventDefault();
      onWidthChange(maxWidth);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onWidthChange(defaultWidth);
    }
  };

  return (
    <>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar width"
        aria-valuenow={sidebarWidth}
        aria-valuemin={minWidth}
        aria-valuemax={Math.min(maxWidth, Math.max(window.innerWidth - 340, minWidth))}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(e) => finishPointerDrag(e.pointerId)}
        onPointerCancel={(e) => finishPointerDrag(e.pointerId)}
        onLostPointerCapture={(e) => finishPointerDrag(e.pointerId)}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        className={`absolute top-0 right-0 bottom-0 w-6 -mr-3 z-50 cursor-col-resize group select-none touch-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--aws-brand)] ${
          isDragging ? 'pointer-events-auto' : ''
        } ${className}`}
        title={`Drag to adjust sidebar width (Double-click or Enter to reset to ${defaultWidth}px)`}
      >
        {/* Glow / Highlight indicator bar on hover or active dragging */}
        <div
          className={`w-[2px] h-full ml-auto transition-colors duration-150 ${
            isDragging
              ? 'bg-[#FF9900] shadow-[0_0_8px_rgba(255,153,0,0.6)]'
              : 'bg-transparent group-hover:bg-[#FF9900]/70'
          }`}
        />
      </div>

    </>
  );
};

export default SidebarResizeHandle;

