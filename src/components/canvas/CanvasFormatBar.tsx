import React, { useRef, useState } from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalSpaceAround,
  AlignHorizontalSpaceAround,
  BoxSelect,
  ArrowUp,
  ArrowDown,
  Layers,
  Activity,
  Maximize2,
  Trash2,
  Copy,
  ChevronDown,
  GitCommit,
  Workflow,
  Plus,
  Users,
  StickyNote,
  LayoutGrid,
} from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useCompassStore } from '../../store/useCompassStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { usePopoverStore } from '../../store/usePopoverStore';
import { CloudscapeSelect } from '../ui/CloudscapeSelect';
import { CloudscapeSearchInput } from '../ui/CloudscapeSearchInput';
import { AnimatedPopover } from '../ui/AnimatedPopover';
import type {
  AWSService,
  EdgeProtocol,
  EdgeRoutingStyle,
  EdgeLineStyle,
  GroupBoundaryType,
  ExternalActorType,
  NodeEnvironment,
} from '../../types/aws';

const PROTOCOLS: EdgeProtocol[] = [
  'HTTPS/REST',
  'IAM Role Assumption',
  'Event Trigger',
  'VPC PrivateLink',
  'SQL/TCP',
  'gRPC',
  'WebSocket',
];

const COLOR_SWATCHES = [
  { label: 'Blue', color: '#539FE5' },
  { label: 'Purple', color: '#8C4FFF' },
  { label: 'Green', color: '#3F8624' },
  { label: 'Orange', color: '#ED7100' },
  { label: 'Red', color: '#DD344C' },
  { label: 'Neutral', color: '#879596' },
];

const BOUNDARY_PRESETS: { type: GroupBoundaryType; label: string; desc: string }[] = [
  { type: 'aws-cloud', label: 'AWS Cloud', desc: 'Outer perimeter' },
  { type: 'region', label: 'Region Boundary', desc: 'Regional scope' },
  { type: 'vpc', label: 'VPC Container', desc: '10.0.0.0/16' },
  { type: 'public-subnet', label: 'Public Subnet', desc: 'Ingress tier' },
  { type: 'private-subnet', label: 'Private Subnet', desc: 'Application tier' },
  { type: 'security-group', label: 'Security Group', desc: 'Firewall rules' },
  { type: 'auto-scaling-group', label: 'Auto Scaling Group', desc: 'Scale cluster' },
];

const EXTERNAL_ACTORS: { type: ExternalActorType; label: string; desc: string }[] = [
  { type: 'user-browser', label: 'User / Web Client', desc: 'Browser HTTPS ingress' },
  { type: 'mobile-client', label: 'Mobile App Client', desc: 'iOS / Android REST ingress' },
  { type: 'corporate-datacenter', label: 'Corporate On-Premises', desc: 'Direct Connect dedicated link' },
  { type: 'branch-office', label: 'Branch Office', desc: 'Site-to-Site VPN link' },
  { type: 'third-party-api', label: 'Third-Party SaaS API', desc: 'Webhook & partner REST' },
];

interface CanvasFormatBarProps {
  onFitView?: () => void;
  onAutoLayout?: (dir: 'LR' | 'TB') => void;
  layoutDirection?: 'LR' | 'TB';
  onChangeLayoutDirection?: (dir: 'LR' | 'TB') => void;
  isArranging?: boolean;
}

