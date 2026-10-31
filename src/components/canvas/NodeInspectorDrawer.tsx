import React, { useEffect, useCallback, useTransition, useMemo } from 'react';
import Markdown from 'react-markdown';
import {
  ExternalLink,
  BookOpen,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Maximize2,
  Trash2,
  CopyPlus,
  Sliders,
  ArrowLeftRight,
  Activity,
  Layers,
  BoxSelect,
  StickyNote,
  Users,
  Star,
} from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useCompassStore } from '../../store/useCompassStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { MermaidViewer } from '../vault/MermaidViewer';
import { AWSServiceIcon } from '../icons/AWSServiceIcon';
import { CloudscapeSplitPanel } from '../ui/CloudscapeSplitPanel';
import { CloudscapeTabs } from '../ui/CloudscapeTabs';
import { CloudscapeCodeBlock } from '../ui/CloudscapeCodeBlock';
import { CloudscapeCopyButton } from '../ui/CloudscapeCopyButton';
import { CloudscapeSelect, type CloudscapeSelectOption } from '../ui/CloudscapeSelect';
import { SegmentedControl } from '../ui/SegmentedControl';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { getVerifiedAWSDocsUrl } from '../../utils/awsDocs';
import type {
  EdgeProtocol,
  EdgeLineStyle,
  EdgeDirectionality,
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

const PROTOCOL_OPTIONS: CloudscapeSelectOption<EdgeProtocol>[] = PROTOCOLS.map((p) => ({
  value: p,
  label: p,
}));

const BOUNDARY_TYPES: { type: GroupBoundaryType; label: string }[] = [
  { type: 'aws-cloud', label: 'AWS Cloud Perimeter' },
  { type: 'region', label: 'AWS Region' },
  { type: 'vpc', label: 'Virtual Private Cloud (VPC)' },
  { type: 'public-subnet', label: 'Public Subnet' },
  { type: 'private-subnet', label: 'Private Subnet' },
  { type: 'data-subnet', label: 'Isolated Data Subnet' },
  { type: 'security-group', label: 'Security Group' },
  { type: 'auto-scaling-group', label: 'Auto Scaling Group' },
  { type: 'serverless', label: 'Managed Serverless' },
  { type: 'corporate-datacenter', label: 'Corporate Data Center' },
];

const BOUNDARY_TYPE_OPTIONS: CloudscapeSelectOption<GroupBoundaryType>[] = BOUNDARY_TYPES.map((b) => ({
  value: b.type,
  label: b.label,
}));

const ACTOR_TYPES: { type: ExternalActorType; label: string }[] = [
  { type: 'user-browser', label: 'User / Client Browser' },
  { type: 'mobile-client', label: 'Mobile / IoT Device Client' },
  { type: 'corporate-datacenter', label: 'Corporate On-Premises Data Center' },
  { type: 'external-webhook', label: 'External Webhook / 3rd-Party API' },
];

const ACTOR_TYPE_OPTIONS: CloudscapeSelectOption<ExternalActorType>[] = ACTOR_TYPES.map((a) => ({
  value: a.type,
  label: a.label,
}));

const ENV_OPTIONS: CloudscapeSelectOption<NodeEnvironment>[] = [
  { value: 'None', label: 'None (Global Scope)' },
  { value: 'Prod', label: 'Production (Prod)' },
  { value: 'Staging', label: 'Staging' },
  { value: 'Dev', label: 'Development (Dev)' },
];

const COLOR_PRESETS = [
  { label: 'Blue', color: '#539FE5' },
  { label: 'Purple', color: '#8C4FFF' },
  { label: 'Pink', color: '#E7157B' },
  { label: 'Green', color: '#3F8624' },
  { label: 'Orange', color: '#ED7100' },
  { label: 'Red', color: '#DD344C' },
  { label: 'Neutral', color: '#879596' },
];

const LINE_STYLE_OPTIONS: { value: EdgeLineStyle; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
];

const DIRECTION_OPTIONS: { value: EdgeDirectionality; label: string }[] = [
  { value: 'one-way', label: 'One-Way ➔' },
  { value: 'bi-directional', label: 'Bi-Dir ⇄' },
  { value: 'none', label: 'None ──' },
];

const NOTE_COLOR_OPTIONS = [
  { value: 'amber', label: 'Amber' },
  { value: 'blue', label: 'Blue' },
  { value: 'purple', label: 'Purple' },
  { value: 'green', label: 'Green' },
  { value: 'slate', label: 'Slate' },
];

export const NodeInspectorDrawer: React.FC = () => {
  const reactFlow = useReactFlow();

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectedEdgeId = useCanvasStore((s) => s.selectedEdgeId);
  const isInspectorOpen = useCanvasStore((s) => s.isInspectorOpen);
  const inspectorActiveTab = useCanvasStore((s) => s.inspectorActiveTab);
  const setInspectorActiveTab = useCanvasStore((s) => s.setInspectorActiveTab);
  const closeInspector = useCanvasStore((s) => s.closeInspector);
  const openNodeInspector = useCanvasStore((s) => s.openNodeInspector);
  const updateNodeProperties = useCanvasStore((s) => s.updateNodeProperties);
  const updateNodeParent = useCanvasStore((s) => s.updateNodeParent);
  const updateEdgeProperties = useCanvasStore((s) => s.updateEdgeProperties);
  const reverseEdgeDirection = useCanvasStore((s) => s.reverseEdgeDirection);
  const removeNode = useCanvasStore((s) => s.removeNode);
  const removeEdge = useCanvasStore((s) => s.removeEdge);
  const duplicateNode = useCanvasStore((s) => s.duplicateNode);

  const services = useCompassStore((s) => s.services);
  const toggleFavorite = useCompassStore((s) => s.toggleFavorite);
  const setWorkspaceMode = useCompassStore((s) => s.setWorkspaceMode);
  const setSelectedServiceId = useCompassStore((s) => s.setSelectedServiceId);

  const [, startTransition] = useTransition();

  const currentNode = nodes.find((n) => n.id === selectedNodeId);
  const currentEdge = edges.find((e) => e.id === selectedEdgeId);
  const service = services.find((s) => s.id === currentNode?.data.serviceId);

  // Group boundaries currently on the canvas for parent assignment
  const groupBoundaries = useMemo(
    () => nodes.filter((n) => n.data.isBoundary),
    [nodes]
  );

  const parentBoundaryOptions = useMemo<CloudscapeSelectOption<string>[]>(() => {
    return [
      { value: 'none', label: '(None - Global Scope)' },
      ...groupBoundaries.map((g) => ({
        value: g.id,
        label: `${g.data.boundaryLabel || g.data.label} (${g.data.boundaryType || 'AWS Boundary'})`,
      })),
    ];
  }, [groupBoundaries]);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isInspectorOpen) {
        closeInspector();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInspectorOpen, closeInspector]);

  const handleOpenFullVault = () => {
    if (service) {
      setSelectedServiceId(service.id);
      setWorkspaceMode('vault');
    }
  };

  const handleFocusNode = useCallback(() => {
    if (!currentNode) return;
    reactFlow.setCenter(currentNode.position.x + 50, currentNode.position.y + 30, {
      zoom: 1.2,
      duration: 500,
    });
  }, [currentNode, reactFlow]);

  if (!isInspectorOpen || (!selectedNodeId && !selectedEdgeId)) {
    return null;
  }

  const incomingEdges = currentNode ? edges.filter((e) => e.target === currentNode.id) : [];
  const outgoingEdges = currentNode ? edges.filter((e) => e.source === currentNode.id) : [];

  // Determine Title & Header Icon
  let headerIcon = <Sliders className="w-5 h-5 text-[#0972D3] dark:text-[#539FE5]" />;
  let headerMainTitle = 'Inspector';
  let headerSubtitle = 'Configure properties';

  if (currentNode) {
    if (currentNode.data.isBoundary) {
      headerIcon = <BoxSelect className="w-5 h-5 text-[#8C4FFF]" />;
      headerMainTitle = currentNode.data.boundaryLabel || currentNode.data.label;
      headerSubtitle = `Group Boundary • ${currentNode.data.boundaryType || 'AWS Boundary'}`;
    } else if (currentNode.data.isActor) {
      headerIcon = <Users className="w-5 h-5 text-[#0972D3]" />;
      headerMainTitle = currentNode.data.customTitle || currentNode.data.label;
      headerSubtitle = `External Actor • ${currentNode.data.actorType || 'Client'}`;
    } else if (currentNode.data.isAnnotation) {
      headerIcon = <StickyNote className="w-5 h-5 text-[#ED7100]" />;
      headerMainTitle = currentNode.data.annotationTitle || currentNode.data.label;
      headerSubtitle = 'Architecture Callout Note';
    } else {
      headerIcon = <AWSServiceIcon serviceId={currentNode.data.serviceId} size={24} variant="service" />;
      headerMainTitle = currentNode.data.customTitle || currentNode.data.label;
      headerSubtitle = `${currentNode.data.serviceId} • Tier ${currentNode.data.tier} • ${currentNode.data.category}`;
    }
  } else if (currentEdge) {
    const srcNode = nodes.find((n) => n.id === currentEdge.source);
    const tgtNode = nodes.find((n) => n.id === currentEdge.target);
    headerIcon = <ArrowLeftRight className="w-5 h-5 text-[#0972D3] dark:text-[#539FE5]" />;
    headerMainTitle = currentEdge.data?.customLabel || currentEdge.protocol || 'Connection Flow';
    headerSubtitle = `${srcNode?.data.label || currentEdge.source} ➔ ${tgtNode?.data.label || currentEdge.target}`;
  }

  const headerTitle = (
    <div className="flex items-center gap-2.5 truncate">
      {headerIcon}
      <div className="truncate">
        <div className="text-[14px] leading-[20px] font-bold text-[#16191F] dark:text-[#EAEDED] truncate">
          {headerMainTitle}
        </div>
        <div className="text-[12px] leading-[16px] text-[#545B64] dark:text-[#879596] font-mono truncate">
          {headerSubtitle}
        </div>
      </div>
    </div>
  );

  const headerActions = currentNode ? (
    <div className="flex items-center gap-1">
      {service && (
        <button
          type="button"
          onClick={() => toggleFavorite(service.id)}
          className={`p-1 rounded-[4px] transition-colors cursor-pointer enabled:active:scale-[0.96] ${
            service.isFavorite
              ? 'text-[#FF9900] hover:bg-[#FF9900]/10'
              : 'text-[#545B64] dark:text-[#879596] hover:text-[#FF9900] hover:bg-[#EAEDED]/60 dark:hover:bg-[#1E2B3D]'
          }`}
          title={service.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-label="Toggle favorite"
        >
          <Star
            className={`w-4 h-4 transition-transform active:scale-90 ${
              service.isFavorite ? 'fill-[#FF9900] text-[#FF9900]' : ''
            }`}
          />
        </button>
      )}
      <button
        type="button"
        onClick={handleFocusNode}
        className="p-1 rounded-[4px] text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] hover:bg-[#EAEDED]/60 dark:hover:bg-[#1E2B3D] transition-colors cursor-pointer"
        title="Center canvas on this node"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
    </div>
  ) : null;

  return (
    <CloudscapeSplitPanel
      isOpen={isInspectorOpen}
      onClose={closeInspector}
      title={headerTitle}
      headerActions={headerActions}
      defaultPosition="side"
      initialWidth={450}
    >
      {/* Flush Underline Tabs */}
      <CloudscapeTabs
        tabs={[
          { id: 'properties', label: 'Properties' },
          {
            id: 'dossier',
            label: service ? 'Documentation' : 'Architecture guide',
            icon: <BookOpen className="w-4 h-4" />,
          },
        ]}
        activeTab={inspectorActiveTab}
        onChange={(tab) => {
          startTransition(() => {
            setInspectorActiveTab(tab as 'properties' | 'dossier');
          });
        }}
      />

      {/* Flush Property Sheet (No nested bordered cards) */}
      <div className="overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-[#141C28]">
        {inspectorActiveTab === 'properties' ? (
          <div>
            {/* ================= AWS SERVICE NODE CUSTOMIZER ================= */}
            {currentNode && !currentNode.data.isBoundary && !currentNode.data.isActor && !currentNode.data.isAnnotation && (
              <>
                {/* 1. Node Identity & Title */}
                <div className="px-5 py-4 border-b border-[#EAEDED] dark:border-[#222D3C] space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#545B64] dark:text-[#879596] flex items-center justify-between">
                    <span>Node Identity</span>
                    <span className="font-mono text-[10px] text-[#0972D3] dark:text-[#539FE5] normal-case font-medium">
                      {currentNode.data.serviceId}
                    </span>
                  </div>

                  <div className="grid grid-cols-[110px_1fr] items-center gap-2.5 py-0.5">
                    <label className="text-[12px] font-medium text-[#545B64] dark:text-[#879596]">
                      Title
                    </label>
                    <input
                      type="text"
                      value={currentNode.data.customTitle || currentNode.data.label}
                      onChange={(e) => updateNodeProperties(currentNode.id, { customTitle: e.target.value })}
                      placeholder="e.g. Orders API Lambda"
                      className="h-8 w-full px-2.5 rounded-[6px] border border-[#D5DBDB] dark:border-[#2A3647] bg-[#F8F9FA] dark:bg-[#0F141A] text-[12px] text-[#16191F] dark:text-[#EAEDED] outline-none focus:border-[#0972D3] dark:focus:border-[#539FE5] transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-[110px_1fr] items-center gap-2.5 py-0.5">
                    <label className="text-[12px] font-medium text-[#545B64] dark:text-[#879596]">
                      Subtitle / Role
                    </label>
                    <input
                      type="text"
                      value={currentNode.data.roleSubtitle || currentNode.data.customNotes || ''}
                      onChange={(e) => updateNodeProperties(currentNode.id, { roleSubtitle: e.target.value })}
                      placeholder="e.g. Python 3.12 · 512MB · arm64"
                      className="h-8 w-full px-2.5 rounded-[6px] border border-[#D5DBDB] dark:border-[#2A3647] bg-[#F8F9FA] dark:bg-[#0F141A] text-[11px] font-mono text-[#16191F] dark:text-[#EAEDED] outline-none focus:border-[#0972D3] dark:focus:border-[#539FE5] transition-colors"
                    />
                  </div>
                </div>

                {/* 2. Cloud Attributes & Deployment */}
                <div className="px-5 py-4 border-b border-[#EAEDED] dark:border-[#222D3C] space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#545B64] dark:text-[#879596]">
                    Cloud Attributes
                  </div>

                  <div className="grid grid-cols-[110px_1fr] items-center gap-2.5 py-0.5">
                    <label className="text-[12px] font-medium text-[#545B64] dark:text-[#879596]">
                      Environment
                    </label>
                    <CloudscapeSelect<NodeEnvironment>
                      value={currentNode.data.env || 'None'}
                      options={ENV_OPTIONS}
                      onChange={(val) => updateNodeProperties(currentNode.id, { env: val })}
                    />
                  </div>

                  <div className="grid grid-cols-[110px_1fr] items-center gap-2.5 py-0.5">
                    <label className="text-[12px] font-medium text-[#545B64] dark:text-[#879596]">
                      Avail. Zone
                    </label>
                    <input
                      type="text"
                      value={currentNode.data.az || ''}
                      onChange={(e) => updateNodeProperties(currentNode.id, { az: e.target.value })}
                      placeholder="e.g. Multi-AZ or us-east-1a"
                      className="h-8 w-full px-2.5 rounded-[6px] border border-[#D5DBDB] dark:border-[#2A3647] bg-[#F8F9FA] dark:bg-[#0F141A] text-[11px] font-mono text-[#16191F] dark:text-[#EAEDED] outline-none focus:border-[#0972D3] dark:focus:border-[#539FE5] transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-[110px_1fr] items-center gap-2.5 py-0.5">
                    <label className="text-[12px] font-medium text-[#545B64] dark:text-[#879596]">
                      Metadata Pill
                    </label>
                    <input
                      type="text"
                      value={currentNode.data.metadataPill || ''}
                      onChange={(e) => updateNodeProperties(currentNode.id, { metadataPill: e.target.value })}
                      placeholder="e.g. 10.0.1.24 or kms:Encrypted"
                      className="h-8 w-full px-2.5 rounded-[6px] border border-[#D5DBDB] dark:border-[#2A3647] bg-[#F8F9FA] dark:bg-[#0F141A] text-[11px] font-mono text-[#16191F] dark:text-[#EAEDED] outline-none focus:border-[#0972D3] dark:focus:border-[#539FE5] transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-[110px_1fr] items-center gap-2.5 py-0.5">
                    <label className="text-[12px] font-medium text-[#545B64] dark:text-[#879596] flex items-center gap-1.5">
                      <Layers className="size-3.5 text-[#0972D3] dark:text-[#539FE5]" />
                      <span>Container</span>
                    </label>
                    <CloudscapeSelect<string>
                      value={currentNode.parentId || 'none'}
                      options={parentBoundaryOptions}
                      onChange={(val) => updateNodeParent(currentNode.id, val)}
                    />
                  </div>
                </div>

                {/* 3. Active Canvas Connections */}
                <div className="px-5 py-4 border-b border-[#EAEDED] dark:border-[#222D3C] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#545B64] dark:text-[#879596]">
                      Canvas Connections
                    </span>
                    <span className="font-mono text-[11px] text-[#545B64] dark:text-[#879596]">
                      {incomingEdges.length} in · {outgoingEdges.length} out
                    </span>
                  </div>

                  {/* Incoming Connections */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-[#545B64] dark:text-[#879596] flex items-center gap-1.5">
                      <ArrowLeft className="size-3 text-[#0972D3] dark:text-[#539FE5]" />
                      <span>Incoming ({incomingEdges.length})</span>
                    </div>
                    {incomingEdges.length === 0 ? (
                      <div className="text-[12px] text-[#545B64] dark:text-[#879596] italic pl-4 py-0.5">
                        No incoming connections
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {incomingEdges.map((e) => {
                          const src = nodes.find((n) => n.id === e.source);
                          return (
                            <div
                              key={e.id}
                              onClick={() => openNodeInspector(e.source)}
                              className="flex items-center justify-between py-1.5 px-2 rounded-[6px] hover:bg-[#F2F3F3] dark:hover:bg-[#1E2B3D] transition-colors group cursor-pointer"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                                <AWSServiceIcon
                                  serviceId={src?.data.serviceId || 'aws'}
                                  size={18}
                                  variant="service"
                                />
                                <span className="text-[12px] font-medium text-[#16191F] dark:text-[#EAEDED] group-hover:text-[#0972D3] dark:group-hover:text-[#539FE5] truncate">
                                  {src?.data.customTitle || src?.data.label || e.source}
                                </span>
                              </div>
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#EAEDED] dark:bg-[#222D3C] text-[#545B64] dark:text-[#879596] shrink-0">
                                {e.protocol || 'TCP'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Outgoing Connections */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-semibold text-[#545B64] dark:text-[#879596] flex items-center gap-1.5">
                      <ArrowRight className="size-3 text-[#3F8624] dark:text-[#4ADE80]" />
                      <span>Outgoing ({outgoingEdges.length})</span>
                    </div>
                    {outgoingEdges.length === 0 ? (
                      <div className="text-[12px] text-[#545B64] dark:text-[#879596] italic pl-4 py-0.5">
                        No outgoing connections
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {outgoingEdges.map((e) => {
                          const tgt = nodes.find((n) => n.id === e.target);
                          return (
                            <div
                              key={e.id}
                              onClick={() => openNodeInspector(e.target)}
                              className="flex items-center justify-between py-1.5 px-2 rounded-[6px] hover:bg-[#F2F3F3] dark:hover:bg-[#1E2B3D] transition-colors group cursor-pointer"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                                <AWSServiceIcon
                                  serviceId={tgt?.data.serviceId || 'aws'}
                                  size={18}
                                  variant="service"
                                />
                                <span className="text-[12px] font-medium text-[#16191F] dark:text-[#EAEDED] group-hover:text-[#0972D3] dark:group-hover:text-[#539FE5] truncate">
                                  {tgt?.data.customTitle || tgt?.data.label || e.target}
                                </span>
                              </div>
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#EAEDED] dark:bg-[#222D3C] text-[#545B64] dark:text-[#879596] shrink-0">
                                {e.protocol || 'TCP'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. ARN Pattern (if available) */}
                {service?.arnExample && (
                  <div className="px-5 py-4 border-b border-[#EAEDED] dark:border-[#222D3C] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#545B64] dark:text-[#879596]">
                        ARN Pattern
                      </span>
                      <CloudscapeCopyButton
                        textToCopy={service.arnExample}
                        label="Copy"
                        copiedLabel="Copied"
                      />
                    </div>
                    <div className="font-mono text-[11px] p-2.5 rounded-[6px] border border-[#EAEDED] dark:border-[#222D3C] bg-[#F8F9FA] dark:bg-[#0F141A] text-[#545B64] dark:text-[#879596] break-all select-all">
                      {service.arnExample}
                    </div>
                  </div>
                )}

                {/* 6. Pinned Action Controls */}
                <div className="px-5 py-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => duplicateNode(currentNode.id)}
                    className="flex-1 h-8 px-3 rounded-[6px] border border-[#D5DBDB] dark:border-[#2A3647] bg-[#F8F9FA] dark:bg-[#0F141A] hover:bg-[#EAEDED] dark:hover:bg-[#1E2B3D] text-[12px] font-medium text-[#16191F] dark:text-[#EAEDED] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CopyPlus className="size-3.5 text-[#0972D3] dark:text-[#539FE5]" />
                    <span>Duplicate (Ctrl+D)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeNode(currentNode.id)}
                    className="h-8 px-3 rounded-[6px] border border-transparent hover:border-[#DD344C]/30 hover:bg-[#DD344C]/10 text-[12px] font-medium text-[#545B64] dark:text-[#879596] hover:text-[#DD344C] dark:hover:text-[#F87171] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}

            {/* ================= GROUP BOUNDARY CUSTOMIZER ================= */}
            {currentNode && currentNode.data.isBoundary && (
              <>
                <div className="px-5 py-4 border-b border-[#EAEDED] dark:border-[#222D3C] space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#545B64] dark:text-[#879596]">
                    Boundary Configuration
                  </div>

                  <div className="grid grid-cols-[110px_1fr] items-center gap-2.5 py-0.5">
                    <label className="text-[12px] font-medium text-[#545B64] dark:text-[#879596]">
                      Type
                    </label>
                    <CloudscapeSelect<GroupBoundaryType>
                      value={currentNode.data.boundaryType || 'aws-cloud'}
                      options={BOUNDARY_TYPE_OPTIONS}
                      onChange={(val) =>
                        updateNodeProperties(currentNode.id, {
                          boundaryType: val,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-[110px_1fr] items-center gap-2.5 py-0.5">
                    <label className="text-[12px] font-medium text-[#545B64] dark:text-[#879596]">
                      Label
                    </label>
                    <input
                      type="text"
                      value={currentNode.data.boundaryLabel || currentNode.data.label}
                      onChange={(e) => updateNodeProperties(currentNode.id, { boundaryLabel: e.target.value })}
                      placeholder="e.g. Production VPC"
                      className="h-8 w-full px-2.5 rounded-[6px] border border-[#D5DBDB] dark:border-[#2A3647] bg-[#F8F9FA] dark:bg-[#0F141A] text-[12px] text-[#16191F] dark:text-[#EAEDED] outline-none focus:border-[#0972D3] dark:focus:border-[#539FE5] transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-[110px_1fr] items-center gap-2.5 py-0.5">
                    <label className="text-[12px] font-medium text-[#545B64] dark:text-[#879596]">
                      CIDR / Scope
                    </label>
                    <input
                      type="text"
                      value={currentNode.data.cidr || ''}
                      onChange={(e) => updateNodeProperties(currentNode.id, { cidr: e.target.value })}
                      placeholder="e.g. 10.0.0.0/16 or us-east-1"
                      className="h-8 w-full px-2.5 rounded-[6px] border border-[#D5DBDB] dark:border-[#2A3647] bg-[#F8F9FA] dark:bg-[#0F141A] text-[11px] font-mono text-[#16191F] dark:text-[#EAEDED] outline-none focus:border-[#0972D3] dark:focus:border-[#539FE5] transition-colors"
                    />
                  </div>
                </div>

                <div className="px-5 py-4 border-b border-[#EAEDED] dark:border-[#222D3C] space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#545B64] dark:text-[#879596]">
                    Boundary Style
                  </div>

                  <div className="grid grid-cols-[110px_1fr] items-center gap-2.5 py-0.5">
                    <label className="text-[12px] font-medium text-[#545B64] dark:text-[#879596]">
                      Border Style
                    </label>
                    <SegmentedControl<'solid' | 'dashed' | 'dotted'>
                      size="sm"
                      options={LINE_STYLE_OPTIONS}
                      value={(currentNode.data.borderStyle as 'solid' | 'dashed' | 'dotted') || 'solid'}
                      onChange={(style) => updateNodeProperties(currentNode.id, { borderStyle: style })}
                      className="w-full justify-between"
                    />
                  </div>

                  <div className="grid grid-cols-[110px_1fr] items-center gap-2.5 py-1">
                    <label className="text-[12px] font-medium text-[#545B64] dark:text-[#879596]">
                      Accent Color
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => updateNodeProperties(currentNode.id, { accentColor: undefined })}
                        className={`text-[11px] h-6 px-2 rounded-[4px] border cursor-pointer font-medium transition-colors ${!currentNode.data.accentColor
                            ? 'border-[#0972D3] bg-[#0972D3]/10 text-[#0972D3] dark:border-[#539FE5] dark:text-[#539FE5]'
                            : 'border-[#D5DBDB] dark:border-[#2A3647] text-[#545B64] dark:text-[#879596] hover:bg-[#EAEDED] dark:hover:bg-[#1E2B3D]'
                          }`}
                      >
                        Default
                      </button>
                      {COLOR_PRESETS.map((p) => {
                        const isSelected = currentNode.data.accentColor === p.color;
                        return (
                          <button
                            key={p.color}
                            type="button"
                            onClick={() => updateNodeProperties(currentNode.id, { accentColor: p.color })}
                            style={{ backgroundColor: p.color }}
                            className={`size-5 rounded-full transition-transform cursor-pointer ${isSelected
                                ? 'scale-110 ring-2 ring-[#0972D3] dark:ring-[#539FE5] ring-offset-2 ring-offset-white dark:ring-offset-[#141C28]'
                                : 'hover:scale-105 opacity-80 hover:opacity-100'
                              }`}
                            title={p.label}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() => removeNode(currentNode.id)}
                    className="w-full h-8 px-3 rounded-[6px] border border-transparent hover:border-[#DD344C]/30 hover:bg-[#DD344C]/10 text-[12px] font-medium text-[#545B64] dark:text-[#879596] hover:text-[#DD344C] dark:hover:text-[#F87171] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Delete group boundary</span>
                  </button>
                </div>
              </>
            )}

            {/* ================= EXTERNAL ACTOR CUSTOMIZER ================= */}
            {currentNode && currentNode.data.isActor && (
              <>
                <div className="px-5 py-4 border-b border-[#EAEDED] dark:border-[#222D3C] space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#545B64] dark:text-[#879596]">
                    Actor Configuration
                  </div>

                  <div className="grid grid-cols-[110px_1fr] items-center gap-2.5 py-0.5">
                    <label className="text-[12px] font-medium text-[#545B64] dark:text-[#879596]">
                      Actor Type
                    </label>
                    <CloudscapeSelect<ExternalActorType>
                      value={currentNode.data.actorType || 'user-browser'}
                      options={ACTOR_TYPE_OPTIONS}
                      onChange={(val) =>
                        updateNodeProperties(currentNode.id, {
                          actorType: val,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-[110px_1fr] items-center gap-2.5 py-0.5">
                    <label className="text-[12px] font-medium text-[#545B64] dark:text-[#879596]">
                      Title
                    </label>
                    <input
                      type="text"
                      value={currentNode.data.customTitle || currentNode.data.label}
                      onChange={(e) => updateNodeProperties(currentNode.id, { customTitle: e.target.value })}
                      placeholder="e.g. Client Web Browser"
                      className="h-8 w-full px-2.5 rounded-[6px] border border-[#D5DBDB] dark:border-[#2A3647] bg-[#F8F9FA] dark:bg-[#0F141A] text-[12px] text-[#16191F] dark:text-[#EAEDED] outline-none focus:border-[#0972D3] dark:focus:border-[#539FE5] transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-[110px_1fr] items-center gap-2.5 py-0.5">
                    <label className="text-[12px] font-medium text-[#545B64] dark:text-[#879596]">
                      Role / Subtitle
                    </label>
                    <input
                      type="text"
                      value={currentNode.data.roleSubtitle || currentNode.data.customNotes || ''}
                      onChange={(e) => updateNodeProperties(currentNode.id, { roleSubtitle: e.target.value })}
                      placeholder="e.g. Next.js SPA / React"
                      className="h-8 w-full px-2.5 rounded-[6px] border border-[#D5DBDB] dark:border-[#2A3647] bg-[#F8F9FA] dark:bg-[#0F141A] text-[11px] font-mono text-[#16191F] dark:text-[#EAEDED] outline-none focus:border-[#0972D3] dark:focus:border-[#539FE5] transition-colors"
                    />
                  </div>
                </div>

                <div className="px-5 py-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => duplicateNode(currentNode.id)}
                    className="flex-1 h-8 px-3 rounded-[6px] border border-[#D5DBDB] dark:border-[#2A3647] bg-[#F8F9FA] dark:bg-[#0F141A] hover:bg-[#EAEDED] dark:hover:bg-[#1E2B3D] text-[12px] font-medium text-[#16191F] dark:text-[#EAEDED] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CopyPlus className="size-3.5 text-[#0972D3] dark:text-[#539FE5]" />
                    <span>Duplicate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeNode(currentNode.id)}
                    className="h-8 px-3 rounded-[6px] border border-transparent hover:border-[#DD344C]/30 hover:bg-[#DD344C]/10 text-[12px] font-medium text-[#545B64] dark:text-[#879596] hover:text-[#DD344C] dark:hover:text-[#F87171] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}

            {/* ================= ARCHITECTURE NOTE CUSTOMIZER ================= */}
            {currentNode && currentNode.data.isAnnotation && (
              <>
                <div className="px-5 py-4 border-b border-[#EAEDED] dark:border-[#222D3C] space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#545B64] dark:text-[#879596]">
                    Note Configuration
                  </div>

                  <div className="grid grid-cols-[110px_1fr] items-center gap-2.5 py-0.5">
                    <label className="text-[12px] font-medium text-[#545B64] dark:text-[#879596]">
                      Note Title
                    </label>
                    <input
                      type="text"
                      value={currentNode.data.annotationTitle || currentNode.data.label}
                      onChange={(e) => updateNodeProperties(currentNode.id, { annotationTitle: e.target.value })}
                      placeholder="e.g. Architecture Decision Record"
                      className="h-8 w-full px-2.5 rounded-[6px] border border-[#D5DBDB] dark:border-[#2A3647] bg-[#F8F9FA] dark:bg-[#0F141A] text-[12px] text-[#16191F] dark:text-[#EAEDED] outline-none focus:border-[#0972D3] dark:focus:border-[#539FE5] transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="text-[12px] font-medium text-[#545B64] dark:text-[#879596]">
                      Content (Markdown)
                    </label>
                    <textarea
                      value={currentNode.data.annotationContent || ''}
                      onChange={(e) => updateNodeProperties(currentNode.id, { annotationContent: e.target.value })}
                      rows={4}
                      placeholder="Write notes, architecture decisions, SLA rules, or gotchas..."
                      className="w-full p-2.5 rounded-[6px] border border-[#D5DBDB] dark:border-[#2A3647] bg-[#F8F9FA] dark:bg-[#0F141A] text-[12px] text-[#16191F] dark:text-[#EAEDED] outline-none focus:border-[#0972D3] dark:focus:border-[#539FE5] resize-y transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-[110px_1fr] items-center gap-2.5 py-1">
                    <label className="text-[12px] font-medium text-[#545B64] dark:text-[#879596]">
                      Theme Color
                    </label>
                    <SegmentedControl<string>
                      size="sm"
                      options={NOTE_COLOR_OPTIONS}
                      value={currentNode.data.annotationColor || 'amber'}
                      onChange={(color) => updateNodeProperties(currentNode.id, { annotationColor: color })}
                      className="w-full justify-between"
                    />
                  </div>
                </div>

                <div className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() => removeNode(currentNode.id)}
                    className="w-full h-8 px-3 rounded-[6px] border border-transparent hover:border-[#DD344C]/30 hover:bg-[#DD344C]/10 text-[12px] font-medium text-[#545B64] dark:text-[#879596] hover:text-[#DD344C] dark:hover:text-[#F87171] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Delete note</span>
                  </button>
                </div>
              </>
            )}

            {/* ================= CONNECTION / EDGE CUSTOMIZER ================= */}
            {currentEdge && (
              <>
                {/* 1. Protocol & Label */}
                <div className="px-5 py-4 border-b border-[#EAEDED] dark:border-[#222D3C] space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#545B64] dark:text-[#879596]">
                    Flow &amp; Protocol
                  </div>

                  <div className="grid grid-cols-[110px_1fr] items-center gap-2.5 py-0.5">
                    <label className="text-[12px] font-medium text-[#545B64] dark:text-[#879596]">
                      Protocol Preset
                    </label>
                    <CloudscapeSelect<EdgeProtocol>
                      value={currentEdge.protocol || 'HTTPS/REST'}
                      options={PROTOCOL_OPTIONS}
                      onChange={(val) => updateEdgeProperties(currentEdge.id, { protocol: val })}
                    />
                  </div>

                  <div className="grid grid-cols-[110px_1fr] items-center gap-2.5 py-0.5">
                    <label className="text-[12px] font-medium text-[#545B64] dark:text-[#879596]">
                      Custom Label
                    </label>
                    <input
                      type="text"
                      value={currentEdge.data?.customLabel || ''}
                      onChange={(e) => updateEdgeProperties(currentEdge.id, { customLabel: e.target.value })}
                      placeholder="e.g. gRPC / JWT Bearer"
                      className="h-8 w-full px-2.5 rounded-[6px] border border-[#D5DBDB] dark:border-[#2A3647] bg-[#F8F9FA] dark:bg-[#0F141A] text-[12px] text-[#16191F] dark:text-[#EAEDED] outline-none focus:border-[#0972D3] dark:focus:border-[#539FE5] transition-colors"
                    />
                  </div>
                </div>

                {/* 2. Line Style, Directionality, and Swatches */}
                <div className="px-5 py-4 border-b border-[#EAEDED] dark:border-[#222D3C] space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#545B64] dark:text-[#879596]">
                    Flow Appearance
                  </div>

                  <div className="grid grid-cols-[110px_1fr] items-center gap-2.5 py-0.5">
                    <label className="text-[12px] font-medium text-[#545B64] dark:text-[#879596]">
                      Line Style
                    </label>
                    <SegmentedControl<EdgeLineStyle>
                      size="sm"
                      options={LINE_STYLE_OPTIONS}
                      value={(currentEdge.data?.lineStyle as EdgeLineStyle) || 'solid'}
                      onChange={(style) => updateEdgeProperties(currentEdge.id, { lineStyle: style })}
                      className="w-full justify-between"
                    />
                  </div>

                  <div className="grid grid-cols-[110px_1fr] items-center gap-2.5 py-0.5">
                    <label className="text-[12px] font-medium text-[#545B64] dark:text-[#879596]">
                      Directionality
                    </label>
                    <SegmentedControl<EdgeDirectionality>
                      size="sm"
                      options={DIRECTION_OPTIONS}
                      value={(currentEdge.data?.directionality as EdgeDirectionality) || 'one-way'}
                      onChange={(dir) => updateEdgeProperties(currentEdge.id, { directionality: dir })}
                      className="w-full justify-between"
                    />
                  </div>

                  <div className="grid grid-cols-[110px_1fr] items-center gap-2.5 py-1">
                    <label className="text-[12px] font-medium text-[#545B64] dark:text-[#879596]">
                      Edge Color
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => updateEdgeProperties(currentEdge.id, { edgeColor: undefined })}
                        className={`text-[11px] h-6 px-2 rounded-[4px] border cursor-pointer font-medium transition-colors ${!currentEdge.data?.edgeColor
                            ? 'border-[#0972D3] bg-[#0972D3]/10 text-[#0972D3] dark:border-[#539FE5] dark:text-[#539FE5]'
                            : 'border-[#D5DBDB] dark:border-[#2A3647] text-[#545B64] dark:text-[#879596] hover:bg-[#EAEDED] dark:hover:bg-[#1E2B3D]'
                          }`}
                      >
                        Default
                      </button>
                      {COLOR_PRESETS.map((p) => {
                        const isSelected = currentEdge.data?.edgeColor === p.color;
                        return (
                          <button
                            key={p.color}
                            type="button"
                            onClick={() => updateEdgeProperties(currentEdge.id, { edgeColor: p.color })}
                            style={{ backgroundColor: p.color }}
                            className={`size-5 rounded-full transition-transform cursor-pointer ${isSelected
                                ? 'scale-110 ring-2 ring-[#0972D3] dark:ring-[#539FE5] ring-offset-2 ring-offset-white dark:ring-offset-[#141C28]'
                                : 'hover:scale-105 opacity-80 hover:opacity-100'
                              }`}
                            title={p.label}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. Traffic Simulation */}
                <div className="px-5 py-4 border-b border-[#EAEDED] dark:border-[#222D3C]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="size-3.5 text-[#3F8624] dark:text-[#4ADE80]" />
                      <span className="text-[12px] font-medium text-[#16191F] dark:text-[#EAEDED]">
                        Active Traffic Animation (dashed pulse)
                      </span>
                    </div>
                    <ToggleSwitch
                      checked={currentEdge.data?.animated ?? currentEdge.animated ?? false}
                      onChange={(checked) => updateEdgeProperties(currentEdge.id, { animated: checked })}
                      ariaLabel="Toggle active traffic animation"
                    />
                  </div>
                </div>

                {/* 4. Action Controls */}
                <div className="px-5 py-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => reverseEdgeDirection(currentEdge.id)}
                    className="flex-1 h-8 px-3 rounded-[6px] border border-[#D5DBDB] dark:border-[#2A3647] bg-[#F8F9FA] dark:bg-[#0F141A] hover:bg-[#EAEDED] dark:hover:bg-[#1E2B3D] text-[12px] font-medium text-[#16191F] dark:text-[#EAEDED] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeftRight className="size-3.5 text-[#0972D3] dark:text-[#539FE5]" />
                    <span>Reverse direction</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeEdge(currentEdge.id)}
                    className="h-8 px-3 rounded-[6px] border border-transparent hover:border-[#DD344C]/30 hover:bg-[#DD344C]/10 text-[12px] font-medium text-[#545B64] dark:text-[#879596] hover:text-[#DD344C] dark:hover:text-[#F87171] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Disconnect</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* ================= 6-PART DOSSIER / REFERENCE TAB ================= */
          <div className="p-5 vault-prose space-y-4">
            {service ? (
              <>
                <Markdown
                  components={{
                    code(props) {
                      const { children, className, ...rest } = props;
                      const match = /language-(\w+)/.exec(className || '');
                      const language = match ? match[1] : '';
                      if (language === 'mermaid') {
                        return <MermaidViewer chart={String(children).replace(/\n$/, '')} />;
                      }
                      if (language === 'bash' || language === 'sh' || language === 'cli') {
                        return (
                          <CloudscapeCodeBlock
                            code={String(children).replace(/\n$/, '')}
                            language="bash"
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
                  }}
                >
                  {service.markdownDoc}
                </Markdown>

                {/* Primary CTA for Full Vault */}
                <div className="space-y-2 pt-4">
                  <button
                    type="button"
                    onClick={handleOpenFullVault}
                    style={{
                      backgroundColor: '#FF9900',
                      color: '#0F141A',
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[4px] font-bold text-[14px] hover:bg-[#EC7211] transition-colors shadow-xs cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Open in Concept Vault documentation</span>
                  </button>

                  {(() => {
                    const docsUrl = getVerifiedAWSDocsUrl(service?.id, service?.docsUrl);
                    if (!docsUrl) return null;
                    return (
                      <a
                        href={docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[6px] border border-[#D5DBDB] dark:border-[#2A3647] bg-[#F8F9FA] dark:bg-[#0F141A] text-[#16191F] dark:text-[#EAEDED] text-[12px] font-medium hover:border-[#FF9900] hover:text-[#FF9900] transition-colors cursor-pointer shadow-2xs select-none"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#FF9900]" />
                        <span>Official AWS reference documentation</span>
                      </a>
                    );
                  })()}
                </div>
              </>
            ) : (
              <div className="text-[#545B64] dark:text-[#879596] text-center py-12 space-y-2">
                <Sparkles className="w-6 h-6 mx-auto opacity-50 text-[#0972D3] dark:text-[#539FE5]" />
                <p className="text-[13px] font-medium text-[#16191F] dark:text-[#EAEDED]">
                  Architecture Element Reference
                </p>
                <p className="text-[12px] max-w-xs mx-auto leading-relaxed">
                  {currentNode?.data.isBoundary
                    ? 'Architecture group boundaries delineate network tiers, security scopes, regions, and VPC containment per AWS Well-Architected Framework.'
                    : currentNode?.data.isActor
                      ? 'External actors represent clients, users, corporate systems, or 3rd-party webhook endpoints initiating requests into the AWS perimeter.'
                      : currentNode?.data.isAnnotation
                        ? 'Architecture notes capture ADR decisions, SLA agreements, or compliance constraints directly on the topology diagram.'
                        : currentEdge
                          ? 'Connection lines define protocol data flows, auth assumption roles, and asynchronous event triggers between architecture nodes.'
                          : 'Select any node or connection on the canvas to configure properties.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </CloudscapeSplitPanel>
  );
};

export default NodeInspectorDrawer;
