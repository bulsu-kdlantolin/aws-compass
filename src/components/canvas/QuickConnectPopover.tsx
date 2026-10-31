import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, ArrowRight, Zap } from 'lucide-react';
import { useCompassStore } from '../../store/useCompassStore';
import type { AWSService, EdgeProtocol } from '../../types/aws';
import { AWSServiceIcon } from '../icons/AWSServiceIcon';

export interface QuickConnectPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  sourceNodeId: string;
  sourceNodeLabel: string;
  sourceServiceId?: string;
  sourceCategory?: string;
  sourceHandleId?: string | null;
  screenPosition: { x: number; y: number };
  flowPosition: { x: number; y: number };
  onSelectTarget: (
    service: AWSService,
    flowPosition: { x: number; y: number },
    protocol?: EdgeProtocol
  ) => void;
}

const TARGET_RECOMMENDATIONS: Record<
  string,
  { targetServiceId: string; defaultProtocol: EdgeProtocol }[]
> = {
  s3: [
    { targetServiceId: 'lambda', defaultProtocol: 'Event Trigger' },
    { targetServiceId: 'cloudfront', defaultProtocol: 'HTTPS/REST' },
    { targetServiceId: 'sns', defaultProtocol: 'Event Trigger' },
    { targetServiceId: 'sqs', defaultProtocol: 'Event Trigger' },
    { targetServiceId: 'kms', defaultProtocol: 'IAM Role Assumption' },
  ],
  apigateway: [
    { targetServiceId: 'lambda', defaultProtocol: 'HTTPS/REST' },
    { targetServiceId: 'ecs', defaultProtocol: 'VPC PrivateLink' },
    { targetServiceId: 'dynamodb', defaultProtocol: 'HTTPS/REST' },
    { targetServiceId: 'cognito', defaultProtocol: 'HTTPS/REST' },
    { targetServiceId: 'waf', defaultProtocol: 'HTTPS/REST' },
  ],
  lambda: [
    { targetServiceId: 'dynamodb', defaultProtocol: 'HTTPS/REST' },
    { targetServiceId: 'rds', defaultProtocol: 'SQL/TCP' },
    { targetServiceId: 'sqs', defaultProtocol: 'Event Trigger' },
    { targetServiceId: 'sns', defaultProtocol: 'Event Trigger' },
    { targetServiceId: 'secretsmanager', defaultProtocol: 'HTTPS/REST' },
  ],
  dynamodb: [
    { targetServiceId: 'lambda', defaultProtocol: 'Event Trigger' },
    { targetServiceId: 'kinesis', defaultProtocol: 'Event Trigger' },
    { targetServiceId: 'cloudwatch', defaultProtocol: 'HTTPS/REST' },
    { targetServiceId: 'kms', defaultProtocol: 'IAM Role Assumption' },
  ],
  cloudfront: [
    { targetServiceId: 's3', defaultProtocol: 'HTTPS/REST' },
    { targetServiceId: 'apigateway', defaultProtocol: 'HTTPS/REST' },
    { targetServiceId: 'alb', defaultProtocol: 'HTTPS/REST' },
    { targetServiceId: 'waf', defaultProtocol: 'HTTPS/REST' },
  ],
  ec2: [
    { targetServiceId: 'rds', defaultProtocol: 'SQL/TCP' },
    { targetServiceId: 'elasticache', defaultProtocol: 'SQL/TCP' },
    { targetServiceId: 's3', defaultProtocol: 'IAM Role Assumption' },
    { targetServiceId: 'cloudwatch', defaultProtocol: 'HTTPS/REST' },
    { targetServiceId: 'iam', defaultProtocol: 'IAM Role Assumption' },
  ],
  ecs: [
    { targetServiceId: 'rds', defaultProtocol: 'SQL/TCP' },
    { targetServiceId: 'elasticache', defaultProtocol: 'SQL/TCP' },
    { targetServiceId: 's3', defaultProtocol: 'IAM Role Assumption' },
    { targetServiceId: 'cloudwatch', defaultProtocol: 'HTTPS/REST' },
  ],
  rds: [
    { targetServiceId: 'secretsmanager', defaultProtocol: 'HTTPS/REST' },
    { targetServiceId: 'cloudwatch', defaultProtocol: 'HTTPS/REST' },
    { targetServiceId: 'kms', defaultProtocol: 'IAM Role Assumption' },
    { targetServiceId: 'ec2', defaultProtocol: 'SQL/TCP' },
  ],
  sqs: [
    { targetServiceId: 'lambda', defaultProtocol: 'Event Trigger' },
    { targetServiceId: 'ecs', defaultProtocol: 'SQL/TCP' },
    { targetServiceId: 'cloudwatch', defaultProtocol: 'HTTPS/REST' },
    { targetServiceId: 'sns', defaultProtocol: 'Event Trigger' },
  ],
  sns: [
    { targetServiceId: 'sqs', defaultProtocol: 'Event Trigger' },
    { targetServiceId: 'lambda', defaultProtocol: 'Event Trigger' },
  ],
  cognito: [
    { targetServiceId: 'apigateway', defaultProtocol: 'HTTPS/REST' },
    { targetServiceId: 'lambda', defaultProtocol: 'HTTPS/REST' },
    { targetServiceId: 'iam', defaultProtocol: 'IAM Role Assumption' },
  ],
};

