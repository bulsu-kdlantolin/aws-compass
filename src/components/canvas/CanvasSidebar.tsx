import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Layers,
  Shapes,
  StickyNote,
  Type,
  Plus,
  Star,
  Lock,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { useCompassStore, DEFAULT_CATEGORIES } from '../../store/useCompassStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { AWSServiceIcon } from '../icons/AWSServiceIcon';
import { CloudscapeSearchInput } from '../ui/CloudscapeSearchInput';
import { SidebarResizeHandle } from '../ui/SidebarResizeHandle';
import { getAWSCategoryColor } from '../../utils/awsCategoryColors';
import type {
  AWSCategory,
  AWSService,
  GroupBoundaryType,
  ExternalActorType,
  StepBadgeType,
} from '../../types/aws';

export interface StencilDragData {
  type: 'service' | 'boundary' | 'actor' | 'annotation' | 'text-block' | 'step-badge' | 'spec-stamp';
  serviceId?: string;
  category?: AWSCategory;
  name?: string;
  boundaryType?: GroupBoundaryType;
  actorType?: ExternalActorType;
  stepType?: StepBadgeType;
  caption?: string;
  isSpecStamp?: boolean;
  label?: string;
  title?: string;
  content?: string;
}

interface BoundaryStencilDef {
  type: GroupBoundaryType;
  groupId: string;
  label: string;
  desc: string;
  badge: string;
  borderStyle: 'solid' | 'dashed';
  borderColorLight: string;
  borderColorDark: string;
  tintLight?: string;
  tintDark?: string;
}

const BOUNDARY_STENCILS: BoundaryStencilDef[] = [
  {
    type: 'aws-organization',
    groupId: 'aws-organization',
    label: 'AWS Organization / Root',
    desc: 'Multi-account root container & SCPs',
    badge: 'Root / OU',
    borderStyle: 'dashed',
    borderColorLight: '#879596',
    borderColorDark: '#879596',
    tintLight: 'rgba(135, 149, 150, 0.04)',
    tintDark: 'rgba(135, 149, 150, 0.06)',
  },
  {
    type: 'aws-account',
    groupId: 'aws-account',
    label: 'AWS Account Boundary',
    desc: 'Perimeter with Account ID header badge',
    badge: 'Account ID',
    borderStyle: 'solid',
    borderColorLight: '#FF9900',
    borderColorDark: '#FF9900',
    tintLight: 'rgba(255, 153, 0, 0.04)',
    tintDark: 'rgba(255, 153, 0, 0.06)',
  },
  {
    type: 'aws-cloud',
    groupId: 'aws-cloud',
    label: 'AWS Cloud / Region',
    desc: 'Outer cloud regional perimeter',
    badge: 'Cloud Scope',
    borderStyle: 'dashed',
    borderColorLight: '#545B64',
    borderColorDark: '#879596',
  },
  {
    type: 'availability-zone',
    groupId: 'availability-zone',
    label: 'Availability Zone (AZ Lane)',
    desc: 'Isolated AZ lane across subnets',
    badge: 'AZ Lane',
    borderStyle: 'dashed',
    borderColorLight: '#00A1C9',
    borderColorDark: '#00A1C9',
    tintLight: 'rgba(0, 161, 201, 0.03)',
    tintDark: 'rgba(0, 161, 201, 0.05)',
  },
  {
    type: 'vpc',
    groupId: 'vpc',
    label: 'VPC Container',
    desc: 'Virtual Private Cloud boundary',
    badge: '10.0.0.0/16',
    borderStyle: 'solid',
    borderColorLight: '#8C4FFF',
    borderColorDark: '#8C4FFF',
    tintLight: 'rgba(140, 79, 255, 0.03)',
    tintDark: 'rgba(140, 79, 255, 0.05)',
  },
  {
    type: 'public-subnet',
    groupId: 'public-subnet',
    label: 'Public Subnet',
    desc: 'Direct Internet Gateway routing',
    badge: '10.0.1.0/24',
    borderStyle: 'solid',
    borderColorLight: '#1D8102',
    borderColorDark: '#2EA043',
    tintLight: 'rgba(29, 129, 2, 0.04)',
    tintDark: 'rgba(46, 160, 67, 0.06)',
  },
  {
    type: 'private-subnet',
    groupId: 'private-subnet',
    label: 'Private Subnet',
    desc: 'NAT/PrivateLink egress only',
    badge: '10.0.2.0/24',
    borderStyle: 'solid',
    borderColorLight: '#0972D3',
    borderColorDark: '#539FE5',
    tintLight: 'rgba(9, 114, 211, 0.04)',
    tintDark: 'rgba(83, 159, 229, 0.06)',
  },
  {
    type: 'security-group',
    groupId: 'security-group',
    label: 'Security Group',
    desc: 'Stateful firewall boundary',
    badge: 'sg-boundary',
    borderStyle: 'dashed',
    borderColorLight: '#DD344C',
    borderColorDark: '#DD344C',
    tintLight: 'rgba(221, 52, 76, 0.03)',
    tintDark: 'rgba(221, 52, 76, 0.05)',
  },
  {
    type: 'auto-scaling-group',
    groupId: 'auto-scaling-group',
    label: 'Auto Scaling Group (ASG)',
    desc: 'Elastic compute scaling cluster',
    badge: 'ASG Min/Max',
    borderStyle: 'dashed',
    borderColorLight: '#ED7100',
    borderColorDark: '#ED7100',
    tintLight: 'rgba(237, 113, 0, 0.03)',
    tintDark: 'rgba(237, 113, 0, 0.05)',
  },
  {
    type: 'corporate-datacenter',
    groupId: 'corporate-datacenter',
    label: 'On-Premises / Corporate Data Center',
    desc: 'Hybrid customer gateway perimeter',
    badge: 'On-Prem',
    borderStyle: 'dashed',
    borderColorLight: '#545B64',
    borderColorDark: '#879596',
    tintLight: 'rgba(84, 91, 100, 0.04)',
    tintDark: 'rgba(135, 149, 150, 0.06)',
  },
];

