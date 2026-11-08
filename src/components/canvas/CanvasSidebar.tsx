import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Layers,
  Shapes,
  StickyNote,
  Type,
  Plus,
  GripVertical,
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
    tintLight: 'rgba(0, 161, 201, 0.04)',
    tintDark: 'rgba(0, 161, 201, 0.06)',
  },
  {
    type: 'vpc',
    groupId: 'vpc',
    label: 'VPC Container',
    desc: '10.0.0.0/16 Virtual Private Cloud',
    badge: '10.0.0.0/16',
    borderStyle: 'solid',
    borderColorLight: '#8C4FFF',
    borderColorDark: '#8C4FFF',
    tintLight: 'rgba(140, 79, 255, 0.05)',
    tintDark: 'rgba(140, 79, 255, 0.08)',
  },
  {
    type: 'public-subnet',
    groupId: 'public-subnet',
    label: 'Public Subnet',
    desc: 'Ingress tier with Internet Gateway route',
    badge: '10.0.1.0/24',
    borderStyle: 'solid',
    borderColorLight: '#2EA043',
    borderColorDark: '#2EA043',
    tintLight: 'rgba(46, 160, 67, 0.05)',
    tintDark: 'rgba(46, 160, 67, 0.08)',
  },
  {
    type: 'private-subnet',
    groupId: 'private-subnet',
    label: 'Private Subnet',
    desc: 'Isolated application backend tier',
    badge: '10.0.2.0/24',
    borderStyle: 'solid',
    borderColorLight: '#539FE5',
    borderColorDark: '#539FE5',
    tintLight: 'rgba(83, 159, 229, 0.05)',
    tintDark: 'rgba(83, 159, 229, 0.08)',
  },
  {
    type: 'security-group',
    groupId: 'security-group',
    label: 'Security Group',
    desc: 'Stateful ENI firewall port boundary',
    badge: 'TCP 443, 80',
    borderStyle: 'dashed',
    borderColorLight: '#DD344C',
    borderColorDark: '#DD344C',
    tintLight: 'rgba(221, 52, 76, 0.05)',
    tintDark: 'rgba(221, 52, 76, 0.08)',
  },
  {
    type: 'auto-scaling-group',
    groupId: 'auto-scaling-group',
    label: 'Auto Scaling Group',
    desc: 'Dynamic compute scaling boundary',
    badge: 'Min 2 · Max 10',
    borderStyle: 'dashed',
    borderColorLight: '#ED7100',
    borderColorDark: '#ED7100',
    tintLight: 'rgba(237, 113, 0, 0.05)',
    tintDark: 'rgba(237, 113, 0, 0.08)',
  },
];

interface NetworkPrimitiveStencilDef {
  type: ExternalActorType;
  label: string;
  desc: string;
  badge: string;
}

const NETWORK_PRIMITIVE_STENCILS: NetworkPrimitiveStencilDef[] = [
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
    desc: 'Subnet CIDR destination rules',
    badge: '0.0.0.0/0',
  },
  {
    type: 'network-acl',
    label: 'Network ACL (NACL)',
    desc: 'Stateless subnet packet filter shield',
    badge: 'NACL',
  },
  {
    type: 'customer-gateway',
    label: 'Customer Gateway (CGW)',
    desc: 'On-prem VPN / Direct Connect router',
    badge: 'BGP / IPSec',
  },
];

interface ActorStencilDef {
  type: ExternalActorType;
  label: string;
  desc: string;
  badge: string;
}

