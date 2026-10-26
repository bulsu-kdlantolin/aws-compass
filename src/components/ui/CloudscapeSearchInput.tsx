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
  const heightClass = size === 'sm' ? 'h-7 text-[12px]' : 'h-8 text-[13px]';

  return (
    <div
      style={{
        backgroundColor: 'var(--aws-page-bg)',
      }}
      className={`relative flex items-center rounded-[4px] border border-[var(--aws-input-border)] px-2.5 transition-[border-color,box-shadow] duration-150 ease-out focus-within:border-[var(--aws-interactive)] focus-within:ring-2 focus-within:ring-[var(--aws-interactive)]/40 focus-within:shadow-xs ${heightClass} ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      } ${className}`}
    >
      {/* Bare 16px Leading Search Icon */}
      <Search
        className="w-4 h-4 text-[var(--aws-text-muted)] shrink-0 mr-2 pointer-events-none"
        strokeWidth={1.75}
        aria-hidden="true"
      />

      {/* Actual Input */}
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
          caretColor: 'var(--aws-interactive)',
          color: 'var(--aws-text-primary)',
        }}
        className="w-full bg-transparent leading-[20px] placeholder:text-[var(--aws-text-muted)] outline-none border-none p-0 focus:ring-0"
      />

      {/* Right Side Controls: Shortcut Badge, Filter Spinner, & Animated Clear (X) Button */}
      <div className="flex items-center shrink-0 ml-1.5 min-w-[20px] justify-end gap-1.5">
        {/* ClassicV2 indicator when filtering */}
        {isLoading && (
          <span
            className="flex items-center justify-center text-[var(--aws-text-muted)] animate-in fade-in duration-150"
            aria-hidden="true"
          >
            <ClassicV2 size={14} color="var(--aws-text-muted)" />
          </span>
        )}

        {/* Keyboard Shortcut badge (when empty and not loading) */}
        {!hasValue && !isLoading && shortcut && (
          <kbd
            style={{
              backgroundColor: 'var(--aws-card-bg)',
              borderColor: 'var(--aws-border)',
              color: 'var(--aws-text-muted)',
            }}
            className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-[3px] border select-none pointer-events-none shadow-xs"
          >
            {shortcut}
          </kbd>
        )}

        {/* Clear (X) icon button with better-ui cubic-bezier cross-fade */}
        <button
          id={clearButtonId}
          type="button"
          tabIndex={hasValue ? 0 : -1}
          aria-hidden={!hasValue}
          onClick={handleClear}
          aria-label="Clear search input"
          className={`relative p-0.5 rounded-[3px] text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-card-bg)] cursor-pointer enabled:active:scale-[0.96] after:absolute after:-inset-1.5 transition-[opacity,filter,scale] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:scale-100 motion-reduce:blur-[0px] ${
            hasValue
              ? 'scale-100 opacity-100 blur-0 pointer-events-auto'
              : 'scale-[0.25] opacity-0 blur-[4px] pointer-events-none'
          }`}
        >
          <X className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

export default CloudscapeSearchInput;