interface ActorStencilDef {
  type: ExternalActorType;
  label: string;
  desc: string;
  badge: string;
}

const NETWORK_PRIMITIVE_ACTORS: ActorStencilDef[] = [
  {
    type: 'vpc-gateway-endpoint',
    label: 'VPC Gateway Endpoint',
    desc: 'Prefix-list route to S3 / DynamoDB',
    badge: 'Gateway',
  },
  {
    type: 'vpc-interface-endpoint',
    label: 'VPC Interface Endpoint',
    desc: 'AWS PrivateLink ENI endpoint',
    badge: 'PrivateLink',
  },
  {
    type: 'route-table',
    label: 'Route Table',
    desc: 'Subnet CIDR routing manifest',
    badge: 'Routes',
  },
  {
    type: 'network-acl',
    label: 'Network ACL (NACL)',
    desc: 'Stateless subnet boundary filter',
    badge: 'Stateless',
  },
  {
    type: 'customer-gateway',
    label: 'Customer Gateway (CGW)',
    desc: 'On-prem VPN/Direct Connect endpoint',
    badge: 'IPsec',
  },
];

const EXTERNAL_SAAS_ACTORS: ActorStencilDef[] = [
  {
    type: 'user-browser',
    label: 'Web Client / End User',
    desc: 'Browser, Single-Page App, Desktop client',
    badge: 'Client',
  },
  {
    type: 'mobile-client',
    label: 'Mobile App Client',
    desc: 'iOS / Android Native mobile user',
    badge: 'Mobile',
  },
  {
    type: 'third-party-api',
    label: '3rd-Party SaaS / REST API',
    desc: 'External vendor or partner endpoint (Stripe, Twilio)',
    badge: 'SaaS API',
  },
  {
    type: 'external-webhook',
    label: 'Inbound Webhook / Partner Service',
    desc: 'External HTTP callback / Git event trigger',
    badge: 'Webhook',
  },
  {
    type: 'branch-office',
    label: 'Remote Branch Office / Edge Worker',
    desc: 'Enterprise branch location or field terminal',
    badge: 'Office',
  },
  {
    type: 'corporate-datacenter',
    label: 'Corporate Data Center',
    desc: 'On-premises enterprise infrastructure',
    badge: 'On-Prem',
  },
];

