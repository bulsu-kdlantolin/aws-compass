import React, { useRef, useEffect, useId, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { usePopoverStore } from '../../store/usePopoverStore';
import { useAnimatedOpen } from './AnimatedPopover';

export interface CloudscapeSelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
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
      case 'ArrowDown': {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1 < options.length ? prev + 1 : 0));
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : options.length - 1));
        break;
      }
      case 'Home': {
        e.preventDefault();
        setHighlightedIndex(0);
        break;
      }
      case 'End': {
        e.preventDefault();
        setHighlightedIndex(options.length - 1);
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleSelect(options[highlightedIndex].value);
        }
        break;
      }
      case 'Escape':
      case 'Tab': {
        e.preventDefault();
        closePopover(listboxId);
        triggerRef.current?.focus();
        break;
      }
      default:
        break;
    }
  };

  const heightClass = size === 'sm' ? 'h-7 text-[12px]' : 'h-8 text-[13px]';

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={`relative inline-block font-sans select-none ${className}`}
    >
      {/* Trigger Button: 32px or 28px height, 4px radius, 3:1 focus ring */}
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        disabled={disabled}
        onClick={() => (isOpen ? closePopover(listboxId) : openListbox())}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={
          isOpen && highlightedIndex >= 0 ? `opt-${uniqueId}-${highlightedIndex}` : undefined
        }
        style={{
          backgroundColor: 'var(--aws-card-bg)',
          color: 'var(--aws-text-primary)',
          boxShadow: isOpen ? '0 0 0 2px rgba(9, 114, 211, 0.25)' : undefined,
        }}
        className={`w-full ${heightClass} px-2.5 rounded-[4px] border flex items-center justify-between gap-2 cursor-pointer transition-[border-color,box-shadow,transform] duration-150 ease-out outline-none disabled:opacity-50 disabled:cursor-not-allowed enabled:active:scale-[0.97] ${
          isOpen
            ? 'border-[#0972D3] dark:border-[#539FE5]'
            : 'border-[var(--aws-input-border)] hover:border-[var(--aws-interactive)]'
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
          className="w-4 h-4 shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] text-[var(--aws-text-muted)]"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
          aria-hidden="true"
        />
      </button>

      {/* Floating Menu Popover with 180ms cubic-bezier entry/exit */}
      {isMounted && (
        <div
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel || placeholder}
          data-state={isOpen ? 'open' : 'closed'}
          style={{
            backgroundColor: 'var(--aws-drawer-bg)',
            borderColor: 'var(--aws-border)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            overscrollBehavior: 'contain',
          }}
          className={`absolute left-0 mt-1 w-full min-w-[200px] max-h-60 overflow-y-auto custom-scrollbar rounded-[4px] border p-1 z-50 transition-[opacity,transform] duration-180 ease-[cubic-bezier(0.16,1,0.3,1)] origin-top ${
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
                className={`px-3 py-2 rounded-[4px] flex items-center justify-between gap-4 transition-colors duration-100 cursor-pointer text-[13px] select-none ${
                  isSelected
                    ? 'bg-[#0972D3]/10 dark:bg-[#539FE5]/15 text-[#0972D3] dark:text-[#539FE5] font-semibold'
                    : isHighlighted
                    ? 'bg-[#F2F3F3] dark:bg-[#232F3E] text-[var(--aws-text-primary)] font-normal'
                    : 'text-[var(--aws-text-primary)] hover:bg-[#F2F3F3] dark:hover:bg-[#232F3E] font-normal'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.icon}
                  <div className="truncate">
                    <div className="truncate">{opt.label}</div>
                    {opt.description && (
                      <div
                        style={{ color: 'var(--aws-text-muted)' }}
                        className="text-[11px] font-normal truncate opacity-85"
                      >
                        {opt.description}
                      </div>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-3.5 h-3.5 shrink-0 text-[#0972D3] dark:text-[#539FE5]" aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CloudscapeSelect;
