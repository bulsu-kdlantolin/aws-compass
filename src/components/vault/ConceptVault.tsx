import React, { useState, useMemo } from 'react';
import Markdown from 'react-markdown';
import {
  ExternalLink,
  Edit3,
  BookOpen,
  RotateCcw,
  Save,
  Check,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
} from 'lucide-react';
import { useCompassStore } from '../../store/useCompassStore';
import type { AWSService, StudyStatus } from '../../types/aws';
import { MermaidViewer } from './MermaidViewer';
import { SEED_SERVICES } from '../../db/seedServices';
import { AWSServiceIcon } from '../icons/AWSServiceIcon';
import { CloudscapeStatusIndicator } from '../ui/CloudscapeStatusIndicator';
import { CloudscapeContainer } from '../ui/CloudscapeContainer';
import { CloudscapeAlert } from '../ui/CloudscapeAlert';
import { CloudscapeCodeBlock } from '../ui/CloudscapeCodeBlock';
import { CloudscapeSearchInput } from '../ui/CloudscapeSearchInput';
import { CloudscapeSelect, type CloudscapeSelectOption } from '../ui/CloudscapeSelect';
import { CloudscapeTextarea } from '../ui/CloudscapeTextarea';
import { CloudscapeCopyButton } from '../ui/CloudscapeCopyButton';
import { getAWSCategoryColor } from '../../utils/awsCategoryColors';
import { getVerifiedAWSDocsUrl } from '../../utils/awsDocs';

/* -------------------------------------------------------------------------- */
/*                           CLOUDSCAPE RESOURCE TABLE                        */
/* -------------------------------------------------------------------------- */

type SortKey = 'name' | 'category' | 'tier' | 'studyStatus';

