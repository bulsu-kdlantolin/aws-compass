import React, { useMemo } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';
import { AnimatedIcon } from './AnimatedIcon';
import { useSettingsStore } from '../../store/useSettingsStore';

export interface CodeFrameProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
  className?: string;
  highlightLines?: number[];
}

/**
 * Syntax highlighter for AWS CLI and shell commands
 */
export function highlightAwsCliLine(line: string): React.ReactNode {
  if (!line.trim()) {
    return <span>&nbsp;</span>;
  }

  // Comments
  if (line.trim().startsWith('#')) {
    return <span className="text-[#545B64] dark:text-[#879596] italic">{line}</span>;
  }

  // Tokenize line by whitespace and quotes
  const tokens = line.split(/(\s+|"[^"]*"|'[^']*'|--[a-zA-Z0-9_-]+|-\w)/g).filter(Boolean);

  return (
    <>
      {tokens.map((token, idx) => {
        if (/^\s+$/.test(token)) {
          return <span key={idx}>{token}</span>;
        }

        // aws CLI root command
        if (token === 'aws') {
          return (
            <span key={idx} className="text-[#D47600] dark:text-[#FF9900] font-bold">
              {token}
            </span>
          );
        }

        // CLI flags: --region, --output, etc.
        if (token.startsWith('-')) {
          return (
            <span key={idx} className="text-[#0972D3] dark:text-[#539FE5] font-medium">
              {token}
            </span>
          );
        }

        // Strings with quotes
        if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
          return (
            <span key={idx} className="text-[#037F51] dark:text-[#38D9A9]">
              {token}
            </span>
          );
        }

        // Common subcommands (s3, ec2, lambda, etc.)
        if (idx <= 3 && /^[a-z0-9_-]+$/i.test(token) && token !== 'aws') {
          return (
            <span key={idx} className="text-[#BA5D00] dark:text-[#ED7100]">
              {token}
            </span>
          );
        }

        // ARN patterns in code
        if (token.startsWith('arn:aws:')) {
          return (
            <span key={idx} className="text-[#6B21A8] dark:text-[#8C4FFF] underline decoration-dotted">
              {token}
            </span>
          );
        }

        return (
          <span key={idx} className="text-[#16191F] dark:text-[#EAEDED]">
            {token}
          </span>
        );
      })}
    </>
  );
}

export const CodeFrame: React.FC<CodeFrameProps> = ({
  code,
  language = 'bash',
  title = 'aws-cli',
  showLineNumbers = true,
  className = '',
  highlightLines = [],
}) => {
  const codeFontSize = useSettingsStore((s) => s.codeFontSize);
  const [copied, setCopied] = React.useState(false);

  const lines = useMemo(() => {
    const raw = code.replace(/\r\n/g, '\n').replace(/\n$/, '');
    return raw.split('\n');
  }, [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const isShell = language === 'bash' || language === 'sh' || language === 'shell' || title.includes('cli');

  return (
    <div
      style={{
        backgroundColor: 'var(--aws-code-bg, #0F141A)',
        borderColor: 'var(--aws-code-border, #242F3D)',
      }}
      className={`rounded-[6px] border border-[#D5DBDB] dark:border-[#242F3D] bg-[#F8F9FA] dark:bg-[#0F141A] overflow-hidden font-mono text-[12px] leading-[20px] my-3 select-text shadow-2xs ${className}`}
    >
      {/* Top Utility Header */}
      <div
        style={{
          borderBottomColor: 'var(--aws-code-border, #242F3D)',
          backgroundColor: 'var(--aws-code-header-bg, #161E2D)',
          color: 'var(--aws-code-muted, #879596)',
        }}
        className="px-3.5 py-1.5 border-b border-[#D5DBDB] dark:border-[#242F3D] bg-[#EAEDED] dark:bg-[#161E2D] flex items-center justify-between text-[11px] select-none text-[#545B64] dark:text-[#879596]"
      >
        <div className="flex items-center gap-2 font-medium text-[#16191F] dark:text-[#EAEDED]">
          <Terminal className="w-3.5 h-3.5 text-[#0972D3] dark:text-[#539FE5]" />
          <span>{title || language}</span>
        </div>

        {/* Animated Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'Copied code' : 'Copy code to clipboard'}
          title={copied ? 'Copied to clipboard' : 'Copy code'}
          className={`relative inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-sans font-medium rounded-[4px] border transition-all duration-150 cursor-pointer enabled:active:scale-[0.96] ${copied
            ? 'border-[#1D8102]/60 bg-[#1D8102]/15 text-[#1D8102] dark:text-[#38D9A9]'
            : 'border-transparent hover:border-[#D5DBDB] dark:hover:border-[#354150] hover:bg-[#D5DBDB]/50 dark:hover:bg-[#1E2B3D] text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED]'
            }`}
        >
          <AnimatedIcon iconKey={copied ? 'copied' : 'idle'} size={14} className="size-3.5">
            {copied ? (
              <Check className="size-3.5 text-[#1D8102] dark:text-[#38D9A9]" strokeWidth={2.5} />
            ) : (
              <Copy className="size-3.5" strokeWidth={1.75} />
            )}
          </AnimatedIcon>
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Numbered Code Body */}
      <pre
        style={{ fontSize: codeFontSize }}
        className="p-3 m-0 overflow-x-auto custom-scrollbar bg-transparent text-[#16191F] dark:text-[#EAEDED] leading-[20px]"
      >
        <code className="block min-w-full">
          {lines.map((line, idx) => {
            const lineNum = idx + 1;
            const isHighlighted = highlightLines.includes(lineNum);

            return (
              <div
                key={idx}
                className={`flex items-start group/line ${isHighlighted ? 'bg-[#0972D3]/10 dark:bg-[#539FE5]/10 -mx-3 px-3' : ''
                  }`}
              >
                {showLineNumbers && (
                  <span
                    aria-hidden="true"
                    className="w-7 shrink-0 text-right pr-3 select-none text-[11px] text-[#7D8998] dark:text-[#545B64] group-hover/line:text-[#16191F] dark:group-hover/line:text-[#879596] tabular-nums font-mono opacity-80"
                  >
                    {lineNum}
                  </span>
                )}
                <span className="flex-1 whitespace-pre">
                  {isShell ? highlightAwsCliLine(line) : line}
                </span>
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
};

export default CodeFrame;

