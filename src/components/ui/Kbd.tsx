import React, { useEffect, useState } from 'react';

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
}

export const Kbd: React.FC<KbdProps> = ({ children, className = '', ...props }) => {
  return (
    <kbd
      className={`inline-flex h-5 min-w-5 px-1.5 items-center justify-center rounded-[4px] border border-[#D5DBDB] dark:border-[#354150] bg-[#F8F9FA] dark:bg-[#0F141A] shadow-[0_1px_0_0_rgba(255,255,255,0.06)] font-mono text-[11px] text-[#545B64] dark:text-[#879596] select-none leading-none ${className}`}
      {...props}
    >
      {children}
    </kbd>
  );
};

export function useIsMac() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const platform = (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData?.platform || navigator.platform || navigator.userAgent || '';
      setIsMac(/Mac|iPod|iPhone|iPad/i.test(platform));
    }
  }, []);

  return isMac;
}

export interface ShortcutKeycapsProps {
  /**
   * Array of keys or chords. Use 'mod' for Cmd on Mac / Ctrl on Windows.
   * e.g. ['mod', 'K'] or ['mod', 'Shift', 'Z']
   */
  keys: string[];
  className?: string;
}

export const ShortcutKeycaps: React.FC<ShortcutKeycapsProps> = ({ keys, className = '' }) => {
  const isMac = useIsMac();

  const formatKey = (key: string) => {
    switch (key.toLowerCase()) {
      case 'mod':
        return isMac ? '⌘' : 'Ctrl';
      case 'shift':
        return isMac ? '⇧' : 'Shift';
      case 'alt':
        return isMac ? '⌥' : 'Alt';
      case 'ctrl':
      case 'control':
        return isMac ? '⌃' : 'Ctrl';
      case 'enter':
      case 'return':
        return isMac ? '↵' : 'Enter';
      case 'delete':
        return isMac ? '⌫' : 'Delete';
      case 'backspace':
        return isMac ? '⌫' : 'Backspace';
      case 'escape':
      case 'esc':
        return 'Esc';
      default:
        return key;
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {keys.map((k, index) => (
        <Kbd key={index}>{formatKey(k)}</Kbd>
      ))}
    </span>
  );
};

export default Kbd;

