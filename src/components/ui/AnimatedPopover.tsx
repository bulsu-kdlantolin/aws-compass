import React, { useEffect, useState, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export function useAnimatedOpen(isOpen: boolean, exitDuration = 180): boolean {
  const [isMounted, setIsMounted] = useState(isOpen);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isOpen) {
      setIsMounted(true);
    } else {
      timer = setTimeout(() => {
        setIsMounted(false);
      }, exitDuration);
    }
    return () => clearTimeout(timer);
  }, [isOpen, exitDuration]);

  return isMounted;
}

export interface AnimatedPopoverProps {
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  side?: 'top' | 'bottom';
  triggerRef?: React.RefObject<HTMLElement | null>;
  usePortal?: boolean;
}

export const AnimatedPopover: React.FC<AnimatedPopoverProps> = ({
  isOpen,
  onClose,
  className = '',
  style = {},
  children,
  align = 'left',
  side = 'bottom',
  triggerRef,
  usePortal = Boolean(triggerRef),
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const isMounted = useAnimatedOpen(isOpen, 180);

  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    transformOrigin: string;
  }>({
    left: 0,
    transformOrigin: 'top left',
  });

  const updatePosition = useCallback(() => {
    if (!triggerRef?.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popoverEl = popoverRef.current;
    const popoverWidth = popoverEl ? popoverEl.offsetWidth : 280;
    const popoverHeight = popoverEl ? popoverEl.offsetHeight : 240;

    let left = triggerRect.left;
    if (align === 'right') {
      left = triggerRect.right - popoverWidth;
    } else if (align === 'center') {
      left = triggerRect.left + triggerRect.width / 2 - popoverWidth / 2;
    }

    // Clamp horizontally to viewport bounds
    left = Math.max(8, Math.min(left, window.innerWidth - popoverWidth - 8));

    if (side === 'top') {
      setCoords({
        bottom: window.innerHeight - triggerRect.top + 6,
        left,
        transformOrigin:
          align === 'right' ? 'bottom right' : align === 'center' ? 'bottom center' : 'bottom left',
      });
    } else {
      // Default: bottom. If it overflows bottom of screen, flip upward if room permits
      const overflowBottom = triggerRect.bottom + popoverHeight + 12 > window.innerHeight;
      const canFitTop = triggerRect.top - popoverHeight > 12;

      if (overflowBottom && canFitTop) {
        setCoords({
          bottom: window.innerHeight - triggerRect.top + 6,
          left,
          transformOrigin:
            align === 'right' ? 'bottom right' : align === 'center' ? 'bottom center' : 'bottom left',
        });
      } else {
        setCoords({
          top: triggerRect.bottom + 6,
          left,
          transformOrigin:
            align === 'right' ? 'top right' : align === 'center' ? 'top center' : 'top left',
        });
      }
    }
  }, [triggerRef, align, side]);

  useLayoutEffect(() => {
    if (!isOpen || !usePortal) return;
    updatePosition();
    const handleScrollResize = () => updatePosition();
    window.addEventListener('resize', handleScrollResize);
    window.addEventListener('scroll', handleScrollResize, true);
    return () => {
      window.removeEventListener('resize', handleScrollResize);
      window.removeEventListener('scroll', handleScrollResize, true);
    };
  }, [isOpen, usePortal, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        (!triggerRef?.current || !triggerRef.current.contains(target))
      ) {
        onClose?.();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isMounted) return null;

  const alignClass =
    align === 'right'
      ? 'right-0 origin-top-right'
      : align === 'center'
        ? 'left-1/2 -translate-x-1/2 origin-top'
        : 'left-0 origin-top-left';

  const isFlippedUp = coords.bottom !== undefined;

  const content = (
    <div
      ref={popoverRef}
      data-state={isOpen ? 'open' : 'closed'}
      style={
        usePortal
          ? {
            position: 'fixed',
            top: coords.top !== undefined ? `${coords.top}px` : undefined,
            bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
            left: `${coords.left}px`,
            transformOrigin: coords.transformOrigin,
            zIndex: 9999,
            overscrollBehavior: 'contain',
            ...style,
          }
          : {
            overscrollBehavior: 'contain',
            ...style,
          }
      }
      className={`${usePortal ? '' : `absolute ${alignClass} z-50`
        } rounded-[12px] p-1.5 border bg-[var(--aws-popover-bg)] border-[var(--aws-border)] text-[var(--aws-text-primary)] shadow-[0px_4px_16px_rgba(0,0,0,0.18),0px_16px_36px_rgba(0,0,0,0.22)] dark:shadow-[0_12px_36px_-5px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.08)] transition-[opacity,transform] duration-180 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
          : `opacity-0 scale-[0.96] ${usePortal && isFlippedUp ? 'translate-y-1.5' : '-translate-y-1.5'
          } pointer-events-none`
        } ${className}`}
    >
      {children}
    </div>
  );

  if (usePortal && typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
};

export default AnimatedPopover;
