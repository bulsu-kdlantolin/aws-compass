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
  section: 'Favorite services' | 'Quick actions' | 'Architecture blueprints' | 'AWS services';
  title: string;
  shortName?: string;
  cliPrefix?: string;
  metadata: string;
  tier?: number;
  isFavorite?: boolean;
  actionLabel: string;
  icon: React.ReactNode;
  serviceId?: string;
  category?: string;
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

    // 0. Favorite services (prioritized at the top of default search list)
    services
      .filter((s) => s.isFavorite)
      .forEach((svc) => {
        items.push({
          id: `fav-${svc.id}`,
          section: 'Favorite services',
          title: svc.name,
          shortName: svc.shortName,
          cliPrefix: svc.cliPrefix || `aws ${svc.id}`,
          metadata: `${svc.category} · T${svc.tier}`,
          tier: svc.tier,
          isFavorite: true,
          category: svc.category,
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
        shortName: svc.shortName,
        cliPrefix: svc.cliPrefix || `aws ${svc.id}`,
        metadata: `${svc.category} · T${svc.tier}`,
        tier: svc.tier,
        isFavorite: svc.isFavorite,
        category: svc.category,
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
      // High-performance default view: keep Favorited, Quick actions, Blueprints,
      // and slice 'AWS services' to the top 25 foundational items (T1 first, then alphabetical)
      const nonServices = allItems.filter((item) => item.section !== 'AWS services');
      const serviceItems = allItems.filter((item) => item.section === 'AWS services');

      const sortedServices = [...serviceItems].sort((a, b) => {
        if ((a.tier || 3) !== (b.tier || 3)) {
          return (a.tier || 3) - (b.tier || 3);
        }
        return a.title.localeCompare(b.title);
      });

      const topServices = sortedServices.slice(0, 25);
      return [...nonServices, ...topServices];
    }

    const q = search.toLowerCase().trim();
    // Exclude the duplicate 'Favorite services' section when actively searching across the 230+ catalog
    return allItems
      .filter((item) => item.section !== 'Favorite services')
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.shortName && item.shortName.toLowerCase().includes(q)) ||
          (item.cliPrefix && item.cliPrefix.toLowerCase().includes(q)) ||
          (item.metadata && item.metadata.toLowerCase().includes(q)) ||
          (item.category && item.category.toLowerCase().includes(q)) ||
          (item.serviceId && item.serviceId.toLowerCase().includes(q))
      );
  }, [allItems, search]);

  // Group filtered items by section maintaining flat indexes for keyboard navigation
  const groupedSections = useMemo(() => {
    const sectionNames: Array<PaletteItem['section']> = [
      'Favorite services',
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
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[13vh] px-4 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[6px] animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[680px] rounded-[16px] overflow-hidden flex flex-col bg-white/95 dark:bg-[#111726]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-white/[0.09] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.18),0_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.75)] animate-in zoom-in-95 duration-180 ease-[cubic-bezier(0.16,1,0.3,1)] select-none"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Top Search Input Bar (h-14, larger typography & clear visibility) */}
          <div className="h-14 px-4.5 sm:px-5 flex items-center gap-3.5 border-b border-slate-200/80 dark:border-white/[0.07] shrink-0 bg-transparent">
            <div className="flex items-center justify-center shrink-0 pointer-events-none" aria-hidden="true">
              <Search className="w-5 h-5 text-slate-400 dark:text-slate-500" strokeWidth={2} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search services, CLI prefixes, or blueprints..."
              spellCheck={false}
              autoComplete="off"
              className="w-full h-full bg-transparent flex-1 text-[15px] sm:text-[16px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none caret-[#FF9900] leading-normal self-center p-0 border-none"
            />
              {
                search.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange('')}
                    className="size-7 rounded-[6px] text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center transition-all cursor-pointer shrink-0"
                    aria-label="Clear search input"
                  >
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
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
                  <p className="text-[14px] font-semibold text-slate-900 dark:text-slate-100">
                    No matching results
                  </p>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                      Try searching by service name (e.g. EC2, S3), CLI prefix, category, or blueprint.
                    </p>
                  </div>
                  ) : (
            groupedSections.map((group) => {
              const sectionDisplayNames: Record<string, string> = {
                    'Favorite services': 'Favorites',
                  'Quick actions': 'Quick actions',
                  'Architecture blueprints': 'Blueprints',
                  'AWS services': 'AWS services',
              };
                  return (
                  <div key={group.name} className="mb-2.5 last:mb-0">
                      <div className="px-3.5 py-1.5 text-[11.5px] font-semibold text-slate-400 dark:text-slate-500 tracking-normal select-none">
                        {sectionDisplayNames[group.name] || group.name}
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
                        className={`h-11 sm:h-12 px-3 rounded-[9px] flex items-center justify-between gap-3 cursor-pointer select-none transition-colors relative ${isSelected
                                ? 'bg-slate-100 dark:bg-white/[0.07]'
                                : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'
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
                                    category={item.category}
                                    size={26}
                                    className="rounded-[5px] shrink-0"
                                  />
                                ) : (
                                    <div className="w-7 h-7 rounded-[5px] bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
                                      {item.icon}
                                    </div>
                          )}

                                      <span className="text-[13.5px] sm:text-[14px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                                        {item.title}
                                      </span>

                                      {item.cliPrefix && (
                                        <span className="text-[11px] font-mono text-[#0972D3] dark:text-[#539FE5] shrink-0">
                                          {item.cliPrefix}
                                        </span>
                                      )}
                                  </div>

                        {/* Right: Default Metadata vs Active Action Badge */}
                                <div className="shrink-0 flex items-center">
                                  {isSelected ? (
                                    <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0972D3] dark:text-[#539FE5] animate-in fade-in duration-100">
                                      <span>{item.actionLabel}</span>
                                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-[4px] bg-[#0972D3]/10 dark:bg-[#539FE5]/15 border border-[#0972D3]/20 dark:border-[#539FE5]/30 leading-none">
                                        ↵
                                      </span>
                                    </span>
                                  ) : (
                                      <div className="flex items-center gap-2 text-[12px] text-slate-500 dark:text-slate-400 tabular-nums">
                                        {item.tier ? (
                                          <span className="flex items-center gap-1.5">
                                            <span>{item.metadata.split(' · ')[0]}</span>
                                            <span>·</span>
                                            <span
                                              className={`font-mono text-[11px] font-medium ${item.tier === 1
                                                ? 'text-[#FF9900]/90'
                                                : item.tier === 2
                                                  ? 'text-[#539FE5]/90'
                                        : 'text-slate-400 dark:text-slate-500'
                                      }`}
                                  >
                                            T{item.tier}
                                          </span>
                                </span>
                                      ) : (
                                      <span>{item.metadata}</span>
                              )}
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
                      );
          })
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
