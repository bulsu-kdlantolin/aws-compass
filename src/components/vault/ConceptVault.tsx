import React, { useState, useMemo, useRef } from 'react';
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
  Plus,
  Layers,
  Boxes,
  Sparkles,
} from 'lucide-react';
import { useCompassStore } from '../../store/useCompassStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import type { AWSService } from '../../types/aws';
import { MermaidViewer } from './MermaidViewer';
import { SEED_SERVICES } from '../../db/seedServices';
import { SEED_BLUEPRINTS } from '../../db/seedBlueprints';
import { AWSServiceIcon } from '../icons/AWSServiceIcon';
import { CloudscapeContainer } from '../ui/CloudscapeContainer';
import { CloudscapeAlert } from '../ui/CloudscapeAlert';
import { CodeFrame } from '../ui/CodeFrame';
import { DocToc, type TocItem } from './DocToc';
import { CloudscapeSearchInput } from '../ui/CloudscapeSearchInput';
import { CloudscapeSelect, type CloudscapeSelectOption } from '../ui/CloudscapeSelect';
import { CloudscapeTextarea } from '../ui/CloudscapeTextarea';
import { CloudscapeCopyButton } from '../ui/CloudscapeCopyButton';
import { useSettingsStore } from '../../store/useSettingsStore';
import { getAWSCategoryColor } from '../../utils/awsCategoryColors';
import { getVerifiedAWSDocsUrl } from '../../utils/awsDocs';

/* -------------------------------------------------------------------------- */
/*                           CLOUDSCAPE RESOURCE TABLE                        */
/* -------------------------------------------------------------------------- */

type SortKey = 'name' | 'category' | 'tier' | 'favorite';

