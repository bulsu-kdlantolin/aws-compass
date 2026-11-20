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
  const [liveWidth, setLiveWidth] = useState(sidebarWidth);
  const dragStartRef = useRef<{ pointerId: number; startX: number; startWidth: number } | null>(null);
  const dragWidthRef = useRef(sidebarWidth);
  const queuedWidthRef = useRef<number | null>(null);
  const asideRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragWidthRef.current = sidebarWidth;
    asideRef.current = e.currentTarget.closest('aside');
    setLiveWidth(sidebarWidth);
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
    const nextWidth = Math.round(targetWidth);
    dragWidthRef.current = nextWidth;
    queuedWidthRef.current = nextWidth;

    if (frameRef.current === null) {
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        const width = queuedWidthRef.current;
        queuedWidthRef.current = null;
        if (width === null) return;
        asideRef.current?.style.setProperty('width', `${width}px`);
        setLiveWidth(width);
      });
    }
  };

  const finishPointerDrag = (pointerId?: number) => {
    const drag = dragStartRef.current;
    if (!drag || (pointerId !== undefined && drag.pointerId !== pointerId)) return;

    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    queuedWidthRef.current = null;
    asideRef.current?.style.setProperty('width', `${dragWidthRef.current}px`);
    onWidthChange(dragWidthRef.current);

    dragStartRef.current = null;
    asideRef.current = null;
    setIsDragging(false);
  };

  useEffect(() => {
    const handleWindowBlur = () => {
      finishPointerDrag();
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

  useEffect(
    () => () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    },
    []
  );

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
        aria-valuenow={isDragging ? liveWidth : sidebarWidth}
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
        {/* A quiet resize cue that stays out of the way while dragging. */}
        <div
          className={`ml-auto h-full w-px ${
            isDragging ? 'bg-[var(--aws-border)]' : 'bg-transparent group-hover:bg-[var(--aws-border)]'
          }`}
        />
      </div>

    </>
  );
};

export default SidebarResizeHandle;

