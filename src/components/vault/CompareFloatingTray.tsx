// src/components/vault/CompareFloatingTray.tsx
// Floating morphing bottom compare tray for Concept Vault.
// Glides up smoothly when 1 to 3 services are queued for architectural comparison.

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Plus, ChevronDown, ArrowLeftRight } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
import { SPRING_SMOOTH } from '../../utils/motionTokens';
import { useCompareStore } from '../../store/useCompareStore';
import { useCompassStore } from '../../store/useCompassStore';
import { COMPARISON_PRESETS } from '../../utils/serviceComparisonEngine';
import { AWSServiceIcon } from '../icons/AWSServiceIcon';
import { CloudscapeSearchInput } from '../ui/CloudscapeSearchInput';
import type { AWSService } from '../../types/aws';

export const CompareFloatingTray: React.FC = () => {
  const comparedServiceIds = useCompareStore((s) => s.comparedServiceIds);
  const removeCompareService = useCompareStore((s) => s.removeCompareService);
  const addCompareService = useCompareStore((s) => s.addCompareService);
  const clearCompare = useCompareStore((s) => s.clearCompare);
  const openCompareModal = useCompareStore((s) => s.openCompareModal);
  const loadPreset = useCompareStore((s) => s.loadPreset);

  const services = useCompassStore((s) => s.services);

  const [isAddPickerOpen, setIsAddPickerOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const addPickerRef = useRef<HTMLDivElement>(null);
  const presetsRef = useRef<HTMLDivElement>(null);
  const addTriggerRef = useRef<HTMLButtonElement>(null);
  const presetsTriggerRef = useRef<HTMLButtonElement>(null);

  // Close popovers on click outside or Escape
  useEffect(() => {
    if (!isAddPickerOpen && !isPresetsOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddPickerOpen(false);
        setIsPresetsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        isAddPickerOpen &&
        addPickerRef.current &&
        !addPickerRef.current.contains(target) &&
        addTriggerRef.current &&
        !addTriggerRef.current.contains(target)
      ) {
        setIsAddPickerOpen(false);
      }
      if (
        isPresetsOpen &&
        presetsRef.current &&
        !presetsRef.current.contains(target) &&
        presetsTriggerRef.current &&
        !presetsTriggerRef.current.contains(target)
      ) {
        setIsPresetsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAddPickerOpen, isPresetsOpen]);

  // Selected service objects
  const queuedServices = useMemo(() => {
    return comparedServiceIds
      .map((id) => services.find((s) => s.id === id))
      .filter((s): s is AWSService => !!s);
  }, [comparedServiceIds, services]);

  // Available services for adding
  const availableToAdd = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const unqueued = services.filter((s) => !comparedServiceIds.includes(s.id));
    if (!q) return unqueued.slice(0, 30);
    return unqueued
      .filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          (s.shortName && s.shortName.toLowerCase().includes(q)) ||
          s.category.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [services, comparedServiceIds, searchQuery]);

  const canCompare = queuedServices.length >= 2;

  return (
    <AnimatePresence>
      {comparedServiceIds.length > 0 && (
        <m.div
          layout
          initial={{ opacity: 0, y: 32, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 32, scale: 0.95 }}
          transition={SPRING_SMOOTH}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 select-none"
        >
          <div className="bg-white/95 dark:bg-[#192534]/95 backdrop-blur-md border border-[#D5DBDB] dark:border-[#354150] shadow-2xl rounded-[12px] px-3.5 py-2 flex items-center gap-2.5 text-[#16191F] dark:text-[#EAEDED] max-w-[calc(100vw-2rem)] flex-wrap">
            {/* Queued Services Tiles */}
            <div className="flex items-center gap-1.5 shrink-0">
              {queuedServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center gap-1.5 pl-1.5 pr-1 py-1 rounded-[6px] bg-[#EAEDED]/70 dark:bg-[#141C28] border border-[#D5DBDB]/60 dark:border-[#354150]/60 text-[12px] font-medium"
                >
                  <AWSServiceIcon serviceId={service.id} size={22} className="shrink-0" />
                  <span className="truncate max-w-[100px] block font-semibold text-[11px]">
                    {service.shortName || service.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCompareService(service.id)}
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[#545B64] dark:text-[#879596] hover:text-[#DD344C] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    title={`Remove ${service.name} from comparison`}
                    aria-label={`Remove ${service.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick + Add Service Picker (when under 3) */}
            {comparedServiceIds.length < 3 && (
              <div className="relative shrink-0">
                <button
                  ref={addTriggerRef}
                  type="button"
                  onClick={() => {
                    setIsAddPickerOpen((prev) => !prev);
                    setIsPresetsOpen(false);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-[6px] text-[11px] font-medium text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] hover:bg-[#EAEDED] dark:hover:bg-white/[0.07] border border-dashed border-[#D5DBDB] dark:border-[#354150] transition-colors cursor-pointer"
                  title="Add another service to comparison"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add service</span>
                </button>

                {/* Inline Add Picker Popover */}
                {isAddPickerOpen && (
                  <div
                    ref={addPickerRef}
                    className="absolute bottom-full left-0 mb-2 z-50 w-72 max-h-72 rounded-[10px] bg-white dark:bg-[#161E2D] border border-[#D5DBDB] dark:border-[#354150] shadow-2xl flex flex-col overflow-hidden text-left"
                  >
                    <div className="p-2 border-b border-[#EAEDED] dark:border-[#222D3C] bg-[#F8F9FA] dark:bg-[#0F141A]">
                      <CloudscapeSearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search to add (max 3)..."
                        size="sm"
                        autoFocus
                        ariaLabel="Search service to add"
                      />
                    </div>
                    <div className="overflow-y-auto flex-1 p-1 scrollbar-thin custom-scrollbar">
                      {availableToAdd.length === 0 ? (
                        <div className="py-6 text-center text-[12px] text-[#545B64] dark:text-[#879596]">
                          No services found
                        </div>
                      ) : (
                        availableToAdd.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              addCompareService(s.id);
                              if (comparedServiceIds.length >= 2) {
                                setIsAddPickerOpen(false);
                              }
                            }}
                            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[4px] text-[12px] text-left hover:bg-[#EAEDED] dark:hover:bg-white/[0.07] text-[#16191F] dark:text-[#EAEDED] transition-colors cursor-pointer select-none"
                          >
                            <AWSServiceIcon serviceId={s.id} size={20} className="shrink-0" />
                            <div className="min-w-0 flex-1 truncate">
                              <span className="font-medium truncate block">{s.shortName || s.name}</span>
                              <span className="text-[10px] font-mono text-[#545B64] dark:text-[#879596] truncate block">
                                aws {s.id}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#879596] shrink-0">
                              T{s.tier}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 1px Vertical Divider */}
            <div className="h-4 w-px bg-[#D5DBDB] dark:bg-[#2A3647] shrink-0" aria-hidden="true" />

            {/* Presets Dropdown Trigger */}
            <div className="relative shrink-0">
              <button
                ref={presetsTriggerRef}
                type="button"
                onClick={() => {
                  setIsPresetsOpen((prev) => !prev);
                  setIsAddPickerOpen(false);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-[6px] text-[11px] font-medium text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] hover:bg-[#EAEDED] dark:hover:bg-white/[0.07] transition-colors cursor-pointer"
                title="Load curated AWS architectural comparison preset"
              >
                <span>Presets</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {/* Presets Popover Menu */}
              {isPresetsOpen && (
                <div
                  ref={presetsRef}
                  className="absolute bottom-full left-0 mb-2 z-50 w-72 rounded-[10px] bg-white dark:bg-[#161E2D] border border-[#D5DBDB] dark:border-[#354150] shadow-2xl p-1 flex flex-col overflow-hidden text-left"
                >
                  <div className="px-2.5 py-1.5 text-[10px] font-mono font-semibold text-[#879596] uppercase tracking-wider border-b border-[#EAEDED] dark:border-[#222D3C]">
                    Curated AWS Matchups
                  </div>
                  <div className="max-h-64 overflow-y-auto scrollbar-thin custom-scrollbar p-0.5">
                    {COMPARISON_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          loadPreset(p.id);
                          setIsPresetsOpen(false);
                        }}
                        className="w-full flex flex-col px-2.5 py-1.5 rounded-[6px] text-left hover:bg-[#EAEDED] dark:hover:bg-white/[0.07] transition-colors cursor-pointer"
                      >
                        <span className="text-[12px] font-medium text-[#16191F] dark:text-[#EAEDED] truncate">
                          {p.title}
                        </span>
                        <span className="text-[10px] text-[#545B64] dark:text-[#879596] font-mono truncate">
                          {p.subtitle}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Clear Trigger */}
            <button
              type="button"
              onClick={clearCompare}
              className="text-[11px] font-medium text-[#545B64] dark:text-[#879596] hover:text-[#DD344C] px-1.5 py-1 rounded-[4px] hover:bg-[#EAEDED] dark:hover:bg-white/[0.07] transition-colors cursor-pointer shrink-0"
              title="Clear comparison queue"
            >
              Clear
            </button>

            {/* 1px Vertical Divider */}
            <div className="h-4 w-px bg-[#D5DBDB] dark:bg-[#2A3647] shrink-0" aria-hidden="true" />

            {/* Primary Action Button: Compare (N/3) */}
            <button
              type="button"
              onClick={() => openCompareModal()}
              disabled={!canCompare}
              className={`flex items-center gap-1.5 px-3 py-1.5 h-8 rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer shrink-0 enabled:active:scale-[0.96] ${
                canCompare
                  ? 'bg-[#FF9900] hover:bg-[#EC7211] text-[#0F141A] shadow-sm'
                  : 'bg-[#EAEDED] dark:bg-[#222D3C] text-[#879596] cursor-not-allowed opacity-60'
              }`}
              title={
                canCompare
                  ? 'Open side-by-side architectural trade-off matrix'
                  : 'Select at least 2 services to compare'
              }
            >
              <ArrowLeftRight className="w-3.5 h-3.5" strokeWidth={2.2} />
              <span>Compare ({queuedServices.length}/3)</span>
            </button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
};

