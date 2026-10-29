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
} from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useCompassStore } from '../../store/useCompassStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { MermaidViewer } from '../vault/MermaidViewer';
import { AWSServiceIcon } from '../icons/AWSServiceIcon';
import { CloudscapeSplitPanel } from '../ui/CloudscapeSplitPanel';
import { CloudscapeTabs } from '../ui/CloudscapeTabs';
import { CloudscapeStatusIndicator } from '../ui/CloudscapeStatusIndicator';
import { CloudscapeCodeBlock } from '../ui/CloudscapeCodeBlock';
import { CloudscapeCopyButton } from '../ui/CloudscapeCopyButton';
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

const ACTOR_TYPES: { type: ExternalActorType; label: string }[] = [
  { type: 'user-browser', label: 'User / Client Browser' },
  { type: 'mobile-client', label: 'Mobile / IoT Device Client' },
  { type: 'corporate-datacenter', label: 'Corporate On-Premises Data Center' },
  { type: 'external-webhook', label: 'External Webhook / 3rd-Party API' },
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
  const updateNodeStatus = useCanvasStore((s) => s.updateNodeStatus);
  const updateEdgeProperties = useCanvasStore((s) => s.updateEdgeProperties);
  const reverseEdgeDirection = useCanvasStore((s) => s.reverseEdgeDirection);
  const removeNode = useCanvasStore((s) => s.removeNode);
  const removeEdge = useCanvasStore((s) => s.removeEdge);
  const duplicateNode = useCanvasStore((s) => s.duplicateNode);

  const services = useCompassStore((s) => s.services);
  const updateServiceStatus = useCompassStore((s) => s.updateServiceStatus);
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
  let headerIcon = <Sliders className="w-5 h-5 text-[var(--aws-interactive)]" />;
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
    headerIcon = <ArrowLeftRight className="w-5 h-5 text-[var(--aws-interactive)]" />;
    headerMainTitle = currentEdge.data?.customLabel || currentEdge.protocol || 'Connection Flow';
    headerSubtitle = `${srcNode?.data.label || currentEdge.source} ➔ ${tgtNode?.data.label || currentEdge.target}`;
  }

  const headerTitle = (
    <div className="flex items-center gap-2.5 truncate">
      {headerIcon}
      <div className="truncate">
        <div className="text-[14px] leading-[20px] font-bold text-[var(--aws-text-primary)] truncate">
          {headerMainTitle}
        </div>
        <div className="text-[12px] leading-[16px] text-[var(--aws-text-muted)] font-mono truncate">
          {headerSubtitle}
        </div>
      </div>
    </div>
  );

  const headerActions = currentNode ? (
    <button
      type="button"
      onClick={handleFocusNode}
      style={{ color: 'var(--aws-text-muted)' }}
      className="p-1 rounded-[4px] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] transition-colors cursor-pointer"
      title="Center canvas on this node"
    >
      <Maximize2 className="w-4 h-4" />
    </button>
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
            label: service ? '6-Part dossier' : 'Architecture guide',
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

      {/* Panel Body */}
      <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
        {inspectorActiveTab === 'properties' ? (
          <div className="space-y-4 text-[13px]">
            {/* ================= SERVICE NODE CUSTOMIZER ================= */}
            {currentNode && !currentNode.data.isBoundary && !currentNode.data.isActor && !currentNode.data.isAnnotation && (
              <>
                {/* Titles & Roles */}
                <div
                  style={{
                    backgroundColor: 'var(--aws-card-bg)',
                    borderColor: 'var(--aws-border)',
                  }}
                  className="p-3.5 rounded-[8px] border space-y-3"
                >
                  <div className="text-[12px] font-bold text-[var(--aws-text-primary)] flex items-center justify-between">
                    <span>Node Identity &amp; Title</span>
                    <span className="font-mono text-[10px] text-[var(--aws-text-muted)]">
                      {currentNode.data.serviceId}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--aws-text-muted)] mb-1">
                      Custom Title (Instance Name)
                    </label>
                    <input
                      type="text"
                      value={currentNode.data.customTitle || currentNode.data.label}
                      onChange={(e) => updateNodeProperties(currentNode.id, { customTitle: e.target.value })}
                      placeholder="e.g. Orders API Lambda"
                      className="w-full h-8 px-2.5 rounded-[4px] border border-[var(--aws-input-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-primary)] text-[12px] outline-none focus:border-[var(--aws-interactive)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--aws-text-muted)] mb-1">
                      Resource Subtitle / Role
                    </label>
                    <input
                      type="text"
                      value={currentNode.data.roleSubtitle || currentNode.data.customNotes || ''}
                      onChange={(e) => updateNodeProperties(currentNode.id, { roleSubtitle: e.target.value })}
                      placeholder="e.g. Python 3.12 · 512MB · arm64"
                      className="w-full h-8 px-2.5 rounded-[4px] border border-[var(--aws-input-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-primary)] text-[12px] font-mono outline-none focus:border-[var(--aws-interactive)]"
                    />
                  </div>
                </div>

                {/* Environment, AZ, and Metadata Badges */}
                <div
                  style={{
                    backgroundColor: 'var(--aws-card-bg)',
                    borderColor: 'var(--aws-border)',
                  }}
                  className="p-3.5 rounded-[8px] border space-y-3"
                >
                  <div className="text-[12px] font-bold text-[var(--aws-text-primary)]">
                    Deployment &amp; Cloud Attributes
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--aws-text-muted)] mb-1">
                        Environment Badge
                      </label>
                      <select
                        value={currentNode.data.env || 'None'}
                        onChange={(e) => updateNodeProperties(currentNode.id, { env: e.target.value as NodeEnvironment })}
                        className="w-full h-8 px-2 rounded-[4px] border border-[var(--aws-input-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-primary)] text-[12px] outline-none cursor-pointer"
                      >
                        <option value="None">None</option>
                        <option value="Prod">Prod (Production)</option>
                        <option value="Staging">Staging</option>
                        <option value="Dev">Dev (Development)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--aws-text-muted)] mb-1">
                        Availability Zone
                      </label>
                      <input
                        type="text"
                        value={currentNode.data.az || ''}
                        onChange={(e) => updateNodeProperties(currentNode.id, { az: e.target.value })}
                        placeholder="e.g. Multi-AZ or us-east-1a"
                        className="w-full h-8 px-2.5 rounded-[4px] border border-[var(--aws-input-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-primary)] text-[12px] font-mono outline-none focus:border-[var(--aws-interactive)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--aws-text-muted)] mb-1">
                      Custom Metadata Pill
                    </label>
                    <input
                      type="text"
                      value={currentNode.data.metadataPill || ''}
                      onChange={(e) => updateNodeProperties(currentNode.id, { metadataPill: e.target.value })}
                      placeholder="e.g. 10.0.1.24 or kms:Encrypted"
                      className="w-full h-8 px-2.5 rounded-[4px] border border-[var(--aws-input-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-primary)] text-[12px] font-mono outline-none focus:border-[var(--aws-interactive)]"
                    />
                  </div>

                  {/* Parent Boundary Group Assignment */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--aws-text-muted)] mb-1 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[var(--aws-interactive)]" />
                      <span>Parent Boundary Container</span>
                    </label>
                    <select
                      value={currentNode.parentId || 'none'}
                      onChange={(e) => updateNodeParent(currentNode.id, e.target.value)}
                      className="w-full h-8 px-2 rounded-[4px] border border-[var(--aws-input-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-primary)] text-[12px] outline-none cursor-pointer"
                    >
                      <option value="none">(None - Global Scope)</option>
                      {groupBoundaries.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.data.boundaryLabel || g.data.label} ({g.data.boundaryType})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Study Mastery Status */}
                <div
                  style={{
                    backgroundColor: 'var(--aws-card-bg)',
                    borderColor: 'var(--aws-border)',
                  }}
                  className="p-3.5 rounded-[8px] border space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-[var(--aws-text-primary)]">
                      Study Mastery Status
                    </span>
                    <CloudscapeStatusIndicator status={currentNode.data.status} />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
                    {(['not-started', 'in-progress', 'mastered', 'review'] as const).map((st) => {
                      const isActive = currentNode.data.status === st;
                      const labels = {
                        'not-started': 'Not started',
                        'in-progress': 'In progress',
                        mastered: 'Mastered',
                        review: 'Review needed',
                      };
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={async () => {
                            await updateServiceStatus(currentNode.data.serviceId, st);
                            updateNodeStatus(currentNode.data.serviceId, st);
                          }}
                          style={
                            isActive
                              ? {
                                  backgroundColor: 'var(--aws-interactive)',
                                  borderColor: 'var(--aws-interactive)',
                                  color: '#FFFFFF',
                                }
                              : {
                                  backgroundColor: 'var(--aws-page-bg)',
                                  borderColor: 'var(--aws-border)',
                                  color: 'var(--aws-text-primary)',
                                }
                          }
                          className="px-2 py-1.5 rounded-[4px] border text-[11px] font-medium transition-colors cursor-pointer text-center truncate"
                        >
                          {labels[st]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Canvas Connections */}
                <div
                  style={{
                    backgroundColor: 'var(--aws-card-bg)',
                    borderColor: 'var(--aws-border)',
                  }}
                  className="p-3.5 rounded-[8px] border space-y-2.5"
                >
                  <div className="text-[12px] font-bold text-[var(--aws-text-primary)]">
                    Active Canvas Connections
                  </div>

                  {/* Incoming */}
                  <div>
                    <div className="text-[11px] text-[var(--aws-text-muted)] flex items-center gap-1.5 mb-1 font-semibold">
                      <ArrowLeft className="w-3.5 h-3.5 text-[var(--aws-interactive)]" />
                      <span>Incoming ({incomingEdges.length})</span>
                    </div>
                    {incomingEdges.length === 0 ? (
                      <div className="text-[11px] text-[var(--aws-text-muted)] pl-4 italic">
                        No incoming connections
                      </div>
                    ) : (
                      <div className="space-y-1 pl-1">
                        {incomingEdges.map((e) => {
                          const src = nodes.find((n) => n.id === e.source);
                          return (
                            <div
                              key={e.id}
                              style={{
                                backgroundColor: 'var(--aws-page-bg)',
                                borderColor: 'var(--aws-border)',
                              }}
                              className="flex items-center justify-between p-1.5 rounded-[4px] border text-[11px] group"
                            >
                              <button
                                type="button"
                                onClick={() => openNodeInspector(e.source)}
                                className="text-left font-medium text-[var(--aws-text-primary)] hover:text-[var(--aws-interactive)] truncate cursor-pointer"
                              >
                                {src?.data.label || e.source}
                              </button>
                              <span className="font-mono text-[9px] text-[var(--aws-text-muted)]">
                                {e.protocol}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Outgoing */}
                  <div>
                    <div className="text-[11px] text-[var(--aws-text-muted)] flex items-center gap-1.5 mb-1 font-semibold">
                      <ArrowRight className="w-3.5 h-3.5 text-[#3F8624]" />
                      <span>Outgoing ({outgoingEdges.length})</span>
                    </div>
                    {outgoingEdges.length === 0 ? (
                      <div className="text-[11px] text-[var(--aws-text-muted)] pl-4 italic">
                        No outgoing connections
                      </div>
                    ) : (
                      <div className="space-y-1 pl-1">
                        {outgoingEdges.map((e) => {
                          const tgt = nodes.find((n) => n.id === e.target);
                          return (
                            <div
                              key={e.id}
                              style={{
                                backgroundColor: 'var(--aws-page-bg)',
                                borderColor: 'var(--aws-border)',
                              }}
                              className="flex items-center justify-between p-1.5 rounded-[4px] border text-[11px] group"
                            >
                              <button
                                type="button"
                                onClick={() => openNodeInspector(e.target)}
                                className="text-left font-medium text-[var(--aws-text-primary)] hover:text-[var(--aws-interactive)] truncate cursor-pointer"
                              >
                                {tgt?.data.label || e.target}
                              </button>
                              <span className="font-mono text-[9px] text-[var(--aws-text-muted)]">
                                {e.protocol}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* ARN Specification Pattern */}
                {service?.arnExample && (
                  <div
                    style={{
                      backgroundColor: 'var(--aws-card-bg)',
                      borderColor: 'var(--aws-border)',
                    }}
                    className="p-3 rounded-[8px] border space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[var(--aws-text-primary)]">
                        ARN Pattern
                      </span>
                      <CloudscapeCopyButton
                        textToCopy={service.arnExample}
                        label="Copy"
                        copiedLabel="Copied"
                      />
                    </div>
                    <div className="font-mono text-[10px] p-2 rounded-[4px] border border-[var(--aws-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-muted)] break-all select-all">
                      {service.arnExample}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => duplicateNode(currentNode.id)}
                    style={{
                      backgroundColor: 'var(--aws-card-bg)',
                      borderColor: 'var(--aws-border)',
                      color: 'var(--aws-text-primary)',
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-[4px] border text-[12px] font-medium hover:border-[var(--aws-interactive)] transition-colors cursor-pointer"
                  >
                    <CopyPlus className="w-3.5 h-3.5 text-[var(--aws-interactive)]" />
                    <span>Duplicate (Ctrl+D)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeNode(currentNode.id)}
                    style={{
                      backgroundColor: 'var(--aws-card-bg)',
                      borderColor: 'var(--aws-border)',
                      color: 'var(--aws-text-muted)',
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-[4px] border text-[12px] font-medium hover:text-[#DD344C] hover:border-[#DD344C] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete (Del)</span>
                  </button>
                </div>
              </>
            )}

            {/* ================= GROUP BOUNDARY CUSTOMIZER ================= */}
            {currentNode && currentNode.data.isBoundary && (
              <div className="space-y-4">
                <div
                  style={{
                    backgroundColor: 'var(--aws-card-bg)',
                    borderColor: 'var(--aws-border)',
                  }}
                  className="p-3.5 rounded-[8px] border space-y-3"
                >
                  <div className="text-[12px] font-bold text-[var(--aws-text-primary)]">
                    Boundary Configuration
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--aws-text-muted)] mb-1">
                      Boundary Type
                    </label>
                    <select
                      value={currentNode.data.boundaryType || 'aws-cloud'}
                      onChange={(e) =>
                        updateNodeProperties(currentNode.id, {
                          boundaryType: e.target.value as GroupBoundaryType,
                        })
                      }
                      className="w-full h-8 px-2 rounded-[4px] border border-[var(--aws-input-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-primary)] text-[12px] outline-none cursor-pointer"
                    >
                      {BOUNDARY_TYPES.map((b) => (
                        <option key={b.type} value={b.type}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--aws-text-muted)] mb-1">
                      Custom Label
                    </label>
                    <input
                      type="text"
                      value={currentNode.data.boundaryLabel || currentNode.data.label}
                      onChange={(e) => updateNodeProperties(currentNode.id, { boundaryLabel: e.target.value })}
                      placeholder="e.g. Production VPC"
                      className="w-full h-8 px-2.5 rounded-[4px] border border-[var(--aws-input-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-primary)] text-[12px] outline-none focus:border-[var(--aws-interactive)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--aws-text-muted)] mb-1">
                      CIDR Block / Region Tag
                    </label>
                    <input
                      type="text"
                      value={currentNode.data.cidr || ''}
                      onChange={(e) => updateNodeProperties(currentNode.id, { cidr: e.target.value })}
                      placeholder="e.g. 10.0.0.0/16 or us-east-1"
                      className="w-full h-8 px-2.5 rounded-[4px] border border-[var(--aws-input-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-primary)] text-[12px] font-mono outline-none focus:border-[var(--aws-interactive)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--aws-text-muted)] mb-1">
                      Border Style
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['solid', 'dashed', 'dotted'] as const).map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => updateNodeProperties(currentNode.id, { borderStyle: style })}
                          className={`h-7 px-2 text-[11px] capitalize rounded-[4px] border transition-colors cursor-pointer ${
                            (currentNode.data.borderStyle || 'solid') === style
                              ? 'border-[var(--aws-interactive)] bg-[var(--aws-interactive)]/15 text-[var(--aws-interactive)] font-semibold'
                              : 'border-[var(--aws-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-muted)]'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--aws-text-muted)] mb-1.5">
                      Accent Color Override
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => updateNodeProperties(currentNode.id, { accentColor: undefined })}
                        className={`text-[10px] px-2 py-1 rounded-[4px] border cursor-pointer ${
                          !currentNode.data.accentColor
                            ? 'border-[var(--aws-interactive)] bg-[var(--aws-interactive)]/15 text-[var(--aws-interactive)] font-semibold'
                            : 'border-[var(--aws-border)] text-[var(--aws-text-muted)]'
                        }`}
                      >
                        Default
                      </button>
                      {COLOR_PRESETS.map((p) => (
                        <button
                          key={p.color}
                          type="button"
                          onClick={() => updateNodeProperties(currentNode.id, { accentColor: p.color })}
                          style={{ backgroundColor: p.color }}
                          className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                            currentNode.data.accentColor === p.color
                              ? 'scale-125 border-white ring-2 ring-[var(--aws-brand)]'
                              : 'border-transparent hover:scale-110'
                          }`}
                          title={p.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeNode(currentNode.id)}
                  style={{
                    backgroundColor: 'var(--aws-card-bg)',
                    borderColor: 'var(--aws-border)',
                    color: 'var(--aws-text-muted)',
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-[4px] border text-[12px] font-medium hover:text-[#DD344C] hover:border-[#DD344C] transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete group boundary</span>
                </button>
              </div>
            )}

            {/* ================= EXTERNAL ACTOR CUSTOMIZER ================= */}
            {currentNode && currentNode.data.isActor && (
              <div className="space-y-4">
                <div
                  style={{
                    backgroundColor: 'var(--aws-card-bg)',
                    borderColor: 'var(--aws-border)',
                  }}
                  className="p-3.5 rounded-[8px] border space-y-3"
                >
                  <div className="text-[12px] font-bold text-[var(--aws-text-primary)]">
                    Actor Configuration
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--aws-text-muted)] mb-1">
                      Actor Type
                    </label>
                    <select
                      value={currentNode.data.actorType || 'user-browser'}
                      onChange={(e) =>
                        updateNodeProperties(currentNode.id, {
                          actorType: e.target.value as ExternalActorType,
                        })
                      }
                      className="w-full h-8 px-2 rounded-[4px] border border-[var(--aws-input-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-primary)] text-[12px] outline-none cursor-pointer"
                    >
                      {ACTOR_TYPES.map((a) => (
                        <option key={a.type} value={a.type}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--aws-text-muted)] mb-1">
                      Display Title
                    </label>
                    <input
                      type="text"
                      value={currentNode.data.customTitle || currentNode.data.label}
                      onChange={(e) => updateNodeProperties(currentNode.id, { customTitle: e.target.value })}
                      placeholder="e.g. Client Web Browser"
                      className="w-full h-8 px-2.5 rounded-[4px] border border-[var(--aws-input-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-primary)] text-[12px] outline-none focus:border-[var(--aws-interactive)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--aws-text-muted)] mb-1">
                      Role / Subtitle
                    </label>
                    <input
                      type="text"
                      value={currentNode.data.roleSubtitle || currentNode.data.customNotes || ''}
                      onChange={(e) => updateNodeProperties(currentNode.id, { roleSubtitle: e.target.value })}
                      placeholder="e.g. Next.js SPA / React"
                      className="w-full h-8 px-2.5 rounded-[4px] border border-[var(--aws-input-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-primary)] text-[12px] font-mono outline-none focus:border-[var(--aws-interactive)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => duplicateNode(currentNode.id)}
                    style={{
                      backgroundColor: 'var(--aws-card-bg)',
                      borderColor: 'var(--aws-border)',
                      color: 'var(--aws-text-primary)',
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-[4px] border text-[12px] font-medium hover:border-[var(--aws-interactive)] transition-colors cursor-pointer"
                  >
                    <CopyPlus className="w-3.5 h-3.5 text-[var(--aws-interactive)]" />
                    <span>Duplicate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeNode(currentNode.id)}
                    style={{
                      backgroundColor: 'var(--aws-card-bg)',
                      borderColor: 'var(--aws-border)',
                      color: 'var(--aws-text-muted)',
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-[4px] border text-[12px] font-medium hover:text-[#DD344C] hover:border-[#DD344C] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            )}

            {/* ================= ANNOTATION / NOTE CUSTOMIZER ================= */}
            {currentNode && currentNode.data.isAnnotation && (
              <div className="space-y-4">
                <div
                  style={{
                    backgroundColor: 'var(--aws-card-bg)',
                    borderColor: 'var(--aws-border)',
                  }}
                  className="p-3.5 rounded-[8px] border space-y-3"
                >
                  <div className="text-[12px] font-bold text-[var(--aws-text-primary)]">
                    Architecture Note Configuration
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--aws-text-muted)] mb-1">
                      Note Title
                    </label>
                    <input
                      type="text"
                      value={currentNode.data.annotationTitle || currentNode.data.label}
                      onChange={(e) => updateNodeProperties(currentNode.id, { annotationTitle: e.target.value })}
                      placeholder="e.g. Architecture Decision Record"
                      className="w-full h-8 px-2.5 rounded-[4px] border border-[var(--aws-input-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-primary)] text-[12px] outline-none focus:border-[var(--aws-interactive)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--aws-text-muted)] mb-1">
                      Note Content (Markdown supported)
                    </label>
                    <textarea
                      value={currentNode.data.annotationContent || ''}
                      onChange={(e) => updateNodeProperties(currentNode.id, { annotationContent: e.target.value })}
                      rows={4}
                      placeholder="Write notes, architecture decisions, SLA rules, or gotchas..."
                      className="w-full p-2.5 rounded-[4px] border border-[var(--aws-input-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-primary)] text-[12px] outline-none focus:border-[var(--aws-interactive)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--aws-text-muted)] mb-1">
                      Color Theme
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { id: 'amber', label: 'Amber' },
                        { id: 'blue', label: 'Blue' },
                        { id: 'purple', label: 'Purple' },
                        { id: 'green', label: 'Green' },
                        { id: 'slate', label: 'Slate' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => updateNodeProperties(currentNode.id, { annotationColor: t.id })}
                          className={`h-7 px-1 text-[11px] rounded-[4px] border cursor-pointer capitalize ${
                            (currentNode.data.annotationColor || 'amber') === t.id
                              ? 'border-[var(--aws-interactive)] bg-[var(--aws-interactive)]/15 text-[var(--aws-interactive)] font-semibold'
                              : 'border-[var(--aws-border)] text-[var(--aws-text-muted)]'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeNode(currentNode.id)}
                  style={{
                    backgroundColor: 'var(--aws-card-bg)',
                    borderColor: 'var(--aws-border)',
                    color: 'var(--aws-text-muted)',
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-[4px] border text-[12px] font-medium hover:text-[#DD344C] hover:border-[#DD344C] transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete note</span>
                </button>
              </div>
            )}

            {/* ================= CONNECTION / EDGE CUSTOMIZER ================= */}
            {currentEdge && (
              <div className="space-y-4">
                <div
                  style={{
                    backgroundColor: 'var(--aws-card-bg)',
                    borderColor: 'var(--aws-border)',
                  }}
                  className="p-3.5 rounded-[8px] border space-y-3"
                >
                  <div className="text-[12px] font-bold text-[var(--aws-text-primary)]">
                    Connection Flow &amp; Protocol
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--aws-text-muted)] mb-1">
                      Protocol Preset
                    </label>
                    <select
                      value={currentEdge.protocol || 'HTTPS/REST'}
                      onChange={(e) => updateEdgeProperties(currentEdge.id, { protocol: e.target.value as EdgeProtocol })}
                      className="w-full h-8 px-2 rounded-[4px] border border-[var(--aws-input-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-primary)] text-[12px] outline-none cursor-pointer"
                    >
                      {PROTOCOLS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--aws-text-muted)] mb-1">
                      Custom Label (Override)
                    </label>
                    <input
                      type="text"
                      value={currentEdge.data?.customLabel || ''}
                      onChange={(e) => updateEdgeProperties(currentEdge.id, { customLabel: e.target.value })}
                      placeholder="e.g. gRPC / JWT Bearer"
                      className="w-full h-8 px-2.5 rounded-[4px] border border-[var(--aws-input-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-primary)] text-[12px] outline-none focus:border-[var(--aws-interactive)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--aws-text-muted)] mb-1">
                      Line Style
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['solid', 'dashed', 'dotted'] as const).map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => updateEdgeProperties(currentEdge.id, { lineStyle: style as EdgeLineStyle })}
                          className={`h-7 px-2 text-[11px] capitalize rounded-[4px] border transition-colors cursor-pointer ${
                            (currentEdge.data?.lineStyle || 'solid') === style
                              ? 'border-[var(--aws-interactive)] bg-[var(--aws-interactive)]/15 text-[var(--aws-interactive)] font-semibold'
                              : 'border-[var(--aws-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-muted)]'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--aws-text-muted)] mb-1">
                      Directionality
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'one-way', label: 'One-Way ➔' },
                        { id: 'bi-directional', label: 'Bi-Dir ⇄' },
                        { id: 'none', label: 'None ──' },
                      ].map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => updateEdgeProperties(currentEdge.id, { directionality: d.id as EdgeDirectionality })}
                          className={`h-7 px-2 text-[11px] rounded-[4px] border transition-colors cursor-pointer ${
                            (currentEdge.data?.directionality || 'one-way') === d.id
                              ? 'border-[var(--aws-interactive)] bg-[var(--aws-interactive)]/15 text-[var(--aws-interactive)] font-semibold'
                              : 'border-[var(--aws-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-muted)]'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--aws-text-muted)] mb-1.5">
                      Edge Color
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => updateEdgeProperties(currentEdge.id, { edgeColor: undefined })}
                        className={`text-[10px] px-2 py-1 rounded-[4px] border cursor-pointer ${
                          !currentEdge.data?.edgeColor
                            ? 'border-[var(--aws-interactive)] bg-[var(--aws-interactive)]/15 text-[var(--aws-interactive)] font-semibold'
                            : 'border-[var(--aws-border)] text-[var(--aws-text-muted)]'
                        }`}
                      >
                        Default
                      </button>
                      {COLOR_PRESETS.map((p) => (
                        <button
                          key={p.color}
                          type="button"
                          onClick={() => updateEdgeProperties(currentEdge.id, { edgeColor: p.color })}
                          style={{ backgroundColor: p.color }}
                          className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                            currentEdge.data?.edgeColor === p.color
                              ? 'scale-125 border-white ring-2 ring-[var(--aws-brand)]'
                              : 'border-transparent hover:scale-110'
                          }`}
                          title={p.label}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={currentEdge.data?.animated ?? currentEdge.animated ?? false}
                        onChange={(e) => updateEdgeProperties(currentEdge.id, { animated: e.target.checked })}
                        className="rounded border-[var(--aws-border)] text-[var(--aws-interactive)] focus:ring-0"
                      />
                      <Activity className="w-3.5 h-3.5 text-[#1D8102]" />
                      <span className="text-[12px] font-medium text-[var(--aws-text-primary)]">
                        Active Traffic Animation (Dashed pulse)
                      </span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => reverseEdgeDirection(currentEdge.id)}
                    style={{
                      backgroundColor: 'var(--aws-card-bg)',
                      borderColor: 'var(--aws-border)',
                      color: 'var(--aws-text-primary)',
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-[4px] border text-[12px] font-medium hover:border-[var(--aws-interactive)] transition-colors cursor-pointer"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-[var(--aws-interactive)]" />
                    <span>Reverse direction</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeEdge(currentEdge.id)}
                    style={{
                      backgroundColor: 'var(--aws-card-bg)',
                      borderColor: 'var(--aws-border)',
                      color: 'var(--aws-text-muted)',
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-[4px] border text-[12px] font-medium hover:text-[#DD344C] hover:border-[#DD344C] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ================= 6-PART DOSSIER / REFERENCE TAB ================= */
          <div className="vault-prose space-y-4">
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
                    <span>Open in Concept Vault dossier</span>
                  </button>

                  {(() => {
                    const docsUrl = getVerifiedAWSDocsUrl(service?.id, service?.docsUrl);
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
                        className="group w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[6px] border text-[12px] font-medium hover:border-[#FF9900] hover:text-[#FF9900] transition-colors cursor-pointer shadow-2xs select-none"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#FF9900]" />
                        <span>Official AWS reference documentation</span>
                      </a>
                    );
                  })()}
                </div>
              </>
            ) : (
              <div className="text-[var(--aws-text-muted)] text-center py-8 space-y-2">
                <Sparkles className="w-6 h-6 mx-auto opacity-50" />
                <p className="text-[13px] font-medium text-[var(--aws-text-primary)]">
                  Architecture Element Reference
                </p>
                <p className="text-[12px] max-w-xs mx-auto">
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
