import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
  MarkerType,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  Plus,
  Trash2,
  Maximize2,
  ChevronDown,
  BoxSelect,
  Download,
  Check,
  Grid,
  ZoomIn,
  ZoomOut,
  Save,
  FolderOpen,
  LayoutGrid,
  ArrowRightLeft,
} from 'lucide-react';
import { useCompassStore } from '../../store/useCompassStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { usePopoverStore } from '../../store/usePopoverStore';
import { AnimatedPopover } from '../ui/AnimatedPopover';
import { AWSServiceNode } from './AWSServiceNode';
import { AWSGroupNode } from './AWSGroupNode';
import { ProtocolEdge } from './ProtocolEdge';
import { NodeInspectorDrawer } from './NodeInspectorDrawer';
import { getAWSCategoryColor } from '../../utils/awsCategoryColors';
import { CloudscapeSelect, type CloudscapeSelectOption } from '../ui/CloudscapeSelect';
import { CloudscapeSearchInput } from '../ui/CloudscapeSearchInput';
import { CloudscapeCopyButton } from '../ui/CloudscapeCopyButton';
import { AnimatedIcon } from '../ui/AnimatedIcon';
import { Blocks, Pulse, Arc } from '../ui/LoadingIndicators';
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
  { value: 'serverless-microservice', label: 'Serverless microservice', description: 'Route 53 -> CloudFront -> S3 + API Gateway -> Lambda -> DynamoDB' },
  { value: '3-tier-vpc', label: '3-Tier VPC web app', description: 'IGW -> ALB -> EC2 Auto Scaling -> RDS Multi-AZ' },
  { value: 'event-driven-pipeline', label: 'Event-driven pipeline', description: 'S3 Event -> SNS -> SQS -> Lambda Worker' },
  { value: 'containerized-fargate', label: 'Containerized Fargate service', description: 'ALB -> ECS Fargate -> Amazon ECR + CloudWatch' },
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
  const activeDiagramId = useCanvasStore((s) => s.activeDiagramId);
  const activeDiagramName = useCanvasStore((s) => s.activeDiagramName);
  const saveStatus = useCanvasStore((s) => s.saveStatus);
  const initializeCanvas = useCanvasStore((s) => s.initializeCanvas);
  const autoLayout = useCanvasStore((s) => s.autoLayout);
  const isSidebarOpen = useCompassStore((s) => s.isSidebarOpen);
  const activePopoverId = usePopoverStore((s) => s.activePopoverId);
  const closePopover = usePopoverStore((s) => s.closePopover);
  const togglePopover = usePopoverStore((s) => s.togglePopover);

  const isAddOpen = activePopoverId === 'canvas-add-service';
  const isBoundaryOpen = activePopoverId === 'canvas-boundary';
  const isSnapshotOpen = activePopoverId === 'canvas-snapshots';
  const isExportOpen = activePopoverId === 'canvas-export';

  const addTriggerRef = useRef<HTMLButtonElement>(null);
  const boundaryTriggerRef = useRef<HTMLButtonElement>(null);
  const snapshotTriggerRef = useRef<HTMLButtonElement>(null);
  const exportTriggerRef = useRef<HTMLButtonElement>(null);

  const [activeTemplateId, setActiveTemplateId] = useState<string>('serverless-microservice');
  const [layoutDirection, setLayoutDirection] = useState<'LR' | 'TB'>('LR');
  const [serviceSearch, setServiceSearch] = useState('');
  const [snapshotNameInput, setSnapshotNameInput] = useState('');
  const [snapshotSaveSuccess, setSnapshotSaveSuccess] = useState(false);
  const [gridVariant, setGridVariant] = useState<BackgroundVariant>(BackgroundVariant.Dots);

  // loading-dev action and layout indicator states
  const [isArranging, setIsArranging] = useState(false);
  const [isAddingService, setIsAddingService] = useState(false);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    initializeCanvas();
  }, [initializeCanvas]);

  useEffect(() => {
    if (activeDiagramId && TEMPLATE_OPTIONS.some((o) => o.value === activeDiagramId)) {
      setActiveTemplateId(activeDiagramId);
    }
  }, [activeDiagramId]);

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
    setIsArranging(true);
    loadTemplate(templateId);
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.15, duration: 400 });
      setIsArranging(false);
    }, 220);
  };

  const handleTriggerAutoLayout = (direction: 'LR' | 'TB') => {
    setIsArranging(true);
    autoLayout(direction);
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.18, duration: 250 });
      setIsArranging(false);
    }, 220);
  };

  const handleQuickAddService = useCallback(
    (svc: AWSService) => {
      setIsAddingService(true);
      const offset = (nodes.length % 5) * 35;
      const center = reactFlowInstance.screenToFlowPosition({
        x: window.innerWidth / 2 + offset,
        y: window.innerHeight / 2 + offset,
      });

      addServiceNode(svc, center);
      closePopover('canvas-add-service');
      setServiceSearch('');
      setTimeout(() => setIsAddingService(false), 300);
    },
    [nodes.length, reactFlowInstance, addServiceNode, closePopover]
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
      closePopover('canvas-boundary');
    },
    [nodes, reactFlowInstance, setNodes, closePopover]
  );

  const handleSaveSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSnapshot(true);
    try {
      await saveSnapshot(snapshotNameInput.trim() || undefined);
      setSnapshotNameInput('');
      setSnapshotSaveSuccess(true);
      setTimeout(() => setSnapshotSaveSuccess(false), 2000);
    } finally {
      setTimeout(() => setIsSavingSnapshot(false), 300);
    }
  };

  const handleExportJson = useCallback(() => {
    setIsExporting(true);
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
    setTimeout(() => {
      setIsExporting(false);
      closePopover('canvas-export');
    }, 350);
  }, [nodes, edges, activeDiagramName, closePopover]);

  const markdownSpec = useMemo(() => {
    const serviceNodes = nodes.filter((n) => !n.data.isBoundary);
    const boundaryNodes = nodes.filter((n) => n.data.isBoundary);

    return [
      `# Architecture Blueprint: ${activeDiagramName}`,
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
          className={`h-12 border-b ${!isSidebarOpen ? 'pl-24 pr-4' : 'px-4'} flex items-center justify-between gap-3 shrink-0 z-10`}
        >
          {/* Left: Template Selector & Non-blocking Auto-Save Status */}
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

            {/* Canvas Auto-Save Persistence Feedback */}
            <div
              className="hidden md:flex items-center text-[11px] font-mono px-2 py-0.5 rounded min-w-[130px] select-none"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <span className="sr-only">
                {saveStatus === 'saving'
                  ? 'Saving changes…'
                  : saveStatus === 'saved'
                  ? 'Saved'
                  : 'All changes saved'}
              </span>
              <div
                className={`inline-flex items-center gap-1.5 transition-opacity duration-200 ${
                  saveStatus === 'idle' ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <AnimatedIcon
                  activeKey={saveStatus === 'saving' ? 'saving' : 'saved'}
                  size={14}
                  className="w-3.5 h-3.5"
                >
                  <Pulse key="saving" size={14} color="#0972D3" />
                  <Check key="saved" className="w-3.5 h-3.5 text-[#1D8102]" strokeWidth={2.5} />
                </AnimatedIcon>
                <span
                  className={
                    saveStatus === 'saved'
                      ? 'text-[#1D8102] font-semibold'
                      : 'text-[var(--aws-text-muted)]'
                  }
                >
                  {saveStatus === 'saving' ? 'Saving changes…' : 'Saved'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions and Controls */}
          <div className="flex items-center gap-2">
            {/* Quick Add Service Dropdown */}
            <div className="relative">
              <button
                ref={addTriggerRef}
                type="button"
                onClick={() => togglePopover('canvas-add-service')}
                aria-disabled={isAddingService ? 'true' : undefined}
                style={{
                  backgroundColor: '#FF9900',
                  color: '#0F141A',
                }}
                className={`h-8 px-3 rounded-[6px] font-bold text-[13px] flex items-center gap-1.5 hover:bg-[#EC7211] enabled:active:scale-[0.97] transition-[background-color,border-color,color,transform] duration-150 ease-out cursor-pointer shadow-xs border ${
                  isAddOpen ? 'border-[#0972D3] dark:border-[#539FE5]' : 'border-transparent'
                }`}
              >
                <AnimatedIcon
                  activeKey={isAddingService ? 'loading' : 'idle'}
                  size={16}
                  className="w-4 h-4"
                >
                  <Plus key="idle" className="w-4 h-4" />
                  <Arc key="loading" size={14} easing="stacked" cap="round" color="#0F141A" />
                </AnimatedIcon>
                <span>Add service</span>
                <ChevronDown
                  className="w-3.5 h-3.5 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ transform: isAddOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              <AnimatedPopover
                isOpen={isAddOpen}
                onClose={() => closePopover('canvas-add-service')}
                triggerRef={addTriggerRef}
                className="top-9.5 left-0 w-64 space-y-1.5"
              >
                <CloudscapeSearchInput
                  value={serviceSearch}
                  onChange={setServiceSearch}
                  placeholder="Filter services..."
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
                      className="w-full text-left px-2.5 py-1.5 rounded-[6px] text-[12px] text-[var(--aws-text-primary)] hover:bg-[var(--aws-popover-hover)] transition-colors duration-100 flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate font-medium">{svc.name}</span>
                      <span className="font-mono text-[10px] text-[var(--aws-text-muted)] ml-2 shrink-0">
                        {svc.id}
                      </span>
                    </button>
                  ))}
                </div>
              </AnimatedPopover>
            </div>

            {/* Add Group Boundary Container Dropdown */}
            <div className="relative">
              <button
                ref={boundaryTriggerRef}
                type="button"
                onClick={() => togglePopover('canvas-boundary')}
                data-open={isBoundaryOpen ? 'true' : 'false'}
                className={`h-8 px-3 rounded-[6px] border text-[12px] font-medium flex items-center gap-1.5 enabled:active:scale-[0.97] transition-[background-color,border-color,color,transform] duration-150 ease-out cursor-pointer bg-[var(--aws-card-bg)] hover:bg-[var(--aws-page-bg)] text-[var(--aws-text-primary)] shadow-xs ${
                  isBoundaryOpen
                    ? 'border-[var(--aws-interactive)] ring-1 ring-[var(--aws-interactive)]/20'
                    : 'border-[var(--aws-border)] hover:border-[var(--aws-interactive)]'
                }`}
              >
                <BoxSelect className="w-4 h-4 text-[#8C4FFF]" />
                <span className="hidden sm:inline">Boundary</span>
                <ChevronDown
                  className="w-3.5 h-3.5 text-[var(--aws-text-muted)] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ transform: isBoundaryOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              <AnimatedPopover
                isOpen={isBoundaryOpen}
                onClose={() => closePopover('canvas-boundary')}
                triggerRef={boundaryTriggerRef}
                className="top-9.5 left-0 w-64 space-y-0.5"
              >
                <div className="px-2.5 py-1 text-[11px] font-bold text-[var(--aws-text-muted)] border-b border-[var(--aws-border)] mb-1">
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
                    className="w-full text-left px-2.5 py-1.5 rounded-[6px] text-[12px] text-[var(--aws-text-primary)] hover:bg-[var(--aws-popover-hover)] transition-colors duration-100 flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="font-medium">{b.label}</span>
                    <span className="text-[10px] text-[var(--aws-text-muted)] shrink-0">{b.desc}</span>
                  </button>
                ))}
              </AnimatedPopover>
            </div>

            {/* Snapshots Menu */}
            <div className="relative">
              <button
                ref={snapshotTriggerRef}
                type="button"
                onClick={() => togglePopover('canvas-snapshots')}
                aria-disabled={isSavingSnapshot ? 'true' : undefined}
                data-open={isSnapshotOpen ? 'true' : 'false'}
                className={`h-8 px-3 rounded-[6px] border text-[12px] font-medium flex items-center gap-1.5 enabled:active:scale-[0.97] transition-[background-color,border-color,color,transform] duration-150 ease-out cursor-pointer bg-[var(--aws-card-bg)] hover:bg-[var(--aws-page-bg)] text-[var(--aws-text-primary)] shadow-xs ${
                  isSnapshotOpen
                    ? 'border-[var(--aws-interactive)] ring-1 ring-[var(--aws-interactive)]/20'
                    : 'border-[var(--aws-border)] hover:border-[var(--aws-interactive)]'
                }`}
              >
                <AnimatedIcon
                  activeKey={isSavingSnapshot ? 'loading' : 'idle'}
                  size={15}
                  className="w-3.5 h-3.5 text-[#1D8102]"
                >
                  <Save key="idle" className="w-3.5 h-3.5 text-[#1D8102]" />
                  <Arc key="loading" size={13} easing="stacked" cap="round" color="#1D8102" />
                </AnimatedIcon>
                <span className="hidden md:inline">Snapshots</span>
                <ChevronDown
                  className="w-3.5 h-3.5 text-[var(--aws-text-muted)] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ transform: isSnapshotOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              <AnimatedPopover
                isOpen={isSnapshotOpen}
                onClose={() => closePopover('canvas-snapshots')}
                triggerRef={snapshotTriggerRef}
                align="right"
                className="top-9.5 right-0 w-72 p-2 space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-[var(--aws-border)] pb-1.5">
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
                    className="flex-1 h-7 px-2.5 rounded-[6px] border text-[12px] outline-none caret-[var(--aws-interactive)] transition-[border-color,box-shadow] duration-150 ease-out focus:border-[var(--aws-interactive)] focus:ring-2 focus:ring-[var(--aws-interactive)]/40"
                  />
                  <button
                    type="submit"
                    disabled={isSavingSnapshot}
                    aria-disabled={isSavingSnapshot ? 'true' : undefined}
                    style={{
                      backgroundColor: 'var(--aws-interactive)',
                      color: '#FFFFFF',
                    }}
                    className="h-7 px-2.5 rounded-[6px] text-[12px] font-medium cursor-pointer enabled:active:scale-[0.97] transition-[background-color,transform] duration-150 ease-out flex items-center gap-1.5"
                  >
                    <AnimatedIcon
                      activeKey={isSavingSnapshot ? 'loading' : 'idle'}
                      size={14}
                      className="w-3.5 h-3.5"
                    >
                      <Save key="idle" className="w-3.5 h-3.5" />
                      <Arc key="loading" size={14} easing="stacked" cap="round" color="#FFFFFF" />
                    </AnimatedIcon>
                    <span>Save</span>
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
                    <div className="max-h-44 overflow-y-auto custom-scrollbar space-y-1">
                      {savedDiagrams.map((diag) => (
                        <div
                          key={diag.id}
                          style={{
                            backgroundColor: 'var(--aws-page-bg)',
                            borderColor: 'var(--aws-border)',
                          }}
                          className="flex items-center justify-between p-1.5 rounded-[6px] border text-[12px] group"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              loadSnapshot(diag.id);
                              closePopover('canvas-snapshots');
                            }}
                            className="text-left text-[var(--aws-text-primary)] hover:text-[var(--aws-interactive)] flex items-center gap-1.5 cursor-pointer truncate flex-1"
                          >
                            <FolderOpen className="w-3.5 h-3.5 text-[#1D8102] shrink-0" />
                            <span className="truncate">{diag.name}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSnapshot(diag.id)}
                            className="text-[var(--aws-text-muted)] hover:text-[#DD344C] opacity-0 group-hover:opacity-100 cursor-pointer ml-1.5"
                            title="Delete snapshot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </AnimatedPopover>
            </div>

            {/* Auto-Layout (LR / TB) Deterministic Engine */}
            <div className="flex items-center border border-[var(--aws-input-border)] rounded-[4px] overflow-hidden h-8">
              <button
                type="button"
                onClick={() => handleTriggerAutoLayout(layoutDirection)}
                aria-disabled={isArranging ? 'true' : undefined}
                className="px-2.5 h-full text-[12px] font-medium text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] enabled:active:scale-[0.97] transition-[background-color,border-color,color,transform] duration-150 ease-out cursor-pointer flex items-center gap-1.5"
                title={`Auto-layout diagram using Dagre (${layoutDirection})`}
              >
                <AnimatedIcon
                  activeKey={isArranging ? 'arranging' : 'idle'}
                  size={14}
                  className="w-3.5 h-3.5 text-[#0972D3] dark:text-[#539FE5]"
                >
                  <LayoutGrid key="idle" className="w-3.5 h-3.5 text-[#0972D3] dark:text-[#539FE5]" />
                  <Blocks key="arranging" size={14} sweep="diagonal" color="#FF9900" />
                </AnimatedIcon>
                <span className="hidden sm:inline">Auto-Layout</span>
                <span className="font-mono text-[10px] text-[var(--aws-text-muted)] bg-[var(--aws-page-bg)] px-1 py-0.2 rounded border border-[var(--aws-border)]">
                  {layoutDirection}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextDir = layoutDirection === 'LR' ? 'TB' : 'LR';
                  setLayoutDirection(nextDir);
                  handleTriggerAutoLayout(nextDir);
                }}
                aria-disabled={isArranging ? 'true' : undefined}
                className="px-1.5 h-full text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] border-l border-[var(--aws-border)] enabled:active:scale-[0.97] transition-[background-color,border-color,color,transform] duration-150 ease-out cursor-pointer"
                title={`Switch layout direction to ${layoutDirection === 'LR' ? 'Top-to-Bottom (TB)' : 'Left-to-Right (LR)'}`}
              >
                <ArrowRightLeft className="w-3 h-3" />
              </button>
            </div>

            {/* Canvas Zoom & View Controls */}
            <div className="flex items-center border border-[var(--aws-input-border)] rounded-[4px] overflow-hidden h-8">
              <button
                type="button"
                onClick={() => reactFlowInstance.zoomIn({ duration: 250 })}
                className="px-2 h-full text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] enabled:active:scale-[0.97] transition-[background-color,border-color,color,transform] duration-150 ease-out cursor-pointer"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => reactFlowInstance.zoomOut({ duration: 250 })}
                className="px-2 h-full text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] border-l border-[var(--aws-border)] enabled:active:scale-[0.97] transition-[background-color,border-color,color,transform] duration-150 ease-out cursor-pointer"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => reactFlowInstance.fitView({ padding: 0.18, duration: 250 })}
                className="px-2.5 h-full text-[12px] text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] border-l border-[var(--aws-border)] enabled:active:scale-[0.97] transition-[background-color,border-color,color,transform] duration-150 ease-out cursor-pointer flex items-center gap-1"
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
                className="px-2.5 h-full text-[12px] text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] border-l border-[var(--aws-border)] enabled:active:scale-[0.97] transition-[background-color,border-color,color,transform] duration-150 ease-out cursor-pointer flex items-center gap-1"
                title="Toggle grid style"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{gridVariant === BackgroundVariant.Dots ? 'Dots' : 'Grid'}</span>
              </button>
            </div>

            {/* Export Menu */}
            <div className="relative">
              <button
                ref={exportTriggerRef}
                type="button"
                onClick={() => togglePopover('canvas-export')}
                aria-disabled={isExporting ? 'true' : undefined}
                data-open={isExportOpen ? 'true' : 'false'}
                className={`h-8 px-3 rounded-[6px] border text-[12px] font-medium flex items-center gap-1.5 enabled:active:scale-[0.97] transition-[background-color,border-color,color,transform] duration-150 ease-out cursor-pointer bg-[var(--aws-card-bg)] hover:bg-[var(--aws-page-bg)] text-[var(--aws-text-primary)] shadow-xs ${
                  isExportOpen
                    ? 'border-[var(--aws-interactive)] ring-1 ring-[var(--aws-interactive)]/20'
                    : 'border-[var(--aws-border)] hover:border-[var(--aws-interactive)]'
                }`}
                title="Export diagram"
              >
                <AnimatedIcon
                  activeKey={isExporting ? 'loading' : 'idle'}
                  size={15}
                  className="w-3.5 h-3.5"
                >
                  <Download key="idle" className="w-3.5 h-3.5" />
                  <Arc
                    key="loading"
                    size={13}
                    easing="stacked"
                    cap="round"
                    color={theme === 'dark' ? '#539FE5' : '#0972D3'}
                  />
                </AnimatedIcon>
                <span className="hidden md:inline">Export</span>
                <ChevronDown
                  className="w-3.5 h-3.5 text-[var(--aws-text-muted)] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ transform: isExportOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              <AnimatedPopover
                isOpen={isExportOpen}
                onClose={() => closePopover('canvas-export')}
                triggerRef={exportTriggerRef}
                align="right"
                className="top-9.5 right-0 w-56 space-y-0.5"
              >
                <button
                  type="button"
                  onClick={handleExportJson}
                  aria-disabled={isExporting ? 'true' : undefined}
                  className="w-full text-left px-2.5 py-1.5 rounded-[6px] text-[12px] text-[var(--aws-text-primary)] hover:bg-[var(--aws-popover-hover)] transition-colors duration-100 flex items-center justify-between cursor-pointer"
                >
                  <span className="font-medium">Export JSON spec</span>
                  <AnimatedIcon
                    activeKey={isExporting ? 'loading' : 'idle'}
                    size={14}
                    className="w-3.5 h-3.5 text-[var(--aws-text-muted)]"
                  >
                    <Download key="idle" className="w-3.5 h-3.5 text-[var(--aws-text-muted)]" />
                    <Arc
                      key="loading"
                      size={14}
                      easing="stacked"
                      cap="round"
                      color={theme === 'dark' ? '#539FE5' : '#0972D3'}
                    />
                  </AnimatedIcon>
                </button>
                <div className="pt-0.5">
                  <CloudscapeCopyButton
                    textToCopy={markdownSpec}
                    label="Copy markdown spec"
                    copiedLabel="Copied markdown"
                    className="w-full justify-between !border-transparent hover:!border-[var(--aws-interactive)] !bg-transparent hover:!bg-[var(--aws-popover-hover)] !text-[var(--aws-text-primary)] !text-[12px] !py-2 !px-3"
                  />
                </div>
              </AnimatedPopover>
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
              className="h-8 px-2 rounded-[4px] border hover:text-[#DD344C] hover:border-[#DD344C] enabled:active:scale-[0.97] transition-[background-color,border-color,color,transform] duration-150 ease-out cursor-pointer"
              title="Clear canvas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* React Flow Core Canvas Viewport */}
        <div className="flex-1 h-full relative">
          {/* Dagre Auto-Layout & Blueprint Arranging Badge */}
          {isArranging && (
            <div
              role="status"
              aria-live="polite"
              className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 px-3.5 py-1.5 rounded-[6px] border border-[#FF9900]/40 bg-[#0F141A]/90 text-[#EAEDED] shadow-lg backdrop-blur-sm animate-in fade-in zoom-in-95 duration-150 select-none"
            >
              <span className="sr-only">Arranging architecture graph…</span>
              <Blocks size={18} sweep="diagonal" color="#FF9900" />
              <span className="text-[12px] font-medium tracking-wide">
                Arranging architecture graph…
              </span>
            </div>
          )}

          <div
            className={`w-full h-full transition-opacity duration-200 ${
              isArranging ? 'opacity-75' : 'opacity-100'
            }`}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              colorMode={theme}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDragOver={onDragOver}
              onDrop={onDrop}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              connectionMode={ConnectionMode.Loose}
              snapToGrid={true}
              snapGrid={[16, 16]}
              onNodeClick={(_, node) => {
                if (!node.data?.isBoundary) {
                  openInspector(node.id);
                }
              }}
              onPaneClick={() => closeInspector()}
              fitView
              fitViewOptions={{ padding: 0.18 }}
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
