import React, { useId } from 'react';
import { Check } from 'lucide-react';

export interface CloudscapeCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export const CloudscapeCheckbox: React.FC<CloudscapeCheckboxProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
  ariaLabel,
}) => {
  const id = useId();

  const layer =
    '[grid-area:1/1] transition-[opacity,filter,scale] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:scale-100 motion-reduce:blur-[0px]';
  const shown = 'scale-100 opacity-100 blur-[0px]';
  const hidden = 'scale-[0.25] opacity-0 blur-[4px] pointer-events-none';

  return (
    <label
      htmlFor={id}
      className={`relative inline-flex items-start gap-2.5 select-none cursor-pointer group ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {/* Hidden real input for accessibility & form participation */}
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={typeof label === 'string' ? undefined : ariaLabel}
        className="sr-only"
      />

      {/* Styled Box with 32x32px hit target extension & press scale */}
      <span
        style={{
          borderColor: checked ? 'var(--aws-interactive)' : 'var(--aws-input-border)',
          backgroundColor: checked ? 'var(--aws-interactive)' : 'var(--aws-page-bg)',
        }}
        className="relative mt-0.5 w-4 h-4 rounded-[3px] border grid place-items-center shrink-0 transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out group-hover:border-[var(--aws-interactive)] group-focus-within:ring-2 group-focus-within:ring-[var(--aws-interactive)]/40 enabled:active:scale-[0.96] after:absolute after:-inset-2 after:content-['']"
      >
        <span className="grid place-items-center w-3 h-3 text-white">
          <span className={`${layer} ${checked ? shown : hidden}`}>
            <Check className="w-3 h-3 text-[#0F141A] dark:text-[#0F141A]" strokeWidth={3} />
          </span>
        </span>
      </span>

      {/* Label and optional description */}
      {label && (
        <span className="text-[13px] leading-[18px] text-[var(--aws-text-primary)]">
          <span className="font-medium block">{label}</span>
          {description && (
            <span className="text-[11px] text-[var(--aws-text-muted)] block mt-0.5">
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  );
};

export default CloudscapeCheckbox;
