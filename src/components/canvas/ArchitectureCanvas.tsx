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
  ZoomIn,
  ZoomOut,
  Save,
  LayoutGrid,
  ArrowRightLeft,
  Undo2,
  Redo2,
  Edit2,
  Users,
  StickyNote,
} from 'lucide-react';
import { useCompassStore } from '../../store/useCompassStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { usePopoverStore } from '../../store/usePopoverStore';
import { AnimatedPopover } from '../ui/AnimatedPopover';
import { AWSServiceNode } from './AWSServiceNode';
import { AWSGroupNode } from './AWSGroupNode';
import { AnnotationNode } from './AnnotationNode';
import { ProtocolEdge } from './ProtocolEdge';
import { NodeInspectorDrawer } from './NodeInspectorDrawer';
import { CanvasContextMenu } from './CanvasContextMenu';
import { BlueprintManagerDropdown } from './BlueprintManagerDropdown';
import { getAWSCategoryColor } from '../../utils/awsCategoryColors';
import { CloudscapeSearchInput } from '../ui/CloudscapeSearchInput';
import { CloudscapeCopyButton } from '../ui/CloudscapeCopyButton';
import { AnimatedIcon } from '../ui/AnimatedIcon';
import { Blocks, Pulse, Arc } from '../ui/LoadingIndicators';
import type { AWSService, GroupBoundaryType, ExternalActorType } from '../../types/aws';

// Hoist static node & edge registrations
const nodeTypes: NodeTypes = {
  awsService: AWSServiceNode,
  awsGroup: AWSGroupNode,
  architectureGroup: AWSGroupNode,
  annotationNode: AnnotationNode,
};

const edgeTypes: EdgeTypes = {
  default: ProtocolEdge,
};

const EXTERNAL_ACTORS: { type: ExternalActorType; label: string; desc: string }[] = [
  { type: 'user-browser', label: 'User / Client Browser', desc: 'HTTPS / Web Traffic Ingress' },
  { type: 'mobile-client', label: 'Mobile / IoT Client', desc: 'REST / WebSocket Device Client' },
  { type: 'corporate-datacenter', label: 'Corporate Data Center', desc: 'Direct Connect / Site-to-Site VPN' },
  { type: 'external-webhook', label: 'External Webhook / API', desc: '3rd-Party Partner Payload Ingress' },
];

