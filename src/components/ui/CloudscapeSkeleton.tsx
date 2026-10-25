import React from 'react';

export interface CloudscapeSkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: number | string;
  variant?: 'rect' | 'circle' | 'text';
  ariaLabel?: string;
}

export const CloudscapeSkeleton: React.FC<CloudscapeSkeletonProps> = ({
  className = '',
  width,
  height,
  borderRadius,
  variant = 'rect',
  ariaLabel = 'Loading content...',
}) => {
  const getRadius = () => {
    if (borderRadius !== undefined) return borderRadius;
    if (variant === 'circle') return '9999px';
    if (variant === 'text') return '3px';
    return '4px';
  };

  return (
    <div
      role="status"
      aria-busy="true"
      style={{
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : variant === 'text' ? '14px' : undefined,
        borderRadius: getRadius(),
      }}
      className={`cloudscape-skeleton relative overflow-hidden select-none shrink-0 ${className}`}
    >
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
};

export const CloudscapeAppSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-busy="true"
      style={{ backgroundColor: 'var(--aws-page-bg)' }}
      className="flex flex-col w-screen h-screen overflow-hidden select-none"
    >
      <span className="sr-only">Loading AWS Compass workspace...</span>

      {/* Header bar skeleton (48px) */}
      <div
        style={{
          backgroundColor: '#0F141A',
          borderBottomColor: '#354150',
        }}
        className="h-12 border-b px-4 flex items-center justify-between shrink-0"
      >
        <div className="flex items-center gap-3">
          <CloudscapeSkeleton width={24} height={24} borderRadius={4} />
          <CloudscapeSkeleton width={110} height={16} variant="text" />
        </div>
        <div className="flex items-center gap-2">
          <CloudscapeSkeleton width={180} height={32} borderRadius={4} />
          <CloudscapeSkeleton width={120} height={32} borderRadius={4} />
        </div>
        <div className="flex items-center gap-2">
          <CloudscapeSkeleton width={32} height={32} borderRadius={4} />
          <CloudscapeSkeleton width={32} height={32} borderRadius={4} />
        </div>
      </div>

      {/* Workspace body skeleton */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left catalog sidebar skeleton */}
        <div
          style={{
            backgroundColor: 'var(--aws-sidebar-bg)',
            borderRightColor: 'var(--aws-border)',
          }}
          className="w-72 border-r p-3 space-y-3 shrink-0 hidden md:block"
        >
          <CloudscapeSkeleton width="100%" height={32} borderRadius={4} />
          <div className="space-y-2 pt-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 h-7">
                <CloudscapeSkeleton width={20} height={20} borderRadius={2} />
                <CloudscapeSkeleton width={`${60 + (i % 4) * 10}%`} height={12} variant="text" />
              </div>
            ))}
          </div>
        </div>

        {/* Main area skeleton */}
        <div className="flex-1 p-6 space-y-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CloudscapeSkeleton width={220} height={22} variant="text" />
              <CloudscapeSkeleton width={320} height={14} variant="text" />
            </div>
            <CloudscapeSkeleton width={160} height={32} borderRadius={4} />
          </div>

          <div
            style={{
              backgroundColor: 'var(--aws-card-bg)',
              borderColor: 'var(--aws-border)',
            }}
            className="rounded-[8px] border p-4 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--aws-border)]">
              <CloudscapeSkeleton width={240} height={32} borderRadius={4} />
              <CloudscapeSkeleton width={100} height={16} variant="text" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-2 border-b border-[var(--aws-border)]/50">
                  <CloudscapeSkeleton width={24} height={24} borderRadius={2} />
                  <CloudscapeSkeleton width="25%" height={14} variant="text" />
                  <CloudscapeSkeleton width="15%" height={14} variant="text" />
                  <CloudscapeSkeleton width="15%" height={14} variant="text" />
                  <CloudscapeSkeleton width="30%" height={14} variant="text" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudscapeSkeleton;
