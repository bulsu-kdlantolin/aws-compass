import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
import { SPRING_SNAPPY } from '../../utils/motionTokens';

export interface CloudscapeSplitPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  defaultPosition?: 'side' | 'bottom';
  initialWidth?: number;
  initialHeight?: number;
}

export const CloudscapeSplitPanel: React.FC<CloudscapeSplitPanelProps> = ({
  isOpen,
  onClose,
  title,
  headerActions,
  children,
  defaultPosition = 'side',
  initialWidth = 440,
  initialHeight = 320,
}) => {
  const position = defaultPosition;
  const [panelWidth, setPanelWidth] = useState(initialWidth);
  const [panelHeight, setPanelHeight] = useState(initialHeight);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startPos: number; startDim: number }>({ startPos: 0, startDim: 0 });

  // Handle Dragging Resize
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    if (position === 'side') {
      dragStartRef.current = { startPos: e.clientX, startDim: panelWidth };
    } else {
      dragStartRef.current = { startPos: e.clientY, startDim: panelHeight };
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      if (position === 'side') {
        const delta = dragStartRef.current.startPos - e.clientX;
        const newWidth = Math.min(Math.max(dragStartRef.current.startDim + delta, 320), window.innerWidth - 300);
        setPanelWidth(newWidth);
      } else {
        const delta = dragStartRef.current.startPos - e.clientY;
        const newHeight = Math.min(Math.max(dragStartRef.current.startDim + delta, 200), window.innerHeight - 200);
        setPanelHeight(newHeight);
      }
    },
    [isDragging, position]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <AnimatePresence>
      {isOpen && (
        <m.aside
          initial={
            position === 'side'
              ? { width: 0, opacity: 0, x: 24 }
              : { height: 0, opacity: 0, y: 24 }
          }
          animate={
            position === 'side'
              ? { width: panelWidth, opacity: 1, x: 0 }
              : { height: panelHeight, opacity: 1, y: 0 }
          }
          exit={
            position === 'side'
              ? { width: 0, opacity: 0, x: 24 }
              : { height: 0, opacity: 0, y: 24 }
          }
          transition={SPRING_SNAPPY}
          style={{
            width: position === 'side' ? `${panelWidth}px` : '100%',
            height: position === 'bottom' ? `${panelHeight}px` : '100%',
          }}
          className={`relative z-20 flex flex-col rounded-none shrink-0 overflow-hidden select-none bg-white/92 dark:bg-[#111726]/90 backdrop-blur-xl ${position === 'side'
              ? 'border-l border-slate-200/90 dark:border-white/[0.08] h-full shadow-[0_16px_40px_-8px_rgba(0,0,0,0.6)]'
              : 'border-t border-slate-200/90 dark:border-white/[0.08] w-full shadow-[0_16px_40px_-8px_rgba(0,0,0,0.6)]'
            }`}
        >
          {/* Draggable Resize Handle */}
          <div
            onMouseDown={handleMouseDown}
            style={{
              cursor: position === 'side' ? 'col-resize' : 'row-resize',
              backgroundColor: isDragging ? 'var(--aws-interactive)' : 'transparent',
            }}
            className={`absolute z-30 transition-colors hover:bg-[var(--aws-interactive)] ${position === 'side'
              ? 'top-0 left-0 bottom-0 w-1.5 -ml-1'
              : 'top-0 left-0 right-0 h-1.5 -mt-1'
              }`}
            title={`Drag to resize (${position === 'side' ? 'width' : 'height'})`}
          />

          {/* Split Panel Header Band */}
          <div
            className="px-4 py-2.5 border-b border-slate-100 dark:border-white/[0.05] bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between shrink-0 h-12"
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              {title}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {headerActions}

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                style={{ color: 'var(--aws-text-muted)' }}
                className="p-1 rounded-[4px] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] transition-colors cursor-pointer"
                title="Close split panel (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Split Panel Content Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </m.aside>
      )}
    </AnimatePresence>
  );
};

export default CloudscapeSplitPanel;
