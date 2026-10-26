import React from 'react';
export {
  Compass,
  Blocks,
  Trace,
  Arc,
  Ring,
  Pulse,
  ClassicV2,
  Radar,
  LinearDots,
  type BlocksSweep,
  type BlocksProps,
  type TraceProps,
} from 'loading-dev';

export interface AccessibleLoadingProps {
  /** Screen reader announcement message */
  announcement?: string;
  /** Visible label text */
  text?: React.ReactNode;
  /** Loading indicator component instance */
  spinner?: React.ReactNode;
  /** Outer container CSS classes */
  className?: string;
  /** HTML role attribute (defaults to 'status') */
  role?: 'status' | 'alert';
}

/**
 * AccessibleLoading
 * 
 * Pairs a loading-dev visual indicator (which has aria-hidden="true") with a polite
 * non-focus-stealing screen reader announcement (<span role="status" className="sr-only">).
 */
export const AccessibleLoading: React.FC<AccessibleLoadingProps> = ({
  announcement,
  text,
  spinner,
  className = '',
  role = 'status',
}) => {
  const message = announcement || (typeof text === 'string' ? text : 'Loading, please wait…');

  return (
    <div
      role={role}
      aria-live="polite"
      aria-atomic="true"
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <span className="sr-only">{message}</span>
      {spinner}
      {text && <span aria-hidden="true">{text}</span>}
    </div>
  );
};

export default AccessibleLoading;