const ACTOR_STENCILS: ActorStencilDef[] = [
  {
    type: 'user-browser',
    label: 'Web Browser / End User',
    desc: 'Public HTTPS client traffic',
    badge: 'HTTPS',
  },
  {
    type: 'mobile-client',
    label: 'Mobile / IoT Client',
    desc: 'iOS/Android & MQTT edge devices',
    badge: 'REST / MQTT',
  },
  {
    type: 'corporate-datacenter',
    label: 'Corporate Data Center',
    desc: 'On-premise hybrid Direct Connect',
    badge: 'Hybrid DC',
  },
  {
    type: 'iam-admin',
    label: 'Developer / IAM Admin',
    desc: 'SSM Session Manager & CLI operator',
    badge: 'CLI / SSM',
  },
  {
    type: 'cicd-pipeline',
    label: 'GitHub / CI/CD Pipeline',
    desc: 'OIDC automated deployment runner',
    badge: 'OIDC',
  },
  {
    type: 'idp-auth',
    label: 'External Identity Provider',
    desc: 'Okta / Entra ID SAML / OIDC',
    badge: 'SAML / SSO',
  },
  {
    type: 'saas-webhook',
    label: 'Observability / SaaS Webhook',
    desc: 'Datadog, Slack, PagerDuty alerts',
    badge: 'Webhook',
  },
];

interface StepBadgeStencilDef {
  type: StepBadgeType;
  label: string;
  desc: string;
  badge: string;
  caption?: string;
}

const STEP_BADGE_STENCILS: StepBadgeStencilDef[] = [
  {
    type: 'flow-step',
    label: 'Numbered Flow Step',
    desc: 'Auto-incrementing ①, ②, ③ flow marker',
    badge: '① Step',
  },
  {
    type: 'tls-badge',
    label: 'TLS / mTLS Badge',
    desc: 'Edge certificate & termination pin',
    badge: 'TLS',
    caption: 'TLS 1.3 / mTLS',
  },
  {
    type: 'risk-pin',
    label: 'SPOF / Risk Marker',
    desc: 'Single point of failure alert pin',
    badge: 'Risk Pin',
    caption: 'SPOF Risk',
  },
];

