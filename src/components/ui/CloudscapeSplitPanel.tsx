import React, { useState, useRef, useEffect } from 'react';
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
  const [isCompactViewport, setIsCompactViewport] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches
  );
  const dragStartRef = useRef<{ pointerId: number; startPos: number; startDim: number } | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)');
    const updateViewport = () => {
      setIsCompactViewport(media.matches);
      setPanelWidth((width) => Math.min(width, Math.max(280, window.innerWidth - 300)));
      setPanelHeight((height) => Math.min(height, Math.max(180, window.innerHeight - 200)));
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const handleWindowBlur = () => {
      dragStartRef.current = null;
      setIsDragging(false);
    };
    window.addEventListener('blur', handleWindowBlur);
    return () => window.removeEventListener('blur', handleWindowBlur);
  }, [isDragging]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isCompactViewport || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    const startPos = position === 'side' ? e.clientX : e.clientY;
    const startDim = position === 'side' ? panelWidth : panelHeight;
    dragStartRef.current = { pointerId: e.pointerId, startPos, startDim };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStartRef.current;
    if (!isDragging || drag?.pointerId !== e.pointerId) return;
    if (position === 'side') {
      const maxWidth = Math.max(280, window.innerWidth - 300);
      const delta = drag.startPos - e.clientX;
      setPanelWidth(Math.min(Math.max(drag.startDim + delta, Math.min(320, maxWidth)), maxWidth));
    } else {
      const maxHeight = Math.max(180, window.innerHeight - 200);
      const delta = drag.startPos - e.clientY;
      setPanelHeight(Math.min(Math.max(drag.startDim + delta, Math.min(200, maxHeight)), maxHeight));
    }
  };

  const finishPointerDrag = (pointerId?: number) => {
    if (pointerId !== undefined && dragStartRef.current?.pointerId !== pointerId) return;
    dragStartRef.current = null;
    setIsDragging(false);
  };

  const handleResizeKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 40 : 10;
    if (position === 'side') {
      const maxWidth = Math.max(280, window.innerWidth - 300);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const direction = e.key === 'ArrowLeft' ? 1 : -1;
        setPanelWidth(Math.min(Math.max(panelWidth + direction * step, Math.min(320, maxWidth)), maxWidth));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setPanelWidth(Math.min(320, maxWidth));
      } else if (e.key === 'End') {
        e.preventDefault();
        setPanelWidth(maxWidth);
      }
    } else {
      const maxHeight = Math.max(180, window.innerHeight - 200);
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const direction = e.key === 'ArrowUp' ? 1 : -1;
        setPanelHeight(Math.min(Math.max(panelHeight + direction * step, Math.min(200, maxHeight)), maxHeight));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setPanelHeight(Math.min(200, maxHeight));
      } else if (e.key === 'End') {
        e.preventDefault();
        setPanelHeight(maxHeight);
      }
    }
  };

  const currentSize = position === 'side' ? panelWidth : panelHeight;
  const minSize = position === 'side' ? Math.min(320, Math.max(280, window.innerWidth - 300)) : Math.min(200, Math.max(180, window.innerHeight - 200));
  const maxSize = position === 'side' ? Math.max(280, window.innerWidth - 300) : Math.max(180, window.innerHeight - 200);

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
              ? { width: isCompactViewport ? 'min(100%, 450px)' : panelWidth, opacity: 1, x: 0 }
              : { height: panelHeight, opacity: 1, y: 0 }
          }
          exit={
            position === 'side'
              ? { width: 0, opacity: 0, x: 24 }
              : { height: 0, opacity: 0, y: 24 }
          }
          transition={SPRING_SNAPPY}
          style={{
            width: position === 'side' ? (isCompactViewport ? 'min(100%, 450px)' : `${panelWidth}px`) : '100%',
            height: position === 'bottom' ? `${panelHeight}px` : '100%',
          }}
          className={`${isCompactViewport && position === 'side' ? 'absolute right-0 top-0 bottom-0 !max-w-full' : 'relative'} z-20 flex flex-col rounded-none shrink-0 overflow-hidden select-none bg-white/92 dark:bg-[#111726]/90 backdrop-blur-xl ${position === 'side'
              ? 'border-l border-slate-200/90 dark:border-white/[0.08] h-full shadow-[0_16px_40px_-8px_rgba(0,0,0,0.6)]'
              : 'border-t border-slate-200/90 dark:border-white/[0.08] w-full shadow-[0_16px_40px_-8px_rgba(0,0,0,0.6)]'
            }`}
        >
          {/* Draggable Resize Handle */}
          <div
            role="separator"
            aria-label={`Resize ${position === 'side' ? 'side' : 'bottom'} panel`}
            aria-orientation={position === 'side' ? 'vertical' : 'horizontal'}
            aria-valuenow={Math.round(currentSize)}
            aria-valuemin={Math.round(minSize)}
            aria-valuemax={Math.round(maxSize)}
            tabIndex={isCompactViewport ? -1 : 0}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={(e) => finishPointerDrag(e.pointerId)}
            onPointerCancel={(e) => finishPointerDrag(e.pointerId)}
            onLostPointerCapture={(e) => finishPointerDrag(e.pointerId)}
            onKeyDown={handleResizeKeyDown}
            style={{
              cursor: position === 'side' ? 'col-resize' : 'row-resize',
            }}
            className={`group absolute z-30 touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aws-interactive)] ${isCompactViewport ? 'hidden' : ''} ${position === 'side'
              ? 'top-0 -left-3 bottom-0 w-6'
              : 'left-0 -top-3 right-0 h-6'
              }`}
            title={`Drag to resize (${position === 'side' ? 'width' : 'height'})`}
          >
            <span className={`absolute bg-[var(--aws-interactive)] transition-opacity ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'} ${position === 'side' ? 'inset-y-0 left-1/2 w-0.5 -translate-x-1/2' : 'inset-x-0 top-1/2 h-0.5 -translate-y-1/2'}`} />
          </div>

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
