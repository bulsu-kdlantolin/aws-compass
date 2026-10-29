import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Search,
  X,
} from 'lucide-react';
import { useCompassStore, DEFAULT_CATEGORIES } from '../../store/useCompassStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import type { AWSCategory, AWSService } from '../../types/aws';
import { ServiceCard } from './ServiceCard';

export const ServiceCatalog: React.FC = () => {
  const {
    services,
    selectedServiceId,
    filter,
    categoryOrder,
    toggleSidebar,
    setSelectedServiceId,
    setSearch,
    setCategoryFilter,
    setTierFilter,
    setStudyStatusFilter,
    reorderService,
    moveServiceToCategory,
  } = useCompassStore();

  const uiDensity = useSettingsStore((s) => s.uiDensity);
  const isCompact = uiDensity === 'compact';

  // Collapsible category state: all categories open by default
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Drag and drop state for services
  const [draggedServiceId, setDraggedServiceId] = useState<string | null>(null);
  const [targetCardId, setTargetCardId] = useState<string | null>(null);
  const [targetCardDropPosition, setTargetCardDropPosition] = useState<'top' | 'bottom' | null>(null);
  const [targetCategoryHeader, setTargetCategoryHeader] = useState<AWSCategory | null>(null);

  const handleSearchChange = (val: string) => {
    setSearch(val);
  };

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  // Filtered and searched services
  const filteredServices = useMemo(() => {
    return services.filter((svc) => {
      // Search filter
      if (filter.search.trim()) {
        const query = filter.search.toLowerCase().trim();
        const matchesId = svc.id.toLowerCase().includes(query);
        const matchesName = svc.name.toLowerCase().includes(query);
        const matchesSummary = svc.summary.toLowerCase().includes(query);
        const matchesCat = svc.category.toLowerCase().includes(query);
        if (!matchesId && !matchesName && !matchesSummary && !matchesCat) {
          return false;
        }
      }

      // Category filter
      if (filter.category !== 'All' && svc.category !== filter.category) {
        return false;
      }

      // Tier filter
      if (filter.tier !== 'All' && svc.tier !== filter.tier) {
        return false;
      }

      // Study status filter
      if (filter.studyStatus !== 'All' && svc.studyStatus !== filter.studyStatus) {
        return false;
      }

      return true;
    });
  }, [services, filter]);

  const hasActiveFilters =
    filter.search.trim() !== '' ||
    filter.category !== 'All' ||
    filter.tier !== 'All' ||
    filter.studyStatus !== 'All';

  // Group filtered services by category (preserving custom ordering)
  const servicesByCategory = useMemo(() => {
    const map = new Map<string, typeof services>();
    filteredServices.forEach((svc) => {
      const list = map.get(svc.category) || [];
      list.push(svc);
      map.set(svc.category, list);
    });
    return map;
  }, [filteredServices]);

  // Categories to render based on user category order
  const categoriesToRender = useMemo(() => {
    const order = categoryOrder && categoryOrder.length > 0 ? categoryOrder : DEFAULT_CATEGORIES;
    // If a service belongs to a category not in the order, append it
    const missing = DEFAULT_CATEGORIES.filter((c) => !order.includes(c));
    return [...order, ...missing];
  }, [categoryOrder]);

  const allCollapsed = useMemo(() => {
    if (categoriesToRender.length === 0) return false;
    return categoriesToRender.every((cat) => collapsedCategories[cat]);
  }, [categoriesToRender, collapsedCategories]);

  const toggleCollapseAll = () => {
    if (allCollapsed) {
      setCollapsedCategories({});
    } else {
      const next: Record<string, boolean> = {};
      categoriesToRender.forEach((cat) => {
        next[cat] = true;
      });
      setCollapsedCategories(next);
    }
  };

  const clearAllFilters = () => {
    setSearch('');
    setCategoryFilter('All');
    setTierFilter('All');
    setStudyStatusFilter('All');
  };

  const isSearching = filter.search.trim().length > 0;

  // --- Drag and Drop Handlers for Service Cards ---
  const handleCardDragStart = (_e: React.DragEvent, service: AWSService) => {
    setDraggedServiceId(service.id);
  };

  const handleCardDragOver = (e: React.DragEvent, targetService: AWSService) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    const sourceId = e.dataTransfer.getData('application/aws-service-id') || draggedServiceId;
    if (!sourceId || sourceId === targetService.id) {
      if (targetCardId) {
        setTargetCardId(null);
        setTargetCardDropPosition(null);
      }
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = e.clientY - rect.top < rect.height / 2 ? 'top' : 'bottom';

    if (targetCardId !== targetService.id || targetCardDropPosition !== pos) {
      setTargetCardId(targetService.id);
      setTargetCardDropPosition(pos);
      setTargetCategoryHeader(null);
    }
  };

  const handleCardDragLeave = (e: React.DragEvent, targetService: AWSService) => {
    const related = e.relatedTarget as Node | null;
    if (!e.currentTarget.contains(related)) {
      if (targetCardId === targetService.id) {
        setTargetCardId(null);
        setTargetCardDropPosition(null);
      }
    }
  };

  const handleCardDrop = async (e: React.DragEvent, targetService: AWSService) => {
    e.preventDefault();
    e.stopPropagation();

    const sourceId = e.dataTransfer.getData('application/aws-service-id') || draggedServiceId;
    const position = targetCardDropPosition === 'top' ? 'before' : 'after';

    setDraggedServiceId(null);
    setTargetCardId(null);
    setTargetCardDropPosition(null);
    setTargetCategoryHeader(null);

    if (!sourceId || sourceId === targetService.id) return;

    await reorderService(sourceId, targetService.id, position, targetService.category);
  };

  const handleCardDragEnd = () => {
    setDraggedServiceId(null);
    setTargetCardId(null);
    setTargetCardDropPosition(null);
    setTargetCategoryHeader(null);
  };

  // --- Drag and Drop Handlers for Moving Services onto Category Headers ---
  const handleCategoryHeaderDragOver = (e: React.DragEvent, cat: AWSCategory) => {
    if (!draggedServiceId) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setTargetCategoryHeader(cat);
    setTargetCardId(null);
  };

  const handleCategoryHeaderDragLeave = (e: React.DragEvent, cat: AWSCategory) => {
    const related = e.relatedTarget as Node | null;
    if (!e.currentTarget.contains(related)) {
      if (targetCategoryHeader === cat) {
        setTargetCategoryHeader(null);
      }
    }
  };

  const handleCategoryHeaderDrop = async (e: React.DragEvent, cat: AWSCategory) => {
    e.preventDefault();
    e.stopPropagation();

    const serviceSource = e.dataTransfer.getData('application/aws-service-id') || draggedServiceId;

    setTargetCategoryHeader(null);
    setDraggedServiceId(null);
    setTargetCardId(null);

    if (serviceSource) {
      // Move service into this category header (at start) and auto-expand
      setCollapsedCategories((prev) => ({ ...prev, [cat]: false }));
      await moveServiceToCategory(serviceSource, cat, 'start');
    }
  };

  return (
    <aside
      style={{
        backgroundColor: 'var(--aws-sidebar-bg)',
        borderRightColor: 'var(--aws-border)',
      }}
      className="w-72 md:w-80 flex flex-col h-full border-r shrink-0 select-none rounded-none"
    >
      {/* Top Header: Search Input + Category Tree Collapse/Expand + Sidebar Collapse Button */}
      <div
        style={{
          borderBottomColor: 'var(--aws-border)',
          backgroundColor: 'var(--aws-card-bg)',
        }}
        className="h-12 px-2.5 border-b flex items-center gap-1.5 shrink-0 select-none"
      >
          <div className="relative flex-1">
            <div className="h-8 w-full rounded-[6px] bg-[var(--aws-page-bg)] border border-[var(--aws-input-border)] focus-within:border-[var(--aws-interactive)] flex items-center px-2.5 gap-2 transition-[border-color,box-shadow] duration-150">
              <Search className="w-3.5 h-3.5 text-[var(--aws-text-muted)] shrink-0" strokeWidth={1.75} />
              <input
                type="text"
                value={filter.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Filter services..."
                className="w-full bg-transparent text-[12px] text-[var(--aws-text-primary)] placeholder-[var(--aws-text-muted)] focus:outline-none min-w-0"
              />
              {filter.search && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] p-0.5 rounded cursor-pointer shrink-0"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

        {/* Tree Collapse / Expand All Button */}
        <button
          type="button"
          onClick={toggleCollapseAll}
          className="h-8 px-2 rounded-[6px] flex items-center gap-1 text-[11px] font-medium text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] border border-[var(--aws-border)]/70 hover:border-[var(--aws-border)] transition-all cursor-pointer shadow-2xs shrink-0"
          title={allCollapsed ? 'Expand all categories' : 'Collapse all categories'}
          aria-label={allCollapsed ? 'Expand all categories' : 'Collapse all categories'}
        >
          <ChevronsUpDown className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>

        {/* Sidebar Collapse Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="h-8 px-2 rounded-[6px] flex items-center gap-1.5 text-[11px] font-medium text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] border border-[var(--aws-border)]/70 hover:border-[var(--aws-border)] transition-all cursor-pointer shadow-2xs shrink-0 group"
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-[var(--aws-text-muted)] group-hover:text-[var(--aws-text-primary)] transition-colors" strokeWidth={2} />
          <span className="text-[11px]">Collapse</span>
        </button>
      </div>

      {/* Segmented Tier Filter Track */}
      <div
        style={{
          borderBottomColor: 'var(--aws-border)',
          backgroundColor: 'var(--aws-card-bg)',
        }}
        className="p-2 border-b shrink-0"
      >
        <div className="h-7 p-0.5 rounded-[6px] bg-[var(--aws-page-bg)] border border-[var(--aws-border)] grid grid-cols-4 gap-0.5">
          {(['All', 1, 2, 3] as const).map((tierVal) => {
            const isSelected = filter.tier === tierVal;
            const label = tierVal === 'All' ? 'All' : `Tier ${tierVal}`;
            return (
              <button
                key={tierVal}
                type="button"
                onClick={() => setTierFilter(tierVal)}
                className={`rounded-[4px] text-[11px] font-medium flex items-center justify-center transition-all duration-150 cursor-pointer ${isSelected
                    ? 'bg-[var(--aws-card-bg)] text-[var(--aws-text-primary)] font-semibold shadow-xs'
                    : 'text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)]'
                  }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto divide-y divide-[var(--aws-border)] scrollbar-thin custom-scrollbar">
        {filteredServices.length === 0 ? (
          <div className="p-6 text-center text-[var(--aws-text-muted)]">
            <p className="text-[13px] font-medium text-[var(--aws-text-primary)]">
              No services match filters
            </p>
            <p className="text-[11px] mt-1">
              Try adjusting the search query or status filter.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-3 text-[11px] px-2.5 py-1 rounded-[4px] bg-[var(--aws-page-bg)] text-[var(--aws-interactive)] border border-[var(--aws-border)] transition-colors cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : isSearching ? (
          /* Flat list during active search */
          <div className="py-1">
            {filteredServices.map((svc, index) => (
              <ServiceCard
                key={svc.id}
                service={svc}
                isSelected={svc.id === selectedServiceId}
                isDragging={draggedServiceId === svc.id}
                dropPosition={targetCardId === svc.id ? targetCardDropPosition : null}
                onSelect={() => setSelectedServiceId(svc.id)}
                onDragStart={handleCardDragStart}
                onDragOver={handleCardDragOver}
                onDragLeave={handleCardDragLeave}
                onDrop={handleCardDrop}
                onDragEnd={handleCardDragEnd}
                onMoveUp={() => {
                  if (index > 0) {
                    reorderService(svc.id, filteredServices[index - 1].id, 'before');
                  }
                }}
                onMoveDown={() => {
                  if (index < filteredServices.length - 1) {
                    reorderService(svc.id, filteredServices[index + 1].id, 'after');
                  }
                }}
              />
            ))}
          </div>
        ) : (
          /* Collapsible Category Tree */
          categoriesToRender.map((cat) => {
            const catServices = servicesByCategory.get(cat) || [];
            const isCollapsed = !!collapsedCategories[cat];
            const isHeaderTarget = targetCategoryHeader === cat;

            return (
              <div key={cat} className="select-none relative">
                {/* Category Header Row (28px height, drop-target for services) */}
                <div
                  onDragOver={(e) => handleCategoryHeaderDragOver(e, cat)}
                  onDragLeave={(e) => handleCategoryHeaderDragLeave(e, cat)}
                  onDrop={(e) => handleCategoryHeaderDrop(e, cat)}
                  style={{
                    backgroundColor: isHeaderTarget && draggedServiceId
                      ? 'rgba(255, 153, 0, 0.15)'
                      : 'var(--aws-card-bg)',
                  }}
                  className={`group w-full ${isCompact ? 'h-6 px-1.5' : 'h-7 px-2'} flex items-center justify-between text-left transition-[background-color,box-shadow] duration-150 relative ${
                    isHeaderTarget && draggedServiceId
                      ? 'ring-2 ring-[#FF9900] border-l-4 border-l-[#FF9900]'
                      : 'hover:bg-[var(--aws-page-bg)]'
                  }`}
                >
                  {/* Category Header Left: Chevron + Label */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className="flex items-center gap-1.5 min-w-0 flex-1 text-left cursor-pointer focus:outline-none"
                  >
                    <ChevronRight
                      className={`w-3.5 h-3.5 text-[var(--aws-text-muted)] transition-transform duration-150 shrink-0 ${
                  isCollapsed ? '' : 'rotate-90'
                }`}
                strokeWidth={2}
                    />
                <span className="text-[12px] font-semibold text-[var(--aws-text-primary)] truncate">
                  {cat}
                </span>
              </button>

                  {/* Category Header Right: Active Drop Badge or Count */ }
            {
              isHeaderTarget && draggedServiceId ? (
                <span className="text-[10px] font-bold text-[#FF9900] bg-[#FF9900]/20 px-1.5 py-0.5 rounded animate-pulse shrink-0">
                  + Move to {cat}
                </span>
              ) : (
              <span className="text-[10px] font-mono text-[var(--aws-text-muted)] shrink-0">
                {catServices.length}
              </span>
            )
            }
                </div>

      {/* Category Service Items */}
      {!isCollapsed && (
        <div
          className="pl-2 relative"
          onDragOver={(e) => {
            if (draggedServiceId) {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }
          }}
          onDrop={async (e) => {
            if (e.target === e.currentTarget && draggedServiceId) {
              e.preventDefault();
              await moveServiceToCategory(draggedServiceId, cat, 'end');
              handleCardDragEnd();
            }
          }}
        >
          {catServices.length === 0 ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setTargetCategoryHeader(cat);
              }}
              onDragLeave={() => setTargetCategoryHeader(null)}
              onDrop={async (e) => {
                e.preventDefault();
                const sourceId =
                  e.dataTransfer.getData('application/aws-service-id') ||
                  draggedServiceId;
                setTargetCategoryHeader(null);
                setDraggedServiceId(null);
                if (sourceId) {
                  await moveServiceToCategory(sourceId, cat, 'start');
                }
              }}
              className="py-2 px-3 text-center border border-dashed border-[var(--aws-border)] rounded mx-2 my-1.5 text-[11px] text-[var(--aws-text-muted)] bg-[var(--aws-card-bg)]/50 hover:border-[#FF9900] transition-colors"
            >
              Drop service here to move to {cat}
            </div>
          ) : (
            catServices.map((svc, index) => (
              <ServiceCard
                key={svc.id}
                service={svc}
                isSelected={svc.id === selectedServiceId}
                isDragging={draggedServiceId === svc.id}
                dropPosition={targetCardId === svc.id ? targetCardDropPosition : null}
                onSelect={() => setSelectedServiceId(svc.id)}
                onDragStart={handleCardDragStart}
                onDragOver={handleCardDragOver}
                onDragLeave={handleCardDragLeave}
                onDrop={handleCardDrop}
                onDragEnd={handleCardDragEnd}
                onMoveUp={() => {
                  if (index > 0) {
                    reorderService(svc.id, catServices[index - 1].id, 'before', cat);
                  }
                }}
                onMoveDown={() => {
                  if (index < catServices.length - 1) {
                    reorderService(svc.id, catServices[index + 1].id, 'after', cat);
                  }
                }}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
})
        )}
      </div >
    </aside >
  );
};

export default ServiceCatalog;