interface AnnotationStencilDef {
  kind: 'note' | 'spec-stamp' | 'text-block';
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

const CATEGORIES: (AWSCategory | 'All')[] = [
  'All',
  ...DEFAULT_CATEGORIES,
];

interface SidebarServiceCardProps {
  svc: AWSService;
  theme: 'dark' | 'light';
  onDragStart: (e: React.DragEvent, stencil: StencilDragData) => void;
  onQuickAdd: (svc: AWSService) => void;
}

const SidebarServiceCard = React.memo<SidebarServiceCardProps>(({
  svc,
  theme,
  onDragStart,
  onQuickAdd,
}) => {
  const catColor = getAWSCategoryColor(svc.category, theme);
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
      className="group relative flex items-center gap-2 p-2 rounded-[6px] border border-transparent hover:border-[#D5DBDB] dark:hover:border-[#2A3647] hover:bg-[#F8F9FA] dark:hover:bg-[#1E2B3D] transition-all cursor-grab active:cursor-grabbing select-none"
      title={`Drag ${svc.name} (${svc.id}) onto the canvas or click to add`}
    >
      <GripVertical className="w-3.5 h-3.5 text-[#879596]/40 group-hover:text-[#879596] shrink-0" />

      <div className="shrink-0">
        <AWSServiceIcon serviceId={svc.id} category={svc.category} size={24} variant="service" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-medium text-[#16191F] dark:text-[#EAEDED] truncate group-hover:text-[#0972D3] dark:group-hover:text-[#539FE5]">
          {svc.name}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#545B64] dark:text-[#879596]">
          <span className="truncate">{svc.id}</span>
          <span>•</span>
          <span style={{ color: catColor }} className="font-semibold">
            {svc.category}
          </span>
        </div>
      </div>

      <span
        className={`text-[11px] font-mono font-medium tabular-nums shrink-0 ${svc.tier === 1
          ? 'text-[#FF9900]/90'
          : svc.tier === 2
            ? 'text-[#539FE5]/90'
            : 'text-[#879596]'
          }`}
      >
        T{svc.tier}
      </span>
    </div>
  );
});

export const CanvasSidebar: React.FC = () => {
  const isCanvasSidebarOpen = useCanvasStore((s) => s.isCanvasSidebarOpen);
  const setIsCanvasSidebarOpen = useCanvasStore((s) => s.setIsCanvasSidebarOpen);
  const [activeMode, setActiveMode] = useState<'catalog' | 'stencils'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AWSCategory | 'All'>('All');

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
  const sidebarWidth = useCompassStore((s) => s.sidebarWidth);
  const setSidebarWidth = useCompassStore((s) => s.setSidebarWidth);
  const addServiceNode = useCanvasStore((s) => s.addServiceNode);
  const addBoundaryNode = useCanvasStore((s) => s.addBoundaryNode);
  const addExternalActor = useCanvasStore((s) => s.addExternalActor);
  const addStepBadgeNode = useCanvasStore((s) => s.addStepBadgeNode);
  const addAnnotationNode = useCanvasStore((s) => s.addAnnotationNode);

  // When only showing favorites, derive categories strictly from favorited services
  const availableCategories = useMemo(() => {
    if (!filter.favoritesOnly) {
      return CATEGORIES;
    }
    const favCatSet = new Set<AWSCategory>();
    services.forEach((s) => {
      if (s.isFavorite) {
        favCatSet.add(s.category);
      }
    });
    const result: (AWSCategory | 'All')[] = ['All'];
    DEFAULT_CATEGORIES.forEach((cat) => {
      if (favCatSet.has(cat)) {
        result.push(cat);
      }
    });
    return result;
  }, [services, filter.favoritesOnly]);

  // If the currently selected category is not in available categories, reset to 'All'
  useEffect(() => {
    if (selectedCategory !== 'All' && !availableCategories.includes(selectedCategory)) {
      setSelectedCategory('All');
    }
  }, [selectedCategory, availableCategories]);

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((svc) => {
      if (filter.favoritesOnly && !svc.isFavorite) {
        return false;
      }
      const matchesCategory =
        selectedCategory === 'All' || svc.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        svc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        svc.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [services, filter.favoritesOnly, selectedCategory, searchQuery]);

  // Handle Drag Start
  const handleDragStart = useCallback((e: React.DragEvent, stencil: StencilDragData) => {
    const json = JSON.stringify(stencil);
    e.dataTransfer.setData('application/aws-stencil', json);
    e.dataTransfer.setData('application/json', json);
    e.dataTransfer.setData('text/plain', json);
    if (stencil.serviceId) {
      e.dataTransfer.setData('application/aws-service-id', stencil.serviceId);
    }
    e.dataTransfer.effectAllowed = 'copyMove';
  }, []);

  // Quick Click Add to Canvas (Center Offset)
  const handleQuickAddService = useCallback((svc: AWSService) => {
    const center = { x: 300 + Math.random() * 80, y: 180 + Math.random() * 60 };
    addServiceNode(svc, center);
  }, [addServiceNode]);

  const handleQuickAddBoundary = (b: BoundaryStencilDef) => {
    const center = { x: 180, y: 120 };
    addBoundaryNode(b.type, b.label, center);
  };

    const handleQuickAddActor = (type: ExternalActorType, label: string) => {
      const center = { x: 140, y: 200 };
      addExternalActor(type, label, center);
    };

    const handleQuickAddStepBadge = (sb: StepBadgeStencilDef) => {
      const center = { x: 260, y: 180 };
      addStepBadgeNode(sb.type, sb.caption, center);
    };

    const handleQuickAddSpecStamp = () => {
      const center = { x: 240, y: 140 };
      addAnnotationNode('System Architecture Spec', '', center, {
        isSpecStamp: true,
        specSystemName: 'System Architecture Spec',
        specRevision: 'v1.0 · Prod',
        specTargetSla: '99.99%',
        specRpoRto: 'RPO < 5m · RTO < 15m',
        specCompliance: 'SOC2 · HIPAA',
        specClassification: 'Confidential (PII)',
        width: 320,
        height: 180,
      });
    };

    const handleQuickAddNote = () => {
      const center = { x: 340, y: 220 };
      addAnnotationNode('Architecture Note', '', center);
    };

    const handleQuickAddTextBlock = () => {
      const center = { x: 300, y: 120 };
      addAnnotationNode('Architecture Section Header', '', center, {
        isTextOnly: true,
        fontSize: 18,
        width: 280,
        height: 48,
      });
    };

    // Filtered Stencil Arrays (Search Query Aware)
    const stencilQuery = searchQuery.toLowerCase().trim();
    const filteredBoundaries = useMemo(() => {
      if (!stencilQuery) return BOUNDARY_STENCILS;
      return BOUNDARY_STENCILS.filter(
        (b) =>
          b.label.toLowerCase().includes(stencilQuery) ||
          b.desc.toLowerCase().includes(stencilQuery) ||
          b.badge.toLowerCase().includes(stencilQuery)
      );
    }, [stencilQuery]);

    const filteredNetworkPrimitives = useMemo(() => {
      if (!stencilQuery) return NETWORK_PRIMITIVE_STENCILS;
      return NETWORK_PRIMITIVE_STENCILS.filter(
        (p) =>
          p.label.toLowerCase().includes(stencilQuery) ||
          p.desc.toLowerCase().includes(stencilQuery) ||
          p.badge.toLowerCase().includes(stencilQuery)
      );
    }, [stencilQuery]);

    const filteredActors = useMemo(() => {
      if (!stencilQuery) return ACTOR_STENCILS;
      return ACTOR_STENCILS.filter(
        (a) =>
          a.label.toLowerCase().includes(stencilQuery) ||
          a.desc.toLowerCase().includes(stencilQuery) ||
          a.badge.toLowerCase().includes(stencilQuery)
      );
    }, [stencilQuery]);

    const filteredStepBadges = useMemo(() => {
      if (!stencilQuery) return STEP_BADGE_STENCILS;
      return STEP_BADGE_STENCILS.filter(
        (s) =>
          s.label.toLowerCase().includes(stencilQuery) ||
          s.desc.toLowerCase().includes(stencilQuery) ||
          s.badge.toLowerCase().includes(stencilQuery)
      );
    }, [stencilQuery]);

    const filteredAnnotations = useMemo(() => {
      if (!stencilQuery) return ANNOTATION_STENCILS;
      return ANNOTATION_STENCILS.filter(
        (an) =>
          an.label.toLowerCase().includes(stencilQuery) ||
          an.desc.toLowerCase().includes(stencilQuery) ||
          an.badge.toLowerCase().includes(stencilQuery)
      );
    }, [stencilQuery]);

    const totalStencilMatches =
      filteredBoundaries.length +
      filteredNetworkPrimitives.length +
      filteredActors.length +
      filteredStepBadges.length +
      filteredAnnotations.length;

    // If sidebar is collapsed, render minimal expand tab
    if (!isCanvasSidebarOpen) {
      return (
        <div className="relative z-50 shrink-0">
          <button
            type="button"
            onClick={() => setIsCanvasSidebarOpen(true)}
            className="absolute left-0 top-14 h-9 pl-2 pr-2.5 rounded-r-[6px] bg-white dark:bg-[#161E2D] border-y border-r border-[#D5DBDB] dark:border-[#354150] shadow-md hover:border-[#FF9900] text-[#545B64] dark:text-[#879596] hover:text-[#FF9900] flex items-center gap-1.5 transition-all cursor-pointer group z-50"
            title="Open Canvas Stencils & Catalog"
            aria-label="Open Canvas Stencils & Catalog"
          >
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            <span className="text-[11px] font-semibold tracking-wide text-[#16191F] dark:text-[#EAEDED]">
              Stencils
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
        className="relative h-full flex flex-col border-r border-[#D5DBDB] dark:border-[#354150] bg-white dark:bg-[#161E2D] shrink-0 z-30 select-none animate-in fade-in duration-150"
      >
        {/* Draggable Resize Handle */}
        <SidebarResizeHandle
          sidebarWidth={sidebarWidth}
          onWidthChange={setSidebarWidth}
        />
        {/* Top Header & Segmented Tab Switcher */}
        <div className="p-3 border-b border-[#EAEDED] dark:border-[#222D3C] space-y-2.5 shrink-0 bg-[#F8F9FA]/60 dark:bg-[#0F141A]/40">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#16191F] dark:text-[#EAEDED]">
              Canvas Studio
            </span>
            <button
              type="button"
              onClick={() => setIsCanvasSidebarOpen(false)}
              className="p-1 rounded-[4px] text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] hover:bg-[#EAEDED] dark:hover:bg-[#1E2B3D] transition-colors cursor-pointer"
              title="Collapse Sidebar"
              aria-label="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Dual-Mode Segmented Control */}
          <div className="grid grid-cols-2 p-0.5 rounded-[6px] bg-[#EAEDED] dark:bg-[#0F141A] border border-[#D5DBDB]/60 dark:border-[#2A3647]">
            <button
              type="button"
              onClick={() => setActiveMode('catalog')}
              className={`h-7 rounded-[4px] text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeMode === 'catalog'
                ? 'bg-white dark:bg-[#1E2B3D] text-[#0972D3] dark:text-[#539FE5] shadow-xs'
                : 'text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED]'
                }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>AWS Catalog</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('stencils')}
              className={`h-7 rounded-[4px] text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeMode === 'stencils'
                ? 'bg-white dark:bg-[#1E2B3D] text-[#0972D3] dark:text-[#539FE5] shadow-xs'
                : 'text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED]'
                }`}
            >
              <Shapes className="w-3.5 h-3.5" />
              <span>Diagram Stencils</span>
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
                    ? 'Filter favorite services…'
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
                className={`h-8 w-8 rounded-[4px] flex items-center justify-center shrink-0 transition-colors cursor-pointer border ${filter.favoritesOnly
                  ? 'bg-[#FF9900]/15 text-[#FF9900] border-[#FF9900]/40 shadow-2xs'
                  : 'text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] hover:bg-[#EAEDED] dark:hover:bg-[#1E2B3D] border-[#D5DBDB]/60 dark:border-[#2A3647]'
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

        {/* Mode 1: AWS Service Catalog */}
        {activeMode === 'catalog' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Category Horizontal Filter Bar (Only showing categories with services) */}
            <div className="px-2.5 py-1.5 border-b border-[#EAEDED] dark:border-[#222D3C] flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
              {
                availableCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-0.5 rounded-[4px] text-[10px] font-medium whitespace-nowrap transition-colors cursor-pointer ${selectedCategory === cat
                      ? 'bg-[#0972D3] text-white dark:bg-[#539FE5] dark:text-[#0F141A] font-semibold'
                      : 'text-[#545B64] dark:text-[#879596] hover:bg-[#EAEDED] dark:hover:bg-[#1E2B3D]'
                      }`}
                  >
                    {cat}
                  </button>
                ))
              }
            </div>

            {/* Service List with Drag Support */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#545B64] dark:text-[#879596] px-1 pb-1">
                Showing {filteredServices.length} {filter.favoritesOnly ? 'Favorite ' : ''}Services · Drag onto Canvas
              </div>

              {filteredServices.map((svc) => (
                <SidebarServiceCard
                  key={svc.id}
                  svc={svc}
                  theme={theme}
                  onDragStart={handleDragStart}
                  onQuickAdd={handleQuickAddService}
                />
              ))}

              {filteredServices.length === 0 && (
                <div className="py-8 text-center text-[12px] text-[#545B64] dark:text-[#879596]">
                  {filter.favoritesOnly
                    ? searchQuery.trim()
                      ? `No favorite services match "${searchQuery}"`
                      : 'No favorite services found. Star services in Concept Vault to see them here.'
                    : `No services match "${searchQuery}"`}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mode 2: Diagram Stencils */}
        {activeMode === 'stencils' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2.5">
                {totalStencilMatches === 0 ? (
                  <div className="py-8 text-center text-[12px] text-[#545B64] dark:text-[#879596]">
                    No stencils match &quot;{searchQuery}&quot;
                  </div>
                ) : (
            <>
                    {/* Group 1: Cloud & Account Boundaries */}
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => setIsBoundariesOpen((prev) => !prev)}
                        className="w-full h-7 px-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] rounded-[4px] hover:bg-[#EAEDED]/50 dark:hover:bg-[#1E2B3D]/50 cursor-pointer transition-colors"
                      >
                        <span>Cloud &amp; Account Boundaries ({filteredBoundaries.length})</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${isBoundariesOpen ? 'rotate-180' : ''
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
                                          className="group flex items-center gap-2.5 h-8 px-2.5 rounded-[4px] hover:bg-[#EAEDED]/70 dark:hover:bg-[#1E2B3D] transition-colors cursor-grab active:cursor-grabbing select-none"
                                          title={`${b.label} — ${b.desc} (Click to add or drag onto canvas)`}
                                        >
                                          <GripVertical className="w-3.5 h-3.5 text-[#879596]/40 group-hover:text-[#879596] shrink-0" />
                                          <div className="shrink-0 flex items-center justify-center">
                                            <AWSServiceIcon groupId={b.groupId} size={18} variant="group" />
                                          </div>
                                          <div className="min-w-0 flex-1 flex items-center gap-2">
                                            <span className="text-[12px] font-medium text-[#16191F] dark:text-[#EAEDED] truncate">
                                              {b.label}
                                            </span>
                                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#EAEDED]/80 dark:bg-[#0F141A] text-[#545B64] dark:text-[#879596] shrink-0">
                                              {b.badge}
                                            </span>
                                          </div>
                                          <Plus className="w-3.5 h-3.5 text-[#545B64] dark:text-[#879596] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                    <div className="border-t border-[#EAEDED] dark:border-[#222D3C]" />

                                    {/* Group 2: Network & Routing Primitives */}
                                    <div className="space-y-0.5">
                                      <button
                                        type="button"
                                        onClick={() => setIsNetworkPrimitivesOpen((prev) => !prev)}
                                        className="w-full h-7 px-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] rounded-[4px] hover:bg-[#EAEDED]/50 dark:hover:bg-[#1E2B3D]/50 cursor-pointer transition-colors"
                                      >
                                        <span>Network &amp; Routing Primitives ({filteredNetworkPrimitives.length})</span>
                                        <ChevronDown
                                          className={`w-3.5 h-3.5 transition-transform duration-200 ${isNetworkPrimitivesOpen ? 'rotate-180' : ''
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
                                              className="group flex items-center gap-2.5 h-8 px-2.5 rounded-[4px] hover:bg-[#EAEDED]/70 dark:hover:bg-[#1E2B3D] transition-colors cursor-grab active:cursor-grabbing select-none"
                                              title={`${p.label} — ${p.desc} (Click to add or drag onto canvas)`}
                                            >
                                              <GripVertical className="w-3.5 h-3.5 text-[#879596]/40 group-hover:text-[#879596] shrink-0" />
                                              <div className="shrink-0 flex items-center justify-center">
                                                <AWSServiceIcon actorId={p.type} size={18} variant="actor" />
                                              </div>
                                                <div className="min-w-0 flex-1 flex items-center gap-2">
                                                  <span className="text-[12px] font-medium text-[#16191F] dark:text-[#EAEDED] truncate">
                                                    {p.label}
                                                  </span>
                                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#EAEDED]/80 dark:bg-[#0F141A] text-[#545B64] dark:text-[#879596] shrink-0">
                                                    {p.badge}
                                                  </span>
                                                </div>
                                                <Plus className="w-3.5 h-3.5 text-[#545B64] dark:text-[#879596] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                              </div>
                    ))}
                                        </div>
                                      )}
                                    </div>

                                  <div className="border-t border-[#EAEDED] dark:border-[#222D3C]" />

                                    {/* Group 3: Clients, DevOps & External SaaS Actors */}
                                    <div className="space-y-0.5">
                                      <button
                                        type="button"
                                        onClick={() => setIsActorsOpen((prev) => !prev)}
                                        className="w-full h-7 px-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] rounded-[4px] hover:bg-[#EAEDED]/50 dark:hover:bg-[#1E2B3D]/50 cursor-pointer transition-colors"
                                      >
                                        <span>Clients &amp; SaaS Actors ({filteredActors.length})</span>
                                        <ChevronDown
                                          className={`w-3.5 h-3.5 transition-transform duration-200 ${isActorsOpen ? 'rotate-180' : ''
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
                        className="group flex items-center gap-2.5 h-8 px-2.5 rounded-[4px] hover:bg-[#EAEDED]/70 dark:hover:bg-[#1E2B3D] transition-colors cursor-grab active:cursor-grabbing select-none"
                        title={`${act.label} — ${act.desc} (Click to add or drag onto canvas)`}
                      >
                        <GripVertical className="w-3.5 h-3.5 text-[#879596]/40 group-hover:text-[#879596] shrink-0" />
                        <div className="shrink-0 flex items-center justify-center">
                          <AWSServiceIcon actorId={act.type} size={18} variant="actor" />
                        </div>
                        <div className="min-w-0 flex-1 flex items-center gap-2">
                          <span className="text-[12px] font-medium text-[#16191F] dark:text-[#EAEDED] truncate">
                            {act.label}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#EAEDED]/80 dark:bg-[#0F141A] text-[#545B64] dark:text-[#879596] shrink-0">
                            {act.badge}
                          </span>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-[#545B64] dark:text-[#879596] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-[#EAEDED] dark:border-[#222D3C]" />

              {/* Group 4: Flow Step Markers & Risk Pins */}
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => setIsStepBadgesOpen((prev) => !prev)}
                  className="w-full h-7 px-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] rounded-[4px] hover:bg-[#EAEDED]/50 dark:hover:bg-[#1E2B3D]/50 cursor-pointer transition-colors"
                >
                  <span>Flow Steps &amp; Risk Pins ({filteredStepBadges.length})</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isStepBadgesOpen ? 'rotate-180' : ''
                    }`}
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
                        className="group flex items-center gap-2.5 h-8 px-2.5 rounded-[4px] hover:bg-[#EAEDED]/70 dark:hover:bg-[#1E2B3D] transition-colors cursor-grab active:cursor-grabbing select-none"
                        title={`${sb.label} — ${sb.desc} (Click to add or drag onto canvas)`}
                      >
                        <GripVertical className="w-3.5 h-3.5 text-[#879596]/40 group-hover:text-[#879596] shrink-0" />
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
                          <span className="text-[12px] font-medium text-[#16191F] dark:text-[#EAEDED] truncate">
                            {sb.label}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#EAEDED]/80 dark:bg-[#0F141A] text-[#545B64] dark:text-[#879596] shrink-0">
                            {sb.badge}
                          </span>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-[#545B64] dark:text-[#879596] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-[#EAEDED] dark:border-[#222D3C]" />

                                                  {/* Group 5: Architecture Annotations & Spec Stamps */}
              <div className="space-y-0.5">
                                                  <button
                                                    type="button"
                                                    onClick={() => setIsAnnotationsOpen((prev) => !prev)}
                                                    className="w-full h-7 px-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] rounded-[4px] hover:bg-[#EAEDED]/50 dark:hover:bg-[#1E2B3D]/50 cursor-pointer transition-colors"
                                                  >
                                                <span>Spec Stamps &amp; Annotations ({filteredAnnotations.length})</span>
                                                <ChevronDown
                                                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isAnnotationsOpen ? 'rotate-180' : ''
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
                        className="group flex items-center gap-2.5 h-8 px-2.5 rounded-[4px] hover:bg-[#EAEDED]/70 dark:hover:bg-[#1E2B3D] transition-colors cursor-grab active:cursor-grabbing select-none"
                        title={`${an.label} — ${an.desc} (Click to add or drag onto canvas)`}
                      >
                        <GripVertical className="w-3.5 h-3.5 text-[#879596]/40 group-hover:text-[#879596] shrink-0" />
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
                            <span className="size-4 rounded bg-[#545B64]/15 text-[#545B64] dark:text-[#879596] flex items-center justify-center">
                              <Type className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 flex items-center gap-2">
                          <span className="text-[12px] font-medium text-[#16191F] dark:text-[#EAEDED] truncate">
                            {an.label}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#EAEDED]/80 dark:bg-[#0F141A] text-[#545B64] dark:text-[#879596] shrink-0">
                            {an.badge}
                          </span>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-[#545B64] dark:text-[#879596] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
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
