import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Search,
  BookOpen,
  LayoutGrid,
  PlusCircle,
  FileCode2,
  X,
  ArrowRight,
  Download,
  Upload,
  RotateCcw,
} from 'lucide-react';
import { useCompassStore } from '../../store/useCompassStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { AWSServiceIcon } from '../canvas/AWSIcons';
import { SEED_BLUEPRINTS } from '../../db/seedBlueprints';
import { ClassicV2 } from '../ui/LoadingIndicators';
import { AWSCompassLogo } from '../icons/AWSCompassLogo';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerExport?: () => void;
  onTriggerImport?: () => void;
}

interface PaletteAction {
  id: string;
  type: 'service-doc' | 'service-node' | 'blueprint' | 'diagram' | 'navigation';
  title: string;
  subtitle: string;
  category?: string;
  serviceId?: string;
  tier?: number;
  icon: React.ReactNode;
  badge?: string;
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
    addServiceNode,
    loadTemplate,
    loadSnapshot,
    savedDiagrams,
  } = useCanvasStore();

  // Focus input on mount without setting state in effect
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Build searchable command items
  const actions: PaletteAction[] = useMemo(() => {
    const list: PaletteAction[] = [];

    // 1. Service Docs in Concept Vault
    services.forEach((svc) => {
      list.push({
        id: `doc-${svc.id}`,
        type: 'service-doc',
        title: svc.name,
        subtitle: `Open 6-part study dossier in Concept Vault • T${svc.tier} ${svc.category}`,
        category: 'Jump to Concept Vault Doc',
        serviceId: svc.id,
        tier: svc.tier,
        badge: `T${svc.tier}`,
        icon: <BookOpen className="w-4 h-4 text-sky-400" />,
        action: () => {
          setSelectedServiceId(svc.id);
          setWorkspaceMode('vault');
          onClose();
        },
      });
    });

    // 2. Drop Service Node onto Canvas Center
    services.forEach((svc) => {
      list.push({
        id: `node-${svc.id}`,
        type: 'service-node',
        title: `Drop ${svc.name} onto Canvas`,
        subtitle: `Spawn new ${svc.category} service node in active architecture canvas`,
        category: 'Drop Node onto Canvas',
        serviceId: svc.id,
        tier: svc.tier,
        badge: 'ADD',
        icon: <PlusCircle className="w-4 h-4 text-emerald-400" />,
        action: () => {
          setWorkspaceMode('canvas');
          // Add near center of canvas
          const centerPos = {
            x: Math.floor(400 + Math.random() * 80 - 40),
            y: Math.floor(250 + Math.random() * 80 - 40),
          };
          addServiceNode(svc, centerPos);
          onClose();
        },
      });
    });

    // 3. Reference Architecture Blueprints
    Object.values(SEED_BLUEPRINTS).forEach((bp) => {
      list.push({
        id: `blueprint-${bp.id}`,
        type: 'blueprint',
        title: bp.name,
        subtitle: `${bp.description} (${bp.nodes.length} nodes, ${bp.edges.length} connections)`,
        category: 'Reference Architecture Blueprints',
        badge: bp.category,
        icon: <FileCode2 className="w-4 h-4 text-purple-400" />,
        action: () => {
          setWorkspaceMode('canvas');
          loadTemplate(bp.id);
          onClose();
        },
      });
    });

    // 4. Saved Snapshots in Dexie
    savedDiagrams.forEach((diag) => {
      list.push({
        id: `diag-${diag.id}`,
        type: 'diagram',
        title: diag.name,
        subtitle: `Saved architecture snapshot with ${diag.nodes.length} nodes (${new Date(
          diag.updatedAt
        ).toLocaleDateString()})`,
        category: 'Saved Architecture Diagrams',
        badge: 'SAVED',
        icon: <LayoutGrid className="w-4 h-4 text-amber-400" />,
        action: () => {
          setWorkspaceMode('canvas');
          loadSnapshot(diag.id);
          onClose();
        },
      });
    });

    // 5. Global Actions
    list.push({
      id: 'nav-switch-vault',
      type: 'navigation',
      title: 'Switch to Concept Vault',
      subtitle: 'Browse 30+ AWS architecture dossiers, Mermaid flows & exam tips',
      category: 'Workspace Navigation',
      badge: 'NAV',
      icon: <BookOpen className="w-4 h-4 text-[#FF9900]" />,
      action: () => {
        setWorkspaceMode('vault');
        onClose();
      },
    });

    list.push({
      id: 'nav-switch-canvas',
      type: 'navigation',
      title: 'Switch to Architecture Canvas',
      subtitle: 'Design multi-tier diagrams with Draw.io protocol edges & group boundaries',
      category: 'Workspace Navigation',
      badge: 'NAV',
      icon: <LayoutGrid className="w-4 h-4 text-purple-400" />,
      action: () => {
        setWorkspaceMode('canvas');
        onClose();
      },
    });

    if (onTriggerExport) {
      list.push({
        id: 'action-export-db',
        type: 'navigation',
        title: 'Export Full Database (JSON Backup)',
        subtitle: 'Download complete Dexie.js database including custom notes & diagrams',
        category: 'Database Backup',
        badge: 'BACKUP',
        icon: <Download className="w-4 h-4 text-emerald-400" />,
        action: () => {
          onClose();
          onTriggerExport();
        },
      });
    }

    if (onTriggerImport) {
      list.push({
        id: 'action-import-db',
        type: 'navigation',
        title: 'Import Database (JSON Backup)',
        subtitle: 'Restore Dexie.js services, dossiers, and diagrams from backup file',
        category: 'Database Backup',
        badge: 'RESTORE',
        icon: <Upload className="w-4 h-4 text-sky-400" />,
        action: () => {
          onClose();
          onTriggerImport();
        },
      });
    }

    list.push({
      id: 'action-reset-defaults',
      type: 'navigation',
      title: 'Reset Database to Defaults',
      subtitle: 'Re-seed all 30 AWS services and dossiers to fresh initial state',
      category: 'Database Backup',
      badge: 'RESET',
      icon: <RotateCcw className="w-4 h-4 text-rose-400" />,
      action: async () => {
        if (window.confirm('Reset all catalog services and diagrams to factory seed?')) {
          await resetToDefaults();
          onClose();
        }
      },
    });

    return list;
  }, [
    services,
    savedDiagrams,
    setSelectedServiceId,
    setWorkspaceMode,
    addServiceNode,
    loadTemplate,
    loadSnapshot,
    resetToDefaults,
    onTriggerExport,
    onTriggerImport,
    onClose,
  ]);

  // Filter actions based on search
  const filteredActions = useMemo(() => {
    if (!search.trim()) {
      return actions.slice(0, 40);
    }
    const q = search.toLowerCase().trim();
    return actions.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q) ||
        (a.category && a.category.toLowerCase().includes(q)) ||
        (a.serviceId && a.serviceId.toLowerCase().includes(q))
    );
  }, [actions, search]);

  const [isSearching, setIsSearching] = useState(false);
  const searchTimerRef = useRef<number | null>(null);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setSelectedIndex(0);
    setIsSearching(true);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = window.setTimeout(() => {
      setIsSearching(false);
    }, 280);
  };

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeElem = listRef.current.querySelector('[data-selected="true"]');
    if (activeElem) {
      activeElem.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredActions.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredActions.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredActions[selectedIndex];
        if (selected) {
          selected.action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [filteredActions, selectedIndex, onClose]
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--aws-drawer-bg)',
          borderColor: 'var(--aws-border)',
          color: 'var(--aws-text-primary)',
        }}
        className="w-full max-w-2xl border rounded-[8px] shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div
          style={{
            backgroundColor: 'var(--aws-card-bg)',
            borderBottomColor: 'var(--aws-border)',
          }}
          className="relative flex items-center px-4 border-b transition-[border-color,box-shadow] duration-150 ease-out focus-within:border-[var(--aws-interactive)]"
        >
          <Search className="w-5 h-5 text-[var(--aws-interactive)] shrink-0 mr-3 pointer-events-none" strokeWidth={1.75} aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Type a command, service name (e.g. 'lambda', 's3'), or blueprint..."
            spellCheck={false}
            autoComplete="off"
            style={{ color: 'var(--aws-text-primary)' }}
            className="w-full py-3.5 bg-transparent text-sm placeholder:text-[var(--aws-text-muted)] outline-none caret-[var(--aws-interactive)]"
          />
          <div className="flex items-center shrink-0 ml-2 gap-2">
            {isSearching && (
              <span className="flex items-center justify-center text-[var(--aws-text-muted)] animate-in fade-in duration-150" aria-hidden="true">
                <ClassicV2 size={14} color="var(--aws-text-muted)" />
              </span>
            )}
            {search ? (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                style={{ color: 'var(--aws-text-muted)' }}
                className="p-1 hover:text-[var(--aws-text-primary)] rounded cursor-pointer transition-[opacity,filter,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:scale-100 motion-reduce:blur-[0px]"
                aria-label="Clear search input"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            ) : (
              <kbd
                style={{
                  backgroundColor: 'var(--aws-page-bg)',
                  borderColor: 'var(--aws-border)',
                  color: 'var(--aws-text-muted)',
                }}
                className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-bold border rounded shadow-xs"
              >
                ESC
              </kbd>
            )}
          </div>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          style={{
            borderColor: 'var(--aws-border)',
          }}
          className="flex-1 overflow-y-auto p-2 divide-y divide-[var(--aws-border)] scrollbar-thin custom-scrollbar"
        >
          {filteredActions.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'var(--aws-text-muted)' }}>
              <AWSCompassLogo size={36} className="opacity-40 mx-auto mb-2" />
              <p className="text-sm font-medium" style={{ color: 'var(--aws-text-primary)' }}>
                No matching commands found
              </p>
              <p className="text-xs opacity-75 mt-1">
                Try searching for "microservice", "dynamodb", "vpc", or "blueprint".
              </p>
            </div>
          ) : (
            filteredActions.map((action, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={action.id}
                  data-selected={isSelected}
                  onClick={() => action.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={
                    isSelected
                      ? {
                          backgroundColor: 'var(--aws-page-bg)',
                          borderColor: 'var(--aws-brand)',
                          color: 'var(--aws-text-primary)',
                        }
                      : {
                          color: 'var(--aws-text-primary)',
                          borderColor: 'transparent',
                        }
                  }
                  className={`flex items-center justify-between gap-3 px-3 py-2 rounded-[4px] cursor-pointer transition-colors border ${
                    isSelected ? 'shadow-sm' : 'hover:bg-[var(--aws-page-bg)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {action.serviceId ? (
                      <AWSServiceIcon serviceId={action.serviceId} size={24} className="shrink-0" />
                    ) : (
                      <div className="w-6 h-6 flex items-center justify-center shrink-0 text-[var(--aws-text-muted)]">
                        {action.icon}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs truncate">{action.title}</span>
                        {action.badge && (
                          <span
                            style={{
                              backgroundColor: 'var(--aws-page-bg)',
                              borderColor: 'var(--aws-border)',
                              color: 'var(--aws-text-muted)',
                            }}
                            className="font-mono text-[9px] px-1.5 py-0.2 rounded-[2px] border shrink-0"
                          >
                            {action.badge}
                          </span>
                        )}
                      </div>
                      <p
                        style={{ color: 'var(--aws-text-muted)' }}
                        className="text-[11px] truncate mt-0.5"
                      >
                        {action.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {action.category && (
                      <span
                        style={{ color: 'var(--aws-text-muted)' }}
                        className="hidden md:inline font-mono text-[9px] opacity-80"
                      >
                        {action.category}
                      </span>
                    )}
                    <ArrowRight
                      style={{
                        color: isSelected ? 'var(--aws-brand)' : 'var(--aws-text-muted)',
                      }}
                      className={`w-3.5 h-3.5 ${isSelected ? 'translate-x-0.5' : ''} transition-transform`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div
          style={{
            backgroundColor: 'var(--aws-sidebar-bg)',
            borderColor: 'var(--aws-border)',
            color: 'var(--aws-text-muted)',
          }}
          className="px-4 py-2 border-t flex items-center justify-between text-[11px] select-none"
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-mono">
              <kbd
                style={{
                  backgroundColor: 'var(--aws-page-bg)',
                  borderColor: 'var(--aws-border)',
                  color: 'var(--aws-text-primary)',
                }}
                className="px-1 py-0.5 rounded border text-[10px]"
              >
                ↑
              </kbd>
              <kbd
                style={{
                  backgroundColor: 'var(--aws-page-bg)',
                  borderColor: 'var(--aws-border)',
                  color: 'var(--aws-text-primary)',
                }}
                className="px-1 py-0.5 rounded border text-[10px]"
              >
                ↓
              </kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1 font-mono">
              <kbd
                style={{
                  backgroundColor: 'var(--aws-page-bg)',
                  borderColor: 'var(--aws-border)',
                  color: 'var(--aws-text-primary)',
                }}
                className="px-1 py-0.5 rounded border text-[10px]"
              >
                ↵
              </kbd>
              <span>to select</span>
            </span>
            <span className="flex items-center gap-1 font-mono">
              <kbd
                style={{
                  backgroundColor: 'var(--aws-page-bg)',
                  borderColor: 'var(--aws-border)',
                  color: 'var(--aws-text-primary)',
                }}
                className="px-1 py-0.5 rounded border text-[10px]"
              >
                esc
              </kbd>
              <span>to close</span>
            </span>
          </div>

          <div
            style={{ color: 'var(--aws-brand)' }}
            className="font-mono text-[10px] font-semibold"
          >
            {filteredActions.length} commands available
          </div>
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
