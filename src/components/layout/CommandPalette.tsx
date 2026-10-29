import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Search,
  BookOpen,
  LayoutGrid,
  FileCode2,
  X,
  Download,
  Settings,
} from 'lucide-react';
import { useCompassStore } from '../../store/useCompassStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { AWSServiceIcon } from '../icons/AWSServiceIcon';
import { SEED_BLUEPRINTS } from '../../db/seedBlueprints';
import { AWSCompassLogoMark } from '../ui/AWSCompassLogo';
import type { StudyStatus } from '../../types/aws';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerExport?: () => void;
  onTriggerImport?: () => void;
}

interface PaletteItem {
  id: string;
  section: 'Quick actions' | 'Architecture blueprints' | 'AWS services';
  title: string;
  cliPrefix?: string;
  metadata: string;
  status?: StudyStatus;
  actionLabel: string;
  icon: React.ReactNode;
  serviceId?: string;
  action: () => void;
}

const CommandPaletteModal: React.FC<Omit<CommandPaletteProps, 'isOpen'>> = ({
  onClose,
  onTriggerExport,
  onTriggerImport,
}) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const {
    services,
    setSelectedServiceId,
    setWorkspaceMode,
    resetToDefaults,
  } = useCompassStore();

  const {
    loadTemplate,
    loadSnapshot,
    savedDiagrams,
  } = useCanvasStore();

  // Focus search input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Build searchable items organized by section
  const allItems: PaletteItem[] = useMemo(() => {
    const items: PaletteItem[] = [];

    // 1. Quick actions
    items.push({
      id: 'quick-settings',
      section: 'Quick actions',
      title: 'Open Settings',
      cliPrefix: 'Ctrl+,',
      metadata: 'Preferences',
      actionLabel: 'Open settings',
      icon: <Settings className="w-3.5 h-3.5 text-cyan-400" strokeWidth={2} />,
      action: () => {
        onClose();
        useSettingsStore.getState().openSettings();
      },
    });

    items.push({
      id: 'quick-vault',
      section: 'Quick actions',
      title: 'Switch to Concept Vault',
      metadata: 'Vault mode',
      actionLabel: 'Switch mode',
      icon: <BookOpen className="w-3.5 h-3.5 text-[#FF9900]" strokeWidth={2} />,
      action: () => {
        setWorkspaceMode('vault');
        onClose();
      },
    });

    items.push({
      id: 'quick-canvas',
      section: 'Quick actions',
      title: 'Switch to Architecture Canvas',
      metadata: 'Canvas mode',
      actionLabel: 'Switch mode',
      icon: <LayoutGrid className="w-3.5 h-3.5 text-purple-400" strokeWidth={2} />,
      action: () => {
        setWorkspaceMode('canvas');
        onClose();
      },
    });

    items.push({
      id: 'quick-export',
      section: 'Quick actions',
      title: 'Export / Import Database (JSON)',
      metadata: 'Backup & Restore',
      actionLabel: 'Manage data',
      icon: <Download className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} />,
      action: () => {
        onClose();
        useSettingsStore.getState().openSettings('data');
      },
    });

    // 2. Architecture blueprints (seeds + saved snapshots)
    Object.values(SEED_BLUEPRINTS).forEach((bp) => {
      items.push({
        id: `blueprint-${bp.id}`,
        section: 'Architecture blueprints',
        title: bp.name,
        cliPrefix: 'blueprint',
        metadata: `${bp.category} · ${bp.nodes.length} nodes`,
        actionLabel: 'Load blueprint',
        icon: <FileCode2 className="w-3.5 h-3.5 text-purple-400" strokeWidth={2} />,
        action: () => {
          setWorkspaceMode('canvas');
          loadTemplate(bp.id);
          onClose();
        },
      });
    });

    savedDiagrams.forEach((diag) => {
      items.push({
        id: `snapshot-${diag.id}`,
        section: 'Architecture blueprints',
        title: diag.name,
        cliPrefix: 'snapshot',
        metadata: `Saved · ${diag.nodes.length} nodes`,
        actionLabel: 'Load snapshot',
        icon: <LayoutGrid className="w-3.5 h-3.5 text-amber-400" strokeWidth={2} />,
        action: () => {
          setWorkspaceMode('canvas');
          loadSnapshot(diag.id);
          onClose();
        },
      });
    });

    // 3. AWS services
    services.forEach((svc) => {
      items.push({
        id: `service-${svc.id}`,
        section: 'AWS services',
        title: svc.name,
        cliPrefix: `aws ${svc.id}`,
        metadata: `${svc.category} · T${svc.tier}`,
        status: svc.studyStatus,
        actionLabel: 'Open dossier',
        serviceId: svc.id,
        icon: null,
        action: () => {
          setSelectedServiceId(svc.id);
          setWorkspaceMode('vault');
          onClose();
        },
      });
    });

    return items;
  }, [
    services,
    savedDiagrams,
    setSelectedServiceId,
    setWorkspaceMode,
    loadTemplate,
    loadSnapshot,
    resetToDefaults,
    onTriggerExport,
    onTriggerImport,
    onClose,
  ]);

  // Filter items matching query
  const filteredItems = useMemo(() => {
    if (!search.trim()) {
      return allItems;
    }
    const q = search.toLowerCase().trim();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.cliPrefix && item.cliPrefix.toLowerCase().includes(q)) ||
        (item.metadata && item.metadata.toLowerCase().includes(q)) ||
        (item.serviceId && item.serviceId.toLowerCase().includes(q))
    );
  }, [allItems, search]);

  // Group filtered items by section maintaining flat indexes for keyboard navigation
  const groupedSections = useMemo(() => {
    const sectionNames: Array<PaletteItem['section']> = [
      'Quick actions',
      'Architecture blueprints',
      'AWS services',
    ];

    const result: {
      name: PaletteItem['section'];
      items: { item: PaletteItem; flatIndex: number }[];
    }[] = [];

    sectionNames.forEach((name) => {
      const itemsInSection: { item: PaletteItem; flatIndex: number }[] = [];
      filteredItems.forEach((item, flatIdx) => {
        if (item.section === name) {
          itemsInSection.push({ item, flatIndex: flatIdx });
        }
      });
      if (itemsInSection.length > 0) {
        result.push({ name, items: itemsInSection });
      }
    });

    return result;
  }, [filteredItems]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setSelectedIndex(0);
  };

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeElem = listRef.current.querySelector('[data-selected="true"]');
    if (activeElem) {
      activeElem.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected) {
          selected.action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [filteredItems, selectedIndex, onClose]
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] sm:pt-[16vh] px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[580px] rounded-[16px] overflow-hidden flex flex-col bg-white dark:bg-[#141C28]/95 dark:backdrop-blur-md border border-[#D5DBDB] dark:border-white/10 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.7)] animate-in zoom-in-95 duration-180 ease-[cubic-bezier(0.16,1,0.3,1)] select-none"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Top Search Input Bar (h-12, no ESC badge) */}
        <div className="h-12 px-4 flex items-center gap-3 border-b border-[#D5DBDB] dark:border-[#2A3647] shrink-0">
          <Search className="w-4 h-4 text-[#545B64] dark:text-[#879596] shrink-0 pointer-events-none" strokeWidth={1.75} aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search services, CLI prefixes, or blueprints..."
            spellCheck={false}
            autoComplete="off"
            className="w-full bg-transparent text-[14px] text-[#16191F] dark:text-[#EAEDED] placeholder:text-[#545B64] dark:placeholder:text-[#879596] outline-none caret-[#FF9900]"
          />
          {search.length > 0 && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="size-6 rounded-[6px] text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center transition-all cursor-pointer shrink-0"
              aria-label="Clear search input"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Results List: max-h-[360px], concentric p-1.5 padding, no footer */}
        <div
          ref={listRef}
          className="max-h-[360px] overflow-y-auto overscroll-contain p-1.5 scrollbar-thin custom-scrollbar"
        >
          {filteredItems.length === 0 ? (
            <div className="py-10 px-4 text-center">
              <AWSCompassLogoMark size={32} className="opacity-60 mx-auto mb-2.5" />
              <p className="text-[13px] font-medium text-[#16191F] dark:text-[#EAEDED]">
                No matching results
              </p>
              <p className="text-[12px] text-[#545B64] dark:text-[#879596] mt-1">
                Try searching by service name, CLI prefix (e.g. s3, lambda), or blueprint.
              </p>
            </div>
          ) : (
            groupedSections.map((group) => (
              <div key={group.name} className="mb-2 last:mb-0">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-[#545B64] dark:text-[#879596] select-none">
                  {group.name}
                </div>
                <div className="space-y-0.5">
                  {group.items.map(({ item, flatIndex }) => {
                    const isSelected = flatIndex === selectedIndex;
                    return (
                      <div
                        key={item.id}
                        data-selected={isSelected}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(flatIndex)}
                        className={`h-10 px-2.5 rounded-[10px] flex items-center justify-between gap-3 cursor-pointer select-none transition-colors relative ${isSelected
                          ? 'bg-[#EAEDED] dark:bg-[#1F2B3E]'
                          : 'hover:bg-[#F2F3F3] dark:hover:bg-[#161E2D]'
                          }`}
                      >
                        {/* Leading Edge Accent Pill on active row */}
                        {isSelected && (
                          <span
                            className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-[2.5px] rounded-full bg-[#FF9900]"
                            aria-hidden="true"
                          />
                        )}

                        {/* Left: Icon + Title + CLI Pill */}
                        <div className="flex items-center gap-2.5 min-w-0 pl-1.5">
                          {item.serviceId ? (
                            <AWSServiceIcon
                              serviceId={item.serviceId}
                              size={24}
                              className="rounded-[5px] shrink-0"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-[5px] bg-[#F2F3F3] dark:bg-[#161E2D] flex items-center justify-center shrink-0">
                              {item.icon}
                            </div>
                          )}

                          <span className="text-[13px] font-semibold text-[#16191F] dark:text-[#EAEDED] truncate">
                            {item.title}
                          </span>

                          {item.cliPrefix && (
                            <span className="text-[11px] font-mono text-[#545B64] dark:text-[#879596] bg-[#F2F3F3] dark:bg-[#0F1B2A] px-1.5 py-0.5 rounded-[4px] shrink-0">
                              {item.cliPrefix}
                            </span>
                          )}
                        </div>

                        {/* Right: Default Metadata vs Active Action Badge */}
                        <div className="shrink-0 flex items-center">
                          {isSelected ? (
                            <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#0972D3] dark:text-[#539FE5] animate-in fade-in duration-100">
                              <span>{item.actionLabel}</span>
                              <span className="text-[11px] font-mono px-1 py-0.5 rounded bg-[#0972D3]/10 dark:bg-[#539FE5]/15 leading-none">
                                ↵
                              </span>
                            </span>
                          ) : (
                            <div className="flex items-center gap-2 text-[12px] text-[#545B64] dark:text-[#879596] tabular-nums">
                              <span>{item.metadata}</span>
                              {item.status === 'mastered' && (
                                <svg
                                  viewBox="0 0 16 16"
                                  width="12"
                                  height="12"
                                  fill="none"
                                  stroke="#1D8102"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="shrink-0 text-[#1D8102]"
                                  aria-label="Mastered"
                                >
                                  <circle cx="8" cy="8" r="6.5" />
                                  <polyline points="5.5 8.2 7.2 10 10.8 6.5" />
                                </svg>
                              )}
                              {item.status === 'in-progress' && (
                                <svg
                                  viewBox="0 0 16 16"
                                  width="12"
                                  height="12"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  className="shrink-0 text-[#0972D3] dark:text-[#539FE5]"
                                  aria-label="In progress"
                                >
                                  <circle cx="8" cy="8" r="6.5" />
                                  <polyline points="8 4.5 8 8 10.5 9.5" />
                                </svg>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onTriggerExport,
  onTriggerImport,
}) => {
  if (!isOpen) return null;
  return (
    <CommandPaletteModal
      onClose={onClose}
      onTriggerExport={onTriggerExport}
      onTriggerImport={onTriggerImport}
    />
  );
};

export default CommandPalette;
