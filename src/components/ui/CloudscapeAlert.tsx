import React from 'react';
import { AlertTriangle, Info, CheckCircle2, AlertOctagon } from 'lucide-react';

export interface CloudscapeAlertProps {
  type?: 'warning' | 'info' | 'success' | 'error';
  header?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const CloudscapeAlert: React.FC<CloudscapeAlertProps> = ({
  type = 'warning',
  header,
  children,
  action,
  className = '',
}) => {
  const config = {
    warning: {
      borderColor: '#FF9900',
      bgColor: 'rgba(255, 153, 0, 0.08)',
      icon: <AlertTriangle className="w-4 h-4 text-[#FF9900] shrink-0 mt-0.5" />,
    },
    info: {
      borderColor: '#0972D3',
      bgColor: 'rgba(9, 114, 211, 0.08)',
      icon: <Info className="w-4 h-4 text-[#0972D3] shrink-0 mt-0.5" />,
    },
    success: {
      borderColor: '#1D8102',
      bgColor: 'rgba(29, 129, 2, 0.08)',
      icon: <CheckCircle2 className="w-4 h-4 text-[#1D8102] shrink-0 mt-0.5" />,
    },
    error: {
      borderColor: '#DD344C',
      bgColor: 'rgba(221, 52, 76, 0.08)',
      icon: <AlertOctagon className="w-4 h-4 text-[#DD344C] shrink-0 mt-0.5" />,
    },
  }[type];

  return (
    <div
      style={{
        backgroundColor: config.bgColor,
        borderLeftColor: config.borderColor,
        borderColor: 'var(--aws-border)',
      }}
      className={`rounded-r-[4px] border border-l-4 p-3.5 my-3 flex items-start gap-3 text-[14px] leading-[20px] text-[var(--aws-text-primary)] ${className}`}
    >
      {config.icon}
      <div className="flex-1 min-w-0">
        {header && <div className="font-bold text-[14px] mb-1">{header}</div>}
        <div className="text-[13px] leading-[18px] opacity-95">{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export default CloudscapeAlert;
