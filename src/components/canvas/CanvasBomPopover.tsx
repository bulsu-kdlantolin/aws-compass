// src/components/canvas/CanvasBomPopover.tsx
// Unified Architecture Bill of Materials (BOM) & FinOps Cost Estimator Popover.
// Provides real-time monthly AWS cost projections, workload T-shirt sizing, and cost optimization insights.

import React, { useMemo, useState } from 'react';
import {
  Copy,
  Check,
  FileSpreadsheet,
  X,
  Lightbulb,
} from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { AnimatedPopover } from '../ui/AnimatedPopover';
import { AnimatedIcon } from '../ui/AnimatedIcon';
import { AWSServiceIcon } from '../icons/AWSServiceIcon';
import { SegmentedControl, type SegmentedControlOption } from '../ui/SegmentedControl';
import {
  estimateArchitectureCost,
  exportBomAndCostToMarkdown,
  type WorkloadTier,
} from '../../utils/costEstimator';

export interface CanvasBomPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const WORKLOAD_OPTIONS: SegmentedControlOption<WorkloadTier>[] = [
  { value: 'small', label: 'Small · Dev', ariaLabel: 'Small Dev / Prototype' },
  { value: 'medium', label: 'Medium · Prod', ariaLabel: 'Medium Production Startup' },
  { value: 'large', label: 'Large · Scale', ariaLabel: 'Large High Scale Enterprise' },
];

