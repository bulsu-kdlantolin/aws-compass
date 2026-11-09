// src/components/vault/ServiceComparisonModal.tsx
// High-craft, de-boxed side-by-side AWS architectural trade-off matrix modal for Concept Vault.

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Copy,
  Check,
  Plus,
  ArrowLeftRight,
  ChevronDown,
} from 'lucide-react';
import { m } from 'motion/react';
import { SPRING_SNAPPY } from '../../utils/motionTokens';
import { useCompareStore } from '../../store/useCompareStore';
import { useCompassStore } from '../../store/useCompassStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import {
  COMPARISON_PRESETS,
  generateComparisonMatrix,
  exportComparisonToMarkdown,
} from '../../utils/serviceComparisonEngine';
import { AWSServiceIcon } from '../icons/AWSServiceIcon';
import { AnimatedIcon } from '../ui/AnimatedIcon';
import { CloudscapeSelect, type CloudscapeSelectOption } from '../ui/CloudscapeSelect';
import { CloudscapeSearchInput } from '../ui/CloudscapeSearchInput';
import type { AWSService } from '../../types/aws';

/* -------------------------------------------------------------------------- */
/*                         INLINE SERVICE SWAP POPOVER                         */
/* -------------------------------------------------------------------------- */

interface SwapServicePopoverProps {
  currentServiceId: string;
  allServices: AWSService[];
  onSwap: (newServiceId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const SwapServicePopover: React.FC<SwapServicePopoverProps> = ({
  currentServiceId,
  allServices,
  onSwap,
  isOpen,
  onClose,
  triggerRef,
}) => {
  const [query, setQuery] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return allServices.slice(0, 40);
    return allServices
      .filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          (s.shortName && s.shortName.toLowerCase().includes(q)) ||
          s.category.toLowerCase().includes(q)
      )
      .slice(0, 40);
  }, [allServices, query]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute top-full left-0 mt-1 z-50 w-72 max-h-80 rounded-[10px] bg-white/95 dark:bg-[#111726]/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.09] shadow-xl flex flex-col overflow-hidden text-left"
    >
        <div className="p-2 border-b border-slate-200/80 dark:border-white/[0.07] bg-slate-50/70 dark:bg-[#0B0F19]/60">
          <CloudscapeSearchInput
            value={query}
            onChange={setQuery}
            placeholder="Swap with service..."
            size="sm"
            autoFocus
            ariaLabel="Search service to swap"
          />
        </div>

        <div className="overflow-y-auto flex-1 p-1 scrollbar-thin custom-scrollbar divide-y divide-transparent">
          {filtered.length === 0 ? (
              <div className="py-6 text-center text-[12px] text-slate-400 dark:text-slate-500">
                No services match "{query}"
              </div>
              ) : (
          filtered.map((s) => {
            const isCurrent = s.id === currentServiceId;
              return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onSwap(s.id);
                  onClose();
                }}
                disabled={isCurrent}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[6px] text-[12px] text-left transition-colors cursor-pointer select-none ${isCurrent
                  ? 'opacity-40 cursor-not-allowed bg-transparent'
                  : 'hover:bg-slate-100 dark:hover:bg-white/[0.07] text-slate-900 dark:text-slate-100'
                  }`}
              >
              <AWSServiceIcon serviceId={s.id} size={20} className="shrink-0" />
              <div className="min-w-0 flex-1 truncate">
                <span className="font-medium truncate block">{s.shortName || s.name}</span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate block">
                    aws {s.id}
                  </span>
              </div>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
                  T{s.tier}
                </span>
              </button>
              );
          })
        )}
            </div>
    </div>
        );
};

/* -------------------------------------------------------------------------- */
/*                        SERVICE COMPARISON MODAL COMPONENT                  */
/* -------------------------------------------------------------------------- */

export const ServiceComparisonModal: React.FC = () => {
  const isCompareModalOpen = useCompareStore((s) => s.isCompareModalOpen);
  const comparedServiceIds = useCompareStore((s) => s.comparedServiceIds);
  const activePresetId = useCompareStore((s) => s.activePresetId);
  const closeCompareModal = useCompareStore((s) => s.closeCompareModal);
  const loadPreset = useCompareStore((s) => s.loadPreset);
  const swapService = useCompareStore((s) => s.swapService);

  const services = useCompassStore((s) => s.services);
  const addServiceNode = useCanvasStore((s) => s.addServiceNode);
  const setWorkspaceMode = useCompassStore((s) => s.setWorkspaceMode);
  const createBlankBlueprint = useCanvasStore((s) => s.createBlankBlueprint);

        const [copied, setCopied] = useState(false);
        const [addedServiceId, setAddedServiceId] = useState<string | null>(null);
        const [activeSwapColumnId, setActiveSwapColumnId] = useState<string | null>(null);
        const swapTriggerRefs = useRef<Record<string, HTMLButtonElement | null>>({ });

  // Resolve compared services objects from store
  const comparedServices = useMemo(() => {
    return comparedServiceIds
      .map((id) => services.find((s) => s.id === id))
      .filter((s): s is AWSService => !!s);
  }, [comparedServiceIds, services]);

  // Generate comparison matrix
  const matrix = useMemo(() => {
    return generateComparisonMatrix(comparedServices);
  }, [comparedServices]);

  // Close on Escape key
  useEffect(() => {
    if (!isCompareModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !activeSwapColumnId) {
            closeCompareModal();
      }
    };

          window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCompareModalOpen, activeSwapColumnId, closeCompareModal]);

  // Copy Markdown handler
  const handleCopyMarkdown = useCallback(async () => {
    if (comparedServices.length === 0) return;
          const md = exportComparisonToMarkdown(matrix);
          try {
            await navigator.clipboard.writeText(md);
          setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
            // Fallback
          }
  }, [matrix, comparedServices.length]);

          // Add to canvas bridge
          const handleAddToCanvas = useCallback(
    (service: AWSService) => {
            createBlankBlueprint();
          addServiceNode(service, {x: 340, y: 220 });
          setAddedServiceId(service.id);
      setTimeout(() => {
            setAddedServiceId(null);
          closeCompareModal();
          setWorkspaceMode('canvas');
      }, 700);
    },
          [addServiceNode, closeCompareModal, createBlankBlueprint, setWorkspaceMode]
          );

  // Preset Select Options
  const presetOptions: CloudscapeSelectOption[] = useMemo(() => {
    return COMPARISON_PRESETS.map((p) => ({
            value: p.id,
          label: p.title,
          description: p.subtitle,
    }));
  }, []);

          if (!isCompareModalOpen) return null;

          const colCount = Math.max(2, comparedServices.length);
          const gridTemplate =
          colCount === 2
          ? 'grid-cols-[180px_repeat(2,minmax(280px,1fr))]'
          : 'grid-cols-[180px_repeat(3,minmax(260px,1fr))]';

          return (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="comparison-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[6px] select-none overscroll-contain animate-in fade-in duration-150"
          >
            {/* Modal Sheet Container */}
            <m.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={SPRING_SNAPPY}
              className="relative max-w-[1040px] w-[calc(100vw-2rem)] max-h-[86vh] rounded-[16px] overflow-hidden flex flex-col bg-white/95 dark:bg-[#111726]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-white/[0.09] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.18),0_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.75)] text-slate-900 dark:text-slate-100"
            >
              {/* Top Header Bar */}
                <div className="h-14 px-6 border-b border-slate-200/80 dark:border-white/[0.07] flex items-center justify-between shrink-0 bg-white/95 dark:bg-[#111726]/95 backdrop-blur-md gap-4">
                  {/* Left: Title + Preset Switcher */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="p-1.5 rounded-[4px] bg-[#FF9900]/10 text-[#FF9900]">
                        <ArrowLeftRight className="w-4 h-4" strokeWidth={2} />
                      </span>
                      <h2
                        id="comparison-modal-title"
                        className="text-[14px] font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap"
                      >
                        Architectural trade-off matrix
                      </h2>
                    </div>

                    {/* 1px Vertical Divider */}
                    <div className="h-4 w-px bg-slate-200 dark:bg-white/[0.08] shrink-0" aria-hidden="true" />

                    {/* Curated Matchups Preset Dropdown */}
                    <div className="w-64 shrink-0">
                      <CloudscapeSelect
                        value={activePresetId || ''}
                        options={presetOptions}
                        onChange={(val) => loadPreset(val)}
                        placeholder="Curated matchups ▾"
                        size="sm"
                        ariaLabel="Curated architectural presets"
                      />
                    </div>
                  </div>

                  {/* Right: Copy as Markdown & Close Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyMarkdown}
                      className="flex items-center gap-1.5 px-3 py-1.5 h-8 rounded-[7px] text-[12px] font-medium border border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 transition-all cursor-pointer select-none enabled:active:scale-[0.96]"
                      title="Copy side-by-side trade-off matrix as GitHub-Flavored Markdown table"
                      aria-label="Copy comparison as Markdown table"
                    >
                      <AnimatedIcon activeKey={copied ? 'copied' : 'copy'} size={14}>
                        {copied ? (
                          <Check key="copied" className="w-3.5 h-3.5 text-[#1D8102] dark:text-[#28A745]" />
                        ) : (
                  <Copy key="copy" className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        )}
                      </AnimatedIcon>
                      <span>{copied ? 'Copied markdown' : 'Copy as Markdown table'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={closeCompareModal}
                      className="w-8 h-8 rounded-[7px] flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer select-none"
                      title="Close comparison modal (Escape)"
                      aria-label="Close modal"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Scrollable Comparison Matrix Table Grid */}
                  <div className="flex-1 overflow-auto scrollbar-thin custom-scrollbar bg-white dark:bg-[#111726]">
                    <div className={`grid ${gridTemplate} min-w-[760px] border-collapse`}>
                      {/* -------------------------------------------------------------- */}
                      {/* STICKY COLUMN HEADERS ROW                                       */}
                      {/* -------------------------------------------------------------- */}
                      {/* Top-Left Corner Cell */}
                          <div className="sticky top-0 left-0 z-30 p-4 bg-slate-50/70 dark:bg-[#0B0F19]/60 border-r border-b border-slate-200/80 dark:border-white/[0.07] flex flex-col justify-end backdrop-blur-md">
                            <span className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 tracking-normal select-none">
                              Dimensions ({matrix.dimensions.length})
                            </span>
                          </div>

                          {/* Service Column Headers */}
                          {comparedServices.map((service) => {
                            const isSwapOpen = activeSwapColumnId === service.id;
                            const isAdded = addedServiceId === service.id;

                            return (
                              <div
                                key={service.id}
                                className="sticky top-0 z-20 p-4 bg-slate-50/70 dark:bg-[#0B0F19]/60 border-r border-b border-slate-200/80 dark:border-white/[0.07] last:border-r-0 flex flex-col justify-between gap-3 relative backdrop-blur-md"
                              >
                                {/* Top Line: Icon + Titles */}
                                <div className="flex items-start gap-3">
                                  <AWSServiceIcon serviceId={service.id} size={32} className="shrink-0 mt-0.5" />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-semibold text-[14px] text-slate-900 dark:text-slate-100 truncate block">
                                          {service.shortName || service.name}
                                        </span>
                                        <span
                          className={`text-[10.5px] font-mono font-medium px-1.5 py-0.5 rounded-[4px] tabular-nums ${service.tier === 1
                                            ? 'text-[#FF9900] bg-[#FF9900]/10 border border-[#FF9900]/20'
                                            : service.tier === 2
                                                ? 'text-[#0972D3] dark:text-[#539FE5] bg-[#0972D3]/10 dark:bg-[#539FE5]/10 border border-[#0972D3]/20 dark:border-[#539FE5]/20'
                                                : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.06]'
                                            }`}
                                        >
                                          T{service.tier} · {service.tier === 1 ? 'Core' : service.tier === 2 ? 'Enterprise' : 'Specialized'}
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-mono text-[#0972D3] dark:text-[#539FE5] block mt-0.5">
                                      aws {service.id}
                                    </span>
                                  </div>
                                </div>

                                {/* Actions Bar: Swap Column & + Add to Canvas */}
                                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-white/[0.06]">
                                    <div className="relative">
                                      <button
                                        ref={(el) => {
                                          swapTriggerRefs.current[service.id] = el;
                                        }}
                                        type="button"
                                        onClick={() =>
                                          setActiveSwapColumnId((prev) => (prev === service.id ? null : service.id))
                                        }
                                        className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-[6px] text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
                                        title="Swap this service with another from catalog"
                                      >
                                        <span>Swap</span>
                                        <ChevronDown className="w-3 h-3 opacity-60" />
                                      </button>

                                      {/* Swap Popover */}
                                      <SwapServicePopover
                                        currentServiceId={service.id}
                                        allServices={services}
                                        isOpen={isSwapOpen}
                                        onClose={() => setActiveSwapColumnId(null)}
                                        onSwap={(newId) => swapService(service.id, newId)}
                                        triggerRef={{ current: swapTriggerRefs.current[service.id] }}
                                      />
                                    </div>

                                    <div className="h-3 w-px bg-slate-200 dark:bg-white/[0.08]" aria-hidden="true" />

                                    <button
                                      type="button"
                                      onClick={() => handleAddToCanvas(service)}
                      className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-[6px] transition-colors cursor-pointer ${isAdded
                                        ? 'text-[#1D8102] dark:text-[#28A745] font-semibold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-[#FF9900] hover:bg-slate-200/60 dark:hover:bg-white/[0.08]'
                        }`}
                                    title={`Add ${service.name} to Active Architecture Canvas`}
                    >
                                    {isAdded ? (
                                      <>
                                        <Check className="w-3 h-3 text-[#1D8102] dark:text-[#28A745]" />
                                        <span>Added to canvas</span>
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="w-3 h-3 text-[#FF9900]" />
                                        <span>+ Add to canvas</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {/* -------------------------------------------------------------- */}
                          {/* 8 STANDARDIZED DE-BOXED MATRIX ROWS                             */}
                          {/* -------------------------------------------------------------- */}
                          {matrix.rows.map((row) => {
                            const { dimension, cells } = row;

                            return (
                              <React.Fragment key={dimension.id}>
                                {/* Left Sticky Dimension Label Column */}
                                    <div className="sticky left-0 z-10 p-4 bg-slate-50/70 dark:bg-[#0B0F19]/60 border-r border-b border-slate-200/80 dark:border-white/[0.07] flex flex-col justify-start">
                                      <span className="text-[12px] font-semibold text-slate-900 dark:text-slate-100 leading-[1.35]">
                                        {dimension.label}
                                      </span>
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-[1.3] mt-1 opacity-80">
                                          {dimension.description}
                                        </span>
                                    </div>

                                    {/* De-Boxed Hairline Service Content Cells */}
                                    {comparedServices.map((service) => {
                                      const cell = cells[service.id];

                                      return (
                                        <div
                                          key={`${dimension.id}-${service.id}`}
                                          className="p-4 border-r border-b border-slate-200/80 dark:border-white/[0.07] last:border-r-0 text-[13px] leading-[1.5] text-slate-800 dark:text-slate-200 flex flex-col justify-start"
                                        >
                                          {/* Optional subtle badge (e.g. for Category & Tier) */}
                                          {cell?.badge && (
                                              <div className="mb-2 flex items-center gap-1.5 flex-wrap">
                                                <span
                              className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-[5px] ${cell.badgeType === 'core'
                                                    ? 'text-[#FF9900] bg-[#FF9900]/10 border border-[#FF9900]/20'
                                                    : cell.badgeType === 'enterprise'
                                                        ? 'text-[#0972D3] dark:text-[#539FE5] bg-[#0972D3]/10 dark:bg-[#539FE5]/10 border border-[#0972D3]/20 dark:border-[#539FE5]/20'
                                                        : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.06]'
                                                    }`}
                                                >
                                                  {cell.badge}
                                                </span>
                                                {cell.subtext && (
                                                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-[5px] bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/50 dark:border-white/[0.05]">
                                                      {cell.subtext}
                                                    </span>
                            )}
                                                  </div>
                                                )}

                                                {/* Summary Prose */}
                                                  <p className="text-[13px] leading-[1.5] text-slate-800 dark:text-slate-200 font-normal">
                                                    {cell?.summary}
                                                  </p>

                                                  {/* Sub-bullet points if available */}
                                                  {cell?.bulletPoints && cell.bulletPoints.length > 0 && (
                                                      <ul className="mt-2 space-y-1 text-[12px] leading-[1.4] text-slate-500 dark:text-slate-400 list-none">
                                                        {cell.bulletPoints.map((bullet, idx) => (
                                                          <li key={idx} className="flex items-start gap-1.5">
                                                            <span className="text-[#0972D3] dark:text-[#539FE5] text-[10px] mt-0.5 shrink-0 select-none">
                                                              •
                                                            </span>
                                                            <span>{bullet}</span>
                                                          </li>
                                                        ))}
                                                      </ul>
                        )}
                                                    </div>
                                                  );
                  })}
                                                </React.Fragment>
                                                );
            })}
                                              </div>
                                            </div>
      </m.div>
    </div>
                                );
};