interface StepBadgeStencilDef {
  type: StepBadgeType;
  label: string;
  desc: string;
  caption: string;
  badge: string;
}

const STEP_BADGE_STENCILS: StepBadgeStencilDef[] = [
  {
    type: 'flow-step',
    label: 'Numbered Flow Step',
    desc: 'Ordered sequence callout marker (①, ②, ③)',
    caption: '1',
    badge: '① Step',
  },
  {
    type: 'tls-badge',
    label: 'TLS / Encryption Lock',
    desc: 'Security indicator for mTLS or KMS encrypted link',
    caption: 'TLS 1.3',
    badge: 'mTLS',
  },
  {
    type: 'risk-pin',
    label: 'Architectural Risk / Warning Pin',
    desc: 'Flag single point of failure or high-cost warning',
    caption: 'SPOF Alert',
    badge: 'Warning',
  },
];

interface AnnotationStencilDef {
  kind: 'note' | 'text-block' | 'spec-stamp';
  label: string;
  desc: string;
  badge: string;
}

const ANNOTATION_STENCILS: AnnotationStencilDef[] = [
  {
    kind: 'note',
    label: 'Architecture Note / Callout',
    desc: 'Resizable markdown sticky note',
    badge: 'Markdown',
  },
  {
    kind: 'spec-stamp',
    label: 'SLA & DR Spec Stamp',
    desc: 'Title block with SLA & RTO/RPO targets',
    badge: '99.99%',
  },
  {
    kind: 'text-block',
    label: 'Section Heading Banner',
    desc: 'Clean borderless typographic canvas label',
    badge: '18px Bold',
  },
];

interface SidebarServiceCardProps {
  svc: AWSService;
  theme: 'dark' | 'light';
  onDragStart: (e: React.DragEvent, stencil: StencilDragData) => void;
  onQuickAdd: (svc: AWSService) => void;
  onToggleFavorite?: (id: string, e: React.MouseEvent) => void;
}

const SidebarServiceCard = React.memo<SidebarServiceCardProps>(({
  svc,
  onDragStart,
  onQuickAdd,
  onToggleFavorite,
}) => {
  return (
    <div
      draggable
      onDragStart={(e) =>
        onDragStart(e, {
          type: 'service',
          serviceId: svc.id,
          category: svc.category,
          name: svc.name,
        })
      }
      onClick={() => onQuickAdd(svc)}
      className="group relative h-8 px-2 rounded-[7px] flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-grab active:cursor-grabbing transition-colors select-none"
      title={`Drag ${svc.name} (${svc.id}) onto the canvas or click to add`}
    >
      <div className="shrink-0 flex items-center justify-center">
        <AWSServiceIcon serviceId={svc.id} category={svc.category} size={20} variant="service" />
      </div>

      <span className="text-[12.5px] font-medium text-slate-700 dark:text-slate-200 truncate flex-1 group-hover:text-slate-900 dark:group-hover:text-white">
        {svc.name}
      </span>

      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
        T{svc.tier}
      </span>

      {onToggleFavorite && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(svc.id, e);
          }}
          className={`size-6 rounded flex items-center justify-center shrink-0 transition-opacity cursor-pointer ${svc.isFavorite
            ? 'opacity-100 text-[#FF9900]'
            : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:text-[#FF9900]'
            }`}
          title={svc.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star className={`w-3.5 h-3.5 ${svc.isFavorite ? 'fill-[#FF9900]' : ''}`} />
        </button>
      )}
    </div>
  );
});

