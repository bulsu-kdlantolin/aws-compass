// src/components/ui/CloudscapeTabs.tsx
// Cloudscape-compliant underline tabs with physically sliding layoutId indicator

import React, { useId } from 'react';
import { m } from 'motion/react';
import { SPRING_SMOOTH } from '../../utils/motionTokens';

export interface CloudscapeTabItem<T extends string = string> {
  id: T;
  label: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
}

export interface CloudscapeTabsProps<T extends string = string> {
  tabs: CloudscapeTabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  className?: string;
  layoutId?: string;
}

export function CloudscapeTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = '',
  layoutId: externalLayoutId,
}: CloudscapeTabsProps<T>) {
  const autoId = useId();
  const layoutId = externalLayoutId || `tabs-${autoId}`;

  return (
    <div
      style={{ borderBottomColor: 'var(--aws-border)' }}
      className={`flex items-center border-b px-4 gap-6 select-none ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              color: isActive ? 'var(--aws-text-primary)' : 'var(--aws-text-muted)',
            }}
            className={`relative py-3 flex items-center gap-2 text-[14px] leading-[20px] cursor-pointer transition-colors outline-none hover:text-[var(--aws-text-primary)] ${isActive ? 'font-bold' : 'font-normal'
              }`}
          >
            {tab.icon && (
              <span className="w-4 h-4 shrink-0 flex items-center justify-center">
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.badge && <span>{tab.badge}</span>}

            {/* 3px active bottom indicator bar sliding with layoutId */}
            {isActive && (
                <m.span
                layoutId={layoutId}
                style={{ backgroundColor: 'var(--aws-interactive)' }}
                className="absolute left-0 right-0 -bottom-[1px] h-[3px] rounded-t-sm"
                transition={SPRING_SMOOTH}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default CloudscapeTabs;
