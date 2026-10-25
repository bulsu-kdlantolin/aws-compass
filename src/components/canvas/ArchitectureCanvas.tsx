import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  Plus,
  Trash2,
  Maximize2,
  ChevronDown,
  BoxSelect,
  Download,
  Copy,
  Check,
  Grid,
  ZoomIn,
  ZoomOut,
  Save,
  FolderOpen,
} from 'lucide-react';
import { useCompassStore } from '../../store/useCompassStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { AWSServiceNode } from './AWSServiceNode';
import { AWSGroupNode } from './AWSGroupNode';
import { ProtocolEdge } from './ProtocolEdge';
import { NodeInspectorDrawer } from './NodeInspectorDrawer';
import { getAWSCategoryColor } from '../../utils/awsCategoryColors';
import { CloudscapeSelect, type CloudscapeSelectOption } from '../ui/CloudscapeSelect';
import type { AWSService, GroupBoundaryType } from '../../types/aws';

// Hoist static node & edge registrations
const nodeTypes: NodeTypes = {
  awsService: AWSServiceNode,
  awsGroup: AWSGroupNode,
  architectureGroup: AWSGroupNode,
};

const edgeTypes: EdgeTypes = {
  default: ProtocolEdge,
};

const defaultEdgeOptions = {
  type: 'default',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 14,
    height: 14,
    color: '#8C4FFF',
  },
};

const TEMPLATE_OPTIONS: CloudscapeSelectOption[] = [
  { value: 'serverless-api', label: 'Serverless microservice', description: 'Route 53 -> CloudFront -> S3 + API Gateway -> Lambda -> DynamoDB' },
  { value: 'three-tier-web', label: '3-Tier VPC web app', description: 'IGW -> ALB -> EC2 Auto Scaling -> RDS Multi-AZ' },
  { value: 'event-pipeline', label: 'Event-driven pipeline', description: 'S3 Event -> SNS -> SQS -> Lambda Worker' },
  { value: 'container-fargate', label: 'Containerized Fargate service', description: 'ALB -> ECS Fargate -> Amazon ECR + CloudWatch' },
];

