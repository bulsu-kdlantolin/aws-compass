import React from 'react';

export interface CloudscapeContainerProps {
  header?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'stacked';
}

export const CloudscapeContainer: React.FC<CloudscapeContainerProps> = ({
  header,
  headerActions,
  children,
  footer,
  className = '',
}) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--aws-card-bg)',
        borderColor: 'var(--aws-border)',
      }}
      className={`rounded-[8px] border overflow-hidden shadow-xs transition-colors ${className}`}
    >
      {/* Top Header Band */}
      {header && (
        <div
          style={{
            borderBottomColor: 'var(--aws-border)',
          }}
          className="px-5 py-3 border-b flex items-center justify-between gap-4"
        >
          <div className="font-bold text-[16px] leading-[24px] text-[var(--aws-text-primary)]">
            {header}
          </div>
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      )}

      {/* Container Content Body */}
      <div className="p-5">{children}</div>

      {/* Container Footer */}
      {footer && (
        <div
          style={{
            borderTopColor: 'var(--aws-border)',
            backgroundColor: 'var(--aws-page-bg)',
          }}
          className="px-5 py-3 border-t text-[12px] text-[var(--aws-text-muted)]"
        >
          {footer}
        </div>
      )}
    </div>
  );
};

export default CloudscapeContainer;
