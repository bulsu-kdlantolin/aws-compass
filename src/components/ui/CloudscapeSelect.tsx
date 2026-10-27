import React, { useRef, useEffect, useId, useState } from 'react';
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
  options: CloudscapeSelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  size?: 'sm' | 'md';
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
}: CloudscapeSelectProps<T>) {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  const uniqueId = useId();
  const listboxId = `listbox-${uniqueId}`;
  const triggerId = `trigger-${uniqueId}`;

  const activePopoverId = usePopoverStore((s) => s.activePopoverId);
  const openPopover = usePopoverStore((s) => s.openPopover);
  const closePopover = usePopoverStore((s) => s.closePopover);
  const isOpen = activePopoverId === listboxId;
  const isMounted = useAnimatedOpen(isOpen, 180);

  const selectedIndex = options.findIndex((opt) => opt.value === value);
  const selectedOption = options[selectedIndex];

  const openListbox = (initialIdx?: number) => {
    openPopover(listboxId);
    const idx = initialIdx ?? (selectedIndex >= 0 ? selectedIndex : 0);
    setHighlightedIndex(idx);
  };

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (isOpen) closePopover(listboxId);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Refined elevated pill trigger with subtle depth */}
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
        className={`w-full ${heightClass} px-3 rounded-[6px] border flex items-center justify-between gap-2 cursor-pointer font-medium transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out outline-none disabled:opacity-50 disabled:cursor-not-allowed enabled:active:scale-[0.97] bg-white dark:bg-[#192534] hover:bg-[#F8F9FA] dark:hover:bg-[#1F2D40] text-[#16191F] dark:text-[#EAEDED] shadow-xs ${
          isOpen
            ? 'border-[#0972D3] dark:border-[#539FE5] ring-1 ring-[#0972D3]/20 dark:ring-[#539FE5]/20'
            : 'border-[#D5DBDB] dark:border-[#354150] hover:border-[#0972D3] dark:hover:border-[#539FE5]'
        }`}
      >
        <span className="flex items-center gap-2 truncate text-left">
          {selectedOption?.icon}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

        {/* 180deg rotating chevron with 200ms cubic-bezier */}
        <ChevronDown
          className="w-3.5 h-3.5 shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] text-[#545B64] dark:text-[#879596]"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
          aria-hidden="true"
        />
      </button>

      {/* Floating Menu Popover with concentric rounded-[12px], p-1.5 and layered elevation */}
      {isMounted && (
        <div
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel || placeholder}
          data-state={isOpen ? 'open' : 'closed'}
          style={{
            overscrollBehavior: 'contain',
          }}
          className={`absolute left-0 mt-1.5 w-full min-w-[210px] max-h-64 overflow-y-auto custom-scrollbar rounded-[12px] p-1.5 border z-50 bg-white dark:bg-[#192534] border-[#D5DBDB] dark:border-[#354150] shadow-[0px_2px_6px_rgba(0,0,0,0.04),0px_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.06)] transition-[opacity,transform] duration-180 ease-[cubic-bezier(0.16,1,0.3,1)] origin-top ${
            isOpen
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
                className={`px-2.5 py-1.5 rounded-[6px] flex items-center justify-between gap-3 transition-colors duration-100 cursor-pointer text-[12px] select-none ${
                  isSelected
                    ? 'bg-[#0972D3]/10 dark:bg-[#539FE5]/15 text-[#0972D3] dark:text-[#539FE5] font-semibold'
                    : isHighlighted
                    ? 'bg-[#F2F3F3] dark:bg-[#232F3E] text-[#16191F] dark:text-[#EAEDED] font-normal'
                    : 'text-[#16191F] dark:text-[#EAEDED] hover:bg-[#F2F3F3] dark:hover:bg-[#232F3E] font-normal'
                }`}
              >
                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                  {opt.icon}
                  <div className="truncate">
                    <div className="truncate leading-tight">{opt.label}</div>
                    {opt.description && (
                      <div
                        className="text-[11px] font-normal truncate text-[#545B64] dark:text-[#879596] opacity-90 mt-0.5"
                      >
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
                      className="w-3.5 h-3.5 text-[#0972D3] dark:text-[#539FE5]"
                      aria-hidden="true"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CloudscapeSelect;
