import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Layers,
  Shapes,
  StickyNote,
  Type,
  Globe,
  Smartphone,
  Building2,
  Network,
  Webhook,
  Plus,
  GripVertical,
} from 'lucide-react';
import { useCompassStore } from '../../store/useCompassStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { AWSServiceIcon } from '../icons/AWSServiceIcon';
import { CloudscapeSearchInput } from '../ui/CloudscapeSearchInput';
import { getAWSCategoryColor } from '../../utils/awsCategoryColors';
import type {
  AWSCategory,
  AWSService,
  GroupBoundaryType,
  ExternalActorType,
} from '../../types/aws';

export interface StencilDragData {
  type: 'service' | 'boundary' | 'actor' | 'annotation' | 'text-block';
  serviceId?: string;
  category?: AWSCategory;
  name?: string;
  boundaryType?: GroupBoundaryType;
  actorType?: ExternalActorType;
  label?: string;
  title?: string;
  content?: string;
}

interface BoundaryStencilDef {
  type: GroupBoundaryType;
  groupId: string;
  label: string;
  desc: string;
  borderStyle: 'solid' | 'dashed';
  borderColorLight: string;
  borderColorDark: string;
  tintLight?: string;
  tintDark?: string;
}

const BOUNDARY_STENCILS: BoundaryStencilDef[] = [
  {
    type: 'aws-cloud',
    groupId: 'aws-cloud',
    label: 'AWS Cloud',
    desc: 'Outer cloud boundary',
    borderStyle: 'solid',
    borderColorLight: '#232F3E',
    borderColorDark: '#EAEDED',
  },
  {
    type: 'region',
    groupId: 'region',
    label: 'Region Boundary',
    desc: 'Regional scope',
    borderStyle: 'dashed',
    borderColorLight: '#545B64',
    borderColorDark: '#879596',
  },
  {
    type: 'vpc',
    groupId: 'vpc',
    label: 'VPC Container',
    desc: '10.0.0.0/16 Virtual Private Cloud',
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
    desc: 'Ingress tier with IGW routing',
    borderStyle: 'solid',
    borderColorLight: '#1D8102',
    borderColorDark: '#1D8102',
    tintLight: 'rgba(29, 129, 2, 0.05)',
    tintDark: 'rgba(29, 129, 2, 0.08)',
  },
  {
    type: 'private-subnet',
    groupId: 'private-subnet',
    label: 'Private Subnet',
    desc: 'Application backend tier',
    borderStyle: 'solid',
    borderColorLight: '#0073BB',
    borderColorDark: '#0073BB',
    tintLight: 'rgba(0, 115, 187, 0.05)',
    tintDark: 'rgba(0, 115, 187, 0.08)',
  },
  {
    type: 'security-group',
    groupId: 'security-group',
    label: 'Security Group',
    desc: 'Stateful firewall rules',
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
    desc: 'Dynamic compute scaling cluster',
    borderStyle: 'dashed',
    borderColorLight: '#ED7100',
    borderColorDark: '#ED7100',
    tintLight: 'rgba(237, 113, 0, 0.05)',
    tintDark: 'rgba(237, 113, 0, 0.08)',
  },
];