const ConceptVaultTable: React.FC<{
  services: AWSService[];
  onSelectService: (id: string) => void;
}> = ({ services, onSelectService }) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortKey, setSortKey] = useState<SortKey>('tier');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

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
      } else if (sortKey === 'studyStatus') {
        const orderMap: Record<StudyStatus, number> = {
          mastered: 1,
          'in-progress': 2,
          review: 3,
          'not-started': 4,
        };
        cmp = orderMap[a.studyStatus] - orderMap[b.studyStatus];
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [services, search, categoryFilter, sortKey, sortOrder]);

  return (
    <div
      style={{ backgroundColor: 'var(--aws-page-bg)' }}
      className="flex flex-col h-full overflow-hidden p-4 sm:p-6"
    >
      <div className="max-w-7xl w-full mx-auto flex flex-col h-full overflow-hidden space-y-4">
        {/* Table Title and Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
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
              Explore core AWS services, official architecture blueprints, and exam study dossiers.
            </p>
          </div>

          {/* Density toggle */}
          <div className="flex items-center gap-1 self-start sm:self-auto">
            <span
              style={{ color: 'var(--aws-text-muted)' }}
              className="text-[12px] mr-1"
            >
              Density:
            </span>
            <button
              type="button"
              onClick={() => setDensity('comfortable')}
              style={
                density === 'comfortable'
                  ? {
                      backgroundColor: 'var(--aws-card-bg)',
                      borderColor: 'var(--aws-brand)',
                      color: 'var(--aws-text-primary)',
                    }
                  : {
                      backgroundColor: 'transparent',
                      borderColor: 'var(--aws-border)',
                      color: 'var(--aws-text-muted)',
                    }
              }
              className="px-2 py-1 text-[11px] rounded-[4px] border font-medium cursor-pointer transition-colors"
            >
              Comfortable
            </button>
            <button
              type="button"
              onClick={() => setDensity('compact')}
              style={
                density === 'compact'
                  ? {
                      backgroundColor: 'var(--aws-card-bg)',
                      borderColor: 'var(--aws-brand)',
                      color: 'var(--aws-text-primary)',
                    }
                  : {
                      backgroundColor: 'transparent',
                      borderColor: 'var(--aws-border)',
                      color: 'var(--aws-text-muted)',
                    }
              }
              className="px-2 py-1 text-[11px] rounded-[4px] border font-medium cursor-pointer transition-colors"
            >
              Compact
            </button>
          </div>
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
            className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0"
          >
            <div className="flex items-center gap-2.5 flex-1 max-w-lg">
              <CloudscapeSearchInput
                value={search}
                onChange={setSearch}
                placeholder="Filter by name, ID, or description..."
                ariaLabel="Filter services"
                className="flex-1"
                size="md"
              />

              {/* Category Select */}
              <CloudscapeSelect
                value={categoryFilter}
                options={categoryOptions}
                onChange={setCategoryFilter}
                ariaLabel="Filter by category"
                className="w-48 shrink-0"
              />
            </div>

            <span
              style={{ color: 'var(--aws-text-muted)' }}
              className="text-[12px] font-mono shrink-0"
            >
              {filteredAndSortedServices.length} of {services.length} services
            </span>
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
                    onClick={() => handleSort('name')}
                    className="px-4 py-2.5 cursor-pointer hover:text-[var(--aws-text-primary)] transition-colors"
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
                    className="px-4 py-2.5 cursor-pointer hover:text-[var(--aws-text-primary)] transition-colors"
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
                    className="px-4 py-2.5 cursor-pointer hover:text-[var(--aws-text-primary)] transition-colors"
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
                  <th scope="col" className="px-4 py-2.5">
                    CLI prefix
                  </th>
                  <th
                    scope="col"
                    onClick={() => handleSort('studyStatus')}
                    className="px-4 py-2.5 cursor-pointer hover:text-[var(--aws-text-primary)] transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Study status</span>
                      {sortKey === 'studyStatus' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-2.5 hidden lg:table-cell">
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
                      className={`hover:bg-[var(--aws-page-bg)] cursor-pointer transition-colors ${
                        density === 'comfortable' ? 'py-3' : 'py-1.5'
                      }`}
                    >
                      {/* Service column with 24x24px AWSServiceIcon */}
                      <td
                        className={`px-4 ${
                          density === 'comfortable' ? 'py-3' : 'py-1.5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <AWSServiceIcon
                            serviceId={svc.id}
                            size={24}
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
                        className={`px-4 ${
                          density === 'comfortable' ? 'py-3' : 'py-1.5'
                        }`}
                      >
                        {svc.category}
                      </td>

                      {/* Tier */}
                      <td
                        className={`px-4 font-mono text-[12px] ${
                          density === 'comfortable' ? 'py-3' : 'py-1.5'
                        }`}
                      >
                        <span
                          style={{
                            color:
                              svc.tier === 1
                                ? 'var(--aws-brand)'
                                : 'var(--aws-text-primary)',
                          }}
                        >
                          Tier {svc.tier}
                        </span>
                      </td>

                      {/* CLI Prefix */}
                      <td
                        className={`px-4 font-mono text-[12px] text-[var(--aws-text-muted)] ${
                          density === 'comfortable' ? 'py-3' : 'py-1.5'
                        }`}
                      >
                        aws {svc.id}
                      </td>

                      {/* Study Status */}
                      <td
                        className={`px-4 ${
                          density === 'comfortable' ? 'py-3' : 'py-1.5'
                        }`}
                      >
                        <CloudscapeStatusIndicator status={svc.studyStatus} />
                      </td>

                      {/* Summary */}
                      <td
                        style={{ color: 'var(--aws-text-muted)' }}
                        className={`px-4 text-[12px] hidden lg:table-cell max-w-xs xl:max-w-md truncate ${
                          density === 'comfortable' ? 'py-3' : 'py-1.5'
                        }`}
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
  onUpdateStatus: (id: string, status: StudyStatus) => Promise<void>;
  onUpdateDoc: (id: string, markdownDoc: string) => Promise<void>;
}

const STUDY_STATUS_OPTIONS: CloudscapeSelectOption[] = [
  { value: 'not-started', label: 'Unstudied' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'mastered', label: 'Mastered' },
  { value: 'review', label: 'Review' },
];

const ServiceDossierContent: React.FC<ServiceDossierContentProps> = ({
  service,
  onBackToTable,
  onUpdateStatus,
  onUpdateDoc,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editorContent, setEditorContent] = useState(service.markdownDoc);
  const [savedSuccess, setSavedSuccess] = useState(false);

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
        className="border-b px-4 sm:px-6 py-2.5 shrink-0 flex items-center justify-between gap-3 select-none"
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

        {/* View / Edit Mode & Docs link */}
        <div className="flex items-center gap-2">
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
                  : 'hover:text-[var(--aws-text-primary)] hover:bg-black/5 dark:hover:bg-white/5'
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
                  : 'hover:text-[var(--aws-text-primary)] hover:bg-black/5 dark:hover:bg-white/5'
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
                </svg>
                <span>AWS docs</span>
                <ExternalLink
                  className="w-3 h-3 text-[var(--aws-text-muted)] group-hover:text-[#FF9900] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-150"
                  strokeWidth={2}
                />
              </a>
            );
          })()}
        </div>
      </div>

      {/* Main Workspace Body */}
      {isEditing ? (
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
                        return <MermaidViewer chart={String(children).replace(/\n$/, '')} />;
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
        /* Reading View Layout: strictly a single flex-1 overflow-y-auto scroll container under the sticky breadcrumb bar */
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 scrollbar-thin custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-5 pb-8">
            {/* Cloudscape Container: Service Header & Key-Value Grid */}
            <CloudscapeContainer
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
              {/* Key-Value Grid with 1px vertical dividers between the 4 metadata columns */}
              <div
                style={{ borderColor: 'var(--aws-border)' }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2"
              >
                {/* Category */}
                <div className="border-r border-[var(--aws-border)] pr-6">
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
                <div className="border-r border-[var(--aws-border)] pr-6">
                  <span
                    style={{ color: 'var(--aws-text-muted)' }}
                    className="text-[12px] block font-medium"
                  >
                    Study tier
                  </span>
                  <span
                    style={{ color: 'var(--aws-text-primary)' }}
                    className="text-[13px] font-semibold mt-0.5 block font-mono"
                  >
                    Tier {service.tier}{' '}
                    <span className="text-[11px] font-sans font-normal text-[var(--aws-text-muted)]">
                      {service.tier === 1
                        ? '(Core)'
                        : service.tier === 2
                        ? '(Exam essential)'
                        : '(Specialized)'}
                    </span>
                  </span>
                </div>

                {/* CLI Prefix */}
                <div className="border-r border-[var(--aws-border)] pr-6">
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

                {/* Study Status */}
                <div>
                  <span
                    style={{ color: 'var(--aws-text-muted)' }}
                    className="text-[12px] block font-medium mb-1"
                  >
                    Study status
                  </span>
                  <CloudscapeSelect
                    value={service.studyStatus}
                    options={STUDY_STATUS_OPTIONS}
                    onChange={(val) =>
                      onUpdateStatus(service.id, val as StudyStatus)
                    }
                    ariaLabel="Update study status"
                    className="w-36"
                  />
                </div>
              </div>

              {/* ARN Example Row */}
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
                    code(props) {
                      const { children, className, ...rest } = props;
                      const match = /language-(\w+)/.exec(className || '');
                      const language = match ? match[1] : '';
                      if (language === 'mermaid') {
                        return <MermaidViewer chart={String(children).replace(/\n$/, '')} />;
                      }
                      if (language === 'bash' || language === 'sh' || language === 'shell') {
                        return (
                          <CloudscapeCodeBlock
                            code={String(children).replace(/\n$/, '')}
                            title="aws-cli"
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
          </div>
        </div>
      )}
    </div>
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
    updateServiceStatus,
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
      onUpdateStatus={updateServiceStatus}
      onUpdateDoc={updateServiceDoc}
    />
  );
};

export default ConceptVault;
