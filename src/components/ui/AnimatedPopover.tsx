import React, { useEffect, useState } from 'react';

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
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export const AnimatedPopover: React.FC<AnimatedPopoverProps> = ({
  isOpen,
  onClose,
  className = '',
  style = {},
  children,
  align = 'left',
  triggerRef,
}) => {
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const isMounted = useAnimatedOpen(isOpen, 180);

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

  return (
    <div
      ref={popoverRef}
      data-state={isOpen ? 'open' : 'closed'}
      style={{
        backgroundColor: 'var(--aws-drawer-bg)',
        borderColor: 'var(--aws-border)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
        overscrollBehavior: 'contain',
        ...style,
      }}
      className={`absolute ${alignClass} rounded-[4px] border z-50 transition-[opacity,transform] duration-180 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isOpen
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 scale-[0.96] -translate-y-1.5 pointer-events-none'
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default AnimatedPopover;