export const CanvasSidebar: React.FC = () => {
  const isCanvasSidebarOpen = useCanvasStore((s) => s.isCanvasSidebarOpen);
  const setIsCanvasSidebarOpen = useCanvasStore((s) => s.setIsCanvasSidebarOpen);
  const [activeMode, setActiveMode] = useState<'catalog' | 'stencils'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Accordion section states for Stencils tab (5 groups)
  const [isBoundariesOpen, setIsBoundariesOpen] = useState(true);
  const [isNetworkPrimitivesOpen, setIsNetworkPrimitivesOpen] = useState(true);
  const [isActorsOpen, setIsActorsOpen] = useState(true);
  const [isStepBadgesOpen, setIsStepBadgesOpen] = useState(true);
  const [isAnnotationsOpen, setIsAnnotationsOpen] = useState(true);

  const services = useCompassStore((s) => s.services);
  const theme = useCompassStore((s) => s.theme);
  const filter = useCompassStore((s) => s.filter);
  const setFavoritesFilter = useCompassStore((s) => s.setFavoritesFilter);
  const toggleFavorite = useCompassStore((s) => s.toggleFavorite);
  const sidebarWidth = useCompassStore((s) => s.sidebarWidth);
  const setSidebarWidth = useCompassStore((s) => s.setSidebarWidth);
  const addServiceNode = useCanvasStore((s) => s.addServiceNode);
  const addBoundaryNode = useCanvasStore((s) => s.addBoundaryNode);
  const addExternalActor = useCanvasStore((s) => s.addExternalActor);
  const addStepBadgeNode = useCanvasStore((s) => s.addStepBadgeNode);
  const addAnnotationNode = useCanvasStore((s) => s.addAnnotationNode);

  const handleToggleFavorite = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      toggleFavorite(id);
    },
    [toggleFavorite]
  );

  const toggleCategoryCollapse = useCallback((cat: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  }, []);

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((svc) => {
      if (filter.favoritesOnly && !svc.isFavorite) {
        return false;
      }
      const matchesSearch =
        !searchQuery.trim() ||
        svc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        svc.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [services, filter.favoritesOnly, searchQuery]);

  // Group filtered services by category
  const servicesByCategory = useMemo(() => {
    const map = new Map<AWSCategory, AWSService[]>();
    DEFAULT_CATEGORIES.forEach((cat) => map.set(cat, []));

    filteredServices.forEach((svc) => {
      const list = map.get(svc.category);
      if (list) {
        list.push(svc);
      } else {
        map.set(svc.category, [svc]);
      }
    });

    return Array.from(map.entries())
      .filter(([_, svcs]) => svcs.length > 0)
      .map(([category, svcs]) => ({ category, svcs }));
  }, [filteredServices]);

  // Filtered Stencils
  const filteredBoundaries = useMemo(() => {
    if (!searchQuery.trim()) return BOUNDARY_STENCILS;
    const q = searchQuery.toLowerCase();
    return BOUNDARY_STENCILS.filter(
      (b) =>
        b.label.toLowerCase().includes(q) ||
        b.desc.toLowerCase().includes(q) ||
        b.badge.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredNetworkPrimitives = useMemo(() => {
    if (!searchQuery.trim()) return NETWORK_PRIMITIVE_ACTORS;
    const q = searchQuery.toLowerCase();
    return NETWORK_PRIMITIVE_ACTORS.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.desc.toLowerCase().includes(q) ||
        a.badge.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredActors = useMemo(() => {
    if (!searchQuery.trim()) return EXTERNAL_SAAS_ACTORS;
    const q = searchQuery.toLowerCase();
    return EXTERNAL_SAAS_ACTORS.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.desc.toLowerCase().includes(q) ||
        a.badge.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredStepBadges = useMemo(() => {
    if (!searchQuery.trim()) return STEP_BADGE_STENCILS;
    const q = searchQuery.toLowerCase();
    return STEP_BADGE_STENCILS.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q) ||
        s.badge.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredAnnotations = useMemo(() => {
    if (!searchQuery.trim()) return ANNOTATION_STENCILS;
    const q = searchQuery.toLowerCase();
    return ANNOTATION_STENCILS.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.desc.toLowerCase().includes(q) ||
        a.badge.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const totalStencilMatches =
    filteredBoundaries.length +
    filteredNetworkPrimitives.length +
    filteredActors.length +
    filteredStepBadges.length +
    filteredAnnotations.length;

  // Drag start handler
  const handleDragStart = useCallback(
    (e: React.DragEvent, stencil: StencilDragData) => {
      e.dataTransfer.setData('application/aws-stencil', JSON.stringify(stencil));
      e.dataTransfer.effectAllowed = 'copy';
    },
    []
  );

  // Quick-add handlers for 1-click placing onto canvas
  const handleQuickAddService = useCallback(
    (svc: AWSService) => {
      const center = { x: 300 + Math.random() * 80, y: 180 + Math.random() * 60 };
      addServiceNode(svc, center);
    },
    [addServiceNode]
  );

  const handleQuickAddBoundary = useCallback(
    (b: BoundaryStencilDef) => {
      const center = { x: 180, y: 120 };
      addBoundaryNode(b.type, b.label, center);
    },
    [addBoundaryNode]
  );

  const handleQuickAddActor = useCallback(
    (actorType: ExternalActorType, label: string) => {
      const center = { x: 260 + Math.random() * 60, y: 180 + Math.random() * 60 };
      addExternalActor(actorType, label, center);
    },
    [addExternalActor]
  );

  const handleQuickAddStepBadge = useCallback(
    (sb: StepBadgeStencilDef) => {
      const center = { x: 280 + Math.random() * 60, y: 180 + Math.random() * 60 };
      addStepBadgeNode(sb.type, sb.caption, center);
    },
    [addStepBadgeNode]
  );

  const handleQuickAddNote = useCallback(() => {
    const center = { x: 320, y: 200 };
    addAnnotationNode('Architecture Note', 'Double-click to edit markdown note content...', center, { isAnnotation: true });
  }, [addAnnotationNode]);

  const handleQuickAddTextBlock = useCallback(() => {
    const center = { x: 320, y: 140 };
    addAnnotationNode('Section Heading', 'Section Heading', center, { isTextOnly: true });
  }, [addAnnotationNode]);

  const handleQuickAddSpecStamp = useCallback(() => {
    const center = { x: 320, y: 160 };
    addAnnotationNode(
      'System Architecture Spec',
      'Target Availability: 99.99%\nRTO: < 15 min · RPO: < 1 min\nCompliance: SOC2 / HIPAA\nus-east-1 Active-Active',
      center,
      { isSpecStamp: true }
    );
  }, [addAnnotationNode]);

  if (!isCanvasSidebarOpen) {
    return (
      <div className="relative z-50 shrink-0">
        <button
          type="button"
          onClick={() => setIsCanvasSidebarOpen(true)}
          className="absolute left-0 top-16 h-9 pl-2 pr-2.5 rounded-r-[8px] bg-white/92 dark:bg-[#111726]/90 backdrop-blur-xl border-y border-r border-slate-200/90 dark:border-white/[0.08] shadow-md hover:border-[#FF9900] text-slate-500 dark:text-slate-400 hover:text-[#FF9900] flex items-center gap-1.5 transition-all cursor-pointer group z-50"
          title="Open Canvas Stencils & Catalog"
          aria-label="Open Canvas Stencils & Catalog"
        >
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          <span className="text-[11px] font-semibold tracking-wide text-slate-800 dark:text-slate-200">
            Catalog & Stencils
          </span>
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="AWS Canvas Stencils and Service Catalog"
      style={{
        width: `${sidebarWidth}px`,
      }}
      className="relative h-full flex flex-col border-r border-slate-200/90 dark:border-white/[0.08] bg-white/92 dark:bg-[#111726]/90 backdrop-blur-xl shrink-0 z-30 select-none animate-in fade-in duration-150"
    >
      {/* Draggable Resize Handle */}
      <SidebarResizeHandle
        sidebarWidth={sidebarWidth}
        onWidthChange={setSidebarWidth}
      />

      {/* Top Header & Segmented Tab Switcher */}
      <div className="p-3 border-b border-slate-100 dark:border-white/[0.05] space-y-2.5 shrink-0 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold text-slate-800 dark:text-slate-200">
            Canvas Studio
          </span>
          <button
            type="button"
            onClick={() => setIsCanvasSidebarOpen(false)}
            className="p-1 rounded-[6px] text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Collapse Sidebar"
            aria-label="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Dual-Mode Segmented Control (Sunken Track + Active Pill) */}
        <div className="grid grid-cols-2 p-0.5 rounded-[8px] bg-slate-100/80 dark:bg-[#090D16]/80 border border-slate-200/90 dark:border-white/[0.05]">
          <button
            type="button"
            onClick={() => setActiveMode('catalog')}
            className={`h-7 rounded-[6px] text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeMode === 'catalog'
              ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>AWS Catalog</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('stencils')}
            className={`h-7 rounded-[6px] text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeMode === 'stencils'
              ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            <Shapes className="w-3.5 h-3.5" />
            <span>Stencils</span>
          </button>
        </div>

        {/* Search Input & Favorites Quick Toggle */}
        <div className="flex items-center gap-1.5">
          <CloudscapeSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={
              activeMode === 'catalog'
                ? filter.favoritesOnly
                  ? 'Filter favorites…'
                  : 'Filter services by name, ID…'
                : 'Search stencils or boundaries…'
            }
            size="sm"
            className="w-full flex-1"
          />
          {activeMode === 'catalog' && (
            <button
              type="button"
              onClick={() => setFavoritesFilter(!filter.favoritesOnly)}
              className={`h-8 w-8 rounded-[6px] flex items-center justify-center shrink-0 transition-colors cursor-pointer border ${filter.favoritesOnly
                  ? 'bg-[#FF9900]/15 text-[#FF9900] border-[#FF9900]/40 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] border-slate-200/90 dark:border-white/[0.08]'
                }`}
              title={
                filter.favoritesOnly
                  ? 'Showing favorite services only (Click to show all)'
                  : 'Show favorite services only'
              }
              aria-label="Favorites filter toggle"
            >
              <Star
                className={`w-3.5 h-3.5 transition-transform active:scale-90 ${filter.favoritesOnly ? 'fill-[#FF9900] text-[#FF9900]' : ''
                  }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Mode 1: AWS Service Catalog (Tree-First Category Navigation) */}
      {activeMode === 'catalog' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {servicesByCategory.map(({ category, svcs }) => {
            const isCollapsed = !searchQuery.trim() && !!collapsedCategories[category];
            const catColor = getAWSCategoryColor(category, theme);

            return (
              <div key={category} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => toggleCategoryCollapse(category)}
                  className="w-full h-7 px-2 flex items-center justify-between text-[11.5px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-[6px] hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      style={{ backgroundColor: catColor }}
                      className="w-2 h-2 rounded-full shrink-0"
                    />
                    <span className="truncate">{category}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ({svcs.length})
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'
                      }`}
                  />
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5 pl-1">
                    {svcs.map((svc) => (
                      <SidebarServiceCard
                        key={svc.id}
                        svc={svc}
                        theme={theme}
                        onDragStart={handleDragStart}
                        onQuickAdd={handleQuickAddService}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {filteredServices.length === 0 && (
            <div className="py-8 text-center text-[12px] text-slate-400">
              {filter.favoritesOnly
                ? searchQuery.trim()
                  ? `No favorite services match "${searchQuery}"`
                  : 'No favorite services found. Star services to see them here.'
                : `No services match "${searchQuery}"`}
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Diagram Stencils */}
      {activeMode === 'stencils' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2.5">
          {totalStencilMatches === 0 ? (
            <div className="py-8 text-center text-[12px] text-slate-400">
              No stencils match &quot;{searchQuery}&quot;
            </div>
          ) : (
            <>
              {/* Group 1: Cloud & Account Boundaries */}
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => setIsBoundariesOpen((prev) => !prev)}
                  className="w-full h-7 px-2 flex items-center justify-between text-[11.5px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-[6px] hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer transition-colors"
                >
                  <span>Cloud &amp; Account Boundaries ({filteredBoundaries.length})</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isBoundariesOpen ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                {isBoundariesOpen && (
                  <div className="space-y-0.5">
                    {filteredBoundaries.map((b) => (
                      <div
                        key={b.type}
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(e, {
                            type: 'boundary',
                            boundaryType: b.type,
                            label: b.label,
                          })
                        }
                        onClick={() => handleQuickAddBoundary(b)}
                        className="group flex items-center gap-2.5 h-8 px-2.5 rounded-[7px] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-grab active:cursor-grabbing select-none"
                        title={`${b.label} — ${b.desc} (Click to add or drag onto canvas)`}
                      >
                        <div className="shrink-0 flex items-center justify-center">
                          <AWSServiceIcon groupId={b.groupId} size={18} variant="group" />
                        </div>
                        <div className="min-w-0 flex-1 flex items-center gap-2">
                          <span className="text-[12.5px] font-medium text-slate-700 dark:text-slate-200 truncate group-hover:text-slate-900 dark:group-hover:text-white">
                            {b.label}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-400 shrink-0">
                            {b.badge}
                          </span>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-white/[0.05]" />

              {/* Group 2: Network & Routing Primitives */}
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => setIsNetworkPrimitivesOpen((prev) => !prev)}
                  className="w-full h-7 px-2 flex items-center justify-between text-[11.5px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-[6px] hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer transition-colors"
                >
                  <span>Network &amp; Routing Primitives ({filteredNetworkPrimitives.length})</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isNetworkPrimitivesOpen ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                {isNetworkPrimitivesOpen && (
                  <div className="space-y-0.5">
                    {filteredNetworkPrimitives.map((p) => (
                      <div
                        key={p.type}
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(e, {
                            type: 'actor',
                            actorType: p.type,
                            label: p.label,
                          })
                        }
                        onClick={() => handleQuickAddActor(p.type, p.label)}
                        className="group flex items-center gap-2.5 h-8 px-2.5 rounded-[7px] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-grab active:cursor-grabbing select-none"
                        title={`${p.label} — ${p.desc} (Click to add or drag onto canvas)`}
                      >
                        <div className="shrink-0 flex items-center justify-center">
                          <AWSServiceIcon actorId={p.type} size={18} variant="actor" />
                        </div>
                        <div className="min-w-0 flex-1 flex items-center gap-2">
                          <span className="text-[12.5px] font-medium text-slate-700 dark:text-slate-200 truncate group-hover:text-slate-900 dark:group-hover:text-white">
                            {p.label}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-400 shrink-0">
                            {p.badge}
                          </span>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-white/[0.05]" />

              {/* Group 3: Clients, DevOps & External SaaS Actors */}
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => setIsActorsOpen((prev) => !prev)}
                  className="w-full h-7 px-2 flex items-center justify-between text-[11.5px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-[6px] hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer transition-colors"
                >
                  <span>Clients &amp; SaaS Actors ({filteredActors.length})</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isActorsOpen ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                {isActorsOpen && (
                  <div className="space-y-0.5">
                    {filteredActors.map((act) => (
                      <div
                        key={act.type}
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(e, {
                            type: 'actor',
                            actorType: act.type,
                            label: act.label,
                          })
                        }
                        onClick={() => handleQuickAddActor(act.type, act.label)}
                        className="group flex items-center gap-2.5 h-8 px-2.5 rounded-[7px] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-grab active:cursor-grabbing select-none"
                        title={`${act.label} — ${act.desc} (Click to add or drag onto canvas)`}
                      >
                        <div className="shrink-0 flex items-center justify-center">
                          <AWSServiceIcon actorId={act.type} size={18} variant="actor" />
                        </div>
                        <div className="min-w-0 flex-1 flex items-center gap-2">
                          <span className="text-[12.5px] font-medium text-slate-700 dark:text-slate-200 truncate group-hover:text-slate-900 dark:group-hover:text-white">
                            {act.label}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-400 shrink-0">
                            {act.badge}
                          </span>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-white/[0.05]" />

              {/* Group 4: Flow Step Markers & Risk Pins */}
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => setIsStepBadgesOpen((prev) => !prev)}
                  className="w-full h-7 px-2 flex items-center justify-between text-[11.5px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-[6px] hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer transition-colors"
                >
                  <span>Flow Steps &amp; Risk Pins ({filteredStepBadges.length})</span>
                  <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isStepBadgesOpen ? 'rotate-180' : ''}`}
                                            />
                </button>

                {isStepBadgesOpen && (
                  <div className="space-y-0.5">
                    {filteredStepBadges.map((sb) => (
                      <div
                        key={sb.type}
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(e, {
                            type: 'step-badge',
                            stepType: sb.type,
                            caption: sb.caption,
                            label: sb.label,
                          })
                        }
                        onClick={() => handleQuickAddStepBadge(sb)}
                        className="group flex items-center gap-2.5 h-8 px-2.5 rounded-[7px] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-grab active:cursor-grabbing select-none"
                        title={`${sb.label} — ${sb.desc} (Click to add or drag onto canvas)`}
                      >
                        <div className="shrink-0 flex items-center justify-center">
                          {sb.type === 'flow-step' ? (
                            <span className="size-4 rounded-full bg-[#FF9900] text-[#0F141A] font-mono font-bold text-[10px] flex items-center justify-center">
                              ①
                            </span>
                          ) : sb.type === 'tls-badge' ? (
                            <span className="size-4 rounded bg-[#0972D3]/15 text-[#0972D3] dark:text-[#539FE5] flex items-center justify-center">
                              <Lock className="w-2.5 h-2.5" />
                            </span>
                          ) : (
                            <span className="size-4 rounded bg-[#DD344C]/15 text-[#DD344C] dark:text-[#F87171] flex items-center justify-center">
                              <AlertTriangle className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 flex items-center gap-2">
                          <span className="text-[12.5px] font-medium text-slate-700 dark:text-slate-200 truncate group-hover:text-slate-900 dark:group-hover:text-white">
                            {sb.label}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-400 shrink-0">
                            {sb.badge}
                          </span>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-white/[0.05]" />

              {/* Group 5: Architecture Annotations & Spec Stamps */}
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => setIsAnnotationsOpen((prev) => !prev)}
                  className="w-full h-7 px-2 flex items-center justify-between text-[11.5px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-[6px] hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer transition-colors"
                >
                  <span>Spec Stamps &amp; Annotations ({filteredAnnotations.length})</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isAnnotationsOpen ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                {isAnnotationsOpen && (
                  <div className="space-y-0.5">
                    {filteredAnnotations.map((an) => (
                      <div
                        key={an.kind}
                        draggable
                        onDragStart={(e) => {
                          if (an.kind === 'note') {
                            handleDragStart(e, { type: 'annotation', title: 'Architecture Note' });
                          } else if (an.kind === 'spec-stamp') {
                            handleDragStart(e, {
                              type: 'spec-stamp',
                              title: 'System Architecture Spec',
                              isSpecStamp: true,
                            });
                          } else {
                            handleDragStart(e, {
                              type: 'text-block',
                              title: 'Architecture Section Header',
                            });
                          }
                        }}
                        onClick={() => {
                          if (an.kind === 'note') handleQuickAddNote();
                          else if (an.kind === 'spec-stamp') handleQuickAddSpecStamp();
                          else handleQuickAddTextBlock();
                        }}
                        className="group flex items-center gap-2.5 h-8 px-2.5 rounded-[7px] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-grab active:cursor-grabbing select-none"
                        title={`${an.label} — ${an.desc} (Click to add or drag onto canvas)`}
                      >
                        <div className="shrink-0 flex items-center justify-center">
                          {an.kind === 'note' ? (
                            <span className="size-4 rounded bg-[#F59E0B]/20 text-[#D97706] flex items-center justify-center">
                              <StickyNote className="w-2.5 h-2.5" />
                            </span>
                          ) : an.kind === 'spec-stamp' ? (
                            <span className="size-4 rounded bg-[#0972D3]/15 text-[#0972D3] dark:text-[#539FE5] flex items-center justify-center">
                              <FileSpreadsheet className="w-2.5 h-2.5" />
                            </span>
                          ) : (
                            <span className="size-4 rounded bg-slate-500/15 text-slate-400 flex items-center justify-center">
                              <Type className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 flex items-center gap-2">
                          <span className="text-[12.5px] font-medium text-slate-700 dark:text-slate-200 truncate group-hover:text-slate-900 dark:group-hover:text-white">
                            {an.label}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-400 shrink-0">
                            {an.badge}
                          </span>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
};

export default CanvasSidebar;