const DEFAULT_RECOMMENDATIONS: { targetServiceId: string; defaultProtocol: EdgeProtocol }[] = [
  { targetServiceId: 'lambda', defaultProtocol: 'HTTPS/REST' },
  { targetServiceId: 's3', defaultProtocol: 'HTTPS/REST' },
  { targetServiceId: 'dynamodb', defaultProtocol: 'HTTPS/REST' },
  { targetServiceId: 'rds', defaultProtocol: 'SQL/TCP' },
  { targetServiceId: 'sqs', defaultProtocol: 'Event Trigger' },
];

export const QuickConnectPopover: React.FC<QuickConnectPopoverProps> = ({
  isOpen,
  onClose,
  sourceNodeLabel,
  sourceServiceId,
  screenPosition,
  flowPosition,
  onSelectTarget,
}) => {
  const services = useCompassStore((s) => s.services);
  const [search, setSearch] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Recommended downstream services
  const recommendedTargets = useMemo(() => {
    const rawList = sourceServiceId && TARGET_RECOMMENDATIONS[sourceServiceId.toLowerCase()]
      ? TARGET_RECOMMENDATIONS[sourceServiceId.toLowerCase()]
      : DEFAULT_RECOMMENDATIONS;

    return rawList
      .map((item) => {
        const found = services.find((s) => s.id === item.targetServiceId);
        if (!found) return null;
        return {
          service: found,
          protocol: item.defaultProtocol,
        };
      })
      .filter(Boolean) as { service: AWSService; protocol: EdgeProtocol }[];
  }, [sourceServiceId, services]);

  // Filtered search results
  const filteredServices = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase().trim();
    return services
      .filter((s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.category.toLowerCase().includes(q))
      .slice(0, 10);
  }, [services, search]);

  if (!isOpen || typeof document === 'undefined') return null;

  // Viewport-aware positioning
  const popoverWidth = 320;
  const popoverHeight = 360;
  const padding = 16;

  let left = screenPosition.x;
  let top = screenPosition.y;

  if (left + popoverWidth > window.innerWidth - padding) {
    left = window.innerWidth - popoverWidth - padding;
  }
  if (left < padding) {
    left = padding;
  }

  if (top + popoverHeight > window.innerHeight - padding) {
    top = window.innerHeight - popoverHeight - padding;
  }
  if (top < padding) {
    top = padding;
  }

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        left: `${left}px`,
        top: `${top}px`,
        backgroundColor: 'var(--aws-popover-bg)',
        borderColor: 'var(--aws-border)',
      }}
      className="fixed z-[99999] w-[320px] rounded-[8px] border shadow-2xl p-0 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      {/* Header Bar */}
      <div
        style={{
          backgroundColor: 'var(--aws-card-bg)',
          borderBottomColor: 'var(--aws-border)',
        }}
        className="px-3 py-2 border-b flex items-center justify-between"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Zap className="w-3.5 h-3.5 text-[#FF9900] shrink-0" />
          <span
            style={{ color: 'var(--aws-text-primary)' }}
            className="text-[12px] font-bold truncate"
          >
            Connect from {sourceNodeLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-[4px] text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] transition-colors cursor-pointer"
          title="Close (Esc)"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Search Input */}
      <div
        style={{ borderBottomColor: 'var(--aws-border)' }}
        className="p-2 border-b bg-[var(--aws-page-bg)]"
      >
          <div className="h-7 px-2.5 rounded-[4px] border border-[var(--aws-border)] bg-[var(--aws-card-bg)] focus-within:border-[var(--aws-interactive)] flex items-center gap-2">
            <div className="flex items-center justify-center shrink-0 pointer-events-none" aria-hidden="true">
              <Search className="w-3.5 h-3.5 text-[var(--aws-text-muted)]" strokeWidth={1.75} />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search downstream service target..."
              className="w-full h-full bg-transparent flex-1 text-[12px] text-[var(--aws-text-primary)] placeholder:text-[var(--aws-text-muted)] focus:outline-none font-sans leading-normal self-center p-0 border-none"
            />
          </div>
        </div>

        {/* Scrollable Target List */}
        <div className="flex-1 max-h-[260px] overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
          {search.trim() ? (
            // Search Results
            filteredServices.length > 0 ? (
              filteredServices.map((svc) => (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => {
                    onSelectTarget(svc, flowPosition, 'HTTPS/REST');
                    onClose();
                  }}
                  className="w-full px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--aws-popover-hover)] flex items-center justify-between group transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <AWSServiceIcon serviceId={svc.id} size={22} className="shrink-0" />
                    <div className="min-w-0">
                      <span
                        style={{ color: 'var(--aws-text-primary)' }}
                        className="text-[12px] font-medium block truncate group-hover:text-[var(--aws-interactive)]"
                      >
                        {svc.name}
                      </span>
                      <span className="text-[10px] text-[var(--aws-text-muted)] font-mono">
                        {svc.category} · aws {svc.id}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--aws-text-muted)] group-hover:text-[var(--aws-interactive)] group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-[12px] text-[var(--aws-text-muted)]">
                No matching AWS services found
              </div>
            )
          ) : (
            // Recommended Targets
            <>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--aws-text-muted)]">
                Recommended Targets
              </div>
              {recommendedTargets.map(({ service: svc, protocol }) => (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => {
                    onSelectTarget(svc, flowPosition, protocol);
                    onClose();
                  }}
                  className="w-full px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--aws-popover-hover)] flex items-center justify-between group transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <AWSServiceIcon serviceId={svc.id} size={22} className="shrink-0" />
                    <div className="min-w-0">
                      <span
                        style={{ color: 'var(--aws-text-primary)' }}
                        className="text-[12px] font-medium block truncate group-hover:text-[var(--aws-interactive)]"
                      >
                        {svc.name}
                      </span>
                      <span className="text-[10px] text-[#FF9900] font-mono">
                        {protocol}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--aws-text-muted)] group-hover:text-[var(--aws-interactive)] group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              ))}
            </>
          )}
        </div>

        {/* Footer Hint */}
        <div
          style={{
            borderTopColor: 'var(--aws-border)',
            backgroundColor: 'var(--aws-page-bg)',
          }}
          className="px-3 py-1.5 border-t text-[10px] text-[var(--aws-text-muted)] flex items-center justify-between"
        >
          <span>Spawns node & wires edge</span>
          <kbd className="px-1 py-0.5 rounded border border-[var(--aws-border)] font-mono text-[9px]">
            ESC
          </kbd>
        </div>
      </div>,
      document.body
      );
};

      export default QuickConnectPopover;