interface ActorStencilDef {
  type: ExternalActorType;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

const ACTOR_STENCILS: ActorStencilDef[] = [
  {
    type: 'user-browser',
    label: 'User / Web Client',
    desc: 'Browser HTTPS ingress',
    icon: <Globe className="w-4 h-4 text-[#0972D3] dark:text-[#539FE5]" />,
  },
  {
    type: 'mobile-client',
    label: 'Mobile App Client',
    desc: 'REST / WebSocket iOS/Android',
    icon: <Smartphone className="w-4 h-4 text-[#8C4FFF]" />,
  },
  {
    type: 'corporate-datacenter',
    label: 'Corporate On-Premises Data Center',
    desc: 'Direct Connect / Dedicated Link',
    icon: <Building2 className="w-4 h-4 text-[#545B64] dark:text-[#879596]" />,
  },
  {
    type: 'branch-office',
    label: 'Branch Office',
    desc: 'Site-to-Site VPN / SD-WAN',
    icon: <Network className="w-4 h-4 text-[#ED7100]" />,
  },
  {
    type: 'third-party-api',
    label: 'Third-Party SaaS API',
    desc: 'Partner REST / Webhook Ingress',
    icon: <Webhook className="w-4 h-4 text-[#E7157B]" />,
  },
];

const CATEGORIES: (AWSCategory | 'All')[] = [
  'All',
  'Compute',
  'Storage',
  'Database',
  'Networking',
  'Security/IAM',
  'Serverless',
];

export const CanvasSidebar: React.FC = () => {
  const isCanvasSidebarOpen = useCanvasStore((s) => s.isCanvasSidebarOpen);
  const setIsCanvasSidebarOpen = useCanvasStore((s) => s.setIsCanvasSidebarOpen);
  const [activeMode, setActiveMode] = useState<'catalog' | 'stencils'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AWSCategory | 'All'>('All');

  // Accordion section states for Stencils tab
  const [isBoundariesOpen, setIsBoundariesOpen] = useState(true);
  const [isActorsOpen, setIsActorsOpen] = useState(true);
  const [isAnnotationsOpen, setIsAnnotationsOpen] = useState(true);

  const services = useCompassStore((s) => s.services);
  const theme = useCompassStore((s) => s.theme);
  const addServiceNode = useCanvasStore((s) => s.addServiceNode);
  const addBoundaryNode = useCanvasStore((s) => s.addBoundaryNode);
  const addExternalActor = useCanvasStore((s) => s.addExternalActor);
  const addAnnotationNode = useCanvasStore((s) => s.addAnnotationNode);

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((svc) => {
      const matchesCategory =
        selectedCategory === 'All' || svc.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        svc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        svc.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [services, selectedCategory, searchQuery]);

  // Handle Drag Start
  const handleDragStart = (e: React.DragEvent, stencil: StencilDragData) => {
    e.dataTransfer.setData('application/aws-stencil', JSON.stringify(stencil));
    if (stencil.serviceId) {
      e.dataTransfer.setData('application/aws-service-id', stencil.serviceId);
    }
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Quick Click Add to Canvas (Center Offset)
  const handleQuickAddService = (svc: AWSService) => {
    const center = { x: 300 + Math.random() * 80, y: 180 + Math.random() * 60 };
    addServiceNode(svc, center);
  };

  const handleQuickAddBoundary = (b: BoundaryStencilDef) => {
    const center = { x: 180, y: 120 };
    addBoundaryNode(b.type, b.label, center);
  };

  const handleQuickAddActor = (act: ActorStencilDef) => {
    const center = { x: 140, y: 200 };
    addExternalActor(act.type, act.label, center);
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
    });
  };

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
            className="w-72 h-full flex flex-col border-r border-[#D5DBDB] dark:border-[#354150] bg-white dark:bg-[#161E2D] shrink-0 z-30 select-none animate-in fade-in duration-150"
          >
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

              {/* Search Input */}
              <CloudscapeSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={
                  activeMode === 'catalog'
                    ? 'Filter services by name, ID…'
                    : 'Search stencils or boundaries…'
                }
                size="sm"
                className="w-full"
              />
            </div>

            {/* Mode 1: AWS Service Catalog */}
            {activeMode === 'catalog' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Category Horizontal Filter Bar */}
                <div className="px-2.5 py-1.5 border-b border-[#EAEDED] dark:border-[#222D3C] flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
                  {CATEGORIES.map((cat) => (
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
                  ))}
                </div>

                {/* Service List with Drag Support */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#545B64] dark:text-[#879596] px-1 pb-1">
                    Showing {filteredServices.length} Services · Drag onto Canvas
                  </div>

                  {filteredServices.map((svc) => {
                    const catColor = getAWSCategoryColor(svc.category, theme);
                    return (
                      <div
                        key={svc.id}
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(e, {
                            type: 'service',
                            serviceId: svc.id,
                            category: svc.category,
                            name: svc.name,
                          })
                        }
                        onClick={() => handleQuickAddService(svc)}
                        className="group relative flex items-center gap-2 p-2 rounded-[6px] border border-transparent hover:border-[#D5DBDB] dark:hover:border-[#2A3647] hover:bg-[#F8F9FA] dark:hover:bg-[#1E2B3D] transition-all cursor-grab active:cursor-grabbing select-none"
                        title={`Drag ${svc.name} (${svc.id}) onto the canvas or click to add`}
                      >
                        <GripVertical className="w-3.5 h-3.5 text-[#879596]/40 group-hover:text-[#879596] shrink-0" />

                        <div className="shrink-0">
                          <AWSServiceIcon serviceId={svc.id} size={24} variant="service" />
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

                        <span className="px-1.5 py-0.5 rounded-[3px] bg-[#EAEDED] dark:bg-[#0F141A] text-[9px] font-mono font-semibold text-[#545B64] dark:text-[#879596] shrink-0">
                          T{svc.tier}
                        </span>
                      </div>
                    );
                  })}

                  {filteredServices.length === 0 && (
                    <div className="py-8 text-center text-[12px] text-[#545B64] dark:text-[#879596]">
                      No services match "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mode 2: Diagram Stencils */}
            {activeMode === 'stencils' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-3">
                {/* Section 1: AWS Group Boundaries */}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setIsBoundariesOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#545B64] dark:text-[#879596] px-1 py-0.5 hover:text-[#16191F] dark:hover:text-[#EAEDED] cursor-pointer"
                  >
                    <span>AWS Group Boundaries ({BOUNDARY_STENCILS.length})</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${isBoundariesOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </button>

                  {isBoundariesOpen && (
                    <div className="space-y-1.5 pt-1">
                      {BOUNDARY_STENCILS.map((b) => {
                        const bColor = theme === 'dark' ? b.borderColorDark : b.borderColorLight;
                        return (
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
                            style={{
                              borderColor: bColor,
                              borderStyle: b.borderStyle,
                              backgroundColor:
                                theme === 'dark' ? b.tintDark || 'transparent' : b.tintLight || 'transparent',
                            }}
                            className="group flex items-center gap-2.5 p-2 rounded-[6px] border-[1.5px] hover:shadow-xs transition-all cursor-grab active:cursor-grabbing select-none"
                            title={`Drag ${b.label} container onto canvas`}
                          >
                            <GripVertical className="w-3.5 h-3.5 text-[#879596]/40 group-hover:text-[#879596] shrink-0" />

                            <div className="shrink-0">
                              <AWSServiceIcon groupId={b.groupId} size={20} variant="group" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div
                                style={{ color: bColor }}
                                className="text-[12px] font-bold truncate"
                              >
                                {b.label}
                              </div>
                              <div className="text-[10px] text-[#545B64] dark:text-[#879596] truncate">
                                {b.desc}
                              </div>
                            </div>

                            <Plus className="w-3.5 h-3.5 text-[#545B64] dark:text-[#879596] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t border-[#EAEDED] dark:border-[#222D3C]" />

                {/* Section 2: External Actors & Hybrid Infrastructure */}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setIsActorsOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#545B64] dark:text-[#879596] px-1 py-0.5 hover:text-[#16191F] dark:hover:text-[#EAEDED] cursor-pointer"
                  >
                    <span>External Actors & Hybrid ({ACTOR_STENCILS.length})</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${isActorsOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </button>

                  {isActorsOpen && (
                    <div className="space-y-1 pt-1">
                      {ACTOR_STENCILS.map((act) => (
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
                          onClick={() => handleQuickAddActor(act)}
                          className="group flex items-center gap-2.5 p-2 rounded-[6px] border border-[#EAEDED] dark:border-[#2A3647] hover:border-[#0972D3] dark:hover:border-[#539FE5] hover:bg-[#F8F9FA] dark:hover:bg-[#1E2B3D] transition-all cursor-grab active:cursor-grabbing select-none"
                          title={`Drag ${act.label} onto canvas`}
                        >
                          <GripVertical className="w-3.5 h-3.5 text-[#879596]/40 group-hover:text-[#879596] shrink-0" />

                          <div className="size-7 rounded-[4px] bg-[#EAEDED]/70 dark:bg-[#0F141A] flex items-center justify-center shrink-0">
                            {act.icon}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="text-[12px] font-medium text-[#16191F] dark:text-[#EAEDED] truncate">
                              {act.label}
                            </div>
                            <div className="text-[10px] text-[#545B64] dark:text-[#879596] truncate">
                              {act.desc}
                            </div>
                          </div>

                          <Plus className="w-3.5 h-3.5 text-[#545B64] dark:text-[#879596] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-[#EAEDED] dark:border-[#222D3C]" />

                {/* Section 3: Drafting Annotations */}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setIsAnnotationsOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#545B64] dark:text-[#879596] px-1 py-0.5 hover:text-[#16191F] dark:hover:text-[#EAEDED] cursor-pointer"
                  >
                    <span>Drafting Annotations (2)</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${isAnnotationsOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </button>

                  {isAnnotationsOpen && (
                    <div className="space-y-1.5 pt-1">
                      {/* Sticky Callout Card */}
                      <div
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(e, {
                            type: 'annotation',
                            title: 'Architecture Note',
                          })
                        }
                        onClick={handleQuickAddNote}
                        className="group flex items-center gap-2.5 p-2 rounded-[6px] border border-[#F59E0B]/50 bg-[#FFFBEB]/40 dark:bg-[#292212]/30 hover:border-[#F59E0B] transition-all cursor-grab active:cursor-grabbing select-none"
                        title="Drag Markdown Sticky Note onto canvas"
                      >
                        <GripVertical className="w-3.5 h-3.5 text-[#879596]/40 group-hover:text-[#879596] shrink-0" />
                        <div className="size-7 rounded-[4px] bg-[#F59E0B]/20 flex items-center justify-center shrink-0">
                          <StickyNote className="w-4 h-4 text-[#D97706]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-semibold text-[#92400E] dark:text-[#FCD34D] truncate">
                            Callout Sticky Note
                          </div>
                          <div className="text-[10px] text-[#78350F] dark:text-[#FDE68A] truncate">
                            Markdown-enabled decisions
                          </div>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-[#D97706] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>

                      {/* Text Label Block */}
                      <div
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(e, {
                            type: 'text-block',
                            title: 'Architecture Section Header',
                          })
                        }
                        onClick={handleQuickAddTextBlock}
                        className="group flex items-center gap-2.5 p-2 rounded-[6px] border border-dashed border-[#D5DBDB] dark:border-[#354150] hover:border-[#0972D3] dark:hover:border-[#539FE5] bg-transparent hover:bg-[#F8F9FA] dark:hover:bg-[#1E2B3D] transition-all cursor-grab active:cursor-grabbing select-none"
                        title="Drag Text Label Banner onto canvas"
                      >
                        <GripVertical className="w-3.5 h-3.5 text-[#879596]/40 group-hover:text-[#879596] shrink-0" />
                        <div className="size-7 rounded-[4px] bg-[#EAEDED]/70 dark:bg-[#0F141A] flex items-center justify-center shrink-0">
                          <Type className="w-4 h-4 text-[#0972D3] dark:text-[#539FE5]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-semibold text-[#16191F] dark:text-[#EAEDED] truncate">
                            Text Label Block
                          </div>
                          <div className="text-[10px] text-[#545B64] dark:text-[#879596] truncate">
                            Section title banner
                          </div>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-[#545B64] dark:text-[#879596] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
          );
};

          export default CanvasSidebar;
