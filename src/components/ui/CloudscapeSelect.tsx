import React, { useRef, useEffect, useId, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { usePopoverStore } from '../../store/usePopoverStore';
import { useAnimatedOpen } from './AnimatedPopover';

export interface CloudscapeSelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  count?: number | string;
}

export interface CloudscapeSelectProps<T extends string = string> {
  value: T;
  options: readonly CloudscapeSelectOption<T>[] | CloudscapeSelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  size?: 'sm' | 'md';
  align?: 'left' | 'right';
  id?: string;
}

export function CloudscapeSelect<T extends string = string>({
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  ariaLabel,
  size = 'md',
  align = 'left',
  id,
}: CloudscapeSelectProps<T>) {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  const uniqueId = useId();
  const listboxId = `listbox-${id || uniqueId}`;
  const triggerId = `trigger-${id || uniqueId}`;

  const activePopoverId = usePopoverStore((s) => s.activePopoverId);
  const openPopover = usePopoverStore((s) => s.openPopover);
  const closePopover = usePopoverStore((s) => s.closePopover);
  const isOpen = activePopoverId === listboxId;
  const isMounted = useAnimatedOpen(isOpen, 180);

  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    transformOrigin: string;
  }>({
    left: 0,
    width: 200,
    transformOrigin: 'top left',
  });

  const selectedIndex = options.findIndex((opt) => opt.value === value);
  const selectedOption = options[selectedIndex];

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popoverEl = listboxRef.current;
    const popoverHeight = popoverEl ? popoverEl.offsetHeight : 220;
    const popoverWidth = Math.max(triggerRect.width, 180);

    let left = triggerRect.left;
    if (align === 'right') {
      left = triggerRect.right - popoverWidth;
    }
    // Clamp horizontally within viewport
    left = Math.max(8, Math.min(left, window.innerWidth - popoverWidth - 8));

    // Determine auto-flip upward if too close to viewport bottom
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const shouldFlip = spaceBelow < popoverHeight + 12 && spaceAbove > spaceBelow;

    if (shouldFlip) {
      setCoords({
        bottom: window.innerHeight - triggerRect.top + 4,
        left,
        width: popoverWidth,
        transformOrigin: align === 'right' ? 'bottom right' : 'bottom left',
      });
    } else {
      setCoords({
        top: triggerRect.bottom + 4,
        left,
        width: popoverWidth,
        transformOrigin: align === 'right' ? 'top right' : 'top left',
      });
    }
  }, [align]);

  const openListbox = (initialIdx?: number) => {
    updatePosition();
    openPopover(listboxId);
    const idx = initialIdx ?? (selectedIndex >= 0 ? selectedIndex : 0);
    setHighlightedIndex(idx);
  };

  // Sync position on mount, resize, scroll
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    window.addEventListener('scroll', handleScrollOrResize, { passive: true, capture: true });
    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
    };
  }, [isOpen, updatePosition]);

  // Click outside listener for portal
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        listboxRef.current &&
        !listboxRef.current.contains(target)
      ) {
        closePopover(listboxId);
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [isOpen, listboxId, closePopover]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && listboxRef.current && highlightedIndex >= 0) {
      const optionEl = listboxRef.current.querySelector(
        `#opt-${uniqueId}-${highlightedIndex}`
      );
      if (optionEl) {
        optionEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen, highlightedIndex, uniqueId]);

  const handleSelect = (val: T) => {
    onChange(val);
    closePopover(listboxId);
    triggerRef.current?.focus();
  };

  // Full ARIA APG Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openListbox();
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        openListbox(options.length - 1);
        return;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1 < options.length ? prev + 1 : 0));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : options.length - 1));
        break;

      case 'Home':
        e.preventDefault();
        setHighlightedIndex(0);
        break;

      case 'End':
        e.preventDefault();
        setHighlightedIndex(options.length - 1);
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleSelect(options[highlightedIndex].value);
        }
        break;

      case 'Escape':
        e.preventDefault();
        closePopover(listboxId);
        triggerRef.current?.focus();
        break;

      case 'Tab':
        closePopover(listboxId);
        break;

      default:
        // Type-ahead jump to matching character
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const char = e.key.toLowerCase();
          const matchIdx = options.findIndex((opt, idx) => {
            if (idx <= highlightedIndex) return false;
            return opt.label.toLowerCase().startsWith(char);
          });
          if (matchIdx >= 0) {
            setHighlightedIndex(matchIdx);
          } else {
            const fallbackIdx = options.findIndex((opt) =>
              opt.label.toLowerCase().startsWith(char)
            );
            if (fallbackIdx >= 0) setHighlightedIndex(fallbackIdx);
          }
        }
        break;
    }
  };

  const heightClass = size === 'sm' ? 'h-7 text-[11px]' : 'h-8 text-[12px]';
  const widthClass = className.includes('w-') ? '' : 'w-full';

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${widthClass} ${className}`}
    >
      {/* Sleek Cloudscape Trigger */}
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        disabled={disabled}
        onClick={() => (isOpen ? closePopover(listboxId) : openListbox())}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        data-open={isOpen ? 'true' : 'false'}
        aria-activedescendant={
          isOpen && highlightedIndex >= 0 ? `opt-${uniqueId}-${highlightedIndex}` : undefined
        }
        className={`group ${heightClass} w-full px-2.5 rounded-[6px] bg-[#F8F9FA] dark:bg-[#0F141A] hover:bg-[#EAEDED]/60 dark:hover:bg-[#192534] border border-[#D5DBDB] dark:border-[#2A3647] data-[open=true]:border-[#0972D3] dark:data-[open=true]:border-[#539FE5] flex items-center justify-between text-[#16191F] dark:text-[#EAEDED] transition-colors duration-150 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className="flex items-center gap-2 truncate text-left min-w-0 flex-1 mr-1">
          {selectedOption?.icon}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

        <ChevronDown
          className="size-3.5 text-[#879596] shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)] group-data-[open=true]:rotate-180"
          aria-hidden="true"
        />
      </button>

      {/* Floating Menu Popover rendered in document.body Portal */}
      {
        isMounted &&
        createPortal(
          <div
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            aria-label={ariaLabel || placeholder}
            data-state={isOpen ? 'open' : 'closed'}
            style={{
              position: 'fixed',
              top: coords.top !== undefined ? `${coords.top}px` : undefined,
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxWidth: '340px',
              transformOrigin: coords.transformOrigin,
              zIndex: 9999,
              overscrollBehavior: 'contain',
            }}
            className={`max-h-64 overflow-y-auto custom-scrollbar rounded-[10px] p-1 border shadow-[0_12px_32px_rgba(0,0,0,0.22)] backdrop-blur-md bg-white dark:bg-[#141C28] border-[#D5DBDB] dark:border-[#2A3647] text-[#16191F] dark:text-[#EAEDED] transition-[opacity,transform] duration-180 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen
              ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 scale-[0.96] -translate-y-1.5 pointer-events-none'
              }`}
          >
            {options.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={opt.value}
                  id={`opt-${uniqueId}-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.value)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`px-2.5 py-1.5 rounded-[6px] flex items-center justify-between gap-2.5 text-[12px] transition-colors duration-100 cursor-pointer select-none ${isSelected
                    ? 'bg-[#0972D3]/10 dark:bg-[#539FE5]/15 text-[#0972D3] dark:text-[#539FE5] font-semibold'
                    : isHighlighted
                      ? 'bg-[#F2F3F3] dark:bg-[#1E2B3D] text-[#16191F] dark:text-[#EAEDED]'
                      : 'text-[#16191F] dark:text-[#EAEDED] hover:bg-[#F2F3F3] dark:hover:bg-[#1E2B3D]'
                    }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                    {opt.icon}
                    <div className="truncate">
                      <div className="truncate leading-tight">{opt.label}</div>
                      {opt.description && (
                        <div className="text-[11px] font-normal truncate text-[#545B64] dark:text-[#879596] opacity-90 mt-0.5">
                          {opt.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {opt.count !== undefined && (
                      <span className="text-[11px] font-mono tabular-nums text-[#545B64] dark:text-[#879596] font-medium">
                        {opt.count}
                      </span>
                    )}
                    {opt.badge}
                    {isSelected && (
                      <Check
                        className="size-3.5 text-[#0972D3] dark:text-[#539FE5]"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>,
          document.body
        )
      }
    </div>
  );
}

export default CloudscapeSelect;