export const CanvasFormatBar: React.FC<CanvasFormatBarProps> = ({
  onFitView,
  onAutoLayout,
  layoutDirection = 'LR',
  onChangeLayoutDirection,
  isArranging = false,
}) => {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectedEdgeId = useCanvasStore((s) => s.selectedEdgeId);
  const alignSelectedNodes = useCanvasStore((s) => s.alignSelectedNodes);
  const distributeSelectedNodes = useCanvasStore((s) => s.distributeSelectedNodes);
  const groupSelectedNodes = useCanvasStore((s) => s.groupSelectedNodes);
  const updateNodeProperties = useCanvasStore((s) => s.updateNodeProperties);
  const updateEdgeProperties = useCanvasStore((s) => s.updateEdgeProperties);
  const reorderNodeZ = useCanvasStore((s) => s.reorderNodeZ);
  const duplicateNode = useCanvasStore((s) => s.duplicateNode);
  const removeNode = useCanvasStore((s) => s.removeNode);
  const removeEdge = useCanvasStore((s) => s.removeEdge);
  const clearCanvas = useCanvasStore((s) => s.clearCanvas);
  const addServiceNode = useCanvasStore((s) => s.addServiceNode);
  const addBoundaryNode = useCanvasStore((s) => s.addBoundaryNode);
  const addExternalActor = useCanvasStore((s) => s.addExternalActor);
  const addAnnotationNode = useCanvasStore((s) => s.addAnnotationNode);

  const services = useCompassStore((s) => s.services);
  const snapToGrid = useSettingsStore((s) => s.snapToGrid);
  const setSnapToGrid = useSettingsStore((s) => s.setSnapToGrid);

  const activePopoverId = usePopoverStore((s) => s.activePopoverId);
  const togglePopover = usePopoverStore((s) => s.togglePopover);
  const closePopover = usePopoverStore((s) => s.closePopover);

  const isAddServiceOpen = activePopoverId === 'dock-add-service';
  const isBoundaryOpen = activePopoverId === 'dock-boundary';
  const isActorNoteOpen = activePopoverId === 'dock-actor-note';
  const isGroupOpen = activePopoverId === 'dock-group-select';

  const addServiceTriggerRef = useRef<HTMLButtonElement>(null);
  const boundaryTriggerRef = useRef<HTMLButtonElement>(null);
  const actorNoteTriggerRef = useRef<HTMLButtonElement>(null);
  const groupTriggerRef = useRef<HTMLButtonElement>(null);

  const [serviceSearch, setServiceSearch] = useState('');

  // Active selection detection
  const selectedNodes = nodes.filter((n) => n.selected);
  const isMultiNode = selectedNodes.length > 1;

  // Single node resolution
  const singleNode =
    selectedNodes.length === 1
      ? selectedNodes[0]
      : selectedNodeId
        ? nodes.find((n) => n.id === selectedNodeId)
        : undefined;

  // Edge resolution
  const selectedEdge = selectedEdgeId
    ? edges.find((e) => e.id === selectedEdgeId)
    : edges.find((e) => (e as any).selected);

  // Quick adds
  const handleQuickAddService = (svc: AWSService) => {
    const center = { x: 340 + Math.random() * 60, y: 180 + Math.random() * 40 };
    addServiceNode(svc, center);
    closePopover('dock-add-service');
  };

  const handleAddBoundary = (type: GroupBoundaryType, label: string) => {
    const center = { x: 200, y: 120 };
    addBoundaryNode(type, label, center);
    closePopover('dock-boundary');
  };

  const handleQuickAddActor = (type: ExternalActorType, label: string) => {
    const center = { x: 140, y: 200 };
    addExternalActor(type, label, center);
    closePopover('dock-actor-note');
  };

  const handleQuickAddNote = () => {
    const center = { x: 340, y: 220 };
    addAnnotationNode('Architecture Note', '', center);
    closePopover('dock-actor-note');
  };

  const filteredQuickAddServices = services
    .filter((svc) => {
      if (!serviceSearch.trim()) return true;
      const q = serviceSearch.toLowerCase().trim();
      return svc.name.toLowerCase().includes(q) || svc.id.toLowerCase().includes(q);
    })
    .slice(0, 16);

  // Common floating dock container styles
  const dockContainerClass =
    'bottom-5 left-1/2 -translate-x-1/2 absolute z-30 pointer-events-auto h-10 px-2 rounded-[10px] bg-white/95 dark:bg-[#192534]/95 backdrop-blur-md border border-[#D5DBDB] dark:border-[#354150] shadow-[0_12px_32px_-4px_rgba(0,0,0,0.45)] flex items-center gap-1.5 select-none animate-in fade-in zoom-in-95 duration-100 text-[12px] text-[#16191F] dark:text-[#EAEDED]';

  // =========================================================================
  // VIEW 1: Multi-Nodes Selected
  // =========================================================================
  if (isMultiNode) {
    return (
        <div className={dockContainerClass}>
          <div className="flex items-center gap-1.5 pr-2 border-r border-[#EAEDED] dark:border-[#2A3647]">
            <Layers className="w-3.5 h-3.5 text-[#0972D3] dark:text-[#539FE5]" />
            <span className="font-semibold text-[11px] tabular-nums">
              {selectedNodes.length} selected
            </span>
          </div>

          {/* Alignment Tools */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => alignSelectedNodes('left')}
              className="p-1.5 rounded-[4px] hover:bg-[#EAEDED] dark:hover:bg-[#2A3647] text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] transition-colors cursor-pointer"
              title="Align Left"
              aria-label="Align Left"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => alignSelectedNodes('center')}
              className="p-1.5 rounded-[4px] hover:bg-[#EAEDED] dark:hover:bg-[#2A3647] text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] transition-colors cursor-pointer"
              title="Align Center Horizontally"
              aria-label="Align Center"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => alignSelectedNodes('right')}
              className="p-1.5 rounded-[4px] hover:bg-[#EAEDED] dark:hover:bg-[#2A3647] text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] transition-colors cursor-pointer"
              title="Align Right"
              aria-label="Align Right"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => alignSelectedNodes('top')}
              className="px-1.5 py-1 text-[11px] font-semibold rounded-[4px] hover:bg-[#EAEDED] dark:hover:bg-[#2A3647] text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] transition-colors cursor-pointer"
              title="Align Top"
            >
              Top
            </button>
            <button
              type="button"
              onClick={() => alignSelectedNodes('middle')}
              className="px-1.5 py-1 text-[11px] font-semibold rounded-[4px] hover:bg-[#EAEDED] dark:hover:bg-[#2A3647] text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] transition-colors cursor-pointer"
              title="Align Middle Vertically"
            >
              Mid
            </button>
            <button
              type="button"
              onClick={() => alignSelectedNodes('bottom')}
              className="px-1.5 py-1 text-[11px] font-semibold rounded-[4px] hover:bg-[#EAEDED] dark:hover:bg-[#2A3647] text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] transition-colors cursor-pointer"
              title="Align Bottom"
            >
              Btm
            </button>
          </div>

          <div className="h-4 w-px bg-[#EAEDED] dark:bg-[#2A3647]" />

          {/* Distribution Tools */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => distributeSelectedNodes('horizontal')}
              className="p-1.5 rounded-[4px] hover:bg-[#EAEDED] dark:hover:bg-[#2A3647] text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] transition-colors cursor-pointer"
              title="Distribute Horizontally (Equal Spacing)"
              aria-label="Distribute Horizontally"
            >
              <AlignHorizontalSpaceAround className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => distributeSelectedNodes('vertical')}
              className="p-1.5 rounded-[4px] hover:bg-[#EAEDED] dark:hover:bg-[#2A3647] text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] transition-colors cursor-pointer"
              title="Distribute Vertically (Equal Spacing)"
              aria-label="Distribute Vertically"
            >
              <AlignVerticalSpaceAround className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-[#EAEDED] dark:bg-[#2A3647]" />

          {/* Group Selection */}
          <div className="relative">
            <button
              ref={groupTriggerRef}
              type="button"
              onClick={() => togglePopover('dock-group-select')}
              className="h-7 px-2 rounded-[4px] bg-[#8C4FFF]/10 hover:bg-[#8C4FFF]/20 text-[#8C4FFF] font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <BoxSelect className="w-3.5 h-3.5" />
              <span>Group into Boundary…</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            <AnimatedPopover
              isOpen={isGroupOpen}
              onClose={() => closePopover('dock-group-select')}
              triggerRef={groupTriggerRef}
              side="top"
              align="center"
              className="w-56 p-1 space-y-0.5"
            >
                <div className="px-2 py-1 text-[10px] font-bold text-[#545B64] dark:text-[#879596]">
                  Choose Boundary Container
                </div>
                {BOUNDARY_PRESETS.map((bp) => (
                  <button
                    key={bp.type}
                    type="button"
                    onClick={() => {
                      groupSelectedNodes(bp.type);
                      closePopover('dock-group-select');
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-[4px] text-[12px] hover:bg-[#EAEDED]/70 dark:hover:bg-[#1E2B3D] text-[#16191F] dark:text-[#EAEDED] transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <BoxSelect className="w-3.5 h-3.5 text-[#8C4FFF]" />
                    <span className="truncate">{bp.label}</span>
                  </button>
                ))}
            </AnimatedPopover>
          </div>
        </div>
        );
  }

        // =========================================================================
        // VIEW 2: Single Node Selected
        // =========================================================================
        if (singleNode && !selectedEdge) {
    const isBoundary = singleNode.data?.isBoundary;
        const currentEnv: NodeEnvironment = singleNode.data?.env || 'None';
        const currentAz = singleNode.data?.az || 'None';

        return (
            <div className={dockContainerClass}>
              <div className="flex items-center gap-1.5 pr-2 border-r border-[#EAEDED] dark:border-[#2A3647] max-w-[140px] truncate">
                <span className="font-semibold text-[11px] truncate">
                  {singleNode.data?.customTitle || singleNode.data?.label}
                </span>
              </div>

              {!isBoundary && (
                <>
                      {/* Environment Tag with Sunken Track */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-[#545B64] dark:text-[#879596]">
                          Env
                        </span>
                                < div className="p-0.5 rounded-[6px] bg-[#EAEDED] dark:bg-[#0F141A] border border-[#D5DBDB]/60 dark:border-[#2A3647] flex items-center gap-0.5">
                              {(['None', 'Prod', 'Staging', 'Dev'] as NodeEnvironment[]).map((env) => {
                                const isActive = currentEnv === env;
                                const envColors: Record<NodeEnvironment, string> = {
                                  None: 'text-[#545B64] dark:text-[#879596]',
                                  Prod: 'text-[#DD344C]',
                                  Staging: 'text-[#ED7100]',
                                  Dev: 'text-[#0972D3] dark:text-[#539FE5]',
                                };
                                return (
                                  <button
                                    key={env}
                                    type="button"
                                    onClick={() => updateNodeProperties(singleNode.id, { env })}
                                    className={`h-6 px-1.5 rounded-[4px] text-[11px] font-semibold transition-all cursor-pointer ${isActive
                                        ? `bg-white dark:bg-[#232F3E] shadow-xs ${envColors[env]}`
                                        : 'text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED]'
                                      }`}
                    >
                              {env}
                            </button>
                          );
                        })}
                      </div>
                  </div>

                  <div className="h-4 w-px bg-[#EAEDED] dark:bg-[#2A3647]" />

                      {/* AZ Assignment with Sunken Track */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-[#545B64] dark:text-[#879596]">
                          AZ
                        </span>
                                < div className="p-0.5 rounded-[6px] bg-[#EAEDED] dark:bg-[#0F141A] border border-[#D5DBDB]/60 dark:border-[#2A3647] flex items-center gap-0.5">
                              {['Multi-AZ', 'us-east-1a', 'us-east-1b'].map((az) => {
                                const isActive = currentAz === az;
                                return (
                                  <button
                                    key={az}
                                    type="button"
                                    onClick={() =>
                                      updateNodeProperties(singleNode.id, { az: isActive ? 'None' : az })
                                    }
                                    className={`h-6 px-1.5 rounded-[4px] text-[10px] font-mono transition-all cursor-pointer ${isActive
                                        ? 'bg-white dark:bg-[#232F3E] text-[#1D8102] font-semibold shadow-xs'
                                        : 'text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED]'
                                      }`}
                    >
                              {az === 'Multi-AZ' ? 'Multi-AZ' : az.slice(-2)}
                            </button>
                          );
                        })}
                      </div>
                  </div>

                  <div className="h-4 w-px bg-[#EAEDED] dark:bg-[#2A3647]" />
                </>
              )}

              {/* Layer Ordering */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => reorderNodeZ(singleNode.id, 'front')}
                  className="p-1.5 rounded-[4px] hover:bg-[#EAEDED] dark:hover:bg-[#2A3647] text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] transition-colors cursor-pointer"
                  title="Bring to Front"
                  aria-label="Bring to Front"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => reorderNodeZ(singleNode.id, 'back')}
                  className="p-1.5 rounded-[4px] hover:bg-[#EAEDED] dark:hover:bg-[#2A3647] text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] transition-colors cursor-pointer"
                  title="Send to Back"
                  aria-label="Send to Back"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-4 w-px bg-[#EAEDED] dark:bg-[#2A3647]" />

              {/* Quick Duplicate & Delete */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => duplicateNode(singleNode.id)}
                  className="p-1.5 rounded-[4px] hover:bg-[#EAEDED] dark:hover:bg-[#2A3647] text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] transition-colors cursor-pointer"
                  title="Duplicate (Ctrl+D)"
                  aria-label="Duplicate"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeNode(singleNode.id)}
                  className="p-1.5 rounded-[4px] hover:bg-[#DD344C]/10 text-[#545B64] dark:text-[#879596] hover:text-[#DD344C] transition-colors cursor-pointer"
                  title="Delete (Del)"
                  aria-label="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            );
  }

            // =========================================================================
            // VIEW 3: Edge Selected (De-Slopped Protocol & Routing Controls)
            // =========================================================================
            if (selectedEdge) {
    const currentProtocol =
            (selectedEdge.protocol || selectedEdge.data?.protocol || 'HTTPS/REST') as EdgeProtocol;
            const currentRouting: EdgeRoutingStyle =
            (selectedEdge.data?.routingStyle as EdgeRoutingStyle) || 'smoothstep';
            const currentLineStyle: EdgeLineStyle =
            (selectedEdge.data?.lineStyle as EdgeLineStyle) || 'solid';
            const isAnimated = Boolean(selectedEdge.data?.animated ?? selectedEdge.animated);
            const currentStrokeWidth = selectedEdge.data?.strokeWidth === 2.5 ? '2.5px' : '1.5px';
            const currentColor = selectedEdge.data?.edgeColor || '#539FE5';

            return (
                  <div className={dockContainerClass}>
                    {/* Routing Style with Workflow Icon & Sunken Track */}
                    <div className="flex items-center gap-1.5">
                      <Workflow className="w-3.5 h-3.5 text-[#545B64] dark:text-[#879596]" />
                      <span className="text-[11px] font-medium text-[#545B64] dark:text-[#879596]">
                        Path
                      </span>
                            < div className="p-0.5 rounded-[6px] bg-[#EAEDED] dark:bg-[#0F141A] border border-[#D5DBDB]/60 dark:border-[#2A3647] flex items-center gap-0.5">
                          {[
                            { id: 'smoothstep' as const, label: 'Step' },
                            { id: 'bezier' as const, label: 'Curved' },
                            { id: 'straight' as const, label: 'Direct' },
                          ].map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => updateEdgeProperties(selectedEdge.id, { routingStyle: r.id })}
                              className={`h-6 px-2 rounded-[4px] text-[11px] font-semibold transition-all cursor-pointer ${currentRouting === r.id
                                  ? 'bg-white dark:bg-[#232F3E] text-[#16191F] dark:text-white shadow-xs'
                                  : 'text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED]'
                                }`}
              >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-4 w-px bg-[#EAEDED] dark:bg-[#2A3647]" />

                    {/* Animated CloudscapeSelect Protocol Selector (No native select) */}
                    <div className="w-40 min-w-[140px]">
                      <CloudscapeSelect
                        value={currentProtocol}
                        options={PROTOCOLS.map((p) => ({ value: p, label: p }))}
                        onChange={(val) =>
                          updateEdgeProperties(selectedEdge.id, { protocol: val as EdgeProtocol })
                        }
                        placeholder="Protocol"
                        size="sm"
                        className="w-full"
                      />
                    </div>

                    <div className="h-4 w-px bg-[#EAEDED] dark:bg-[#2A3647]" />

                      {/* Stroke Style with Sunken Track */}
                      <div className="p-0.5 rounded-[6px] bg-[#EAEDED] dark:bg-[#0F141A] border border-[#D5DBDB]/60 dark:border-[#2A3647] flex items-center gap-0.5">
                        {(['solid', 'dashed', 'dotted'] as EdgeLineStyle[]).map((style) => (
                          <button
                            key={style}
                            type="button"
                            onClick={() => updateEdgeProperties(selectedEdge.id, { lineStyle: style })}
                            className={`h-6 px-1.5 rounded-[4px] text-[10px] capitalize transition-all cursor-pointer ${currentLineStyle === style
                                ? 'bg-white dark:bg-[#232F3E] text-[#16191F] dark:text-white font-semibold shadow-xs'
                                : 'text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED]'
                              }`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>

                      {/* Stroke Color Swatches */}
                        <div className="flex items-center gap-1 px-1">
                          {COLOR_SWATCHES.map((sw) => (
                            <button
                              key={sw.color}
                              type="button"
                              onClick={() => updateEdgeProperties(selectedEdge.id, { edgeColor: sw.color })}
                              style={{ backgroundColor: sw.color }}
                              className={`size-3.5 rounded-full transition-transform cursor-pointer ${currentColor === sw.color ? 'ring-2 ring-offset-1 ring-[#0972D3] scale-110' : 'hover:scale-110'
                                }`}
                              title={sw.label}
                            />
                          ))}
                        </div>

                        {/* Stroke Width Toggle Pill: 1.5px | 2.5px */}
                        <div className="p-0.5 rounded-[6px] bg-[#EAEDED] dark:bg-[#0F141A] border border-[#D5DBDB]/60 dark:border-[#2A3647] flex items-center gap-0.5">
                          {(['1.5px', '2.5px'] as const).map((widthStr) => {
                            const isCurrent = currentStrokeWidth === widthStr;
                            const widthNum = widthStr === '1.5px' ? 1.5 : 2.5;
                            return (
                              <button
                                key={widthStr}
                                type="button"
                                onClick={() => updateEdgeProperties(selectedEdge.id, { strokeWidth: widthNum })}
                                className={`h-6 px-1.5 rounded-[4px] text-[10px] font-mono transition-all cursor-pointer ${isCurrent
                                    ? 'bg-white dark:bg-[#232F3E] text-[#16191F] dark:text-white font-semibold shadow-xs'
                                    : 'text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED]'
                                  }`}
                                title={`Stroke width: ${widthStr}`}
                              >
                                {widthStr}
                              </button>
                            );
                          })}
                        </div>

                        <div className="h-4 w-px bg-[#EAEDED] dark:bg-[#2A3647]" />

                        {/* Traffic Flow Pulse Simulation */}
                        <button
                          type="button"
                          onClick={() => updateEdgeProperties(selectedEdge.id, { animated: !isAnimated })}
          className={`h-7 px-2 rounded-[4px] text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${isAnimated
                              ? 'bg-[#1D8102]/15 text-[#1D8102]'
                              : 'text-[#545B64] dark:text-[#879596] hover:bg-[#EAEDED] dark:hover:bg-[#2A3647]'
          }`}
                        title="Toggle Animated Pulse Dots"
        >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Pulse</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => removeEdge(selectedEdge.id)}
                        className="p-1.5 rounded-[4px] hover:bg-[#DD344C]/10 text-[#545B64] dark:text-[#879596] hover:text-[#DD344C] transition-colors cursor-pointer"
                        title="Delete Connection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    );
  }

                    // =========================================================================
                    // VIEW 4: Empty Selection (Primary Studio Dock)
                    // =========================================================================
                    return (
                      <div className={dockContainerClass}>
                        {/* + Service Popover */}
                        <div className="relative">
                          <button
                            ref={addServiceTriggerRef}
                            type="button"
                            onClick={() => togglePopover('dock-add-service')}
                            style={{ backgroundColor: '#FF9900', color: '#0F141A' }}
                            className="h-7.5 px-2.5 rounded-[6px] text-[12px] font-bold flex items-center gap-1.5 shadow-xs hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
                            title="Add AWS Service"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Service</span>
                            <ChevronDown
                              className="w-3 h-3 transition-transform duration-200"
                              style={{ transform: isAddServiceOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            />
                          </button>

                          <AnimatedPopover
                            isOpen={isAddServiceOpen}
                            onClose={() => closePopover('dock-add-service')}
                            triggerRef={addServiceTriggerRef}
                            side="top"
                            className="w-72 p-2 space-y-2"
                          >
                            <div className="text-[11px] font-bold text-[#545B64] dark:text-[#879596] border-b border-[#EAEDED] dark:border-[#222D3C] pb-1 px-1">
                              Add AWS service to canvas
                            </div>
                            <CloudscapeSearchInput
                              value={serviceSearch}
                              onChange={setServiceSearch}
                              placeholder="Filter services by name or ID..."
                              autoFocus
                              size="sm"
                              className="w-full"
                            />
                            <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-0.5">
                              {filteredQuickAddServices.map((svc) => (
                                <button
                                  key={svc.id}
                                  type="button"
                                  onClick={() => handleQuickAddService(svc)}
                                  className="w-full text-left px-2 py-1.5 rounded-[4px] text-[12px] text-[#16191F] dark:text-[#EAEDED] hover:bg-[#EAEDED]/70 dark:hover:bg-[#1E2B3D] transition-colors flex items-center justify-between cursor-pointer"
                                >
                                  <span className="truncate font-medium">{svc.name}</span>
                                  <span className="font-mono text-[10px] text-[#545B64] dark:text-[#879596] ml-2 shrink-0">
                                    {svc.id}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </AnimatedPopover>
                        </div>

                        {/* + Boundary Popover */}
                        <div className="relative">
                          <button
                            ref={boundaryTriggerRef}
                            type="button"
                            onClick={() => togglePopover('dock-boundary')}
                            className={`h-7.5 px-2.5 rounded-[6px] border text-[12px] font-medium text-[#16191F] dark:text-[#EAEDED] bg-white dark:bg-[#161E2D] hover:bg-[#F8F9FA] dark:hover:bg-[#1E2B3D] flex items-center gap-1.5 transition-all cursor-pointer ${isBoundaryOpen
                                ? 'border-[#0972D3] dark:border-[#539FE5] ring-1 ring-[#0972D3]/20'
                                : 'border-[#D5DBDB] dark:border-[#354150]'
                              }`}
                            title="Add architectural group boundary"
                          >
                            <BoxSelect className="w-3.5 h-3.5 text-[#8C4FFF]" />
                            <span>Boundary</span>
                            <ChevronDown
                              className="w-3 h-3 text-[#545B64] dark:text-[#879596] transition-transform duration-200"
                              style={{ transform: isBoundaryOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            />
                          </button>

                          <AnimatedPopover
                            isOpen={isBoundaryOpen}
                            onClose={() => closePopover('dock-boundary')}
                            triggerRef={boundaryTriggerRef}
                            side="top"
                            className="w-68 p-1.5 space-y-0.5"
                          >
                            <div className="px-2 py-1 text-[11px] font-bold text-[#545B64] dark:text-[#879596] border-b border-[#EAEDED] dark:border-[#222D3C] mb-1">
                              Add group boundary
                            </div>
                            {BOUNDARY_PRESETS.map((b) => (
                              <button
                                key={b.type}
                                type="button"
                                onClick={() => handleAddBoundary(b.type, b.label)}
                                className="w-full text-left px-2 py-1.5 rounded-[4px] text-[12px] text-[#16191F] dark:text-[#EAEDED] hover:bg-[#EAEDED]/70 dark:hover:bg-[#1E2B3D] transition-colors flex items-center justify-between gap-4 cursor-pointer"
                              >
                                <span className="font-medium">{b.label}</span>
                                <span className="text-[10px] text-[#545B64] dark:text-[#879596] shrink-0">{b.desc}</span>
                              </button>
                            ))}
                          </AnimatedPopover>
                        </div>

                        {/* + Actor / Note Popover */}
                        <div className="relative">
                          <button
                            ref={actorNoteTriggerRef}
                            type="button"
                            onClick={() => togglePopover('dock-actor-note')}
                            className={`h-7.5 px-2.5 rounded-[6px] border text-[12px] font-medium text-[#16191F] dark:text-[#EAEDED] bg-white dark:bg-[#161E2D] hover:bg-[#F8F9FA] dark:hover:bg-[#1E2B3D] flex items-center gap-1.5 transition-all cursor-pointer ${isActorNoteOpen
                                ? 'border-[#0972D3] dark:border-[#539FE5] ring-1 ring-[#0972D3]/20'
                                : 'border-[#D5DBDB] dark:border-[#354150]'
                              }`}
                            title="Add external clients or callout notes"
                          >
                            <Users className="w-3.5 h-3.5 text-[#0972D3] dark:text-[#539FE5]" />
                            <span>Actor / Note</span>
                            <ChevronDown
                              className="w-3 h-3 text-[#545B64] dark:text-[#879596] transition-transform duration-200"
                              style={{ transform: isActorNoteOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            />
                          </button>

                          <AnimatedPopover
                            isOpen={isActorNoteOpen}
                            onClose={() => closePopover('dock-actor-note')}
                            triggerRef={actorNoteTriggerRef}
                            side="top"
                            className="w-72 p-2 space-y-2"
                          >
                            <div className="text-[10px] font-bold text-[#545B64] dark:text-[#879596] px-1">
                              External Clients & Ingress
                            </div>
                            <div className="space-y-0.5">
                              {EXTERNAL_ACTORS.map((act) => (
                                <button
                                  key={act.type}
                                  type="button"
                                  onClick={() => handleQuickAddActor(act.type, act.label)}
                                  className="w-full text-left px-2 py-1.5 rounded-[4px] text-[12px] text-[#16191F] dark:text-[#EAEDED] hover:bg-[#EAEDED]/70 dark:hover:bg-[#1E2B3D] transition-colors flex items-center justify-between gap-3 cursor-pointer"
                                >
                                  <div className="truncate">
                                    <div className="font-medium truncate">{act.label}</div>
                                    <div className="text-[10px] text-[#545B64] dark:text-[#879596] truncate">{act.desc}</div>
                                  </div>
                                  <Users className="w-3.5 h-3.5 text-[#0972D3] dark:text-[#539FE5] shrink-0" />
                                </button>
                              ))}
                            </div>

                            <div className="border-t border-[#EAEDED] dark:border-[#222D3C] pt-1.5">
                              <div className="text-[10px] font-bold text-[#545B64] dark:text-[#879596] px-1 mb-1">
                                Architecture Callout Note
                              </div>
                              <button
                                type="button"
                                onClick={handleQuickAddNote}
                                className="w-full flex items-center gap-2 p-2 rounded-[4px] border border-dashed border-[#D5DBDB] dark:border-[#354150] hover:border-[#0972D3] dark:hover:border-[#539FE5] hover:bg-[#F8F9FA] dark:hover:bg-[#1E2B3D] text-[#16191F] dark:text-[#EAEDED] cursor-pointer text-left transition-colors"
                              >
                                <StickyNote className="w-4 h-4 text-[#ED7100] shrink-0" />
                                <div>
                                  <div className="text-[12px] font-semibold">Add sticky note</div>
                                  <div className="text-[10px] text-[#545B64] dark:text-[#879596]">
                                    Document decisions or SLA targets
                                  </div>
                                </div>
                              </button>
                            </div>
                          </AnimatedPopover>
                        </div>

                        <div className="h-5 w-px bg-[#D5DBDB] dark:bg-[#354150] mx-0.5" aria-hidden="true" />

                        {/* Auto-Layout (LR | TB) */}
                        <div className="flex items-center border border-[#D5DBDB] dark:border-[#354150] rounded-[6px] overflow-hidden h-7.5 bg-white dark:bg-[#161E2D]">
                          <button
                            type="button"
                            onClick={() => onAutoLayout?.(layoutDirection)}
                            aria-disabled={isArranging ? 'true' : undefined}
                            className="px-2.5 h-full text-[12px] font-medium text-[#16191F] dark:text-[#EAEDED] hover:bg-[#F8F9FA] dark:hover:bg-[#1E2B3D] enabled:active:scale-[0.97] transition-all cursor-pointer flex items-center gap-1.5"
                            title={`Auto-layout diagram using Dagre (${layoutDirection})`}
                          >
                            <LayoutGrid className="w-3.5 h-3.5 text-[#0972D3] dark:text-[#539FE5]" />
                            <span>Auto-Layout</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const nextDir = layoutDirection === 'LR' ? 'TB' : 'LR';
                              onChangeLayoutDirection?.(nextDir);
                              onAutoLayout?.(nextDir);
                            }}
                            aria-disabled={isArranging ? 'true' : undefined}
                            className="px-2 h-full text-[11px] font-mono font-semibold text-[#0972D3] dark:text-[#539FE5] hover:bg-[#F8F9FA] dark:hover:bg-[#1E2B3D] border-l border-[#D5DBDB] dark:border-[#354150] cursor-pointer"
                            title={`Switch layout direction to ${layoutDirection === 'LR' ? 'Top-to-Bottom (TB)' : 'Left-to-Right (LR)'}`}
                          >
                            {layoutDirection}
                          </button>
                        </div>

                        <div className="h-5 w-px bg-[#D5DBDB] dark:bg-[#354150] mx-0.5" aria-hidden="true" />

                        {/* Snap to Grid (16px) */}
                        <button
                          type="button"
                          onClick={() => setSnapToGrid(!snapToGrid)}
        className={`h-7.5 px-2 rounded-[6px] text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${snapToGrid
                              ? 'bg-[#0972D3]/15 dark:bg-[#539FE5]/20 text-[#0972D3] dark:text-[#539FE5]'
                              : 'text-[#545B64] dark:text-[#879596] hover:bg-[#EAEDED] dark:hover:bg-[#2A3647]'
        }`}
                        title="Snap elements to 16px grid"
      >
                        <GitCommit className="w-3 h-3" />
                        <span>Snap: 16px</span>
                      </button>

                        {/* Fit to View */}
                        {onFitView && (
        <button
          type="button"
          onClick={onFitView}
          className="h-7.5 px-2 rounded-[6px] text-[11px] font-medium text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] hover:bg-[#EAEDED] dark:hover:bg-[#2A3647] flex items-center gap-1.5 cursor-pointer"
          title="Fit diagram to screen (F)"
        >
          <Maximize2 className="w-3 h-3" />
          <span>Fit</span>
        </button>
      )}

                      <div className="h-5 w-px bg-[#D5DBDB] dark:bg-[#354150] mx-0.5" aria-hidden="true" />

                      {/* Clear Canvas */}
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Clear all nodes and edges from canvas?')) {
                            clearCanvas();
                          }
                        }}
                        className="size-7.5 rounded-[6px] flex items-center justify-center text-[#545B64] dark:text-[#879596] hover:text-[#DD344C] hover:bg-[#DD344C]/10 transition-colors cursor-pointer"
                        title="Clear canvas"
                        aria-label="Clear canvas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    );
};

                    export default CanvasFormatBar;
