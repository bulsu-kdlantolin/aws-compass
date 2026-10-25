import React, { useMemo, useState } from 'react';
import { Search, X, ChevronRight, Filter } from 'lucide-react';
import { useCompassStore } from '../../store/useCompassStore';
import type { AWSCategory, ServiceTier, StudyStatus } from '../../types/aws';
import { ServiceCard } from './ServiceCard';

const CATEGORIES: AWSCategory[] = [
  'Compute',
  'Storage',
  'Database',
  'Networking',
  'Security/IAM',
  'Serverless',
];

const TIERS: ServiceTier[] = [1, 2, 3];

export const ServiceCatalog: React.FC = () => {
  const {
    services,
    selectedServiceId,
    filter,
    setSelectedServiceId,
    setSearch,
    setCategoryFilter,
    setTierFilter,
    setStudyStatusFilter,
  } = useCompassStore();

  // Collapsible category state: all categories open by default
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

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

  // Group filtered services by category
  const servicesByCategory = useMemo(() => {
    const map = new Map<string, typeof services>();
    filteredServices.forEach((svc) => {
      const list = map.get(svc.category) || [];
      list.push(svc);
      map.set(svc.category, list);
    });
    return map;
  }, [filteredServices]);

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

  return (
    <aside
      style={{
        backgroundColor: 'var(--aws-sidebar-bg)',
        borderRightColor: 'var(--aws-border)',
      }}
      className="w-72 md:w-80 flex flex-col h-full border-r shrink-0 select-none rounded-none"
    >
      {/* Search Header */}
      <div
        style={{
          backgroundColor: 'var(--aws-card-bg)',
          borderBottomColor: 'var(--aws-border)',
        }}
        className="p-2.5 border-b space-y-2"
      >
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--aws-text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.75} />
          <input
            type="text"
            value={filter.search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            style={{
              backgroundColor: 'var(--aws-page-bg)',
              borderColor: 'var(--aws-input-border)',
              color: 'var(--aws-text-primary)',
            }}
            className="w-full text-[12px] pl-8 pr-7 py-1.5 rounded-[4px] border focus:border-[var(--aws-brand)] focus:outline-none placeholder:text-[var(--aws-text-muted)] transition-colors"
          />
          {filter.search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] p-0.5 cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          )}
        </div>

        {/* Filters Row: Tier & Status */}
        <div className="flex items-center justify-between gap-1.5 text-[11px]">
          {/* Tier Segmented Filter */}
          <div className="flex items-center gap-0.5">
            <span className="text-[10px] font-mono text-[var(--aws-text-muted)] mr-1">
              Tier:
            </span>
            {(['All', ...TIERS] as const).map((tierVal) => {
              const isSelected = filter.tier === tierVal;
              return (
                <button
                  key={tierVal}
                  type="button"
                  onClick={() => setTierFilter(tierVal)}
                  style={
                    isSelected
                      ? {
                          backgroundColor: 'var(--aws-brand)',
                          color: '#0F141A',
                          borderColor: 'var(--aws-brand)',
                        }
                      : {
                          backgroundColor: 'var(--aws-page-bg)',
                          color: 'var(--aws-text-muted)',
                          borderColor: 'var(--aws-border)',
                        }
                  }
                  className="px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono font-medium border transition-colors cursor-pointer"
                >
                  {tierVal === 'All' ? 'All' : `T${tierVal}`}
                </button>
              );
            })}
          </div>

          {/* Status Filter */}
          <select
            value={filter.studyStatus}
            onChange={(e) => setStudyStatusFilter(e.target.value as StudyStatus | 'All')}
            aria-label="Filter by study status"
            style={{
              backgroundColor: 'var(--aws-page-bg)',
              color: 'var(--aws-text-primary)',
              borderColor: 'var(--aws-input-border)',
            }}
            className="rounded-[3px] px-1.5 py-0.5 text-[10px] outline-none cursor-pointer border focus:border-[var(--aws-brand)]"
          >
            <option value="All">All statuses</option>
            <option value="not-started">Unstudied</option>
            <option value="in-progress">In progress</option>
            <option value="mastered">Mastered</option>
            <option value="review">Review</option>
          </select>
        </div>
      </div>

      {/* Progress & Summary Hairline Bar */}
      <div
        style={{
          backgroundColor: 'var(--aws-page-bg)',
          borderBottomColor: 'var(--aws-border)',
        }}
        className="px-3 py-1.5 border-b flex items-center justify-between text-[11px]"
      >
        <span className="text-[var(--aws-text-muted)] font-mono text-[10px]">
          {filteredServices.length} of {services.length} services
        </span>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[var(--aws-text-muted)] font-mono">
            T1/T2: {masteredTier1And2Count}/{totalTier1And2} ({progressPercent}%)
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-[10px] text-[var(--aws-interactive)] hover:underline flex items-center gap-0.5 cursor-pointer ml-1"
            >
              <Filter className="w-2.5 h-2.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto divide-y divide-[var(--aws-border)] scrollbar-thin">
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
            {filteredServices.map((svc) => (
              <ServiceCard
                key={svc.id}
                service={svc}
                isSelected={svc.id === selectedServiceId}
                onSelect={() => setSelectedServiceId(svc.id)}
              />
            ))}
          </div>
        ) : (
          /* Collapsible Category Tree */
          CATEGORIES.map((cat) => {
            const catServices = servicesByCategory.get(cat) || [];
            if (catServices.length === 0) return null;
            const isCollapsed = !!collapsedCategories[cat];

            return (
              <div key={cat} className="select-none">
                {/* Category Header Row (28px height) */}
                <button
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  style={{
                    backgroundColor: 'var(--aws-card-bg)',
                  }}
                  className="w-full h-7 px-2 flex items-center justify-between text-left cursor-pointer hover:bg-[var(--aws-page-bg)] transition-colors"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ChevronRight
                      className={`w-3.5 h-3.5 text-[var(--aws-text-muted)] transition-transform duration-150 ${
                        isCollapsed ? '' : 'rotate-90'
                      }`}
                      strokeWidth={2}
                    />
                    <span className="text-[12px] font-semibold text-[var(--aws-text-primary)] truncate">
                      {cat}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--aws-text-muted)]">
                    {catServices.length}
                  </span>
                </button>

                {/* Category Service Items (each 28px height) */}
                {!isCollapsed && (
                  <div className="pl-2">
                    {catServices.map((svc) => (
                      <ServiceCard
                        key={svc.id}
                        service={svc}
                        isSelected={svc.id === selectedServiceId}
                        onSelect={() => setSelectedServiceId(svc.id)}
                      />
                    ))}
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
