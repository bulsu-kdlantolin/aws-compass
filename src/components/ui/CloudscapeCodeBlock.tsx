import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

export interface CloudscapeCodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  className?: string;
}

export const CloudscapeCodeBlock: React.FC<CloudscapeCodeBlockProps> = ({
  code,
  language = 'bash',
  title = 'aws-cli',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        backgroundColor: '#0F141A',
        borderColor: 'var(--aws-border)',
      }}
      className={`rounded-[4px] border overflow-hidden font-mono text-[12px] leading-[18px] my-3 select-text ${className}`}
    >
      {/* Top Utility Bar (Strictly no macOS dots) */}
      <div
        style={{
          borderBottomColor: '#242f3d',
          backgroundColor: '#161E2D',
          color: '#879596',
        }}
        className="px-3 py-1.5 border-b flex items-center justify-between text-[11px] select-none"
      >
        <div className="flex items-center gap-1.5 font-semibold text-[#EAEDED]">
          <Terminal className="w-3.5 h-3.5 text-[#539FE5]" />
          <span>{title || language}</span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          style={{ color: '#879596' }}
          className="flex items-center gap-1 hover:text-[#EAEDED] cursor-pointer transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#1D8102]" />
              <span className="text-[#1D8102] font-semibold text-[11px]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Text Content */}
      <pre className="p-3 m-0 overflow-x-auto text-[#EAEDED] bg-transparent">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default CloudscapeCodeBlock;
