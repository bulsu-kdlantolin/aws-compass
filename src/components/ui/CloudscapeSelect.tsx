import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';

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
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  const uniqueId = useId();
  const listboxId = `listbox-${uniqueId}`;
  const triggerId = `trigger-${uniqueId}`;

  const selectedIndex = options.findIndex((opt) => opt.value === value);
  const selectedOption = options[selectedIndex];

  const openListbox = (initialIdx?: number) => {
    setIsOpen(true);
    const idx = initialIdx ?? (selectedIndex >= 0 ? selectedIndex : 0);
    setHighlightedIndex(idx);
  };

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

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
    setIsOpen(false);
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
        setIsOpen(false);
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
        onClick={() => (isOpen ? setIsOpen(false) : openListbox())}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={
          isOpen && highlightedIndex >= 0 ? `opt-${uniqueId}-${highlightedIndex}` : undefined
        }
        style={{
          backgroundColor: 'var(--aws-card-bg)',
          borderColor: isOpen ? 'var(--aws-interactive)' : 'var(--aws-input-border)',
          color: 'var(--aws-text-primary)',
          boxShadow: isOpen ? '0 0 0 2px rgba(9, 114, 211, 0.25)' : undefined,
        }}
        className={`w-full ${heightClass} px-2.5 rounded-[4px] border flex items-center justify-between gap-2 cursor-pointer transition-[border-color,box-shadow,transform] duration-150 ease-out outline-none disabled:opacity-50 disabled:cursor-not-allowed hover:border-[var(--aws-interactive)] enabled:active:scale-[0.96]`}
      >
        <span className="flex items-center gap-2 truncate text-left">
          {selectedOption?.icon}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

        {/* 180deg rotating chevron with 150ms cubic-bezier */}
        <ChevronDown
          className="w-4 h-4 shrink-0 transition-transform text-[var(--aws-text-muted)]"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transitionDuration: '150ms',
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          aria-hidden="true"
        />
      </button>

      {/* Floating Menu Popover with 150ms cubic-bezier entry */}
      {isOpen && (
        <div
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel || placeholder}
          style={{
            backgroundColor: 'var(--aws-drawer-bg)',
            borderColor: 'var(--aws-border)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            overscrollBehavior: 'contain',
          }}
          className="absolute left-0 mt-1 w-full min-w-[190px] max-h-60 overflow-y-auto rounded-[4px] border py-1 z-50 transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1"
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
                style={{
                  color: isSelected ? 'var(--aws-interactive)' : 'var(--aws-text-primary)',
                  backgroundColor: isHighlighted ? 'var(--aws-card-bg)' : 'transparent',
                }}
                className={`relative px-3 py-1.5 flex items-center justify-between gap-2 cursor-pointer transition-colors text-[13px] select-none ${
                  isSelected ? 'font-semibold' : 'font-normal'
                }`}
              >
                {/* 2px left active indicator bar */}
                {isSelected && (
                  <span
                    style={{ backgroundColor: 'var(--aws-interactive)' }}
                    className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r"
                    aria-hidden="true"
                  />
                )}

                <div className="flex items-center gap-2 truncate pl-1">
                  {opt.icon}
                  <div className="truncate">
                    <div className="truncate">{opt.label}</div>
                    {opt.description && (
                      <div
                        style={{ color: 'var(--aws-text-muted)' }}
                        className="text-[11px] font-normal truncate"
                      >
                        {opt.description}
                      </div>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-3.5 h-3.5 shrink-0 text-[var(--aws-interactive)]" aria-hidden="true" />
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
