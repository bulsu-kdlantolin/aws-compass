import React, { useMemo, useState, useRef } from 'react';
import {
  ChevronRight,
  Filter,
  GripVertical,
  RotateCcw,
  Search,
  X,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useCompassStore, DEFAULT_CATEGORIES } from '../../store/useCompassStore';
import { usePopoverStore } from '../../store/usePopoverStore';
import type { AWSCategory, StudyStatus, AWSService } from '../../types/aws';
import { ServiceCard } from './ServiceCard';
import { AnimatedPopover } from '../ui/AnimatedPopover';

export const ServiceCatalog: React.FC = () => {
  const {
    services,
    selectedServiceId,
    filter,
    categoryOrder,
    setSelectedServiceId,
    setSearch,
    setCategoryFilter,
    setTierFilter,
    setStudyStatusFilter,
    reorderService,
    moveServiceToCategory,
    reorderCategories,
    resetServiceOrder,
  } = useCompassStore();

  // Collapsible category state: all categories open by default
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const statusTriggerRef = useRef<HTMLButtonElement>(null);

  const activePopoverId = usePopoverStore((s) => s.activePopoverId);
  const openPopover = usePopoverStore((s) => s.openPopover);
  const closePopover = usePopoverStore((s) => s.closePopover);
  const isStatusOpen = activePopoverId === 'sidebar-status-filter';

  // Drag and drop state for services & category labels
  const [draggedServiceId, setDraggedServiceId] = useState<string | null>(null);
  const [draggedCategory, setDraggedCategory] = useState<AWSCategory | null>(null);
  const [targetCardId, setTargetCardId] = useState<string | null>(null);
  const [targetCardDropPosition, setTargetCardDropPosition] = useState<'top' | 'bottom' | null>(null);
  const [targetCategoryHeader, setTargetCategoryHeader] = useState<AWSCategory | null>(null);
  const [targetCategoryDropPosition, setTargetCategoryDropPosition] = useState<'top' | 'bottom' | null>(null);

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

  // Tier 1 & 2 progress metrics
  const { masteredTier1And2Count, totalTier1And2, progressPercent } = useMemo(() => {
    const tier1And2 = services.filter((s) => s.tier === 1 || s.tier === 2);
    const mastered = tier1And2.filter((s) => s.studyStatus === 'mastered').length;
    const total = tier1And2.length;
    const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
    return {
      masteredTier1And2Count: mastered,
      totalTier1And2: total,
      progressPercent: pct,
    };
  }, [services]);

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
    setDraggedCategory(null);
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
    setDraggedCategory(null);
    setTargetCardId(null);
    setTargetCardDropPosition(null);
    setTargetCategoryHeader(null);
    setTargetCategoryDropPosition(null);
  };

  // --- Drag and Drop Handlers for Category Headers ("Around that Label") ---
  const handleCategoryDragStart = (e: React.DragEvent, cat: AWSCategory) => {
    e.dataTransfer.setData('application/aws-category-id', cat);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedCategory(cat);
    setDraggedServiceId(null);
  };

  const handleCategoryHeaderDragOver = (e: React.DragEvent, cat: AWSCategory) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    if (draggedCategory) {
      // Reordering category labels
      if (draggedCategory === cat) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = e.clientY - rect.top < rect.height / 2 ? 'top' : 'bottom';
      setTargetCategoryHeader(cat);
      setTargetCategoryDropPosition(pos);
    } else {
      // Dragging service onto category label
      setTargetCategoryHeader(cat);
      setTargetCategoryDropPosition(null);
      setTargetCardId(null);
    }
  };

  const handleCategoryHeaderDragLeave = (e: React.DragEvent, cat: AWSCategory) => {
    const related = e.relatedTarget as Node | null;
    if (!e.currentTarget.contains(related)) {
      if (targetCategoryHeader === cat) {
        setTargetCategoryHeader(null);
        setTargetCategoryDropPosition(null);
      }
    }
  };

  const handleCategoryHeaderDrop = async (e: React.DragEvent, cat: AWSCategory) => {
    e.preventDefault();
    e.stopPropagation();

    const categorySource = e.dataTransfer.getData('application/aws-category-id') || draggedCategory;
    const serviceSource = e.dataTransfer.getData('application/aws-service-id') || draggedServiceId;

    const catDropPos = targetCategoryDropPosition;

    setTargetCategoryHeader(null);
    setTargetCategoryDropPosition(null);
    setDraggedCategory(null);
    setDraggedServiceId(null);
    setTargetCardId(null);

    if (categorySource && categorySource !== cat) {
      // Reorder category labels
      const pos = catDropPos === 'top' ? 'before' : 'after';
      reorderCategories(categorySource as AWSCategory, cat, pos);
    } else if (serviceSource) {
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
      {/* Redesigned 3-Row Filter Header */}
      <div
        style={{
          backgroundColor: 'var(--aws-card-bg)',
        }}
        className="p-2.5 space-y-2 relative"
      >
        {/* Row 1: Composite Filter Input with Embedded Status Trigger */}
        <div className="relative">
          <div className="h-8 w-full rounded-[6px] bg-[#F8F9FA] dark:bg-[#0F141A] border border-[#D5DBDB] dark:border-[#354150] focus-within:border-[#0972D3] dark:focus-within:border-[#539FE5] flex items-center px-2.5 gap-2 transition-[border-color,box-shadow] duration-150">
            <Search className="w-3.5 h-3.5 text-[#545B64] dark:text-[#879596] shrink-0" strokeWidth={1.75} />
            <input
              type="text"
              value={filter.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Filter catalog..."
              className="w-full bg-transparent text-[12px] text-[#16191F] dark:text-[#EAEDED] placeholder-[#545B64] dark:placeholder-[#879596] focus:outline-none min-w-0"
            />
            {filter.search && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] p-0.5 rounded cursor-pointer shrink-0"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            {/* Inline status filter trigger button */}
            <button
              ref={statusTriggerRef}
              type="button"
              onClick={() =>
                isStatusOpen ? closePopover('sidebar-status-filter') : openPopover('sidebar-status-filter')
              }
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-medium shrink-0 cursor-pointer transition-colors ${
                filter.studyStatus !== 'All'
                  ? 'bg-[#0972D3]/10 dark:bg-[#539FE5]/15 text-[#0972D3] dark:text-[#539FE5]'
                  : 'text-[#545B64] dark:text-[#879596] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title="Filter by study status"
              aria-haspopup="listbox"
              aria-expanded={isStatusOpen}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  filter.studyStatus === 'mastered'
                    ? 'bg-[#1D8102]'
                    : filter.studyStatus === 'in-progress'
                    ? 'bg-[#539FE5]'
                    : filter.studyStatus === 'review'
                    ? 'bg-[#FF9900]'
                    : filter.studyStatus === 'not-started'
                    ? 'bg-[#879596]'
                    : 'bg-[#879596]/40 border border-[#879596]'
                }`}
              />
              <span className="truncate max-w-[62px]">
                {filter.studyStatus === 'All'
                  ? 'All'
                  : filter.studyStatus === 'mastered'
                  ? 'Mastered'
                  : filter.studyStatus === 'in-progress'
                  ? 'In prog.'
                  : filter.studyStatus === 'review'
                  ? 'Review'
                  : 'Not started'}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-[#545B64] dark:text-[#879596] shrink-0 transition-transform duration-150 ${
                  isStatusOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          {/* Status Filter Popover */}
          <AnimatedPopover
            isOpen={isStatusOpen}
            onClose={() => closePopover('sidebar-status-filter')}
            align="right"
            triggerRef={statusTriggerRef}
            className="w-48 mt-1.5"
          >
            <div className="space-y-0.5">
              {[
                { value: 'All', label: 'All statuses', dot: 'bg-transparent border border-[#879596]' },
                { value: 'mastered', label: 'Mastered', dot: 'bg-[#1D8102]' },
                { value: 'in-progress', label: 'In progress', dot: 'bg-[#539FE5]' },
                { value: 'review', label: 'Review', dot: 'bg-[#FF9900]' },
                { value: 'not-started', label: 'Not started', dot: 'bg-[#879596]' },
              ].map((item) => {
                const isSelected = filter.studyStatus === item.value;
                const count =
                  item.value === 'All'
                    ? services.length
                    : services.filter((s) => s.studyStatus === item.value).length;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setStudyStatusFilter(item.value as StudyStatus | 'All');
                      closePopover('sidebar-status-filter');
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-[6px] flex items-center justify-between text-[11px] font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#0972D3]/10 dark:bg-[#539FE5]/15 text-[#0972D3] dark:text-[#539FE5] font-semibold'
                        : 'text-[#16191F] dark:text-[#EAEDED] hover:bg-[#F2F3F3] dark:hover:bg-[#232F3E]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono tabular-nums text-[#879596] text-[10px]">
                        {count}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#0972D3] dark:text-[#539FE5]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </AnimatedPopover>
        </div>

        {/* Row 2: Concentric Segmented Tier Track (All | Tier 1 | Tier 2 | Tier 3) */}
        <div className="h-7 p-0.5 rounded-[7px] bg-[#EAEDED] dark:bg-[#0F141A] border border-[#D5DBDB]/60 dark:border-[#354150]/60 grid grid-cols-4 gap-0.5">
          {(['All', 1, 2, 3] as const).map((tierVal) => {
            const isSelected = filter.tier === tierVal;
            const label = tierVal === 'All' ? 'All' : `Tier ${tierVal}`;
            return (
              <button
                key={tierVal}
                type="button"
                onClick={() => setTierFilter(tierVal)}
                className={`rounded-[5px] text-[11px] font-semibold flex items-center justify-center transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-[#1F2B3E] text-[#16191F] dark:text-white shadow-xs'
                    : 'text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Row 3: Integrated Summary Readout & Progress Edge */}
        <div className="pt-1 flex items-center justify-between text-[11px] tabular-nums text-[#545B64] dark:text-[#879596]">
          <span>
            {filteredServices.length} of {services.length} services
          </span>
          <div className="flex items-center gap-2">
            <span>
              T1/T2: {masteredTier1And2Count}/{totalTier1And2} ({progressPercent}%)
            </span>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-[10px] text-[#0972D3] dark:text-[#539FE5] hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
              >
                <Filter className="w-2.5 h-2.5" />
                Reset
              </button>
            ) : (
              <button
                type="button"
                onClick={resetServiceOrder}
                className="text-[10px] text-[#879596] hover:text-[#0972D3] dark:hover:text-[#539FE5] hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                title="Reset services to default alphabetical ordering"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Row 3 Bottom Progress Edge (2px progress track with fill in #FF9900 / #539FE5) */}
      <div className="h-[2px] w-full bg-[#D5DBDB]/40 dark:bg-[#354150]/60 relative overflow-hidden shrink-0">
        <div
          className="h-full bg-gradient-to-r from-[#FF9900] to-[#539FE5] transition-[width] duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
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
          /* Collapsible Category Tree with Drag-and-Drop Reordering */
          categoriesToRender.map((cat) => {
            const catServices = servicesByCategory.get(cat) || [];
            const isCollapsed = !!collapsedCategories[cat];
            const isHeaderTarget = targetCategoryHeader === cat;
            const isCategoryDragging = draggedCategory === cat;

            return (
              <div key={cat} className="select-none relative">
                {/* Category Reorder Drop Indicator - Top */}
                {isHeaderTarget && draggedCategory && targetCategoryDropPosition === 'top' && (
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#FF9900] z-30 pointer-events-none flex items-center shadow-[0_0_8px_rgba(255,153,0,0.8)]">
                    <div className="w-2 h-2 rounded-full bg-[#FF9900] -ml-1 border-2 border-[var(--aws-page-bg)]" />
                  </div>
                )}

                {/* Category Header Row (28px height, draggable & drop-target) */}
                <div
                  onDragOver={(e) => handleCategoryHeaderDragOver(e, cat)}
                  onDragLeave={(e) => handleCategoryHeaderDragLeave(e, cat)}
                  onDrop={(e) => handleCategoryHeaderDrop(e, cat)}
                  style={{
                    backgroundColor: isHeaderTarget && draggedServiceId
                      ? 'rgba(255, 153, 0, 0.15)'
                      : 'var(--aws-card-bg)',
                  }}
                  className={`group w-full h-7 px-2 flex items-center justify-between text-left transition-[background-color,box-shadow] duration-150 relative ${
                    isCategoryDragging ? 'opacity-40' : 'opacity-100'
                  } ${
                    isHeaderTarget && draggedServiceId
                      ? 'ring-2 ring-[#FF9900] border-l-4 border-l-[#FF9900]'
                      : 'hover:bg-[var(--aws-page-bg)]'
                  }`}
                >
                  {/* Category Header Left: Drag Grip + Chevron + Label */}
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    {/* Category Label Drag Handle */}
                    <span
                      draggable
                      onDragStart={(e) => handleCategoryDragStart(e, cat)}
                      onDragEnd={handleCardDragEnd}
                      title={`Drag to reorder "${cat}" section`}
                      className="opacity-0 group-hover:opacity-60 text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] cursor-grab active:cursor-grabbing shrink-0 transition-opacity mr-0.5"
                    >
                      <GripVertical className="w-3 h-3" strokeWidth={1.75} />
                    </span>

                    {/* Toggle Button */}
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
                  </div>

                  {/* Category Header Right: Active Drop Badge or Count */}
                  {isHeaderTarget && draggedServiceId ? (
                    <span className="text-[10px] font-bold text-[#FF9900] bg-[#FF9900]/20 px-1.5 py-0.5 rounded animate-pulse shrink-0">
                      + Move to {cat}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-[var(--aws-text-muted)] shrink-0">
                      {catServices.length}
                    </span>
                  )}
                </div>

                {/* Category Reorder Drop Indicator - Bottom */}
                {isHeaderTarget && draggedCategory && targetCategoryDropPosition === 'bottom' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF9900] z-30 pointer-events-none flex items-center shadow-[0_0_8px_rgba(255,153,0,0.8)]">
                    <div className="w-2 h-2 rounded-full bg-[#FF9900] -ml-1 border-2 border-[var(--aws-page-bg)]" />
                  </div>
                )}

                {/* Category Service Items (each 28px height) */}
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
      </div>
    </aside>
  );
};

export default ServiceCatalog;
