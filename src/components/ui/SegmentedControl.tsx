import React, { useRef } from 'react';

export interface SegmentedControlOption<T extends string | number> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  ariaLabel?: string;
}

export interface SegmentedControlProps<T extends string | number> {
  options: readonly SegmentedControlOption<T>[] | SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  ariaLabel?: string;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
  ariaLabel,
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = options.findIndex((opt) => opt.value === value);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % options.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + options.length) % options.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = options.length - 1;
    } else {
      return;
    }

    const nextOption = options[nextIndex];
    if (nextOption) {
      onChange(nextOption.value);
      // Focus the next button in the container
      const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('button[role="radio"]');
      buttons?.[nextIndex]?.focus();
    }
  };

  const isSm = size === 'sm';

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={`inline-flex items-center p-0.5 rounded-[8px] bg-[#EAEDED] dark:bg-[#0F141A] border border-[#D5DBDB]/60 dark:border-[#2A3647] select-none gap-0.5 ${
        isSm ? 'h-7 text-[11px]' : 'h-8 text-[12px]'
      } ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={option.ariaLabel || option.label}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={`h-full flex items-center justify-center gap-1.5 rounded-[6px] transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0972D3] dark:focus-visible:ring-[#539FE5] ${
              isSm ? 'px-2' : 'px-2.5'
            } ${
              isSelected
                ? 'bg-white dark:bg-[#1F2B3E] text-[#16191F] dark:text-white shadow-xs font-medium'
                : 'border-0 bg-transparent text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] font-normal'
            }`}
          >
            {option.icon && (
              <span className={`shrink-0 ${isSelected ? 'text-[#FF9900]' : 'text-current opacity-80'}`}>
                {option.icon}
              </span>
            )}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;

