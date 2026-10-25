import React, { useState, useRef, useEffect } from 'react';
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
}

export function CloudscapeSelect<T extends string = string>({
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  ariaLabel,
}: CloudscapeSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
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

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (val: T) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-[14px] leading-[20px] font-sans select-none ${className}`}
    >
      {/* Trigger Button: 32px height, 4px radius */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          backgroundColor: 'var(--aws-card-bg)',
          borderColor: isOpen ? 'var(--aws-interactive)' : 'var(--aws-input-border)',
          color: 'var(--aws-text-primary)',
          boxShadow: isOpen ? '0 0 0 1px var(--aws-interactive)' : undefined,
        }}
        className="w-full h-8 px-3 rounded-[4px] border flex items-center justify-between gap-2 cursor-pointer transition-colors outline-none disabled:opacity-50 disabled:cursor-not-allowed hover:border-[var(--aws-interactive)]"
      >
        <span className="flex items-center gap-2 truncate">
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
        />
      </button>

      {/* Floating Menu Popover with 120ms slide-and-fade */}
      {isOpen && (
        <div
          role="listbox"
          style={{
            backgroundColor: 'var(--aws-drawer-bg)',
            borderColor: 'var(--aws-border)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          }}
          className="absolute left-0 mt-1 w-full min-w-[200px] max-h-60 overflow-y-auto rounded-[4px] border py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-120"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                style={{
                  color: isSelected ? 'var(--aws-interactive)' : 'var(--aws-text-primary)',
                }}
                className={`relative px-3 py-1.5 flex items-center justify-between gap-2 cursor-pointer transition-colors text-[13px] hover:bg-[var(--aws-card-bg)] ${
                  isSelected ? 'font-semibold' : 'font-normal'
                }`}
              >
                {/* 2px left active indicator bar */}
                {isSelected && (
                  <span
                    style={{ backgroundColor: 'var(--aws-interactive)' }}
                    className="absolute left-0 top-1 bottom-1 w-[2px] rounded-r"
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
                  <Check className="w-3.5 h-3.5 shrink-0 text-[var(--aws-interactive)]" />
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
