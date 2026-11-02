// src/components/ui/CloudscapeCopyButton.tsx
// Cloudscape-compliant copy button with AnimatedIcon spring physics

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { AnimatedIcon } from './AnimatedIcon';

export interface CloudscapeCopyButtonProps {
  textToCopy: string;
  label?: string;
  copiedLabel?: string;
  showLabel?: boolean;
  className?: string;
  ariaLabel?: string;
}

export const CloudscapeCopyButton: React.FC<CloudscapeCopyButtonProps> = ({
  textToCopy,
  label = 'Copy',
  copiedLabel = 'Copied',
  showLabel = true,
  className = '',
  ariaLabel = 'Copy to clipboard',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback or ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? copiedLabel : ariaLabel}
      title={copied ? copiedLabel : ariaLabel}
      className={`relative inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-sans font-medium rounded-[4px] border border-[var(--aws-border)] bg-[var(--aws-card-bg)] text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:border-[var(--aws-interactive)] cursor-pointer select-none enabled:active:scale-[0.96] transition-[border-color,color,transform] duration-150 ease-out after:absolute after:-inset-1.5 ${className}`}
    >
          <AnimatedIcon iconKey={copied ? 'copied' : 'idle'} size={14} className="w-3.5 h-3.5 shrink-0">
            {copied ? (
              <Check className="w-3.5 h-3.5 text-[#1D8102]" strokeWidth={2.25} />
          ) : (
          <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />
        )}
    </AnimatedIcon>

  {/* Label */ }
  {
    showLabel && (
      <span
        className={`transition-colors duration-150 ${copied ? 'text-[#1D8102] font-semibold' : ''
          }`}
      >
        {copied ? copiedLabel : label}
      </span>
    )
  }
    </button >
  );
};

export default CloudscapeCopyButton;
