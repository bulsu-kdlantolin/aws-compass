import React, { useMemo } from 'react';
import { Terminal } from 'lucide-react';
import { CloudscapeCopyButton } from './CloudscapeCopyButton';
import { useSettingsStore } from '../../store/useSettingsStore';
import { highlightAwsCliLine } from './CodeFrame';

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
  const codeFontSize = useSettingsStore((s) => s.codeFontSize);

  const lines = useMemo(() => {
    const raw = code.replace(/\r\n/g, '\n').replace(/\n$/, '');
    return raw.split('\n');
  }, [code]);

  const isShell = language === 'bash' || language === 'sh' || language === 'shell' || language === 'cli' || title.includes('cli');

  return (
    <div
      style={{
        backgroundColor: 'var(--aws-code-bg, #0F141A)',
        borderColor: 'var(--aws-code-border, var(--aws-border))',
      }}
      className={`rounded-[4px] border border-[#D5DBDB] dark:border-[#242F3D] bg-[#F8F9FA] dark:bg-[#0F141A] overflow-hidden font-mono text-[12px] leading-[18px] my-3 select-text shadow-2xs ${className}`}
    >
      {/* Top Utility Bar (Strictly no macOS dots) */}
      <div
        style={{
          borderBottomColor: 'var(--aws-code-border, var(--aws-border))',
          backgroundColor: 'var(--aws-code-header-bg, #161E2D)',
        }}
        className="px-3 py-1.5 border-b border-[#D5DBDB] dark:border-[#242F3D] bg-[#EAEDED] dark:bg-[#161E2D] flex items-center justify-between text-[11px] select-none text-[#545B64] dark:text-[#879596]"
      >
        <div className="flex items-center gap-1.5 font-semibold text-[#16191F] dark:text-[#EAEDED]">
          <Terminal className="w-3.5 h-3.5 text-[#0972D3] dark:text-[#539FE5]" />
          <span>{title || language}</span>
        </div>

        <CloudscapeCopyButton
          textToCopy={code}
          label="Copy"
          copiedLabel="Copied"
          ariaLabel="Copy code to clipboard"
          className="!bg-transparent !border-transparent hover:!border-[#D5DBDB] dark:hover:!border-[#354150] hover:!bg-[#D5DBDB]/50 dark:hover:!bg-[#192534] !text-[#545B64] dark:!text-[#879596] hover:!text-[#16191F] dark:hover:!text-[#EAEDED]"
        />
      </div>

      {/* Code Text Content */}
      <pre
        style={{ fontSize: codeFontSize }}
        className="p-3 m-0 overflow-x-auto custom-scrollbar text-[#16191F] dark:text-[#EAEDED] bg-transparent leading-[20px]"
      >
        <code className="block min-w-full">
          {lines.map((line, idx) => (
            <div key={idx} className="whitespace-pre">
              {isShell ? highlightAwsCliLine(line) : line}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
};

export default CloudscapeCodeBlock;
