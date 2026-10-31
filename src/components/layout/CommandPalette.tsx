import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Search,
  BookOpen,
  LayoutGrid,
  FileCode2,
  X,
  Download,
  Settings,
  Star,
} from 'lucide-react';
import { useCompassStore } from '../../store/useCompassStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { AWSServiceIcon } from '../icons/AWSServiceIcon';
import { SEED_BLUEPRINTS } from '../../db/seedBlueprints';
import { AWSCompassLogoMark } from '../ui/AWSCompassLogo';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerExport?: () => void;
  onTriggerImport?: () => void;
}

interface PaletteItem {
  id: string;
  section: 'Favorited services' | 'Quick actions' | 'Architecture blueprints' | 'AWS services';
  title: string;
  cliPrefix?: string;
  metadata: string;
  isFavorite?: boolean;
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

    // 0. Favorited services (prioritized at the top of default search list)
    services
      .filter((s) => s.isFavorite)
      .forEach((svc) => {
        items.push({
          id: `fav-${svc.id}`,
          section: 'Favorited services',
          title: svc.name,
          cliPrefix: `aws ${svc.id}`,
          metadata: `${svc.category} · T${svc.tier}`,
          isFavorite: true,
          actionLabel: 'Open documentation',
          serviceId: svc.id,
          icon: null,
          action: () => {
            setSelectedServiceId(svc.id);
            setWorkspaceMode('vault');
            onClose();
          },
        });
      });

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
        isFavorite: svc.isFavorite,
        actionLabel: 'Open documentation',
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
    // Exclude the duplicate 'Favorited services' section when actively searching
    return allItems
      .filter((item) => item.section !== 'Favorited services')
      .filter(
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
      'Favorited services',
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
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[13vh] px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[680px] rounded-[14px] overflow-hidden flex flex-col bg-white dark:bg-[#141C28]/95 dark:backdrop-blur-md border border-[#D5DBDB] dark:border-white/10 shadow-[0_24px_60px_-10px_rgba(0,0,0,0.2)] dark:shadow-[0_28px_72px_-12px_rgba(0,0,0,0.75)] animate-in zoom-in-95 duration-180 ease-[cubic-bezier(0.16,1,0.3,1)] select-none"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Top Search Input Bar (h-14, larger typography & clear visibility) */}
        <div className="h-14 px-4.5 sm:px-5 flex items-center gap-3.5 border-b border-[#D5DBDB] dark:border-[#2A3647] shrink-0 bg-transparent">
          <div className="flex items-center justify-center shrink-0 pointer-events-none" aria-hidden="true">
            <Search className="w-5 h-5 text-[#545B64] dark:text-[#879596]" strokeWidth={2} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search services, CLI prefixes, or blueprints..."
            spellCheck={false}
            autoComplete="off"
            className="w-full h-full bg-transparent flex-1 text-[15px] sm:text-[16px] text-[#16191F] dark:text-[#EAEDED] placeholder:text-[#545B64] dark:placeholder:text-[#879596] outline-none caret-[#FF9900] leading-normal self-center p-0 border-none"
          />
          {search.length > 0 ? (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="size-7 rounded-[6px] text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center transition-all cursor-pointer shrink-0"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center text-[10.5px] font-mono font-medium text-[#545B64] dark:text-[#879596] bg-[#EAEDED]/70 dark:bg-[#1F2B3E] px-2 py-0.5 rounded-[4px] border border-[#D5DBDB] dark:border-[#2A3647]/70 shrink-0">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List: max-h-[440px], generous padding, smooth scrolling */}
        <div
          ref={listRef}
          className="max-h-[440px] overflow-y-auto overscroll-contain p-2 scrollbar-thin custom-scrollbar"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <AWSCompassLogoMark size={36} className="opacity-60 mx-auto mb-3" />
              <p className="text-[14px] font-semibold text-[#16191F] dark:text-[#EAEDED]">
                No matching results
              </p>
              <p className="text-[12px] text-[#545B64] dark:text-[#879596] mt-1 max-w-sm mx-auto">
                Try searching by service name (e.g. EC2, S3), CLI prefix, category, or blueprint.
              </p>
            </div>
          ) : (
            groupedSections.map((group) => (
              <div key={group.name} className="mb-2.5 last:mb-0">
                <div className="px-3.5 py-1 text-[11px] font-bold text-[#545B64] dark:text-[#879596] uppercase tracking-wider select-none">
                  {group.name}
                </div>
                <div className="space-y-1">
                  {group.items.map(({ item, flatIndex }) => {
                    const isSelected = flatIndex === selectedIndex;
                    return (
                      <div
                        key={item.id}
                        data-selected={isSelected}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(flatIndex)}
                        className={`h-11 sm:h-12 px-3 rounded-[8px] flex items-center justify-between gap-3 cursor-pointer select-none transition-colors relative ${isSelected
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
                        <div className="flex items-center gap-3 min-w-0 pl-1.5">
                          {item.serviceId ? (
                            <AWSServiceIcon
                              serviceId={item.serviceId}
                              size={26}
                              className="rounded-[5px] shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-[5px] bg-[#F2F3F3] dark:bg-[#161E2D] flex items-center justify-center shrink-0">
                              {item.icon}
                            </div>
                          )}

                          <span className="text-[13.5px] sm:text-[14px] font-semibold text-[#16191F] dark:text-[#EAEDED] truncate">
                            {item.title}
                          </span>

                          {item.cliPrefix && (
                            <span className="text-[11px] font-mono text-[#545B64] dark:text-[#879596] bg-[#F2F3F3] dark:bg-[#0F1B2A] px-2 py-0.5 rounded-[4px] shrink-0 border border-black/5 dark:border-white/5">
                              {item.cliPrefix}
                            </span>
                          )}
                        </div>

                        {/* Right: Default Metadata vs Active Action Badge */}
                        <div className="shrink-0 flex items-center">
                          {isSelected ? (
                            <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0972D3] dark:text-[#539FE5] animate-in fade-in duration-100">
                              <span>{item.actionLabel}</span>
                              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#0972D3]/10 dark:bg-[#539FE5]/15 border border-[#0972D3]/20 dark:border-[#539FE5]/30 leading-none">
                                ↵
                              </span>
                            </span>
                          ) : (
                            <div className="flex items-center gap-2 text-[12px] text-[#545B64] dark:text-[#879596] tabular-nums">
                              <span>{item.metadata}</span>
                              {item.isFavorite && (
                                <Star className="w-3.5 h-3.5 text-[#FF9900] fill-[#FF9900] shrink-0" />
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

        {/* Footer Navigation Hints */}
        <div className="h-9 px-4 border-t border-[#D5DBDB] dark:border-[#2A3647] flex items-center justify-between text-[11px] text-[#545B64] dark:text-[#879596] bg-[#F8F9FA]/80 dark:bg-[#0F141A]/80 shrink-0 select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="font-mono text-[10px] px-1 py-0.2 rounded bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10">↑↓</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10">↵</kbd>
              <span>select</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="font-mono text-[10px] px-1 py-0.2 rounded bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10">esc</kbd>
            <span>close</span>
          </span>
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