const ConceptVaultTable: React.FC<{
  services: AWSService[];
  onSelectService: (id: string) => void;
}> = ({ services, onSelectService }) => {
  const isSidebarOpen = useCompassStore((s) => s.isSidebarOpen);
  const toggleFavorite = useCompassStore((s) => s.toggleFavorite);
  const uiDensity = useSettingsStore((s) => s.uiDensity);
  const isCompact = uiDensity === 'compact';
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortKey, setSortKey] = useState<SortKey>('tier');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const categories = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => set.add(s.category));
    return ['All', ...Array.from(set).sort()];
  }, [services]);

  const categoryOptions: CloudscapeSelectOption[] = useMemo(() => {
    return categories.map((cat) => {
      const count =
        cat === 'All'
          ? services.length
          : services.filter((s) => s.category === cat).length;

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
  }, [categories, services]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedServices = useMemo(() => {
    let result = services.filter((svc) => {
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
  }, [services, search, categoryFilter, sortKey, sortOrder]);

  const hasActiveFilters = search.trim().length > 0 || categoryFilter !== 'All';
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
                    className={`w-10 px-2 ${headPad} text-center cursor-pointer hover:text-[var(--aws-text-primary)] transition-colors`}
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
                      No services match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedServices.map((svc) => (
                    <tr
                      key={svc.id}
                      onClick={() => onSelectService(svc.id)}
                      className={`hover:bg-[var(--aws-page-bg)] cursor-pointer transition-colors ${rowPad}`}
                    >
                      {/* Favorite button */}
                      <td
                        className={`w-10 px-2 ${rowPad} text-center`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(svc.id);
                        }}
                      >
                        <button
                          type="button"
                          className="p-1 rounded-[4px] hover:bg-[var(--aws-card-bg)] text-[var(--aws-text-muted)] hover:text-[#FF9900] transition-colors cursor-pointer enabled:active:scale-[0.96]"
                          title={svc.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                          aria-label={svc.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Star
                            className={`w-4 h-4 transition-transform active:scale-90 ${svc.isFavorite ? 'fill-[#FF9900] text-[#FF9900]' : 'text-[var(--aws-text-muted)] hover:text-[#FF9900]'
                              }`}
                          />
                        </button>
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
                          className={`inline-flex items-center px-2 py-0.5 rounded-[4px] font-mono text-[11px] font-medium ${svc.tier === 1
                            ? 'bg-[#FF9900]/10 text-[#FF9900] border border-[#FF9900]/25'
                            : svc.tier === 2
                              ? 'bg-[#0972D3]/10 text-[#0972D3] dark:text-[#539FE5] border border-[#0972D3]/20'
                              : 'bg-[#545B64]/10 text-[#545B64] dark:text-[#879596] border border-[#545B64]/20'
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
                      <td className={`px-4 ${rowPad} font-mono text-[12px] text-[var(--aws-text-muted)]`}>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                           SERVICE DOSSIER CONTENT                          */
/* -------------------------------------------------------------------------- */

interface ServiceDossierContentProps {
  service: AWSService;
  onBackToTable: () => void;
  onUpdateDoc: (id: string, markdownDoc: string) => Promise<void>;
}

  const REGION_OPTIONS: CloudscapeSelectOption[] = [
    { value: 'us-east-1', label: 'us-east-1 (N. Virginia)' },
    { value: 'us-west-2', label: 'us-west-2 (Oregon)' },
    { value: 'eu-west-1', label: 'eu-west-1 (Ireland)' },
    { value: 'eu-central-1', label: 'eu-central-1 (Frankfurt)' },
    { value: 'ap-southeast-1', label: 'ap-southeast-1 (Singapore)' },
    { value: 'ap-northeast-1', label: 'ap-northeast-1 (Tokyo)' },
  ];

    const ServiceDossierContent: React.FC<ServiceDossierContentProps> = ({
      service,
      onBackToTable,
      onUpdateDoc,
    }) => {
      const isSidebarOpen = useCompassStore((s) => s.isSidebarOpen);
      const toggleFavorite = useCompassStore((s) => s.toggleFavorite);
      const setWorkspaceMode = useCompassStore((s) => s.setWorkspaceMode);

      const savedDiagrams = useCanvasStore((s) => s.savedDiagrams);
      const loadTemplate = useCanvasStore((s) => s.loadTemplate);
      const loadSnapshot = useCanvasStore((s) => s.loadSnapshot);
      const createBlankBlueprint = useCanvasStore((s) => s.createBlankBlueprint);
      const addServiceNode = useCanvasStore((s) => s.addServiceNode);

      const [isEditing, setIsEditing] = useState(false);
      const [editorContent, setEditorContent] = useState(service.markdownDoc);
      const [savedSuccess, setSavedSuccess] = useState(false);

      // Live ARN & CLI Context Variables
      const [contextRegion, setContextRegion] = useState('us-east-1');
      const [contextAccountId, setContextAccountId] = useState('123456789012');
      const [contextResourceName, setContextResourceName] = useState(`${service.id}-prod-primary`);

      const scrollContainerRef = useRef<HTMLDivElement>(null);

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

        // Interpolate context parameters into ARN pattern
        const interpolatedArn = useMemo(() => {
          if (!service.arnExample) return '';
          return service.arnExample
            .replace(/<region>|us-east-1/g, contextRegion)
            .replace(/<account-id>|123456789012/g, contextAccountId)
            .replace(
              /<resource-name>|<bucket-name>|<table-name>|<function-name>|production-datalake-artifacts/g,
              contextResourceName
            );
        }, [service.arnExample, contextRegion, contextAccountId, contextResourceName]);

        // Interpolate context parameters into CLI code blocks
        const interpolateCliCode = (rawCode: string) => {
          if (!rawCode) return rawCode;
          return rawCode
            .replace(/us-east-1|<region>/g, contextRegion)
            .replace(/123456789012|<account-id>/g, contextAccountId)
            .replace(
              /my-prod-bucket|my-table|my-function|<resource-name>|<bucket-name>|production-datalake-artifacts/g,
              contextResourceName
            );
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
    <div
      style={{ backgroundColor: 'var(--aws-page-bg)' }}
      className="flex flex-col h-full overflow-hidden"
    >
      {/* Top Breadcrumb & Action Bar */}
      <div
        style={{
          backgroundColor: 'var(--aws-card-bg)',
          borderBottomColor: 'var(--aws-border)',
        }}
        className={`border-b ${!isSidebarOpen ? 'pl-24 pr-4 sm:pr-6' : 'px-4 sm:px-6'} py-2.5 shrink-0 flex items-center justify-between gap-3 select-none`}
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[13px]">
          <button
            type="button"
            onClick={onBackToTable}
            className="flex items-center gap-1 text-[var(--aws-interactive)] hover:underline cursor-pointer font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Services</span>
          </button>
          <span className="text-[var(--aws-text-muted)]">/</span>
          <span
            style={{ color: 'var(--aws-text-primary)' }}
            className="font-semibold truncate"
          >
            {service.name}
          </span>
        </div>

        {/* View / Edit Mode, Favorite & Canvas Bridge */}
        <div className="flex items-center gap-2">
          {/* Favorite Toggle Button */}
          <button
            type="button"
            onClick={() => toggleFavorite(service.id)}
            className={`flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 h-[29px] rounded-[6px] border transition-all duration-150 cursor-pointer enabled:active:scale-[0.96] shadow-2xs select-none ${
              service.isFavorite
                ? 'bg-[#FF9900]/15 text-[#FF9900] border-[#FF9900]/40'
                : 'bg-[var(--aws-card-bg)] text-[var(--aws-text-primary)] border-[var(--aws-border)] hover:border-[#FF9900] hover:text-[#FF9900]'
            }`}
            title={service.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-label="Toggle favorite"
          >
            <Star
              className={`w-3.5 h-3.5 transition-colors ${
                service.isFavorite ? 'fill-[#FF9900] text-[#FF9900]' : ''
              }`}
            />
            <span>{service.isFavorite ? 'Favorited' : 'Favorite'}</span>
          </button>

          {/* 1px Vertical Divider */}
          <div
            style={{ backgroundColor: 'var(--aws-border)' }}
            className="h-4 w-px mx-0.5"
            aria-hidden="true"
          />

          {/* Read / Edit Segmented Switch */}
          <div
            style={{
              backgroundColor: 'var(--aws-page-bg)',
              borderColor: 'var(--aws-border)',
            }}
            className="flex items-center p-0.5 rounded-[6px] border select-none shadow-2xs"
          >
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={
                !isEditing
                  ? {
                      backgroundColor: 'var(--aws-card-bg)',
                      color: 'var(--aws-text-primary)',
                      borderColor: 'var(--aws-border)',
                    }
                  : {
                      color: 'var(--aws-text-muted)',
                      borderColor: 'transparent',
                    }
              }
              className={`flex items-center gap-1.5 px-3 py-1 text-[12px] font-medium rounded-[4px] border transition-all duration-150 cursor-pointer ${
                !isEditing
                  ? 'shadow-xs font-semibold'
                  : 'hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-popover-hover)]'
              }`}
            >
              <BookOpen
                className={`w-3.5 h-3.5 ${!isEditing ? 'text-[#FF9900]' : 'opacity-70'}`}
                strokeWidth={2}
              />
              <span>Read</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditorContent(service.markdownDoc);
                setIsEditing(true);
              }}
              style={
                isEditing
                  ? {
                      backgroundColor: 'var(--aws-card-bg)',
                      color: 'var(--aws-text-primary)',
                      borderColor: 'var(--aws-border)',
                    }
                  : {
                      color: 'var(--aws-text-muted)',
                      borderColor: 'transparent',
                    }
              }
              className={`flex items-center gap-1.5 px-3 py-1 text-[12px] font-medium rounded-[4px] border transition-all duration-150 cursor-pointer ${
                isEditing
                  ? 'shadow-xs font-semibold'
                  : 'hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-popover-hover)]'
              }`}
            >
              <Edit3
                className={`w-3.5 h-3.5 ${isEditing ? 'text-[#FF9900]' : 'opacity-70'}`}
                strokeWidth={2}
              />
              <span>Edit</span>
            </button>
          </div>

          {/* 1px Vertical Divider */}
          <div
            style={{ backgroundColor: 'var(--aws-border)' }}
            className="h-4 w-px mx-0.5"
            aria-hidden="true"
          />

          {/* + Add to Canvas Button */}
          <button
            type="button"
            onClick={handleAddToCanvas}
            style={{
              backgroundColor: 'var(--aws-card-bg)',
              borderColor: 'var(--aws-border)',
              color: 'var(--aws-text-primary)',
            }}
            className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1 h-[29px] rounded-[6px] border hover:border-[#FF9900] hover:text-[#FF9900] active:scale-[0.98] transition-all duration-150 cursor-pointer shadow-2xs select-none"
            title={`Add ${service.name} node to active architecture canvas`}
            aria-label={`Add ${service.name} to canvas`}
          >
            <Plus className="w-3.5 h-3.5 text-[#FF9900]" strokeWidth={2.5} />
            <span>Add to Canvas</span>
          </button>

          {/* 1px Vertical Divider */}
          <div
            style={{ backgroundColor: 'var(--aws-border)' }}
            className="h-4 w-px mx-0.5"
            aria-hidden="true"
          />

          {/* External AWS Docs Button */}
          {(() => {
            const docsUrl = getVerifiedAWSDocsUrl(service.id, service.docsUrl);
            if (!docsUrl) return null;
            return (
              <a
                href={docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: 'var(--aws-card-bg)',
                  borderColor: 'var(--aws-border)',
                  color: 'var(--aws-text-primary)',
                }}
                className="group flex items-center gap-1.5 text-[12px] font-medium px-3 py-1 h-[29px] rounded-[6px] border hover:border-[#FF9900] hover:text-[#FF9900] active:scale-[0.98] transition-all duration-150 cursor-pointer shadow-2xs select-none"
                title="Open official AWS documentation in a new tab"
                aria-label={`Open official ${service.name} documentation`}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0 text-[#FF9900]"
                  aria-hidden="true"
                >
                  <path
                    d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 2V8H20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 13H8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 17H8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg >
                <span>AWS docs</span>
                <ExternalLink
                  className="w-3 h-3 text-[var(--aws-text-muted)] group-hover:text-[#FF9900] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-150"
                  strokeWidth={2}
                />
              </a >
            );
          }) ()}
        </div >
      </div >

    {/* Main Workspace Body */ }
      {
    isEditing ? (
      /* Editor Layout */
      <div
        style={{ backgroundColor: 'var(--aws-page-bg)' }}
        className="flex flex-col flex-1 min-h-0 overflow-hidden relative"
      >
        {/* Editor Action Header */}
        <div
          style={{
            backgroundColor: 'var(--aws-card-bg)',
            borderBottomColor: 'var(--aws-border)',
          }}
          className="flex items-center justify-between px-6 py-2 border-b text-[12px] shrink-0"
        >
          <span style={{ color: 'var(--aws-text-muted)' }}>
            Editing 6-part concept dossier (Markdown + Mermaid)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToSeed}
              style={{
                backgroundColor: 'var(--aws-page-bg)',
                borderColor: 'var(--aws-border)',
                color: 'var(--aws-text-muted)',
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] border transition-colors cursor-pointer hover:text-[var(--aws-text-primary)]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to seed</span>
            </button>
            <button
              type="button"
              onClick={handleSaveDoc}
              style={{
                backgroundColor: 'var(--aws-brand)',
                color: '#0F141A',
              }}
              className="flex items-center gap-1 px-3 py-1 rounded-[4px] font-bold transition-[background-color,transform] duration-150 ease-out enabled:active:scale-[0.96] cursor-pointer hover:bg-[var(--aws-brand-hover)]"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{savedSuccess ? 'Saved' : 'Save changes'}</span>
            </button>
          </div>
        </div>

        {/* Split Editor / Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 flex-1 min-h-0 overflow-hidden">
          <div
            style={{ borderRightColor: 'var(--aws-border)' }}
            className="flex flex-col h-full border-r overflow-hidden"
          >
            <CloudscapeTextarea
              value={editorContent}
              onChange={setEditorContent}
              placeholder="Enter markdown document with mermaid diagrams..."
              spellCheck={false}
              className="w-full h-full border-0 rounded-none font-mono text-[12px] p-4"
            />
          </div>

                      <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-6 vault-prose scrollbar-thin custom-scrollbar">
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
                            code={interpolateCliCode(String(children).replace(/\n$/, ''))}
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
          </div>
            </div>
            ) : (
            /* Reading View Layout */
            <div
              ref={scrollContainerRef}
              className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 scrollbar-thin custom-scrollbar"
            >
              <div className="max-w-7xl mx-auto flex items-start gap-8">
                {/* Main Content Column */}
                <div className="flex-1 min-w-0 space-y-6 pb-12">
                  {/* Cloudscape Container: Service Header & Key-Value Grid */}
                  <CloudscapeContainer
                    className="relative z-10"
                    header={
                      <div className="flex items-center gap-3">
                        <AWSServiceIcon serviceId={service.id} size={32} />
                        <div>
                          <h2
                            style={{ color: 'var(--aws-text-primary)' }}
                            className="text-[18px] font-bold leading-[22px]"
                          >
                            {service.name}
                          </h2>
                          <span className="text-[11px] font-mono text-[var(--aws-text-muted)] uppercase">
                            {service.id}
                          </span>
                        </div>
                      </div>
                    }
                  >
                    {/* Key-Value Grid with 1px vertical dividers */}
                    <div
                      style={{ borderColor: 'var(--aws-border)' }}
                      className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2"
                    >
                      {/* Category */}
                          <div className="sm:border-r border-[var(--aws-border)] sm:pr-6">
                            <span
                              style={{ color: 'var(--aws-text-muted)' }}
                              className="text-[12px] block font-medium"
                            >
                              Category
                            </span>
                            <span
                              style={{ color: 'var(--aws-text-primary)' }}
                              className="text-[13px] font-semibold mt-0.5 block"
                            >
                              {service.category}
                            </span>
                          </div>

                          {/* Tier */}
                          <div className="sm:border-r border-[var(--aws-border)] sm:pr-6">
                            <span
                              style={{ color: 'var(--aws-text-muted)' }}
                              className="text-[12px] block font-medium"
                            >
                              Service tier
                            </span>
                            <span
                              style={{ color: 'var(--aws-text-primary)' }}
                              className="text-[13px] font-semibold mt-0.5 block font-mono"
                            >
                              {service.tier === 1
                                ? 'Tier 1 (Core & Popular)'
                                : service.tier === 2
                                  ? 'Tier 2 (Enterprise)'
                                  : 'Tier 3 (Specialized)'}
                            </span>
                          </div>

                          {/* CLI Prefix */}
                          <div>
                            <span
                              style={{ color: 'var(--aws-text-muted)' }}
                              className="text-[12px] block font-medium"
                            >
                              CLI prefix
                            </span>
                            <span
                              style={{ color: 'var(--aws-interactive)' }}
                              className="text-[13px] font-mono mt-0.5 block font-medium"
                            >
                              aws {service.id}
                            </span>
                          </div>
                      </div>

                      {/* Interactive Context Variables Bar */}
                      <div
                        style={{
                          backgroundColor: 'var(--aws-page-bg)',
                          borderColor: 'var(--aws-border)',
                        }}
                        className="mt-3 pt-3 pb-3 px-3.5 border-t rounded-[6px] border flex flex-col gap-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--aws-text-primary)]">
                            <Sparkles className="w-3.5 h-3.5 text-[#FF9900]" />
                            <span>Context Parameters & Interpolation</span>
                          </div>
                          <span className="text-[10px] text-[var(--aws-text-muted)] font-mono">
                            Dynamic ARN & CLI substitution
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Region Selector */}
                          <div>
                            <label className="block text-[11px] font-medium text-[var(--aws-text-muted)] mb-1">
                              Region
                            </label>
                            <CloudscapeSelect
                              value={contextRegion}
                              onChange={setContextRegion}
                              options={REGION_OPTIONS}
                              ariaLabel="Select AWS region"
                            />
                          </div>

                          {/* Account ID */}
                          <div>
                            <label className="block text-[11px] font-medium text-[var(--aws-text-muted)] mb-1">
                              Account ID
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={contextAccountId}
                                onChange={(e) => setContextAccountId(e.target.value.trim())}
                                placeholder="123456789012"
                                maxLength={12}
                                className="w-full h-8 px-2.5 text-[12px] font-mono rounded-[6px] border border-[var(--aws-border)] bg-[var(--aws-card-bg)] text-[var(--aws-text-primary)] focus:outline-none focus:border-[var(--aws-interactive)]"
                              />
                            </div>
                          </div>

                          {/* Resource Name */}
                          <div>
                            <label className="block text-[11px] font-medium text-[var(--aws-text-muted)] mb-1">
                              Resource Name
                            </label>
                            <input
                              type="text"
                              value={contextResourceName}
                              onChange={(e) => setContextResourceName(e.target.value.trim())}
                              placeholder="resource-name"
                              className="w-full h-8 px-2.5 text-[12px] font-mono rounded-[6px] border border-[var(--aws-border)] bg-[var(--aws-card-bg)] text-[var(--aws-text-primary)] focus:outline-none focus:border-[var(--aws-interactive)]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* ARN Example Row with Live Interpolation */}
                      {service.arnExample && (
                        <div
                          style={{
                            borderTopColor: 'var(--aws-border)',
                            backgroundColor: 'var(--aws-page-bg)',
                          }}
                          className="mt-3 pt-3 border-t p-2.5 rounded-[4px] flex items-center justify-between gap-3 text-[12px] font-mono"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[var(--aws-text-muted)] shrink-0 font-sans">
                              ARN pattern:
                            </span>
                            <span
                              style={{ color: 'var(--aws-text-primary)' }}
                              className="truncate select-all"
                            >
                              {interpolatedArn}
                            </span>
                          </div>
                          <CloudscapeCopyButton
                            textToCopy={interpolatedArn}
                            ariaLabel="Copy interpolated ARN pattern"
                            showLabel={false}
                            className="shrink-0"
                          />
                        </div>
                      )}
                  </CloudscapeContainer>

                  {/* Unified Cloudscape Container for 6-Part Concept Dossier */}
                  <div
                    style={{
                      backgroundColor: 'var(--aws-card-bg)',
                      borderColor: 'var(--aws-border)',
                    }}
                    className="rounded-[8px] border p-6 shadow-none"
                  >
                    <div className="vault-prose">
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
                              <h2 id={id} className="scroll-mt-6" {...props}>
                                {props.children}
                              </h2>
                              );
                      },
                              code(props) {
                        const {children, className, ...rest } = props;
                              const match = /language-(\w+)/.exec(className || '');
                              const language = match ? match[1] : '';
                              const codeContent = String(children).replace(/\n$/, '');

                              if (language === 'mermaid') {
                          return <MermaidViewer chart={codeContent} service={service} />;
                        }
                              if (language === 'bash' || language === 'sh' || language === 'shell') {
                          return (
                              <CodeFrame
                                code={interpolateCliCode(codeContent)}
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
                                className="my-4"
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
            </div>

                  {/* Referenced in Blueprints Footer Strip */}
                  <div
                    id="section-blueprints"
                    style={{
                      backgroundColor: 'var(--aws-card-bg)',
                      borderColor: 'var(--aws-border)',
                    }}
                    className="rounded-[8px] border p-5 shadow-none scroll-mt-6"
                  >
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--aws-border)]">
                      <div className="flex items-center gap-2">
                        <Boxes className="w-4 h-4 text-[#FF9900]" />
                        <h3
                          style={{ color: 'var(--aws-text-primary)' }}
                          className="text-[14px] font-bold"
                        >
                          Referenced in Blueprints
                        </h3>
                        <span
                          style={{
                            backgroundColor: 'var(--aws-page-bg)',
                            borderColor: 'var(--aws-border)',
                            color: 'var(--aws-text-muted)',
                          }}
                          className="text-[11px] font-mono px-2 py-0.5 rounded-full border"
                        >
                          {matchingBlueprints.length} {matchingBlueprints.length === 1 ? 'diagram' : 'diagrams'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleCreateBlueprintWithService}
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-[#FF9900] hover:underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New Blueprint with {service.name}</span>
                      </button>
                    </div>

                    {matchingBlueprints.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {matchingBlueprints.map((bp) => (
                          <div
                            key={bp.id}
                            style={{
                              backgroundColor: 'var(--aws-page-bg)',
                              borderColor: 'var(--aws-border)',
                            }}
                            className="rounded-[6px] border p-3.5 flex flex-col justify-between hover:border-[var(--aws-interactive)] transition-all group"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span
                                  style={{ color: 'var(--aws-text-primary)' }}
                                  className="text-[13px] font-semibold truncate group-hover:text-[var(--aws-interactive)] transition-colors"
                                >
                                  {bp.name}
                                </span>
                                <span
                                  className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-[4px] border ${bp.isTemplate
                                      ? 'bg-[#0972D3]/10 text-[#0972D3] dark:text-[#539FE5] border-[#0972D3]/30'
                                      : 'bg-[#1D8102]/10 text-[#1D8102] dark:text-[#38D9A9] border-[#1D8102]/30'
                                    }`}
                                >
                                  {bp.isTemplate ? 'Template' : 'Custom'}
                                </span>
                              </div>
                              <p
                                style={{ color: 'var(--aws-text-muted)' }}
                                className="text-[11px] line-clamp-2 mb-3"
                              >
                                {bp.description}
                              </p>
                            </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[var(--aws-border)] text-[11px]">
                          <span className="font-mono text-[var(--aws-text-muted)]">
                            {bp.nodes.length} nodes · {bp.edges.length} edges
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenBlueprint(bp)}
                            className="flex items-center gap-1 font-semibold text-[var(--aws-interactive)] hover:underline cursor-pointer"
                          >
                            <span>Open in Canvas</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  ) : (
                  <div
                    style={{ backgroundColor: 'var(--aws-page-bg)' }}
                    className="rounded-[6px] border border-dashed border-[var(--aws-border)] p-6 text-center"
                  >
                    <Layers className="w-8 h-8 text-[var(--aws-text-muted)] mx-auto mb-2 opacity-50" />
                    <p
                      style={{ color: 'var(--aws-text-primary)' }}
                      className="text-[13px] font-medium mb-1"
                    >
                      No blueprints currently reference {service.name}
                    </p>
                    <p
                      style={{ color: 'var(--aws-text-muted)' }}
                      className="text-[12px] max-w-md mx-auto mb-4"
                    >
                      You can add {service.name} to your active canvas or create a new dedicated architecture blueprint.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={handleAddToCanvas}
                        className="h-8 px-3.5 rounded-[6px] bg-[#FF9900] text-[#0F141A] font-bold text-[12px] hover:bg-[#EC7211] active:scale-[0.98] transition-all cursor-pointer shadow-xs"
                      >
                        + Add to Active Canvas
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateBlueprintWithService}
                        style={{
                          backgroundColor: 'var(--aws-card-bg)',
                          borderColor: 'var(--aws-border)',
                          color: 'var(--aws-text-primary)',
                        }}
                        className="h-8 px-3.5 rounded-[6px] border text-[12px] font-medium hover:border-[var(--aws-interactive)] transition-all cursor-pointer"
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
    </div >
  );
};

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                               */
/* -------------------------------------------------------------------------- */

export const ConceptVault: React.FC = () => {
  const {
    services,
    selectedServiceId,
    setSelectedServiceId,
    updateServiceDoc,
  } = useCompassStore();

  const selectedService = services.find((s) => s.id === selectedServiceId);

  if (!selectedService) {
    return (
      <ConceptVaultTable
        services={services}
        onSelectService={(id) => setSelectedServiceId(id)}
      />
    );
  }

  return (
    <ServiceDossierContent
      key={selectedService.id}
      service={selectedService}
      onBackToTable={() => setSelectedServiceId(null)}
      onUpdateDoc={updateServiceDoc}
    />
  );
};

export default ConceptVault;
