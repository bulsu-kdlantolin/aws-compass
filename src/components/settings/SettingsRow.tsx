import React from 'react';

export interface SettingsRowProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  control: React.ReactNode;
  isSubRow?: boolean;
  className?: string;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  title,
  description,
  control,
  isSubRow = false,
  className = '',
}) => {
  if (isSubRow) {
    return (
      <div
        className={`flex items-center justify-between gap-6 py-2.5 px-3.5 my-1 ps-5 rounded-[8px] bg-[#F8F9FA]/70 dark:bg-[#0F141A]/40 border border-[#EAEDED] dark:border-[#222D3C] ${className}`}
      >
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-medium text-[#16191F] dark:text-[#EAEDED]">{title}</div>
          {description && (
            <div className="text-[11px] text-[#545B64] dark:text-[#879596] mt-0.5 leading-tight truncate">
              {description}
            </div>
          )}
        </div>
        <div className="shrink-0 flex items-center">{control}</div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between gap-8 py-3.5 border-b border-[#EAEDED] dark:border-[#222D3C] last:border-b-0 ${className}`}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-[#16191F] dark:text-[#EAEDED]">{title}</div>
        {description && (
          <div className="text-[12px] text-[#545B64] dark:text-[#879596] mt-0.5 leading-snug">
            {description}
          </div>
        )}
      </div>
      <div className="shrink-0 flex items-center">{control}</div>
    </div>
  );
};

export default SettingsRow;

