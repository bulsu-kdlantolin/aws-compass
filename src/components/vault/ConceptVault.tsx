import React, { useState, useMemo, useRef, memo } from 'react';
import Markdown from 'react-markdown';
import {
  ExternalLink,
  Edit3,
  BookOpen,
  RotateCcw,
  Save,
  Check,
  Star,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ChevronRight,
  Plus,
  Layers,
  Boxes,
  ArrowLeftRight,
} from 'lucide-react';
import { useCompassStore } from '../../store/useCompassStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useCompareStore } from '../../store/useCompareStore';
import type { AWSService } from '../../types/aws';
import { MermaidViewer } from './MermaidViewer';
import { SEED_SERVICES } from '../../db/seedServices';
import { SEED_BLUEPRINTS } from '../../db/seedBlueprints';
import { AWSServiceIcon } from '../icons/AWSServiceIcon';
import { ServiceCatalog } from '../catalog/ServiceCatalog';
import { CloudscapeAlert } from '../ui/CloudscapeAlert';
import { CodeFrame } from '../ui/CodeFrame';
import { DocToc, type TocItem } from './DocToc';
import { CloudscapeSearchInput } from '../ui/CloudscapeSearchInput';
import { AnimatedIcon } from '../ui/AnimatedIcon';
import { AnimatePresence, m } from 'motion/react';
import { SPRING_SMOOTH } from '../../utils/motionTokens';
import { CloudscapeSelect, type CloudscapeSelectOption } from '../ui/CloudscapeSelect';
import { CloudscapeCopyButton } from '../ui/CloudscapeCopyButton';
import { useSettingsStore } from '../../store/useSettingsStore';
import { getAWSCategoryColor } from '../../utils/awsCategoryColors';
import { getVerifiedAWSDocsUrl } from '../../utils/awsDocs';
import { CompareFloatingTray } from './CompareFloatingTray';
import { ServiceComparisonModal } from './ServiceComparisonModal';

/* -------------------------------------------------------------------------- */
/*                           CLOUDSCAPE RESOURCE TABLE                        */
/* -------------------------------------------------------------------------- */

type SortKey = 'name' | 'category' | 'tier' | 'favorite';

