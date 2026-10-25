import React from 'react';

export interface CloudscapeTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  spellCheck?: boolean;
}

export const CloudscapeTextarea: React.FC<CloudscapeTextareaProps> = ({
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled = false,
  className = '',
  ariaLabel,
  spellCheck = false,
}) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      disabled={disabled}
      spellCheck={spellCheck}
      aria-label={ariaLabel}
      style={{
        backgroundColor: 'var(--aws-page-bg)',
        borderColor: 'var(--aws-input-border)',
        color: 'var(--aws-text-primary)',
        caretColor: 'var(--aws-interactive)',
        overscrollBehavior: 'contain',
      }}
      className={`w-full font-mono text-[12px] leading-[18px] p-3 rounded-[4px] border outline-none resize-y transition-[border-color,box-shadow] duration-150 ease-out focus-visible:border-[var(--aws-interactive)] focus-visible:ring-2 focus-visible:ring-[var(--aws-interactive)]/40 focus:border-[var(--aws-interactive)] focus:ring-2 focus:ring-[var(--aws-interactive)]/40 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-[var(--aws-text-muted)] ${className}`}
    />
  );
};

export default CloudscapeTextarea;