const GROUP_BOUNDARIES: { id: GroupBoundaryType; label: string; desc: string }[] = [
  { id: 'aws-cloud', label: 'AWS Cloud', desc: 'Outer perimeter' },
  { id: 'region', label: 'Region', desc: 'Regional boundary' },
  { id: 'vpc', label: 'VPC', desc: '10.0.0.0/16' },
  { id: 'public-subnet', label: 'Public subnet', desc: 'Ingress tier' },
  { id: 'private-subnet', label: 'Private subnet', desc: 'Application tier' },
  { id: 'data-subnet', label: 'Data subnet', desc: 'Database isolated' },
  { id: 'security-group', label: 'Security group', desc: 'Firewall rules' },
  { id: 'auto-scaling-group', label: 'Auto scaling group', desc: 'Scale cluster' },
  { id: 'corporate-datacenter', label: 'Corporate Data Center', desc: 'On-premises scope' },
  { id: 'serverless', label: 'Managed Serverless', desc: 'Event-driven scope' },
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
  const addExternalActor = useCanvasStore((s) => s.addExternalActor);
  const addAnnotationNode = useCanvasStore((s) => s.addAnnotationNode);
  const clearCanvas = useCanvasStore((s) => s.clearCanvas);
  const openNodeInspector = useCanvasStore((s) => s.openNodeInspector);
  const openEdgeInspector = useCanvasStore((s) => s.openEdgeInspector);
  const closeInspector = useCanvasStore((s) => s.closeInspector);
  const setNodes = useCanvasStore((s) => s.setNodes);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectedEdgeId = useCanvasStore((s) => s.selectedEdgeId);
  const removeNode = useCanvasStore((s) => s.removeNode);
  const removeEdge = useCanvasStore((s) => s.removeEdge);
  const duplicateNode = useCanvasStore((s) => s.duplicateNode);
  const activeDiagramName = useCanvasStore((s) => s.activeDiagramName);
  const saveCurrentAsBlueprint = useCanvasStore((s) => s.saveCurrentAsBlueprint);
  const renameBlueprint = useCanvasStore((s) => s.renameBlueprint);
  const activeDiagramId = useCanvasStore((s) => s.activeDiagramId);
  const saveStatus = useCanvasStore((s) => s.saveStatus);
  const initializeCanvas = useCanvasStore((s) => s.initializeCanvas);
  const autoLayout = useCanvasStore((s) => s.autoLayout);
  const openContextMenu = useCanvasStore((s) => s.openContextMenu);
  const closeContextMenu = useCanvasStore((s) => s.closeContextMenu);

  // Undo / Redo history
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const canUndo = useCanvasStore((s) => s.canUndo);
  const canRedo = useCanvasStore((s) => s.canRedo);

  const isSidebarOpen = useCompassStore((s) => s.isSidebarOpen);
  const activePopoverId = usePopoverStore((s) => s.activePopoverId);
  const closePopover = usePopoverStore((s) => s.closePopover);
  const togglePopover = usePopoverStore((s) => s.togglePopover);

  // Settings preferences
  const canvasGridVariant = useSettingsStore((s) => s.canvasGridVariant);
  const snapToGrid = useSettingsStore((s) => s.snapToGrid);
  const snapGridSize = useSettingsStore((s) => s.snapGridSize);
  const showMiniMap = useSettingsStore((s) => s.showMiniMap);
  const animateEdgesByDefault = useSettingsStore((s) => s.animateEdgesByDefault);

  const isAddServiceOpen = activePopoverId === 'canvas-add-service';
  const isBoundaryOpen = activePopoverId === 'canvas-boundary';
  const isActorNoteOpen = activePopoverId === 'canvas-actor-note';
  const isSaveAsOpen = activePopoverId === 'canvas-save-as';
  const isExportOpen = activePopoverId === 'canvas-export';

  const addServiceTriggerRef = useRef<HTMLButtonElement>(null);
  const boundaryTriggerRef = useRef<HTMLButtonElement>(null);
  const actorNoteTriggerRef = useRef<HTMLButtonElement>(null);
  const saveAsTriggerRef = useRef<HTMLButtonElement>(null);
  const exportTriggerRef = useRef<HTMLButtonElement>(null);

  const [layoutDirection, setLayoutDirection] = useState<'LR' | 'TB'>('LR');
  const [serviceSearch, setServiceSearch] = useState('');

  // Inline Title Editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  // Save As Custom Blueprint state
  const [saveAsNameInput, setSaveAsNameInput] = useState('');
  const [saveAsSuccess, setSaveAsSuccess] = useState(false);

  // Indicators
  const [isArranging, setIsArranging] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    initializeCanvas();
  }, [initializeCanvas]);

  // Global Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+D, Delete/Backspace, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isTyping =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey && !isTyping) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Y / Ctrl+Shift+Z / Cmd+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y' && !isTyping) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z' && !isTyping)
      ) {
        e.preventDefault();
        redo();
        return;
      }

      // Duplicate: Ctrl+D / Cmd+D
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && !isTyping) {
        e.preventDefault();
        if (selectedNodeId) {
          duplicateNode(selectedNodeId);
        }
        return;
      }

      // Delete: Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isTyping) {
        if (selectedNodeId) {
          removeNode(selectedNodeId);
        } else if (selectedEdgeId) {
          removeEdge(selectedEdgeId);
        }
        return;
      }

      // Escape: Close context menu and inspectors
      if (e.key === 'Escape') {
        closeContextMenu();
        closeInspector();
        setIsEditingTitle(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, duplicateNode, removeNode, removeEdge, selectedNodeId, selectedEdgeId, closeContextMenu, closeInspector]);

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
      const offset = (nodes.length % 5) * 35;
      const center = reactFlowInstance.screenToFlowPosition({
        x: window.innerWidth / 2 + offset,
        y: window.innerHeight / 2 + offset,
      });

      addServiceNode(svc, center);
      closePopover('canvas-add-primitives');
      closePopover('canvas-add-service');
      setServiceSearch('');
    },
    [nodes.length, reactFlowInstance, addServiceNode, closePopover]
  );

  const handleQuickAddActor = useCallback(
    (actorType: ExternalActorType, label: string) => {
      const offset = (nodes.length % 4) * 30;
      const center = reactFlowInstance.screenToFlowPosition({
        x: window.innerWidth / 2 - 120 + offset,
        y: window.innerHeight / 2 - 100 + offset,
      });

      addExternalActor(actorType, label, center);
      closePopover('canvas-add-primitives');
      closePopover('canvas-actor-note');
    },
    [nodes.length, reactFlowInstance, addExternalActor, closePopover]
  );

  const handleQuickAddNote = useCallback(() => {
    const center = reactFlowInstance.screenToFlowPosition({
      x: window.innerWidth / 2 - 80,
      y: window.innerHeight / 2 - 60,
    });

    addAnnotationNode('Architecture Note', '', center);
    closePopover('canvas-add-primitives');
    closePopover('canvas-actor-note');
  }, [reactFlowInstance, addAnnotationNode, closePopover]);

  const handleAddBoundary = useCallback(
    (boundaryType: GroupBoundaryType, label: string) => {
      const center = reactFlowInstance.screenToFlowPosition({
        x: window.innerWidth / 2 - 220,
        y: window.innerHeight / 2 - 160,
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
          cidr: boundaryType === 'vpc' ? '10.0.0.0/16' : boundaryType.includes('subnet') ? '10.0.1.0/24' : undefined,
          width: boundaryType === 'aws-cloud' ? 960 : 540,
          height: boundaryType === 'aws-cloud' ? 520 : 340,
        },
      };

      setNodes([newBoundary, ...nodes]);
      closePopover('canvas-boundary');
    },
    [nodes, reactFlowInstance, setNodes, closePopover]
  );

  const handleCommitTitleChange = async () => {
    if (titleDraft.trim() && titleDraft.trim() !== activeDiagramName) {
      await renameBlueprint(activeDiagramId, titleDraft.trim());
    }
    setIsEditingTitle(false);
  };

  const handleSaveAsBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveAsNameInput.trim()) return;

    await saveCurrentAsBlueprint(saveAsNameInput.trim());
    setSaveAsSuccess(true);
    setTimeout(() => {
      setSaveAsSuccess(false);
      closePopover('canvas-save-as');
      setSaveAsNameInput('');
    }, 1200);
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
    const serviceNodes = nodes.filter((n) => !n.data.isBoundary && !n.data.isAnnotation);
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
      ...serviceNodes.map((n) => `- **${n.data.customTitle || n.data.label}** (\`${n.data.serviceId}\`): ${n.data.category} (Tier ${n.data.tier})`),
      '',
      `## Data & Control Flows`,
      ...edges.map((e) => {
        const src = nodes.find((n) => n.id === e.source)?.data.label || e.source;
        const tgt = nodes.find((n) => n.id === e.target)?.data.label || e.target;
        return `- ${src} --[${e.data?.customLabel || e.protocol || 'HTTPS/REST'}]--> ${tgt}`;
      }),
    ].join('\n');
  }, [nodes, edges, activeDiagramName]);

  const filteredQuickAddServices = useMemo(() => {
    if (!serviceSearch.trim()) return services.slice(0, 18);
    const q = serviceSearch.toLowerCase().trim();
    return services.filter(
      (s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    );
  }, [services, serviceSearch]);

  const miniMapNodeColor = useCallback(
    (node: { data?: unknown }) => {
      const data = node.data as { category?: string; isBoundary?: boolean; isAnnotation?: boolean };
      if (data?.isBoundary) {
        return theme === 'dark' ? '#354150' : '#D5DBDB';
      }
      if (data?.isAnnotation) {
        return '#ED7100';
      }
      return getAWSCategoryColor(data?.category || '', theme);
    },
    [theme]
  );

  const flowEdgeOptions = useMemo(
    () => ({
      type: 'default',
      animated: animateEdgesByDefault,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 14,
        height: 14,
        color: '#8C4FFF',
      },
    }),
    [animateEdgesByDefault]
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
        {/* Cloudscape Enterprise Toolbar - 3 Clusters */}
        <div
          style={{
            backgroundColor: 'var(--aws-card-bg)',
            borderBottomColor: 'var(--aws-border)',
          }}
          className={`h-12 border-b ${!isSidebarOpen ? 'pl-24 pr-4' : 'px-4'} flex items-center justify-between gap-3 shrink-0 z-10 overflow-x-auto custom-scrollbar`}
        >
          {/* Cluster 1: Blueprint Selector & Save As */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0">
            <BlueprintManagerDropdown />

            {/* Inline Title & Save As Action */}
            <div className="hidden lg:flex items-center gap-1.5 border-l border-[var(--aws-border)] pl-2.5">
              {isEditingTitle ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCommitTitleChange();
                      if (e.key === 'Escape') setIsEditingTitle(false);
                    }}
                    onBlur={handleCommitTitleChange}
                    autoFocus
                    className="h-7 px-2 text-[12px] font-semibold rounded border border-[var(--aws-interactive)] bg-[var(--aws-page-bg)] text-[var(--aws-text-primary)] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCommitTitleChange}
                    className="p-1 text-[#1D8102] hover:opacity-80 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setTitleDraft(activeDiagramName);
                    setIsEditingTitle(true);
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-[4px] text-[12px] text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] cursor-pointer group"
                  title="Click to rename current blueprint"
                >
                  <span className="max-w-[140px] truncate">{activeDiagramName}</span>
                  <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}

              {/* Save As Custom Blueprint Button */}
              <div className="relative">
                <button
                  ref={saveAsTriggerRef}
                  type="button"
                  onClick={() => togglePopover('canvas-save-as')}
                  className="h-7 px-2 text-[11px] font-medium rounded border border-[var(--aws-border)] hover:border-[var(--aws-interactive)] hover:text-[var(--aws-interactive)] text-[var(--aws-text-muted)] bg-[var(--aws-card-bg)] flex items-center gap-1 cursor-pointer"
                  title="Save current architecture graph as a Custom Blueprint"
                >
                  <Save className="w-3 h-3 text-[#1D8102]" />
                  <span>Save as...</span>
                </button>

                <AnimatedPopover
                  isOpen={isSaveAsOpen}
                  onClose={() => closePopover('canvas-save-as')}
                  triggerRef={saveAsTriggerRef}
                  align="left"
                  className="top-8.5 left-0 w-72 p-2.5 space-y-2"
                >
                  <div className="text-[12px] font-bold text-[var(--aws-text-primary)] flex items-center justify-between">
                    <span>Save Custom Blueprint</span>
                    {saveAsSuccess && (
                      <span className="text-[11px] text-[#1D8102] flex items-center gap-1 font-semibold">
                        <Check className="w-3.5 h-3.5" /> Saved
                      </span>
                    )}
                  </div>
                  <form onSubmit={handleSaveAsBlueprint} className="space-y-2">
                    <input
                      type="text"
                      value={saveAsNameInput}
                      onChange={(e) => setSaveAsNameInput(e.target.value)}
                      placeholder="Blueprint title (e.g. My Prod VPC)..."
                      autoFocus
                      className="w-full h-8 px-2.5 text-[12px] rounded border border-[var(--aws-input-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-primary)] outline-none focus:border-[var(--aws-interactive)]"
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => closePopover('canvas-save-as')}
                        className="px-2.5 py-1 text-[11px] rounded border border-[var(--aws-border)] text-[var(--aws-text-muted)] hover:bg-[var(--aws-page-bg)] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 text-[11px] font-semibold rounded bg-[var(--aws-interactive)] text-white hover:opacity-90 cursor-pointer"
                      >
                        Save Blueprint
                      </button>
                    </div>
                  </form>
                </AnimatedPopover>
              </div>
            </div>

            {/* Canvas Auto-Save Indicator */}
            <div
              className="hidden 2xl:flex items-center text-[11px] font-mono px-2 py-0.5 rounded select-none"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
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
                  {saveStatus === 'saving' ? 'Saving…' : 'Saved'}
                </span>
              </div>
            </div>
          </div>

          {/* 1px Vertical Divider */}
          <div className="h-5 w-px bg-[var(--aws-border)] shrink-0 hidden md:block" aria-hidden="true" />

          {/* Cluster 2: Add Primitives (Service, Boundary, Actor/Note) & Auto-Layout */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* + Add service ▾ */}
            <div className="relative">
              <button
                ref={addServiceTriggerRef}
                type="button"
                onClick={() => togglePopover('canvas-add-service')}
                style={{
                  backgroundColor: '#FF9900',
                  color: '#0F141A',
                }}
                className="h-8 px-2.5 rounded-[4px] text-[12px] font-bold flex items-center gap-1.5 shadow-xs hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
                title="Add AWS Service"
              >
                <Plus className="w-4 h-4" />
                <span>Service</span>
                <ChevronDown
                  className="w-3.5 h-3.5 transition-transform duration-200"
                  style={{ transform: isAddServiceOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              <AnimatedPopover
                isOpen={isAddServiceOpen}
                onClose={() => closePopover('canvas-add-service')}
                triggerRef={addServiceTriggerRef}
                className="top-9.5 left-0 w-72 p-2 space-y-2"
              >
                <div className="text-[11px] font-bold text-[var(--aws-text-muted)] border-b border-[var(--aws-border)] pb-1 px-1">
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

            {/* + Boundary ▾ */}
            <div className="relative">
              <button
                ref={boundaryTriggerRef}
                type="button"
                onClick={() => togglePopover('canvas-boundary')}
                data-open={isBoundaryOpen ? 'true' : 'false'}
                className={`h-8 px-2.5 rounded-[4px] border text-[12px] font-medium text-[var(--aws-text-primary)] bg-[var(--aws-card-bg)] hover:bg-[var(--aws-page-bg)] flex items-center gap-1.5 transition-all cursor-pointer ${
                  isBoundaryOpen
                    ? 'border-[var(--aws-interactive)] ring-1 ring-[var(--aws-interactive)]/20'
                    : 'border-[var(--aws-border)] hover:border-[var(--aws-interactive)]'
                }`}
                title="Add architectural group boundary"
              >
                <BoxSelect className="w-4 h-4 text-[#8C4FFF]" />
                <span className="hidden sm:inline">Boundary</span>
                <ChevronDown
                  className="w-3.5 h-3.5 text-[var(--aws-text-muted)] transition-transform duration-200"
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
                {GROUP_BOUNDARIES.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleAddBoundary(b.id, b.label)}
                    className="w-full text-left px-2.5 py-1.5 rounded-[6px] text-[12px] text-[var(--aws-text-primary)] hover:bg-[var(--aws-popover-hover)] transition-colors flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="font-medium">{b.label}</span>
                    <span className="text-[10px] text-[var(--aws-text-muted)] shrink-0">{b.desc}</span>
                  </button>
                ))}
              </AnimatedPopover>
            </div>

            {/* + Actor / Note ▾ */}
            <div className="relative">
              <button
                ref={actorNoteTriggerRef}
                type="button"
                onClick={() => togglePopover('canvas-actor-note')}
                data-open={isActorNoteOpen ? 'true' : 'false'}
                className={`h-8 px-2.5 rounded-[4px] border text-[12px] font-medium text-[var(--aws-text-primary)] bg-[var(--aws-card-bg)] hover:bg-[var(--aws-page-bg)] flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActorNoteOpen
                    ? 'border-[var(--aws-interactive)] ring-1 ring-[var(--aws-interactive)]/20'
                    : 'border-[var(--aws-border)] hover:border-[var(--aws-interactive)]'
                }`}
                title="Add external clients or callout notes"
              >
                <Users className="w-4 h-4 text-[#0972D3] dark:text-[#539FE5]" />
                <span className="hidden md:inline">Actor / Note</span>
                <ChevronDown
                  className="w-3.5 h-3.5 text-[var(--aws-text-muted)] transition-transform duration-200"
                  style={{ transform: isActorNoteOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              <AnimatedPopover
                isOpen={isActorNoteOpen}
                onClose={() => closePopover('canvas-actor-note')}
                triggerRef={actorNoteTriggerRef}
                className="top-9.5 left-0 w-72 p-2 space-y-2"
              >
                <div className="text-[10px] font-bold text-[var(--aws-text-muted)] uppercase tracking-wider px-1">
                  External Clients & Callers
                </div>
                <div className="space-y-0.5">
                  {EXTERNAL_ACTORS.map((act) => (
                    <button
                      key={act.type}
                      type="button"
                      onClick={() => handleQuickAddActor(act.type, act.label)}
                      className="w-full text-left px-2.5 py-1.5 rounded-[6px] text-[12px] text-[var(--aws-text-primary)] hover:bg-[var(--aws-popover-hover)] transition-colors flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="truncate">
                        <div className="font-medium truncate">{act.label}</div>
                        <div className="text-[10px] text-[var(--aws-text-muted)] truncate">{act.desc}</div>
                      </div>
                      <Users className="w-3.5 h-3.5 text-[var(--aws-interactive)] shrink-0" />
                    </button>
                  ))}
                </div>

                <div className="border-t border-[var(--aws-border)] pt-2">
                  <div className="text-[10px] font-bold text-[var(--aws-text-muted)] uppercase tracking-wider px-1 mb-1">
                    Topology Sticky Note
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickAddNote}
                    className="w-full flex items-center gap-2 p-2 rounded-[6px] border border-dashed border-[var(--aws-border)] hover:border-[var(--aws-interactive)] hover:bg-[var(--aws-interactive)]/10 text-[var(--aws-text-primary)] cursor-pointer text-left transition-colors"
                  >
                    <StickyNote className="w-4 h-4 text-[#ED7100] shrink-0" />
                    <div>
                      <div className="text-[12px] font-semibold">Add sticky callout note</div>
                      <div className="text-[10px] text-[var(--aws-text-muted)]">
                        Document decisions or SLA targets
                      </div>
                    </div>
                  </button>
                </div>
              </AnimatedPopover>
            </div>

            {/* Auto-Layout (LR / TB) */}
            <div className="flex items-center border border-[var(--aws-input-border)] rounded-[4px] overflow-hidden h-8">
              <button
                type="button"
                onClick={() => handleTriggerAutoLayout(layoutDirection)}
                aria-disabled={isArranging ? 'true' : undefined}
                className="px-2.5 h-full text-[12px] font-medium text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] enabled:active:scale-[0.97] transition-all cursor-pointer flex items-center gap-1.5"
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
                <span className="hidden lg:inline">Auto-Layout</span>
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
                className="px-1.5 h-full text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] border-l border-[var(--aws-border)] cursor-pointer"
                title={`Switch layout direction to ${layoutDirection === 'LR' ? 'Top-to-Bottom (TB)' : 'Left-to-Right (LR)'}`}
              >
                <ArrowRightLeft className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 1px Vertical Divider */}
          <div className="h-5 w-px bg-[var(--aws-border)] shrink-0 hidden md:block" aria-hidden="true" />

          {/* Cluster 3: Undo/Redo, Zoom/Fit, Export, Clear */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Undo / Redo Actions */}
            <div className="flex items-center border border-[var(--aws-input-border)] rounded-[4px] overflow-hidden h-8">
              <button
                type="button"
                onClick={undo}
                disabled={!canUndo}
                className="px-2 h-full text-[var(--aws-text-primary)] disabled:text-[var(--aws-text-muted)]/40 hover:bg-[var(--aws-page-bg)] disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={!canRedo}
                className="px-2 h-full text-[var(--aws-text-primary)] disabled:text-[var(--aws-text-muted)]/40 hover:bg-[var(--aws-page-bg)] disabled:hover:bg-transparent border-l border-[var(--aws-border)] cursor-pointer disabled:cursor-not-allowed transition-colors"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Canvas Zoom & View Controls */}
            <div className="flex items-center border border-[var(--aws-input-border)] rounded-[4px] overflow-hidden h-8">
              <button
                type="button"
                onClick={() => reactFlowInstance.zoomIn({ duration: 250 })}
                className="px-2 h-full text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] cursor-pointer"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => reactFlowInstance.zoomOut({ duration: 250 })}
                className="px-2 h-full text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] border-l border-[var(--aws-border)] cursor-pointer"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => reactFlowInstance.fitView({ padding: 0.18, duration: 250 })}
                className="px-2.5 h-full text-[12px] text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] border-l border-[var(--aws-border)] cursor-pointer flex items-center gap-1"
                title="Fit diagram to canvas"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Fit</span>
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
                className={`h-8 px-2.5 rounded-[4px] border text-[12px] font-medium text-[var(--aws-text-primary)] bg-[var(--aws-card-bg)] hover:bg-[var(--aws-page-bg)] flex items-center gap-1.5 transition-all cursor-pointer ${
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
                  className="w-3.5 h-3.5 text-[var(--aws-text-muted)] transition-transform duration-200"
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
                  className="w-full text-left px-2.5 py-1.5 rounded-[6px] text-[12px] text-[var(--aws-text-primary)] hover:bg-[var(--aws-popover-hover)] transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span className="font-medium">Export JSON spec</span>
                  <Download className="w-3.5 h-3.5 text-[var(--aws-text-muted)]" />
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
              className="h-8 px-2 rounded-[4px] border hover:text-[#DD344C] hover:border-[#DD344C] cursor-pointer transition-colors"
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
              defaultEdgeOptions={flowEdgeOptions}
              connectionMode={ConnectionMode.Loose}
              snapToGrid={snapToGrid}
              snapGrid={[snapGridSize, snapGridSize]}
              onNodeClick={(_, node) => {
                openNodeInspector(node.id);
              }}
              onEdgeClick={(_, edge) => {
                openEdgeInspector(edge.id);
              }}
              onPaneClick={() => {
                closeInspector();
                closeContextMenu();
              }}
              onNodeContextMenu={(e, node) => {
                e.preventDefault();
                openContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  type: 'node',
                  targetId: node.id,
                });
              }}
              onEdgeContextMenu={(e, edge) => {
                e.preventDefault();
                openContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  type: 'edge',
                  targetId: edge.id,
                });
              }}
              onPaneContextMenu={(e) => {
                e.preventDefault();
                openContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  type: 'canvas',
                });
              }}
              fitView
              fitViewOptions={{ padding: 0.18 }}
              minZoom={0.15}
              maxZoom={2.5}
              proOptions={{ hideAttribution: true }}
            >
              {canvasGridVariant !== 'none' && (
                <Background
                  variant={
                    canvasGridVariant === 'dots'
                      ? BackgroundVariant.Dots
                      : canvasGridVariant === 'lines'
                      ? BackgroundVariant.Lines
                      : BackgroundVariant.Cross
                  }
                  gap={snapGridSize * 1.5}
                  size={canvasGridVariant === 'dots' ? 1.2 : 1}
                  color={theme === 'dark' ? '#354150' : '#D5DBDB'}
                />
              )}
              {showMiniMap && (
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
              )}
            </ReactFlow>
          </div>
        </div>
      </div>

      {/* Right Context Menu Floating Popover */}
      <CanvasContextMenu />

      {/* Docked Resizable Dual-Tab Split Panel */}
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