const ConceptVaultTable: React.FC<{
  services: AWSService[];
  onSelectService: (id: string) => void;
}> = memo(({ services, onSelectService }) => {
  const isSidebarOpen = useCompassStore((s) => s.isSidebarOpen);
  const toggleFavorite = useCompassStore((s) => s.toggleFavorite);
  const filter = useCompassStore((s) => s.filter);
  const setFavoritesFilter = useCompassStore((s) => s.setFavoritesFilter);
  const uiDensity = useSettingsStore((s) => s.uiDensity);
  const isCompact = uiDensity === 'compact';

  const comparedServiceIds = useCompareStore((s) => s.comparedServiceIds);
  const toggleCompareService = useCompareStore((s) => s.toggleCompareService);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortKey, setSortKey] = useState<SortKey>('tier');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // When only showing favorites, base services are strictly the favorited services
  const baseServices = useMemo(() => {
    return filter.favoritesOnly ? services.filter((s) => s.isFavorite) : services;
  }, [services, filter.favoritesOnly]);

  // Categories to display: when favoritesOnly is active, only include categories that actually have favorites!
  const categories = useMemo(() => {
    const set = new Set<string>();
    baseServices.forEach((s) => set.add(s.category));
    return ['All', ...Array.from(set).sort()];
  }, [baseServices]);

  // Reset category filter to 'All' if selected category is not in available categories
  React.useEffect(() => {
    if (categoryFilter !== 'All' && !categories.includes(categoryFilter)) {
      setCategoryFilter('All');
    }
  }, [categoryFilter, categories]);

  const categoryOptions: CloudscapeSelectOption[] = useMemo(() => {
    return categories.map((cat) => {
      const count =
        cat === 'All'
          ? baseServices.length
          : baseServices.filter((s) => s.category === cat).length;

      const dotColor =
        cat === 'All' ? 'var(--aws-interactive)' : getAWSCategoryColor(cat, 'dark');

      return {
        value: cat,
        label: cat === 'All' ? 'All categories' : cat,
        count,
        icon: (
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: dotColor }}
            aria-hidden="true"
          />
        ),
      };
    });
  }, [categories, baseServices]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedServices = useMemo(() => {
    let result = baseServices.filter((svc) => {
      if (categoryFilter !== 'All' && svc.category !== categoryFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        return (
          svc.id.toLowerCase().includes(q) ||
          svc.name.toLowerCase().includes(q) ||
          svc.summary.toLowerCase().includes(q) ||
          svc.category.toLowerCase().includes(q)
        );
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortKey === 'category') {
        cmp = a.category.localeCompare(b.category);
      } else if (sortKey === 'tier') {
        cmp = a.tier - b.tier;
      } else if (sortKey === 'favorite') {
        cmp = a.isFavorite === b.isFavorite ? 0 : a.isFavorite ? -1 : 1;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [baseServices, search, categoryFilter, sortKey, sortOrder]);

  const hasActiveFilters = search.trim().length > 0 || categoryFilter !== 'All' || filter.favoritesOnly;
  const rowPad = isCompact ? 'py-1.5' : 'py-3';
  const headPad = isCompact ? 'py-1.5' : 'py-2.5';

  return (
    <div
      style={{ backgroundColor: 'var(--aws-page-bg)' }}
      className={`flex flex-col h-full overflow-hidden ${!isSidebarOpen ? 'pl-24 pr-4 sm:pr-6 pt-4 sm:pt-6 pb-4 sm:pb-6' : 'p-4 sm:p-6'}`}
    >
      <div className="max-w-7xl w-full mx-auto flex flex-col h-full overflow-hidden space-y-4">
        {/* Table Title */}
        <div className="shrink-0">
          <h1
            style={{ color: 'var(--aws-text-primary)' }}
            className="text-[20px] font-bold leading-[24px]"
          >
            AWS Services
          </h1>
          <p
            style={{ color: 'var(--aws-text-muted)' }}
            className="text-[12px] leading-[16px] mt-0.5"
          >
            Official AWS service documentation, architectural primitives, CLI references, and system blueprints.
          </p>
        </div>

        {/* Outer Cloudscape Container (8px radius, single 1px border) */}
        <div
          style={{
            backgroundColor: 'var(--aws-card-bg)',
            borderColor: 'var(--aws-border)',
          }}
          className="border rounded-[8px] flex flex-col flex-1 overflow-hidden"
        >
          {/* Header Bar with Search & Filter */}
          <div
            style={{
              borderBottomColor: 'var(--aws-border)',
            }}
            className="px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 relative z-20"
          >
            <div className="flex items-center gap-3 flex-1 min-w-[300px] max-w-2xl">
              <CloudscapeSearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search services by name, ID, category, or CLI prefix..."
                ariaLabel="Filter services"
                className="flex-1 min-w-[220px]"
                size="md"
              />

              {/* Category Select */}
              <CloudscapeSelect
                value={categoryFilter}
                options={categoryOptions}
                onChange={setCategoryFilter}
                ariaLabel="Filter by category"
                placeholder="All categories"
                className="w-56 shrink-0"
              />
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span
                style={{ color: 'var(--aws-text-muted)' }}
                className="text-[12px] font-mono"
              >
                {hasActiveFilters
                  ? `Showing ${filteredAndSortedServices.length} of ${services.length} services`
                  : `${services.length} services`}
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setCategoryFilter('All');
                    setFavoritesFilter(false);
                  }}
                  className="text-[11px] font-medium text-[var(--aws-interactive)] hover:underline cursor-pointer bg-transparent border-0 p-0"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Sticky Header Table */}
          <div className="flex-1 overflow-y-auto scrollbar-thin custom-scrollbar">
            <table className="w-full border-collapse text-left select-none">
              <thead
                style={{
                  backgroundColor: 'var(--aws-page-bg)',
                  borderBottomColor: 'var(--aws-border)',
                  color: 'var(--aws-text-muted)',
                }}
                className="sticky top-0 z-10 border-b text-[12px] leading-[16px] font-semibold"
              >
                <tr>
                  <th
                    scope="col"
                    onClick={() => handleSort('favorite')}
                    className={`w-14 px-1.5 ${headPad} text-center cursor-pointer hover:text-[var(--aws-text-primary)] transition-colors`}
                    title="Sort by favorites"
                  >
                    <Star className={`w-3.5 h-3.5 mx-auto ${sortKey === 'favorite' ? 'text-[#FF9900] fill-[#FF9900]' : 'opacity-60'}`} />
                  </th>
                  <th
                    scope="col"
                    onClick={() => handleSort('name')}
                    className={`px-4 ${headPad} cursor-pointer hover:text-[var(--aws-text-primary)] transition-colors`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Service</span>
                      {sortKey === 'name' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    onClick={() => handleSort('category')}
                    className={`px-4 ${headPad} cursor-pointer hover:text-[var(--aws-text-primary)] transition-colors`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Category</span>
                      {sortKey === 'category' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    onClick={() => handleSort('tier')}
                    className={`px-4 ${headPad} cursor-pointer hover:text-[var(--aws-text-primary)] transition-colors`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Tier</span>
                      {sortKey === 'tier' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th scope="col" className={`px-4 ${headPad}`}>
                    CLI prefix
                  </th>
                  <th scope="col" className={`px-4 ${headPad} hidden lg:table-cell`}>
                    Summary
                  </th>
                </tr>
              </thead>
              <tbody
                style={{
                  borderColor: 'var(--aws-border)',
                }}
                className="divide-y divide-[var(--aws-border)] text-[13px] leading-[18px]"
              >
                {filteredAndSortedServices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-12 text-[var(--aws-text-muted)] text-[13px]"
                    >
                      {filter.favoritesOnly
                        ? 'No favorite services found. Click the star icon next to any service to add it to your favorites.'
                        : 'No services match the current filters.'}
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedServices.map((svc) => {
                    const isCompared = comparedServiceIds.includes(svc.id);
                    return (
                      <tr
                        key={svc.id}
                        onClick={() => onSelectService(svc.id)}
                        className={`group hover:bg-[var(--aws-page-bg)] cursor-pointer transition-colors ${rowPad}`}
                      >
                        {/* Favorite & Compare toggle buttons */}
                        <td
                          className={`w-14 px-1.5 ${rowPad} text-center`}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(svc.id);
                              }}
                              className="p-1 rounded-[4px] hover:bg-[var(--aws-card-bg)] text-[var(--aws-text-muted)] hover:text-[#FF9900] transition-colors cursor-pointer enabled:active:scale-[0.96]"
                              title={svc.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                              aria-label={svc.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <AnimatedIcon iconKey={svc.isFavorite ? 'fav' : 'unfav'} size={15}>
                                <Star
                                  className={`w-3.5 h-3.5 transition-transform active:scale-90 ${svc.isFavorite
                                      ? 'fill-[#FF9900] text-[#FF9900]'
                                      : 'text-[var(--aws-text-muted)] hover:text-[#FF9900]'
                                    }`}
                                />
                              </AnimatedIcon>
                            </button>

                            {/* Subtle borderless Compare icon toggle on row hover */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCompareService(svc.id);
                              }}
                              className={`p-1 rounded-[4px] transition-all cursor-pointer enabled:active:scale-[0.96] ${isCompared
                                  ? 'text-[#0972D3] dark:text-[#539FE5] bg-[#0972D3]/15 dark:bg-[#539FE5]/20 opacity-100'
                                  : 'text-[var(--aws-text-muted)] hover:text-[#0972D3] dark:hover:text-[#539FE5] hover:bg-[var(--aws-card-bg)] opacity-0 group-hover:opacity-100'
                                }`}
                              title={
                                isCompared
                                  ? `Remove ${svc.shortName || svc.name} from comparison`
                                  : `Compare ${svc.shortName || svc.name} (max 3)`
                              }
                              aria-label={isCompared ? `Remove ${svc.name} from comparison` : `Compare ${svc.name}`}
                              aria-pressed={isCompared}
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                            </button>
                          </div>
                        </td>

                        {/* Service column with AWSServiceIcon */}
                        <td className={`px-4 ${rowPad}`}>
                          <div className="flex items-center gap-2.5">
                            <AWSServiceIcon
                              serviceId={svc.id}
                              size={isCompact ? 20 : 24}
                              className="shrink-0"
                            />
                            <div className="min-w-0">
                              <span
                                style={{ color: 'var(--aws-text-primary)' }}
                                className="font-medium hover:text-[var(--aws-interactive)] hover:underline truncate block"
                              >
                                {svc.name}
                              </span>
                              <span className="text-[11px] font-mono text-[var(--aws-text-muted)] uppercase">
                                {svc.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td
                          style={{ color: 'var(--aws-text-primary)' }}
                          className={`px-4 ${rowPad}`}
                        >
                          {svc.category}
                        </td>

                        {/* Tier */}
                        <td className={`px-4 ${rowPad} text-[12px]`}>
                          <span
                            className={`text-[11px] font-mono font-medium tabular-nums ${svc.tier === 1
                              ? 'text-[#FF9900]/90'
                              : svc.tier === 2
                                ? 'text-[#539FE5]/90'
                                : 'text-[#879596]'
                              }`}
                          >
                            {svc.tier === 1
                              ? 'T1 · Core'
                              : svc.tier === 2
                                ? 'T2 · Enterprise'
                                : 'T3 · Specialized'}
                          </span>
                        </td>

                        {/* CLI Prefix */}
                        <td className={`px-4 ${rowPad} font-mono text-[12px] text-[#0972D3] dark:text-[#539FE5]`}>
                          aws {svc.id}
                        </td>

                        {/* Summary */}
                        <td
                          style={{ color: 'var(--aws-text-muted)' }}
                          className={`px-4 ${rowPad} text-[12px] hidden lg:table-cell max-w-xs xl:max-w-md truncate`}
                        >
                          {svc.summary}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*                           SERVICE DOSSIER CONTENT                          */
/* -------------------------------------------------------------------------- */

interface ServiceDossierContentProps {
  service: AWSService;
  onBackToTable: () => void;
  onUpdateDoc: (id: string, markdownDoc: string) => Promise<void>;
}

const ServiceDossierContent: React.FC<ServiceDossierContentProps> = memo(({
  service,
  onBackToTable,
  onUpdateDoc,
}) => {
  const isSidebarOpen = useCompassStore((s) => s.isSidebarOpen);
  const toggleFavorite = useCompassStore((s) => s.toggleFavorite);
  const setWorkspaceMode = useCompassStore((s) => s.setWorkspaceMode);

  const addCompareService = useCompareStore((s) => s.addCompareService);
  const openCompareModal = useCompareStore((s) => s.openCompareModal);

  const savedDiagrams = useCanvasStore((s) => s.savedDiagrams);
  const loadTemplate = useCanvasStore((s) => s.loadTemplate);
  const loadSnapshot = useCanvasStore((s) => s.loadSnapshot);
  const createBlankBlueprint = useCanvasStore((s) => s.createBlankBlueprint);
  const addServiceNode = useCanvasStore((s) => s.addServiceNode);

  const [isEditing, setIsEditing] = useState(false);
  const [editorContent, setEditorContent] = useState(service.markdownDoc);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const lineCount = useMemo(() => editorContent.split('\n').length, [editorContent]);

  const handleSaveDoc = async () => {
    await onUpdateDoc(service.id, editorContent);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
    setIsEditing(false);
  };

  const handleResetToSeed = async () => {
    const original = SEED_SERVICES.find((s) => s.id === service.id);
    if (original) {
      setEditorContent(original.markdownDoc);
      await onUpdateDoc(service.id, original.markdownDoc);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  const handleAddToCanvas = () => {
    const canvasNodes = useCanvasStore.getState().nodes;
    let targetPos = { x: 260, y: 220 };
    if (canvasNodes.length > 0) {
      const maxX = Math.max(...canvasNodes.map((n) => n.position.x));
      const avgY = canvasNodes.reduce((acc, n) => acc + n.position.y, 0) / canvasNodes.length;
      targetPos = {
        x: maxX + 220,
        y: Math.max(80, Math.round(avgY / 16) * 16),
      };
    }
    addServiceNode(service, targetPos);
    setWorkspaceMode('canvas');
  };

  // Blueprints that reference this service
  const matchingBlueprints = useMemo(() => {
    const all: Array<{
      id: string;
      name: string;
      description: string;
      nodes: any[];
      edges: any[];
      isTemplate: boolean;
    }> = [
        ...Object.values(SEED_BLUEPRINTS).map((b) => ({ ...b, isTemplate: true })),
        ...savedDiagrams.map((d) => ({ ...d, isTemplate: false })),
      ];

    return all.filter((bp) =>
      bp.nodes.some(
        (n) =>
          n.data?.serviceId === service.id ||
          n.id.toLowerCase().includes(service.id.toLowerCase()) ||
          n.data?.label?.toLowerCase().includes(service.name.toLowerCase()) ||
          n.data?.customTitle?.toLowerCase().includes(service.name.toLowerCase())
      )
    );
  }, [service.id, service.name, savedDiagrams]);

  const handleOpenBlueprint = (blueprint: { id: string; nodes: any[]; isTemplate: boolean }) => {
    if (blueprint.isTemplate) {
      loadTemplate(blueprint.id);
    } else {
      loadSnapshot(blueprint.id);
    }

    setTimeout(() => {
      const currentNodes = useCanvasStore.getState().nodes;
      const match = currentNodes.find(
        (n) =>
          n.data?.serviceId === service.id ||
          n.id.toLowerCase().includes(service.id.toLowerCase())
      );
      if (match) {
        useCanvasStore.setState({
          selectedNodeId: match.id,
          isInspectorOpen: true,
        });
      }
      setWorkspaceMode('canvas');
    }, 60);
  };

  const handleCreateBlueprintWithService = () => {
    createBlankBlueprint();
    addServiceNode(service, { x: 300, y: 220 });
    setWorkspaceMode('canvas');
  };

  const tocItems: TocItem[] = [
    { id: 'section-1', label: 'Core Purpose', number: '1' },
    { id: 'section-2', label: 'Architectural Primitives', number: '2' },
    { id: 'section-3', label: 'Enterprise Flow', number: '3' },
    { id: 'section-4', label: 'Canvas Connections', number: '4' },
    { id: 'section-5', label: 'Gotchas & Warnings', number: '5' },
    { id: 'section-6', label: 'CLI Commands', number: '6' },
    { id: 'section-blueprints', label: 'Referenced Blueprints' },
  ];

  return (
      <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-[#0B0F19]">
        {/* Top Breadcrumb & Action Bar */}
        <div
          className={`sticky top-0 z-20 h-12 ${!isSidebarOpen ? 'pl-24 pr-4 sm:pr-8' : 'px-4 sm:px-8'} bg-white/85 dark:bg-[#0B0F19]/85 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.07] shrink-0 flex items-center justify-between gap-3 select-none`}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[13px]">
            <button
              type="button"
              onClick={onBackToTable}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer font-medium text-[13px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Services</span>
            </button>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="text-slate-900 dark:text-white font-semibold truncate text-[13px]">
                {service.name}
              </span>
          </div>

          {/* View / Edit Mode, Favorite & Canvas Bridge */}
          <div className="flex items-center gap-1.5">
            {/* Favorite Ghost Button */}
            <button
              type="button"
              onClick={() => toggleFavorite(service.id)}
            className={`flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 h-8 rounded-[7px] transition-all duration-150 cursor-pointer enabled:active:scale-[0.96] select-none ${service.isFavorite
                ? 'bg-[#FF9900]/15 text-[#FF9900]'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
              }`}
            title={service.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-label="Toggle favorite"
          >
              <AnimatedIcon activeKey={service.isFavorite ? 'fav' : 'unfav'} size={14}>
                <Star
                  className={`w-3.5 h-3.5 transition-colors ${service.isFavorite ? 'fill-[#FF9900] text-[#FF9900]' : ''
                    }`}
                />
              </AnimatedIcon>
              <span>Favorite</span>
            </button>

            {/* 1px Vertical Divider */}
            <div className="h-4 w-px bg-slate-200 dark:bg-white/[0.08] mx-1" aria-hidden="true" />

            {/* Read / Edit Sunken Borderless Segmented Pill with sliding indicator */}
              <div className="relative flex items-center p-0.5 rounded-[7px] bg-slate-100 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.06] select-none">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
              className={`relative flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium rounded-[5px] transition-colors cursor-pointer ${!isEditing
                    ? 'text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  {!isEditing && (
                    <m.span
                      layoutId="read-edit-pill"
                      className="pointer-events-none absolute inset-0 rounded-[5px] bg-white dark:bg-[#1E293B] shadow-xs"
                      transition={SPRING_SMOOTH}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <BookOpen
                      className={`w-3.5 h-3.5 ${!isEditing ? 'text-[#FF9900]' : 'opacity-70'}`}
                      strokeWidth={2}
                    />
                    <span>Read</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditorContent(service.markdownDoc);
                    setIsEditing(true);
                  }}
              className={`relative flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium rounded-[5px] transition-colors cursor-pointer ${isEditing
                    ? 'text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  {isEditing && (
                    <m.span
                      layoutId="read-edit-pill"
                      className="pointer-events-none absolute inset-0 rounded-[5px] bg-white dark:bg-[#1E293B] shadow-xs"
                      transition={SPRING_SMOOTH}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Edit3
                      className={`w-3.5 h-3.5 ${isEditing ? 'text-[#FF9900]' : 'opacity-70'}`}
                      strokeWidth={2}
                    />
                    <span>Edit</span>
                  </span>
                </button>
              </div>

              {/* 1px Vertical Divider */}
              <div className="h-4 w-px bg-slate-200 dark:bg-white/[0.08] mx-1" aria-hidden="true" />

              {/* + Add to Canvas Ghost Button */}
              <button
                type="button"
                onClick={handleAddToCanvas}
                className="flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 h-8 rounded-[7px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-[#FF9900] active:scale-[0.98] transition-all duration-150 cursor-pointer select-none"
                title={`Add ${service.name} node to active architecture canvas`}
                aria-label={`Add ${service.name} to canvas`}
              >
                <Plus className="w-3.5 h-3.5 text-[#FF9900]" strokeWidth={2.5} />
                <span>Add to Canvas</span>
              </button>

              {/* Compare with... Ghost Button */}
              <button
                type="button"
                onClick={() => {
                  addCompareService(service.id);
                  openCompareModal();
                }}
                className="flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 h-8 rounded-[7px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-[#0972D3] dark:hover:text-[#539FE5] active:scale-[0.98] transition-all duration-150 cursor-pointer select-none"
                title={`Compare ${service.shortName || service.name} with other AWS services`}
                aria-label={`Compare ${service.name} with other services`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#0972D3] dark:text-[#539FE5]" strokeWidth={2} />
                <span>Compare with…</span>
              </button>

              {/* External AWS Docs Ghost Button */}
              {(() => {
                const docsUrl = getVerifiedAWSDocsUrl(service.id, service.docsUrl);
                if (!docsUrl) return null;
                return (
                  <>
                    <div className="h-4 w-px bg-slate-200 dark:bg-white/[0.08] mx-1" aria-hidden="true" />
                    <a
                      href={docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 h-8 rounded-[7px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-[#0972D3] dark:hover:text-[#539FE5] active:scale-[0.98] transition-all duration-150 cursor-pointer select-none"
                      title="Open official AWS documentation in a new tab"
                      aria-label={`Open official ${service.name} documentation`}
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0972D3] dark:group-hover:text-[#539FE5] transition-colors" />
                      <span>AWS docs ↗</span>
                    </a>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Main Workspace Body */}
                  {isEditing ? (
                    /* Modern Split-Screen Code Editor */
                    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-white dark:bg-[#0B0F19]">
                      {/* Top Editor Tab Bar */}
                      <div className="h-11 px-4 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.07] flex items-center justify-between shrink-0 select-none">
                        {/* File tab pill */}
                        <div className="flex items-center gap-2 px-3 py-1 rounded-[6px] bg-slate-100 dark:bg-[#111726] border border-slate-200/80 dark:border-white/[0.07] text-[12px] font-mono text-slate-700 dark:text-slate-200 font-medium">
                          <span className="w-2 h-2 rounded-full bg-[#FF9900]" />
                          <span>dossier.md</span>
                        </div>

            <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleResetToSeed}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-[7px] border border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300 text-[12px] font-medium transition-colors cursor-pointer"
                            >
                < RotateCcw className="w-3 h-3" />
                              <span>Reset to seed</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveDoc}
                              className="flex items-center gap-1.5 px-3.5 py-1 rounded-[7px] font-bold text-[12px] bg-[#FF9900] text-[#0F141A] hover:bg-[#EC7211] transition-all enabled:active:scale-[0.96] cursor-pointer shadow-xs"
                            >
                              {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                              <span>{savedSuccess ? 'Saved' : 'Save changes'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Split Panes: Left = Live Preview, Right = Code Editor */}
                        <div className="grid grid-cols-1 md:grid-cols-2 flex-1 min-h-0 overflow-hidden">
                          {/* Left: Concept Screen (Live Preview) */}
                          <div className="flex flex-col h-full border-r border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#0B0F19] overflow-hidden">
                            <div className="h-8 px-4 border-b border-slate-200/80 dark:border-white/[0.07] text-[11px] font-medium flex items-center justify-between text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-white/[0.02] shrink-0 select-none">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">Concept Preview</span>
                              <span>Live rendered</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 sm:p-8 vault-prose scrollbar-thin custom-scrollbar">
                              <Markdown
                                components={{
                                  code(props) {
                                    const { children, className, ...rest } = props;
                                    const match = /language-(\w+)/.exec(className || '');
                                    const language = match ? match[1] : '';
                                    if (language === 'mermaid') {
                                      return <MermaidViewer chart={String(children).replace(/\n$/, '')} service={service} />;
                                    }
                                    if (language === 'bash' || language === 'sh' || language === 'shell') {
                                      return (
                                        <CodeFrame
                                          code={String(children).replace(/\n$/, '')}
                                          title={`aws ${service.id}`}
                                          language="bash"
                                        />
                                      );
                                    }
                                    return (
                                      <code className={className} {...rest}>
                                        {children}
                                      </code>
                                    );
                                  },
                                }}
                              >
                            {editorContent}
                          </Markdown>
                        </div>
                      </div>

                        {/* Right: Code Editor with Line Numbers */}
                        <div className="flex flex-col h-full bg-[#0F172A] overflow-hidden">
                          <div className="h-8 px-4 border-b border-white/[0.08] text-[11px] font-medium flex items-center justify-between text-slate-400 bg-[#0B1120] shrink-0 select-none">
                            <span className="font-semibold text-slate-200">Markdown Source</span>
                            <span>Supports Mermaid & CLI</span>
                          </div>
                          <div className="flex-1 flex min-h-0 overflow-hidden relative">
                            {/* Line Numbers Column */}
                            <div
                              ref={lineNumbersRef}
                              className="w-11 py-4 pr-3 text-right font-mono text-[13px] leading-[1.65] text-slate-600 select-none bg-[#0B1120] border-r border-white/[0.06] overflow-hidden shrink-0"
                            >
                              {Array.from({ length: lineCount }, (_, i) => (
                                <div key={i + 1}>{i + 1}</div>
                              ))}
                            </div>
                            {/* Editor Textarea */}
                            <textarea
                              value={editorContent}
                              onChange={(e) => setEditorContent(e.target.value)}
                              onScroll={(e) => {
                                if (lineNumbersRef.current) {
                                  lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
                                }
                              }}
                              placeholder="Enter markdown document with mermaid diagrams..."
                              spellCheck={false}
                              className="flex-1 h-full bg-transparent text-slate-100 font-mono text-[13px] leading-[1.65] p-4 resize-none outline-none selection:bg-[#3B82F6]/30 overflow-y-auto scrollbar-thin custom-scrollbar border-0"
                            />
                          </div>
                        </div>
                      </div>
        </div>
                          ) : (
                          /* Reading View Layout */
                          <div
                            ref={scrollContainerRef}
                            className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-12 py-8 scrollbar-thin custom-scrollbar bg-white dark:bg-[#0B0F19]"
                          >
                            <div className="max-w-[1100px] mx-auto flex items-start gap-12">
                              {/* Main Content Column */}
                              <div className="flex-1 min-w-0 max-w-[780px] pb-24">
                                {/* Editorial Hero Header (NO OUTER BORDER BOX) */}
                                <div className="space-y-4">
                                  {/* Eyebrow Row: Category pill + Tier badge + CLI pill */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.06]">
                                      {service.category}
                                    </span>
                                    <span
                                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-mono font-medium border ${service.tier === 1
                                        ? 'text-[#FF9900] bg-[#FF9900]/10 border-[#FF9900]/20'
                                        : service.tier === 2
                                          ? 'text-[#0972D3] dark:text-[#539FE5] bg-[#0972D3]/10 dark:bg-[#539FE5]/10 border-[#0972D3]/20 dark:border-[#539FE5]/20'
                                          : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.06] border-slate-200/60 dark:border-white/[0.06]'
                                        }`}
                                    >
                                      {service.tier === 1
                                        ? 'Tier 1 · Core & Popular'
                                        : service.tier === 2
                                          ? 'Tier 2 · Enterprise'
                                          : 'Tier 3 · Specialized'}
                                    </span>
                                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-mono text-[#0972D3] dark:text-[#539FE5] bg-[#0972D3]/5 dark:bg-[#539FE5]/10 border border-[#0972D3]/20 dark:border-[#539FE5]/20">
                                      aws {service.id}
                                    </span>
                                  </div>

                                  {/* Main Title Row: 40x40 Icon + 26px Bold Title */}
                                  <div className="flex items-center gap-3.5 pt-1">
                                    <div className="p-1 rounded-[10px] bg-slate-100 dark:bg-white/[0.06] border border-slate-200/70 dark:border-white/[0.07] shrink-0">
                                      <AWSServiceIcon serviceId={service.id} category={service.category} size={40} />
                                    </div>
                                    <div>
                                      <h1 className="text-[26px] font-bold tracking-[-0.025em] text-slate-900 dark:text-white leading-tight">
                                        {service.name}
                                      </h1>
                                      <span className="text-[12px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                                        {service.id}
                                      </span>
                                    </div>
                                  </div>

                                      {/* Interactive Single-Line Sunken ARN Bar */}
                                      {service.arnExample && (
                                        <div className="mt-4 px-3.5 py-2 rounded-[8px] bg-slate-50 dark:bg-[#111726] border border-slate-200/80 dark:border-white/[0.07] flex items-center justify-between gap-3 text-[12px] font-mono">
                                          <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-slate-400 dark:text-slate-500 shrink-0 font-sans text-[11px] font-medium">
                                              ARN pattern:
                                            </span>
                                              <span className="text-slate-800 dark:text-slate-200 truncate select-all">
                                                {service.arnExample}
                                              </span>
                                          </div>
                                          <CloudscapeCopyButton
                                            textToCopy={service.arnExample}
                                            ariaLabel="Copy ARN pattern"
                                            showLabel={false}
                                            className="shrink-0"
                                          />
                                        </div>
                                      )}

                                    {/* 1px Hairline Divider separating Hero Header from Markdown Prose */}
                                    <div className="pt-4 pb-2 border-b border-slate-200/80 dark:border-white/[0.07]" aria-hidden="true" />
                                  </div>

                                            {/* Seamless Dossier Prose */ }
                                            <div className="vault-prose pt-4">
                                              <Markdown
                                                components={{
                                                  h2(props) {
                                                    const text = String(props.children);
                                                    let id = '';
                                                    if (text.includes('1.') || text.toLowerCase().includes('core purpose')) id = 'section-1';
                                                    else if (text.includes('2.') || text.toLowerCase().includes('primitives')) id = 'section-2';
                                                    else if (text.includes('3.') || text.toLowerCase().includes('flow')) id = 'section-3';
                                                    else if (text.includes('4.') || text.toLowerCase().includes('canvas connections')) id = 'section-4';
                                                    else if (text.includes('5.') || text.toLowerCase().includes('gotchas')) id = 'section-5';
                                                    else if (text.includes('6.') || text.toLowerCase().includes('cli')) id = 'section-6';

                                                    return (
                                                      <h2 id={id} className="scroll-mt-14" {...props}>
                                                        {props.children}
                                                      </h2>
                                                    );
                                                  },
                                                  code(props) {
                                                    const { children, className, ...rest } = props;
                                                    const match = /language-(\w+)/.exec(className || '');
                                                    const language = match ? match[1] : '';
                                                    const codeContent = String(children).replace(/\n$/, '');

                                        if(language === 'mermaid') {
                        return <MermaidViewer chart={codeContent} service={service} />;
                      }
                                    if (language === 'bash' || language === 'sh' || language === 'shell') {
                        return (
                                    <CodeFrame
                                      code={codeContent}
                                      title={`aws ${service.id}`}
                                      language="bash"
                                    />
                                    );
                      }
                                    return (
                                    <code className={className} {...rest}>
                                      {children}
                                    </code>
                                    );
                    },
                                    blockquote(props) {
                      return (
                                    <CloudscapeAlert
                                      type="warning"
                                      header="Exam & Production Gotcha"
                                      className="my-5"
                                    >
                                      {props.children}
                                    </CloudscapeAlert>
                                    );
                    },
                  }}
                >
                                      {service.markdownDoc}
                                    </Markdown>
                                  </div>

                                  {/* Referenced in Blueprints Section */}
                                  <div
                                    id="section-blueprints"
                                    className="pt-10 mt-12 border-t border-slate-200/80 dark:border-white/[0.07] scroll-mt-14"
                                  >
                                    <div className="flex items-center justify-between pb-4 mb-6">
                                      <div className="flex items-center gap-2.5">
                                        <Boxes className="w-4 h-4 text-[#FF9900]" />
                                        <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">
                                          Referenced in Blueprints
                                        </h3>
                                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.06]">
                                          {matchingBlueprints.length} {matchingBlueprints.length === 1 ? 'diagram' : 'diagrams'}
                                        </span>
                                      </div>

                  <button
                    type="button"
                    onClick={handleCreateBlueprintWithService}
                    className="flex items-center gap-1.5 text-[12px] font-semibold text-[#FF9900] hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Blueprint with {service.name}</span>
                  </button>
                </div>

                {matchingBlueprints.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matchingBlueprints.map((bp) => (
                      <div
                        key={bp.id}
                        className="rounded-[10px] bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.07] p-4 flex flex-col justify-between hover:border-[#FF9900]/50 transition-all group"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[13px] font-semibold text-slate-900 dark:text-white truncate group-hover:text-[#FF9900] transition-colors">
                              {bp.name}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-[4px] border ${bp.isTemplate
                                ? 'bg-[#0972D3]/10 text-[#0972D3] dark:text-[#539FE5] border-[#0972D3]/20'
                                : 'bg-[#1D8102]/10 text-[#1D8102] dark:text-[#38D9A9] border-[#1D8102]/20'
                                }`}
                            >
                              {bp.isTemplate ? 'Template' : 'Custom'}
                            </span>
                          </div>
                          <p className="text-[12px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                            {bp.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/60 dark:border-white/[0.06] text-[11px]">
                          <span className="font-mono text-slate-400 dark:text-slate-500">
                            {bp.nodes.length} nodes · {bp.edges.length} edges
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenBlueprint(bp)}
                            className="flex items-center gap-1 font-semibold text-[#0972D3] dark:text-[#539FE5] hover:underline cursor-pointer"
                          >
                            <span>Open in Canvas</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                                          ) : (
                                          <div className="rounded-[10px] border border-dashed border-slate-200 dark:border-white/[0.08] p-8 text-center bg-slate-50/40 dark:bg-white/[0.01]">
                                            <Layers className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2.5 opacity-60" />
                                            <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 mb-1">
                                              No blueprints currently reference {service.name}
                                            </p>
                                            <p className="text-[12px] text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
                                              You can add {service.name} to your active canvas or create a new dedicated architecture blueprint.
                                            </p>
                                            <div className="flex items-center justify-center gap-3">
                                              <button
                                                type="button"
                                                onClick={handleAddToCanvas}
                                                className="h-8 px-3.5 rounded-[7px] bg-[#FF9900] text-[#0F141A] font-bold text-[12px] hover:bg-[#EC7211] active:scale-[0.98] transition-all cursor-pointer shadow-xs"
                                              >
                        + Add to Active Canvas
                                            </button>
                                            <button
                                              type="button"
                                              onClick={handleCreateBlueprintWithService}
                                              className="h-8 px-3.5 rounded-[7px] border border-slate-200/90 dark:border-white/[0.09] bg-white dark:bg-[#111726] text-slate-800 dark:text-slate-200 text-[12px] font-medium hover:border-[#FF9900]/40 transition-all cursor-pointer shadow-2xs"
                                            >
                                            Create New Blueprint
                                          </button>
                                        </div>
                                  </div>
                )}
                                </div>
                              </div>

                            {/* Sticky Table of Contents on xl viewports */}
                            <DocToc items={tocItems} containerRef={scrollContainerRef} />
                          </div>
                      </div>
      )}
                    </div>
                  );
});

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                               */
/* -------------------------------------------------------------------------- */

export const ConceptVault: React.FC = memo(() => {
  const services = useCompassStore((s) => s.services);
  const selectedServiceId = useCompassStore((s) => s.selectedServiceId);
  const setSelectedServiceId = useCompassStore((s) => s.setSelectedServiceId);
  const updateServiceDoc = useCompassStore((s) => s.updateServiceDoc);
  const isSidebarOpen = useCompassStore((s) => s.isSidebarOpen);
  const sidebarWidth = useCompassStore((s) => s.sidebarWidth);
  const toggleSidebar = useCompassStore((s) => s.toggleSidebar);

  const selectedService = services.find((s) => s.id === selectedServiceId);

                  return (
                  <div className="flex w-full h-full overflow-hidden relative">
                    {/* Service Catalog Sidebar (Encapsulated in Concept Vault, smooth width/opacity glide) */}
                    <div
                      style={{
                        width: isSidebarOpen ? `${sidebarWidth}px` : '0px',
                      }}
                      className={`h-full shrink-0 relative overflow-hidden transition-[width,opacity,transform] duration-250 ease-[cubic-bezier(0.2,0,0,1)] ${isSidebarOpen
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 -translate-x-4 pointer-events-none'
                        }`}
                      aria-hidden={!isSidebarOpen}
                    >
                      <ServiceCatalog />
                    </div>

                    {/* Collapsed Sidebar Docked Trigger (Only shown in Concept Vault when sidebar closed) */}
                    <AnimatePresence>
                      {!isSidebarOpen && (
                        <m.button
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -12 }}
                          transition={SPRING_SMOOTH}
                          type="button"
                          onClick={toggleSidebar}
                          className="absolute left-0 top-2 z-30 h-8 pl-2.5 pr-3 rounded-r-[6px] bg-[var(--aws-card-bg)] border-y border-r border-[var(--aws-border)] shadow-md hover:border-[#FF9900] text-[var(--aws-text-primary)] hover:text-[#FF9900] flex items-center gap-1.5 transition-all duration-150 cursor-pointer group"
                          title="Open service catalog"
                          aria-label="Open service catalog"
                        >
                          <ChevronRight
                            className="w-3.5 h-3.5 text-[var(--aws-text-muted)] group-hover:text-[#FF9900] transition-colors"
                            strokeWidth={2}
                          />
                          <span className="text-[11px] font-semibold tracking-wide">Catalog</span>
                        </m.button>
                      )}
                    </AnimatePresence>

                    {/* Workspace Content Area: Table or Service Dossier */}
                    <div className="flex-1 h-full overflow-hidden relative">
                      <m.div
                        key={selectedService ? selectedService.id : 'vault-table'}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.16, ease: [0.2, 0, 0, 1] }}
                        className="w-full h-full overflow-hidden flex flex-col"
                      >
                        {selectedService ? (
                          <ServiceDossierContent
                            service={selectedService}
                            onBackToTable={() => setSelectedServiceId(null)}
                            onUpdateDoc={updateServiceDoc}
                          />
                        ) : (
                          <ConceptVaultTable
                            services={services}
                            onSelectService={(id) => setSelectedServiceId(id)}
                          />
                        )}
                      </m.div>

                      {/* Morphing Floating Compare Dock */}
                      <CompareFloatingTray />

                      {/* Side-by-Side Trade-Off Matrix Modal */}
                      <ServiceComparisonModal />
                    </div>
                  </div>
                  );
});

                  export default ConceptVault;