const ArchitectureCanvasInner: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();

  const services = useCompassStore((s) => s.services);
  const theme = useCompassStore((s) => s.theme);

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const onConnect = useCanvasStore((s) => s.onConnect);
  const addServiceNode = useCanvasStore((s) => s.addServiceNode);
  const clearCanvas = useCanvasStore((s) => s.clearCanvas);
  const loadTemplate = useCanvasStore((s) => s.loadTemplate);
  const openInspector = useCanvasStore((s) => s.openInspector);
  const closeInspector = useCanvasStore((s) => s.closeInspector);
  const setNodes = useCanvasStore((s) => s.setNodes);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const removeNode = useCanvasStore((s) => s.removeNode);
  const saveSnapshot = useCanvasStore((s) => s.saveSnapshot);
  const loadSnapshot = useCanvasStore((s) => s.loadSnapshot);
  const deleteSnapshot = useCanvasStore((s) => s.deleteSnapshot);
  const savedDiagrams = useCanvasStore((s) => s.savedDiagrams);
  const activeDiagramName = useCanvasStore((s) => s.activeDiagramName);
  const initializeCanvas = useCanvasStore((s) => s.initializeCanvas);

  const [activeTemplateId, setActiveTemplateId] = useState<string>('three-tier-web');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showBoundaryMenu, setShowBoundaryMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSnapshotMenu, setShowSnapshotMenu] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [copiedSpec, setCopiedSpec] = useState(false);
  const [snapshotNameInput, setSnapshotNameInput] = useState('');
  const [snapshotSaveSuccess, setSnapshotSaveSuccess] = useState(false);
  const [gridVariant, setGridVariant] = useState<BackgroundVariant>(BackgroundVariant.Dots);

  useEffect(() => {
    initializeCanvas();
  }, [initializeCanvas]);

  // Keyboard shortcut listener: Delete/Backspace to delete selected node
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedNodeId &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        removeNode(selectedNodeId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, removeNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const serviceId = event.dataTransfer.getData('application/aws-service-id');
      if (!serviceId) return;

      const service = services.find((s) => s.id === serviceId);
      if (!service) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addServiceNode(service, position);
    },
    [reactFlowInstance, services, addServiceNode]
  );

  const handleSelectTemplate = (templateId: string) => {
    setActiveTemplateId(templateId);
    loadTemplate(templateId);
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.15, duration: 400 });
    }, 50);
  };

  const handleQuickAddService = useCallback(
    (svc: AWSService) => {
      const offset = (nodes.length % 5) * 35;
      const center = reactFlowInstance.screenToFlowPosition({
        x: window.innerWidth / 2 + offset,
        y: window.innerHeight / 2 + offset,
      });

      addServiceNode(svc, center);
      setShowAddMenu(false);
      setServiceSearch('');
    },
    [nodes.length, reactFlowInstance, addServiceNode]
  );

  const handleAddBoundary = useCallback(
    (boundaryType: GroupBoundaryType, label: string) => {
      const center = reactFlowInstance.screenToFlowPosition({
        x: window.innerWidth / 2 - 200,
        y: window.innerHeight / 2 - 150,
      });

      const newBoundary = {
        id: `boundary-${boundaryType}-${Date.now()}`,
        type: 'awsGroup',
        position: center,
        zIndex: -1,
        data: {
          serviceId: `bound-${boundaryType}`,
          label,
          category: 'Networking' as const,
          tier: 1 as const,
          status: 'not-started' as const,
          isBoundary: true,
          boundaryType,
          boundaryLabel: label,
          width: boundaryType === 'aws-cloud' ? 1000 : 540,
          height: boundaryType === 'aws-cloud' ? 520 : 320,
        },
      };

      setNodes([newBoundary, ...nodes]);
      setShowBoundaryMenu(false);
    },
    [nodes, reactFlowInstance, setNodes]
  );

  const handleSaveSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSnapshot(snapshotNameInput.trim() || undefined);
    setSnapshotNameInput('');
    setSnapshotSaveSuccess(true);
    setTimeout(() => setSnapshotSaveSuccess(false), 2000);
  };

  const handleExportJson = useCallback(() => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          {
            version: '1.0',
            diagramName: activeDiagramName,
            nodes,
            edges,
            exportedAt: new Date().toISOString(),
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `aws-architecture-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setShowExportMenu(false);
  }, [nodes, edges, activeDiagramName]);

  const handleCopySpec = useCallback(async () => {
    const serviceNodes = nodes.filter((n) => !n.data.isBoundary);
    const boundaryNodes = nodes.filter((n) => n.data.isBoundary);

    const markdownSpec = [
      `# Architecture Blueprint: ${activeDiagramName}`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      `## Summary`,
      `- **Services Count**: ${serviceNodes.length}`,
      `- **Boundaries Count**: ${boundaryNodes.length}`,
      `- **Connections Count**: ${edges.length}`,
      '',
      `## Service Instances`,
      ...serviceNodes.map((n) => `- **${n.data.label}** (\`${n.data.serviceId}\`): ${n.data.category} (Tier ${n.data.tier})`),
      '',
      `## Data & Control Flows`,
      ...edges.map((e) => {
        const src = nodes.find((n) => n.id === e.source)?.data.label || e.source;
        const tgt = nodes.find((n) => n.id === e.target)?.data.label || e.target;
        return `- ${src} --[${e.protocol || 'HTTPS/REST'}]--> ${tgt}`;
      }),
    ].join('\n');

    await navigator.clipboard.writeText(markdownSpec);
    setCopiedSpec(true);
    setTimeout(() => setCopiedSpec(false), 2000);
    setShowExportMenu(false);
  }, [nodes, edges, activeDiagramName]);

  const filteredQuickAddServices = useMemo(() => {
    if (!serviceSearch.trim()) return services.slice(0, 16);
    const q = serviceSearch.toLowerCase().trim();
    return services.filter(
      (s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    );
  }, [services, serviceSearch]);

  const miniMapNodeColor = useCallback(
    (node: { data?: unknown }) => {
      const data = node.data as { category?: string; isBoundary?: boolean };
      if (data?.isBoundary) {
        return theme === 'dark' ? '#354150' : '#D5DBDB';
      }
      return getAWSCategoryColor(data?.category || '', theme);
    },
    [theme]
  );

  return (
    <div
      ref={reactFlowWrapper}
      style={{ backgroundColor: 'var(--aws-canvas-bg)' }}
      className="flex w-full h-full relative overflow-hidden select-none"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Main Canvas Viewport Area */}
      <div className="flex-1 h-full relative flex flex-col min-w-0">
        {/* Cloudscape Enterprise Toolbar */}
        <div
          style={{
            backgroundColor: 'var(--aws-card-bg)',
            borderBottomColor: 'var(--aws-border)',
          }}
          className="h-12 border-b px-4 flex items-center justify-between gap-3 shrink-0 z-10"
        >
          {/* Left: Template Selector */}
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-bold text-[var(--aws-text-muted)] hidden sm:inline">
              Blueprint:
            </span>
            <CloudscapeSelect
              value={activeTemplateId}
              options={TEMPLATE_OPTIONS}
              onChange={handleSelectTemplate}
              className="w-56 sm:w-64"
            />
          </div>

          {/* Right: Actions and Controls */}
          <div className="flex items-center gap-2">
            {/* Quick Add Service Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowAddMenu(!showAddMenu);
                  setShowBoundaryMenu(false);
                  setShowExportMenu(false);
                  setShowSnapshotMenu(false);
                }}
                style={{
                  backgroundColor: '#FF9900',
                  color: '#0F141A',
                }}
                className="h-8 px-3 rounded-[4px] font-bold text-[13px] flex items-center gap-1.5 hover:bg-[#EC7211] transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add service</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showAddMenu && (
                <div
                  style={{
                    backgroundColor: 'var(--aws-drawer-bg)',
                    borderColor: 'var(--aws-border)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                  }}
                  className="absolute top-9 left-0 w-64 rounded-[4px] border p-2 z-50 space-y-2 animate-in fade-in duration-100"
                >
                  <input
                    type="text"
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    placeholder="Filter services..."
                    autoFocus
                    style={{
                      backgroundColor: 'var(--aws-page-bg)',
                      borderColor: 'var(--aws-input-border)',
                      color: 'var(--aws-text-primary)',
                    }}
                    className="w-full h-7 px-2 rounded-[4px] border text-[12px] outline-none"
                  />
                  <div className="max-h-56 overflow-y-auto space-y-0.5">
                    {filteredQuickAddServices.map((svc) => (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => handleQuickAddService(svc)}
                        className="w-full text-left px-2 py-1.5 rounded-[4px] text-[12px] text-[var(--aws-text-primary)] hover:bg-[var(--aws-card-bg)] transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span className="truncate">{svc.name}</span>
                        <span className="font-mono text-[10px] text-[var(--aws-text-muted)] ml-1">
                          {svc.id}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Add Group Boundary Container Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowBoundaryMenu(!showBoundaryMenu);
                  setShowAddMenu(false);
                  setShowExportMenu(false);
                  setShowSnapshotMenu(false);
                }}
                style={{
                  backgroundColor: 'var(--aws-card-bg)',
                  borderColor: 'var(--aws-input-border)',
                  color: 'var(--aws-text-primary)',
                }}
                className="h-8 px-3 rounded-[4px] border text-[13px] font-medium flex items-center gap-1.5 hover:border-[var(--aws-interactive)] transition-colors cursor-pointer"
              >
                <BoxSelect className="w-4 h-4 text-[#8C4FFF]" />
                <span className="hidden sm:inline">Boundary</span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--aws-text-muted)]" />
              </button>

              {showBoundaryMenu && (
                <div
                  style={{
                    backgroundColor: 'var(--aws-drawer-bg)',
                    borderColor: 'var(--aws-border)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                  }}
                  className="absolute top-9 left-0 w-60 rounded-[4px] border p-1.5 z-50 space-y-1 animate-in fade-in duration-100"
                >
                  <div className="px-2 py-1 text-[11px] font-bold text-[var(--aws-text-muted)] border-b border-[var(--aws-border)] mb-1">
                    Add group boundary
                  </div>
                  {[
                    { id: 'aws-cloud', label: 'AWS Cloud', desc: 'Outer perimeter' },
                    { id: 'region', label: 'Region', desc: 'Regional boundary' },
                    { id: 'vpc', label: 'VPC', desc: '10.0.0.0/16' },
                    { id: 'public-subnet', label: 'Public subnet', desc: 'Ingress tier' },
                    { id: 'private-subnet', label: 'Private subnet', desc: 'Application tier' },
                    { id: 'security-group', label: 'Security group', desc: 'Firewall rules' },
                    { id: 'auto-scaling-group', label: 'Auto scaling group', desc: 'Scale cluster' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleAddBoundary(b.id as GroupBoundaryType, b.label)}
                      className="w-full text-left px-2 py-1.5 rounded-[4px] text-[12px] text-[var(--aws-text-primary)] hover:bg-[var(--aws-card-bg)] flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-medium">{b.label}</span>
                      <span className="text-[10px] text-[var(--aws-text-muted)]">{b.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Snapshots Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowSnapshotMenu(!showSnapshotMenu);
                  setShowAddMenu(false);
                  setShowBoundaryMenu(false);
                  setShowExportMenu(false);
                }}
                style={{
                  backgroundColor: 'var(--aws-card-bg)',
                  borderColor: 'var(--aws-input-border)',
                  color: 'var(--aws-text-primary)',
                }}
                className="h-8 px-3 rounded-[4px] border text-[13px] font-medium flex items-center gap-1.5 hover:border-[var(--aws-interactive)] transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4 text-[#1D8102]" />
                <span className="hidden md:inline">Snapshots</span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--aws-text-muted)]" />
              </button>

              {showSnapshotMenu && (
                <div
                  style={{
                    backgroundColor: 'var(--aws-drawer-bg)',
                    borderColor: 'var(--aws-border)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                  }}
                  className="absolute top-9 right-0 w-72 rounded-[4px] border p-3 z-50 space-y-3 animate-in fade-in duration-100"
                >
                  <div className="flex items-center justify-between border-b border-[var(--aws-border)] pb-2">
                    <span className="text-[12px] font-bold text-[var(--aws-text-primary)]">
                      Diagram snapshots
                    </span>
                    {snapshotSaveSuccess && (
                      <span className="text-[11px] text-[#1D8102] flex items-center gap-1 font-semibold">
                        <Check className="w-3.5 h-3.5" /> Saved
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleSaveSnapshot} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={snapshotNameInput}
                      onChange={(e) => setSnapshotNameInput(e.target.value)}
                      placeholder="Snapshot title..."
                      style={{
                        backgroundColor: 'var(--aws-page-bg)',
                        borderColor: 'var(--aws-input-border)',
                        color: 'var(--aws-text-primary)',
                      }}
                      className="flex-1 h-7 px-2 rounded-[4px] border text-[12px] outline-none"
                    />
                    <button
                      type="submit"
                      style={{
                        backgroundColor: 'var(--aws-interactive)',
                        color: '#FFFFFF',
                      }}
                      className="h-7 px-2.5 rounded-[4px] text-[12px] font-medium cursor-pointer"
                    >
                      Save
                    </button>
                  </form>

                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-[var(--aws-text-muted)]">
                      Saved ({savedDiagrams.length})
                    </div>
                    {savedDiagrams.length === 0 ? (
                      <div className="text-[11px] text-[var(--aws-text-muted)] italic py-1">
                        No custom snapshots yet.
                      </div>
                    ) : (
                      <div className="max-h-44 overflow-y-auto space-y-1">
                        {savedDiagrams.map((diag) => (
                          <div
                            key={diag.id}
                            style={{
                              backgroundColor: 'var(--aws-page-bg)',
                              borderColor: 'var(--aws-border)',
                            }}
                            className="flex items-center justify-between p-1.5 rounded-[4px] border text-[12px] group"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                loadSnapshot(diag.id);
                                setShowSnapshotMenu(false);
                              }}
                              className="text-left text-[var(--aws-text-primary)] hover:text-[var(--aws-interactive)] flex items-center gap-1.5 cursor-pointer truncate"
                            >
                              <FolderOpen className="w-3.5 h-3.5 text-[#1D8102] shrink-0" />
                              <span className="truncate">{diag.name}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSnapshot(diag.id)}
                              className="text-[var(--aws-text-muted)] hover:text-[#DD344C] opacity-0 group-hover:opacity-100 cursor-pointer"
                              title="Delete snapshot"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Canvas Zoom & View Controls */}
            <div className="flex items-center border border-[var(--aws-input-border)] rounded-[4px] overflow-hidden h-8">
              <button
                type="button"
                onClick={() => reactFlowInstance.zoomIn({ duration: 250 })}
                className="px-2 h-full text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] transition-colors cursor-pointer"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => reactFlowInstance.zoomOut({ duration: 250 })}
                className="px-2 h-full text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] border-l border-[var(--aws-border)] transition-colors cursor-pointer"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => reactFlowInstance.fitView({ padding: 0.15, duration: 350 })}
                className="px-2.5 h-full text-[12px] text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] border-l border-[var(--aws-border)] transition-colors cursor-pointer flex items-center gap-1"
                title="Fit diagram to canvas"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Fit</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setGridVariant((curr) =>
                    curr === BackgroundVariant.Dots
                      ? BackgroundVariant.Lines
                      : BackgroundVariant.Dots
                  )
                }
                className="px-2.5 h-full text-[12px] text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] border-l border-[var(--aws-border)] transition-colors cursor-pointer flex items-center gap-1"
                title="Toggle grid style"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{gridVariant === BackgroundVariant.Dots ? 'Dots' : 'Grid'}</span>
              </button>
            </div>

            {/* Export Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowExportMenu(!showExportMenu);
                  setShowAddMenu(false);
                  setShowBoundaryMenu(false);
                  setShowSnapshotMenu(false);
                }}
                style={{
                  backgroundColor: 'var(--aws-card-bg)',
                  borderColor: 'var(--aws-input-border)',
                  color: 'var(--aws-text-primary)',
                }}
                className="h-8 px-2.5 rounded-[4px] border text-[13px] font-medium flex items-center gap-1.5 hover:border-[var(--aws-interactive)] transition-colors cursor-pointer"
                title="Export diagram"
              >
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">Export</span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--aws-text-muted)]" />
              </button>

              {showExportMenu && (
                <div
                  style={{
                    backgroundColor: 'var(--aws-drawer-bg)',
                    borderColor: 'var(--aws-border)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                  }}
                  className="absolute top-9 right-0 w-52 rounded-[4px] border p-1 z-50 space-y-0.5 animate-in fade-in duration-100"
                >
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="w-full text-left px-2.5 py-1.5 rounded-[4px] text-[12px] text-[var(--aws-text-primary)] hover:bg-[var(--aws-card-bg)] flex items-center justify-between cursor-pointer"
                  >
                    <span>Export JSON spec</span>
                    <Download className="w-3.5 h-3.5 text-[var(--aws-text-muted)]" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCopySpec}
                    className="w-full text-left px-2.5 py-1.5 rounded-[4px] text-[12px] text-[var(--aws-text-primary)] hover:bg-[var(--aws-card-bg)] flex items-center justify-between cursor-pointer"
                  >
                    <span>{copiedSpec ? 'Copied markdown' : 'Copy markdown spec'}</span>
                    {copiedSpec ? <Check className="w-3.5 h-3.5 text-[#1D8102]" /> : <Copy className="w-3.5 h-3.5 text-[var(--aws-text-muted)]" />}
                  </button>
                </div>
              )}
            </div>

            {/* Clear Canvas */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Clear all nodes and edges from canvas?')) {
                  clearCanvas();
                }
              }}
              style={{
                backgroundColor: 'var(--aws-card-bg)',
                borderColor: 'var(--aws-input-border)',
                color: 'var(--aws-text-muted)',
              }}
              className="h-8 px-2 rounded-[4px] border hover:text-[#DD344C] hover:border-[#DD344C] transition-colors cursor-pointer"
              title="Clear canvas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* React Flow Core Canvas Viewport */}
        <div className="flex-1 h-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            onNodeClick={(_, node) => {
              if (!node.data?.isBoundary) {
                openInspector(node.id);
              }
            }}
            onPaneClick={() => closeInspector()}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            minZoom={0.15}
            maxZoom={2.5}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={gridVariant}
              gap={24}
              size={gridVariant === BackgroundVariant.Dots ? 1.2 : 1}
              color={theme === 'dark' ? '#354150' : '#D5DBDB'}
            />
            <Controls
              style={{
                backgroundColor: 'var(--aws-card-bg)',
                borderColor: 'var(--aws-border)',
              }}
              className="!border !rounded-[4px] !shadow-md !overflow-hidden"
              showInteractive={false}
            />
            <MiniMap
              style={{
                backgroundColor: 'var(--aws-card-bg)',
                borderColor: 'var(--aws-border)',
              }}
              className="!border !rounded-[4px] !shadow-md !overflow-hidden"
              nodeColor={miniMapNodeColor}
              maskColor={theme === 'dark' ? 'rgba(15, 27, 42, 0.75)' : 'rgba(242, 243, 243, 0.75)'}
              zoomable
              pannable
            />
          </ReactFlow>
        </div>
      </div>

      {/* Docked Resizable Split Panel (resizes viewport alongside canvas without backdrop) */}
      <NodeInspectorDrawer />
    </div>
  );
};

export const ArchitectureCanvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <ArchitectureCanvasInner />
    </ReactFlowProvider>
  );
};

export default ArchitectureCanvas;
