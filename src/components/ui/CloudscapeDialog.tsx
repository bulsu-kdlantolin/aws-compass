import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';

interface CloudscapeDialogProps {
  title: string;
  description: React.ReactNode;
  primaryLabel: string;
  secondaryLabel?: string;
  tone?: 'default' | 'danger';
  onPrimary: () => void | Promise<void>;
  onDismiss: () => void;
}

export const CloudscapeDialog: React.FC<CloudscapeDialogProps> = ({
  title,
  description,
  primaryLabel,
  secondaryLabel = 'Cancel',
  tone = 'default',
  onPrimary,
  onDismiss,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const secondaryRef = useRef<HTMLButtonElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const dismissRef = useRef(onDismiss);
  const reducedMotion = useReducedMotion();
  dismissRef.current = onDismiss;

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    (secondaryRef.current ?? primaryRef.current)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dismissRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled)'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  return createPortal(
    <AnimatePresence>
      <m.div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/50 p-4 dark:bg-black/65"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.16 }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onDismiss();
        }}
      >
        <m.section
          ref={dialogRef}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className="w-full max-w-md rounded-xl border border-[var(--aws-border)] bg-[var(--aws-popover-bg)] p-5 text-[var(--aws-text-primary)] shadow-[0_20px_55px_-16px_rgba(0,0,0,0.55)]"
          initial={reducedMotion ? false : { opacity: 0, scale: 0.98, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 4 }}
          transition={{ duration: reducedMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 id={titleId} className="text-base font-semibold tracking-[-0.01em]">{title}</h2>
          <div id={descriptionId} className="mt-2 text-sm leading-6 text-[var(--aws-text-muted)]">{description}</div>
          <div className="mt-6 flex justify-end gap-2">
            {secondaryLabel && (
              <button
                ref={secondaryRef}
                type="button"
                onClick={onDismiss}
                className="h-9 rounded-md border border-[var(--aws-control-border)] px-3 text-sm font-medium text-[var(--aws-text-primary)] transition-colors hover:bg-[var(--aws-popover-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aws-interactive)]"
              >
                {secondaryLabel}
              </button>
            )}
            <button
              ref={primaryRef}
              type="button"
              onClick={() => void onPrimary()}
              className={`h-9 rounded-md px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aws-interactive)] ${tone === 'danger' ? 'bg-[#D13212] text-white hover:bg-[#B1270F]' : 'bg-[var(--aws-interactive)] text-white hover:bg-[var(--aws-interactive-hover)]'}`}
            >
              {primaryLabel}
            </button>
          </div>
        </m.section>
      </m.div>
    </AnimatePresence>,
    document.body,
  );
};

