import React, { useState, useEffect, useRef, useCallback } from 'react';

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
  const dragStartRef = useRef<{ startX: number; startWidth: number }>({
    startX: 0,
    startWidth: sidebarWidth,
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startWidth: sidebarWidth,
    };
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onWidthChange(defaultWidth);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const delta = e.clientX - dragStartRef.current.startX;
      const maxAvailable =
        typeof window !== 'undefined'
          ? Math.min(maxWidth, Math.max(window.innerWidth - 340, minWidth))
          : maxWidth;
      const targetWidth = Math.min(
        Math.max(dragStartRef.current.startWidth + delta, minWidth),
        maxAvailable
      );
      onWidthChange(Math.round(targetWidth));
    },
    [isDragging, minWidth, maxWidth, onWidthChange]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove, { passive: false });
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

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
        aria-valuemax={maxWidth}
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        className={`absolute top-0 right-0 bottom-0 w-2 -mr-1 z-50 cursor-col-resize group select-none outline-none focus-visible:ring-1 focus-visible:ring-[#FF9900] ${
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

      {/* Global transparent drag shield to intercept pointer events over ReactFlow / iframe */}
      {isDragging && (
        <div
          className="fixed inset-0 z-[99999] cursor-col-resize select-none bg-transparent"
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default SidebarResizeHandle;

