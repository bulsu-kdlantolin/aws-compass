import React, { useRef, useId } from 'react';
import { Search, X } from 'lucide-react';
import { ClassicV2 } from './LoadingIndicators';

export interface CloudscapeSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  shortcut?: string;
  ariaLabel?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isLoading?: boolean;
}

export const CloudscapeSearchInput: React.FC<CloudscapeSearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  shortcut,
  ariaLabel = 'Search',
  autoFocus = false,
  disabled = false,
  className = '',
  size = 'md',
  onKeyDown,
  isLoading = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const clearButtonId = useId();

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const hasValue = value.trim().length > 0;
  const heightClass = size === 'sm' ? 'h-7' : 'h-8';
  const fontSizeClass = size === 'sm' ? 'text-[12px]' : 'text-[13px]';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div
      className={`relative flex items-center rounded-[6px] border border-[#D5DBDB] dark:border-[#2A3647] bg-[#F8F9FA] dark:bg-[#0F141A] px-2.5 transition-[border-color,box-shadow] duration-150 ease-out focus-within:border-[#0972D3] dark:focus-within:border-[#539FE5] focus-within:ring-1 focus-within:ring-[#0972D3] dark:focus-within:ring-[#539FE5] ${heightClass} ${disabled ? 'opacity-50 pointer-events-none' : ''
        } ${className}`}
    >
      {/* Leading Search Icon - perfectly centered */}
      <div className="flex items-center justify-center shrink-0 mr-2 pointer-events-none" aria-hidden="true">
        <Search
          className={`${iconSize} text-[#545B64] dark:text-[#879596] shrink-0`}
          strokeWidth={1.75}
        />
      </div>

      {/* Actual Input - full height and leading-normal for exact vertical baseline centering */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        spellCheck={false}
        autoComplete="off"
        aria-label={ariaLabel}
        style={{
          caretColor: 'var(--aws-interactive, #0972D3)',
        }}
        className={`w-full h-full bg-transparent flex-1 text-[#16191F] dark:text-[#EAEDED] placeholder:text-[#545B64] dark:placeholder:text-[#879596] outline-none border-none p-0 focus:ring-0 leading-normal ${fontSizeClass}`}
      />

      {/* Right Side Controls: Shortcut Badge, Filter Spinner, & Animated Clear (X) Button */}
      <div className="flex items-center shrink-0 ml-1.5 min-w-[20px] justify-end gap-1.5">
        {/* ClassicV2 indicator when filtering */}
        {isLoading && (
          <span
            className="flex items-center justify-center text-[#545B64] dark:text-[#879596] animate-in fade-in duration-150"
            aria-hidden="true"
          >
            <ClassicV2 size={14} color="#879596" />
          </span>
        )}

        {/* Keyboard Shortcut badge (when empty and not loading) */}
        {!hasValue && !isLoading && shortcut && (
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-[3px] border border-[#D5DBDB] dark:border-[#2A3647] bg-[#EAEDED] dark:bg-[#1E2B3D] text-[#545B64] dark:text-[#879596] select-none pointer-events-none shadow-xs">
            {shortcut}
          </kbd>
        )}

        {/* Clear (X) icon button with cubic-bezier cross-fade */}
        <button
          id={clearButtonId}
          type="button"
          tabIndex={hasValue ? 0 : -1}
          aria-hidden={!hasValue}
          onClick={handleClear}
          aria-label="Clear search input"
          className={`relative p-0.5 rounded-[4px] text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] hover:bg-[#EAEDED]/70 dark:hover:bg-[#1E2B3D] cursor-pointer enabled:active:scale-[0.96] transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.2,0,0,1)] flex items-center justify-center ${hasValue
              ? 'scale-100 opacity-100 pointer-events-auto'
              : 'scale-[0.5] opacity-0 pointer-events-none'
            }`}
        >
          <X className="size-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

export default CloudscapeSearchInput;