export const CanvasBomPopover: React.FC<CanvasBomPopoverProps> = ({
  isOpen,
  onClose,
  triggerRef,
}) => {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const activeDiagramName = useCanvasStore((s) => s.activeDiagramName);
  const canvasWorkloadTier = useCanvasStore((s) => s.canvasWorkloadTier);
  const setCanvasWorkloadTier = useCanvasStore((s) => s.setCanvasWorkloadTier);

  const [copied, setCopied] = useState(false);

  // Separate service nodes, boundary containers, and external actors
  const { boundaryNodes } = useMemo(() => {
    const boundaries = nodes.filter((n) => n.data?.isBoundary);
    const actors = nodes.filter((n) => n.data?.isExternalActor);
    return { boundaryNodes: boundaries, actorNodes: actors };
  }, [nodes]);

  // Compute live FinOps cost estimation across active diagram
  const costEstimate = useMemo(() => {
    return estimateArchitectureCost(nodes, edges, canvasWorkloadTier);
  }, [nodes, edges, canvasWorkloadTier]);

  const handleCopyMarkdown = async () => {
    try {
      const md = exportBomAndCostToMarkdown(
        activeDiagramName,
        costEstimate,
        boundaryNodes,
        edges
      );
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <AnimatedPopover
      isOpen={isOpen}
      onClose={onClose}
      triggerRef={triggerRef}
      align="right"
      className="p-1.5 overflow-hidden w-[420px] rounded-[14px] shadow-2xl"
    >
      <div
        style={{
          backgroundColor: 'var(--aws-popover-bg)',
          borderColor: 'var(--aws-border)',
        }}
        className="flex flex-col max-h-[580px] rounded-[10px] overflow-hidden select-none text-[12px] text-[#16191F] dark:text-[#EAEDED]"
      >
        {/* Header Bar */}
        <div
          style={{
            backgroundColor: 'var(--aws-card-bg)',
            borderBottomColor: 'var(--aws-border)',
          }}
          className="px-4 py-2.5 border-b flex items-center justify-between shrink-0"
        >
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-[4px] bg-[#FF9900]/10 text-[#FF9900]">
              <FileSpreadsheet className="w-4 h-4" strokeWidth={2} />
            </span>
            <div>
              <span className="font-bold text-[13px] block leading-tight text-[#16191F] dark:text-[#EAEDED]">
                BOM & Cost Estimator
              </span>
              <span className="text-[10px] text-[#545B64] dark:text-[#879596] font-mono truncate max-w-[190px] block">
                {activeDiagramName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border text-[11px] font-semibold transition-all cursor-pointer select-none enabled:active:scale-[0.96] ${
                copied
                  ? 'bg-[#1D8102]/15 text-[#1D8102] dark:text-[#38D9A9] border-[#1D8102]/40'
                  : 'bg-[var(--aws-card-bg)] text-[#16191F] dark:text-[#EAEDED] border-[#D5DBDB] dark:border-[#354150] hover:border-[#FF9900] hover:text-[#FF9900]'
              }`}
              title="Copy Bill of Materials & Cost breakdown as Markdown table"
              aria-label="Copy BOM and cost Markdown"
            >
              <AnimatedIcon activeKey={copied ? 'copied' : 'idle'} size={12}>
                {copied ? (
                  <Check className="w-3 h-3 text-[#1D8102] dark:text-[#38D9A9]" />
                ) : (
                  <Copy className="w-3 h-3 text-current" />
                )}
              </AnimatedIcon>
              <span>{copied ? 'Copied' : 'Copy Table'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-[4px] text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-white hover:bg-[#EAEDED] dark:hover:bg-white/[0.07] transition-colors cursor-pointer"
              title="Close BOM popover"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 1. Global Workload Sizing T-Shirt Switcher */}
        <div className="px-4 py-2.5 bg-[#F8F9FA] dark:bg-[#0F141A] border-b border-[#EAEDED] dark:border-[#222D3C] flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] font-medium text-[#545B64] dark:text-[#879596] whitespace-nowrap">
            Workload sizing
          </span>
          <div className="w-64 shrink-0">
            <SegmentedControl<WorkloadTier>
              value={canvasWorkloadTier}
              options={WORKLOAD_OPTIONS}
              onChange={(val) => setCanvasWorkloadTier(val)}
              size="sm"
              groupId="global-workload-sizing"
              ariaLabel="Global workload sizing tier"
            />
          </div>
        </div>

        {/* 2. Total Estimated Cost & Fixed vs Usage Bar */}
        <div className="px-4 py-3 bg-white dark:bg-[#141C28] border-b border-[#EAEDED] dark:border-[#222D3C] shrink-0">
          <div className="flex items-baseline justify-between mb-1.5">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#545B64] dark:text-[#879596] block">
                Estimated Monthly Baseline
              </span>
              <span className="text-[20px] font-bold font-mono tracking-tight text-[#FF9900] tabular-nums">
                ~${costEstimate.totalMonthlyCost.toLocaleString()}
                <span className="text-[12px] font-normal text-[#545B64] dark:text-[#879596] ml-1">/mo</span>
              </span>
            </div>
            <div className="text-right font-mono text-[11px] tabular-nums text-[#545B64] dark:text-[#879596]">
              <span>{costEstimate.nodeEstimates.length} active resources</span>
            </div>
          </div>

          {/* Slim 6px Stacked Fixed vs Usage Bar */}
          <div className="h-1.5 w-full rounded-full bg-[#EAEDED] dark:bg-[#222D3C] overflow-hidden flex my-2">
            <div
              style={{ width: `${costEstimate.fixedPercentage}%` }}
              className="h-full bg-[#0972D3] dark:bg-[#539FE5] transition-all duration-300"
              title={`Fixed Baseline: ~$${costEstimate.fixedBaselineCost}/mo (${costEstimate.fixedPercentage}%)`}
            />
            <div
              style={{ width: `${costEstimate.usagePercentage}%` }}
              className="h-full bg-[#FF9900] transition-all duration-300"
              title={`Variable Usage: ~$${costEstimate.usageBasedCost}/mo (${costEstimate.usagePercentage}%)`}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-[#545B64] dark:text-[#879596]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#0972D3] dark:bg-[#539FE5]" aria-hidden="true" />
              <span>Fixed: ~${costEstimate.fixedBaselineCost}/mo ({costEstimate.fixedPercentage}%)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#FF9900]" aria-hidden="true" />
              <span>Usage: ~${costEstimate.usageBasedCost}/mo ({costEstimate.usagePercentage}%)</span>
            </span>
          </div>
        </div>

        {/* 3. Cost Optimization Insights Tip Strip (if applicable) */}
        {costEstimate.insights.length > 0 && (
          <div className="p-3 bg-[#F8F9FA] dark:bg-[#0F141A] border-b border-[#EAEDED] dark:border-[#222D3C] shrink-0 space-y-2">
            {costEstimate.insights.slice(0, 2).map((insight) => (
              <div
                key={insight.id}
                className="flex items-start gap-2 p-2 rounded-[6px] border border-[#0972D3]/30 bg-[#0972D3]/5 text-[11px]"
              >
                <Lightbulb className="w-3.5 h-3.5 text-[#0972D3] dark:text-[#539FE5] shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 leading-[1.35]">
                  <span className="font-semibold text-[#16191F] dark:text-[#EAEDED] block">
                    {insight.title}
                  </span>
                  <span className="text-[#545B64] dark:text-[#879596] block mt-0.5">
                    {insight.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. Itemized Resource & Cost List */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin custom-scrollbar divide-y divide-[#EAEDED] dark:divide-[#222D3C]">
          {costEstimate.nodeEstimates.length === 0 ? (
            <div className="py-8 text-center text-[#545B64] dark:text-[#879596] text-[12px]">
              No service nodes on canvas yet.
            </div>
          ) : (
            costEstimate.nodeEstimates.map((item) => (
              <div
                key={item.nodeId}
                className="h-9 px-2 flex items-center justify-between text-[12px] tabular-nums hover:bg-[#EAEDED]/50 dark:hover:bg-white/[0.04] transition-colors rounded-[4px]"
              >
                {/* Left: Icon + Title + Sizing Badge */}
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <AWSServiceIcon serviceId={item.serviceId} size={18} className="shrink-0" />
                  <span className="font-medium text-[#16191F] dark:text-[#EAEDED] truncate max-w-[170px] block">
                    {item.serviceName}
                  </span>
                  <span className="text-[10px] font-mono text-[#879596] bg-black/5 dark:bg-white/5 px-1 py-0.2 rounded shrink-0">
                    {item.effectiveTier === 'free' ? 'Free' : item.effectiveTier[0].toUpperCase()}
                    {item.isMultiAz ? ' · Multi-AZ' : item.isInsideAsg ? ' · ASG' : ''}
                  </span>
                </div>

                {/* Right: Cost + % of Total */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-medium text-[#16191F] dark:text-[#EAEDED]">
                    ${item.monthlyCost}
                    <span className="text-[10px] text-[#879596]">/mo</span>
                  </span>
                  <span className="font-mono text-[11px] text-[#879596] w-9 text-right">
                    {item.percentageOfTotal}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AnimatedPopover>
  );
};

export default CanvasBomPopover;
