import React from 'react';
import { Terminal } from 'lucide-react';
import { CloudscapeCopyButton } from './CloudscapeCopyButton';

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

        <CloudscapeCopyButton
          textToCopy={code}
          label="Copy"
          copiedLabel="Copied"
          ariaLabel="Copy code to clipboard"
          className="!bg-transparent !border-transparent hover:!border-[#354150] hover:!bg-[#192534] !text-[#879596] hover:!text-[#EAEDED]"
        />
      </div>

      {/* Code Text Content */}
      <pre className="p-3 m-0 overflow-x-auto custom-scrollbar text-[#EAEDED] bg-transparent">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default CloudscapeCodeBlock;
