import React from 'react';
import type { StudyStatus } from '../../types/aws';
import { useCompassStore } from '../../store/useCompassStore';

export interface CloudscapeStatusIndicatorProps {
  status: StudyStatus;
  showLabel?: boolean;
  className?: string;
}

export const CloudscapeStatusIndicator: React.FC<CloudscapeStatusIndicatorProps> = ({
  status,
  showLabel = true,
  className = '',
}) => {
  const theme = useCompassStore((s) => s.theme);

  const config = {
    mastered: {
      label: 'Mastered',
      color: '#1D8102',
      icon: (
        <svg
          viewBox="0 0 16 16"
          width="14"
          height="14"
          fill="none"
          stroke="#1D8102"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <circle cx="8" cy="8" r="6.5" />
          <polyline points="5.5 8.2 7.2 10 10.8 6.5" />
        </svg>
      ),
    },
    'in-progress': {
      label: 'In progress',
      color: theme === 'dark' ? '#539FE5' : '#0972D3',
      icon: (
        <svg
          viewBox="0 0 16 16"
          width="14"
          height="14"
          fill="none"
          stroke={theme === 'dark' ? '#539FE5' : '#0972D3'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <circle cx="8" cy="8" r="6.5" />
          <polyline points="8 4.5 8 8 10.5 9.5" />
        </svg>
      ),
    },
    'not-started': {
      label: 'Not started',
      color: theme === 'dark' ? '#879596' : '#545B64',
      icon: (
        <svg
          viewBox="0 0 16 16"
          width="14"
          height="14"
          fill="none"
          stroke={theme === 'dark' ? '#879596' : '#545B64'}
          strokeWidth="1.75"
          strokeDasharray="2.5 2"
          className="shrink-0"
        >
          <circle cx="8" cy="8" r="6.5" />
        </svg>
      ),
    },
    review: {
      label: 'Review needed',
      color: '#FF9900',
      icon: (
        <svg
          viewBox="0 0 16 16"
          width="14"
          height="14"
          fill="none"
          stroke="#FF9900"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <circle cx="8" cy="8" r="6.5" />
          <line x1="8" y1="5.5" x2="8" y2="8.5" />
          <circle cx="8" cy="11" r="0.75" fill="#FF9900" />
        </svg>
      ),
    },
  }[status] || {
    label: 'Not started',
    color: '#879596',
    icon: null,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[12px] leading-[16px] font-normal select-none ${className}`}
      style={{ color: 'var(--aws-text-primary)' }}
      title={`Study status: ${config.label}`}
    >
      {config.icon}
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};

export default CloudscapeStatusIndicator;
