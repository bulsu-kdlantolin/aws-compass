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
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  Maximize,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronRight,
  Download,
  Check,
  ZoomIn,
  ZoomOut,
  Save,
  Undo2,
  Redo2,
  FileSpreadsheet,
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
import { CanvasSidebar } from './CanvasSidebar';
import { CanvasFormatBar } from './CanvasFormatBar';
import { DiagramExportPopover } from './DiagramExportPopover';
import { CanvasBomPopover } from './CanvasBomPopover';
import { QuickConnectPopover } from './QuickConnectPopover';
import { getAWSCategoryColor } from '../../utils/awsCategoryColors';
import { AnimatedIcon } from '../ui/AnimatedIcon';
import { Blocks, Pulse } from '../ui/LoadingIndicators';
import type { AWSService, EdgeProtocol, CanvasNodeItem, CanvasEdgeItem } from '../../types/aws';

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
  const addBoundaryNode = useCanvasStore((s) => s.addBoundaryNode);
  const isCanvasSidebarOpen = useCanvasStore((s) => s.isCanvasSidebarOpen);
  const setIsCanvasSidebarOpen = useCanvasStore((s) => s.setIsCanvasSidebarOpen);
  const addExternalActor = useCanvasStore((s) => s.addExternalActor);
  const addAnnotationNode = useCanvasStore((s) => s.addAnnotationNode);
  const openNodeInspector = useCanvasStore((s) => s.openNodeInspector);
  const openEdgeInspector = useCanvasStore((s) => s.openEdgeInspector);
  const closeInspector = useCanvasStore((s) => s.closeInspector);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectedEdgeId = useCanvasStore((s) => s.selectedEdgeId);
  const removeNode = useCanvasStore((s) => s.removeNode);
  const removeEdge = useCanvasStore((s) => s.removeEdge);
  const duplicateNode = useCanvasStore((s) => s.duplicateNode);
  const activeDiagramName = useCanvasStore((s) => s.activeDiagramName);
  const saveCurrentAsBlueprint = useCanvasStore((s) => s.saveCurrentAsBlueprint);
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

  const activePopoverId = usePopoverStore((s) => s.activePopoverId);
  const closePopover = usePopoverStore((s) => s.closePopover);
  const togglePopover = usePopoverStore((s) => s.togglePopover);

  // Settings preferences
  const canvasGridVariant = useSettingsStore((s) => s.canvasGridVariant);
  const snapToGrid = useSettingsStore((s) => s.snapToGrid);
  const snapGridSize = useSettingsStore((s) => s.snapGridSize);
  const showMiniMap = useSettingsStore((s) => s.showMiniMap);
  const animateEdgesByDefault = useSettingsStore((s) => s.animateEdgesByDefault);

  const isSaveAsOpen = activePopoverId === 'canvas-save-as';
  const isExportOpen = activePopoverId === 'canvas-export';
  const isBomOpen = activePopoverId === 'canvas-bom';

  const saveAsTriggerRef = useRef<HTMLButtonElement>(null);
  const exportTriggerRef = useRef<HTMLButtonElement>(null);
  const bomTriggerRef = useRef<HTMLButtonElement>(null);

  const [layoutDirection, setLayoutDirection] = useState<'LR' | 'TB'>('LR');

  // Drop wire on empty canvas state (Quick Connect Spawner)
  const [quickConnectState, setQuickConnectState] = useState<{
    isOpen: boolean;
    sourceNodeId: string;
    sourceNodeLabel: string;
    sourceServiceId?: string;
    sourceCategory?: string;
    sourceHandleId?: string | null;
    screenPosition: { x: number; y: number };
    flowPosition: { x: number; y: number };
  }>({
    isOpen: false,
    sourceNodeId: '',
    sourceNodeLabel: '',
    screenPosition: { x: 0, y: 0 },
    flowPosition: { x: 0, y: 0 },
  });

  const handleConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState: any) => {
      // If wire dropped on empty canvas space (not connected to a valid target handle)
      if (!connectionState.isValid && connectionState.fromNode) {
        const clientX =
          'clientX' in event
            ? event.clientX
            : (event as TouchEvent).touches?.[0]?.clientX || 0;
        const clientY =
          'clientY' in event
            ? event.clientY
            : (event as TouchEvent).touches?.[0]?.clientY || 0;

        const flowPosition = reactFlowInstance.screenToFlowPosition({
          x: clientX,
          y: clientY,
        });

        const srcNode = connectionState.fromNode;
        const srcLabel = srcNode.data?.customTitle || srcNode.data?.label || 'Source Component';

        setQuickConnectState({
          isOpen: true,
          sourceNodeId: srcNode.id,
          sourceNodeLabel: srcLabel,
          sourceServiceId: srcNode.data?.serviceId,
          sourceCategory: srcNode.data?.category,
          sourceHandleId: connectionState.fromHandle?.id || null,
          screenPosition: { x: clientX, y: clientY },
          flowPosition,
        });
      }
    },
    [reactFlowInstance]
  );

  const handleQuickConnectSelectTarget = useCallback(
    (
      targetService: AWSService,
      targetFlowPos: { x: number; y: number },
      protocol: EdgeProtocol = 'HTTPS/REST'
    ) => {
      const targetNodeId = `node-${targetService.id}-${Date.now()}`;
      const newTargetNode: CanvasNodeItem = {
        id: targetNodeId,
        type: 'awsService',
        position: targetFlowPos,
        data: {
          serviceId: targetService.id,
          label: targetService.name,
          category: targetService.category,
          tier: targetService.tier,
          isFavorite: targetService.isFavorite,
          customNotes: targetService.summary,
          arnPattern: targetService.arnExample,
          customTitle: targetService.name,
          roleSubtitle: targetService.summary,
          env: 'Prod',
        },
      };

      const newEdgeId = `edge-${quickConnectState.sourceNodeId}-${targetNodeId}-${Date.now()}`;
      const newEdge: CanvasEdgeItem = {
        id: newEdgeId,
        source: quickConnectState.sourceNodeId,
        target: targetNodeId,
        sourceHandle: quickConnectState.sourceHandleId || 'right',
        targetHandle: 'left',
        protocol,
        label: protocol,
        animated: true,
        data: {
          protocol,
          label: protocol,
          customLabel: protocol,
          lineStyle: protocol === 'Event Trigger' ? 'dashed' : 'solid',
          directionality: 'one-way',
          animated: true,
        },
      };

      useCanvasStore.getState().recordSnapshot();
      useCanvasStore.setState((state) => {
        const updatedNodes = [...state.nodes, newTargetNode];
        const updatedEdges = [...state.edges, newEdge];
        return {
          nodes: updatedNodes,
          edges: updatedEdges,
          selectedNodeId: targetNodeId,
          selectedEdgeId: null,
          isInspectorOpen: true,
          inspectorActiveTab: 'properties',
        };
      });
    },
    [quickConnectState]
  );

  const isCanvasFullscreen = useCanvasStore((s) => s.isCanvasFullscreen);
  const toggleCanvasFullscreen = useCanvasStore((s) => s.toggleCanvasFullscreen);
  const [zoomPercent, setZoomPercent] = useState(100);

  // Save As Custom Blueprint state
  const [saveAsNameInput, setSaveAsNameInput] = useState('');
  const [saveAsSuccess, setSaveAsSuccess] = useState(false);

  // Indicators
  const [isArranging, setIsArranging] = useState(false);

  // Canvas viewport pan-drag cursor state (moving around canvas with right/middle click)
  const [isCanvasPanning, setIsCanvasPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; isDown: boolean } | null>(null);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Button 2 is right click, button 1 is middle click (both pan the canvas via panOnDrag={[1, 2]})
    if (e.button === 2 || e.button === 1) {
      panStartRef.current = { x: e.clientX, y: e.clientY, isDown: true };
    }
  }, []);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (panStartRef.current?.isDown) {
      // Bitmask check: button 2 (right-click) is bit 2, button 1 (middle-click) is bit 4
      if ((e.buttons & 2) !== 0 || (e.buttons & 4) !== 0) {
        const dist = Math.hypot(e.clientX - panStartRef.current.x, e.clientY - panStartRef.current.y);
        if (dist >= 2) {
          setIsCanvasPanning(true);
        }
      } else {
        panStartRef.current = null;
        setIsCanvasPanning(false);
      }
    }
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      // Revert panning when right or middle click is released or no buttons remain pressed
      if (e.button === 2 || e.button === 1 || e.buttons === 0) {
        panStartRef.current = null;
        setIsCanvasPanning(false);
      }
    };

    const handleGlobalBlur = () => {
      panStartRef.current = null;
      setIsCanvasPanning(false);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('blur', handleGlobalBlur);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('blur', handleGlobalBlur);
    };
  }, []);

  // Sync global body class for uninterrupted grabbing cursor across all canvas elements & boundaries
  useEffect(() => {
    if (isCanvasPanning) {
      document.body.classList.add('canvas-global-panning');
    } else {
      document.body.classList.remove('canvas-global-panning');
    }
    return () => {
      document.body.classList.remove('canvas-global-panning');
    };
  }, [isCanvasPanning]);

  useEffect(() => {
    // When toggling fullscreen / Zen mode, smoothly re-fit the canvas to new bounds
    const timer = setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.18, duration: 250 });
    }, 150);
    return () => clearTimeout(timer);
  }, [isCanvasFullscreen, reactFlowInstance]);

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

      // Fit to View: F
      if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !isTyping) {
        e.preventDefault();
        reactFlowInstance.fitView({ padding: 0.18, duration: 250 });
        return;
      }

      // Escape: Close context menu and inspectors
      if (e.key === 'Escape') {
        closeContextMenu();
        closeInspector();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, duplicateNode, removeNode, removeEdge, selectedNodeId, selectedEdgeId, closeContextMenu, closeInspector, reactFlowInstance]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const stencilJson = event.dataTransfer.getData('application/aws-stencil');
      const serviceId = event.dataTransfer.getData('application/aws-service-id');

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (stencilJson) {
        try {
          const stencil = JSON.parse(stencilJson);
          if (stencil.type === 'service' && stencil.serviceId) {
            const service = services.find((s) => s.id === stencil.serviceId);
            if (service) addServiceNode(service, position);
          } else if (stencil.type === 'boundary' && stencil.boundaryType) {
            addBoundaryNode(stencil.boundaryType, stencil.label, position);
          } else if (stencil.type === 'actor' && stencil.actorType) {
            addExternalActor(stencil.actorType, stencil.label, position);
          } else if (stencil.type === 'annotation') {
            addAnnotationNode(stencil.title || 'Architecture Note', '', position);
          } else if (stencil.type === 'text-block') {
            addAnnotationNode(stencil.title || 'Architecture Section Header', '', position, {
              isTextOnly: true,
              fontSize: 18,
            });
          }
          return;
        } catch (e) {
          console.error('Failed to parse dropped stencil:', e);
        }
      }

      if (serviceId) {
        const service = services.find((s) => s.id === serviceId);
        if (service) {
          addServiceNode(service, position);
        }
      }
    },
    [reactFlowInstance, services, addServiceNode, addBoundaryNode, addExternalActor, addAnnotationNode]
  );

  // Dynamic Group Nesting when node is dragged into boundary container
  const handleNodeDragStop = useCallback(
    (_: unknown, draggedNode: any) => {
      if (draggedNode.data?.isBoundary) return;

      const allNodes = useCanvasStore.getState().nodes;
      const boundaryNodes = allNodes.filter(
        (n) => n.data?.isBoundary && n.id !== draggedNode.id
      );

      // Compute absolute position of draggedNode
      let absX = draggedNode.position.x;
      let absY = draggedNode.position.y;
      if (draggedNode.parentId) {
        const parent = allNodes.find((n) => n.id === draggedNode.parentId);
        if (parent) {
          absX += parent.position.x;
          absY += parent.position.y;
        }
      }

      const nodeW = (draggedNode.data?.width as number) || 144;
      const nodeH = (draggedNode.data?.height as number) || 80;
      const centerX = absX + nodeW / 2;
      const centerY = absY + nodeH / 2;

      // Find all boundaries enclosing this node's center
      const matchingBoundaries = boundaryNodes.filter((b) => {
        const bW = (b.data?.width as number) || (b.style?.width as number) || 540;
        const bH = (b.data?.height as number) || (b.style?.height as number) || 340;
        return (
          centerX >= b.position.x &&
          centerX <= b.position.x + bW &&
          centerY >= b.position.y &&
          centerY <= b.position.y + bH
        );
      });

      if (matchingBoundaries.length > 0) {
        // Pick innermost boundary (smallest area)
        matchingBoundaries.sort((a, b) => {
          const areaA = ((a.data?.width as number) || 540) * ((a.data?.height as number) || 340);
          const areaB = ((b.data?.width as number) || 540) * ((b.data?.height as number) || 340);
          return areaA - areaB;
        });
        const targetBoundary = matchingBoundaries[0];

        if (draggedNode.parentId !== targetBoundary.id) {
          const relX = Math.max(16, Math.round((absX - targetBoundary.position.x) / 16) * 16);
          const relY = Math.max(48, Math.round((absY - targetBoundary.position.y) / 16) * 16);

          useCanvasStore.getState().updateNodeParent(draggedNode.id, targetBoundary.id, {
            x: relX,
            y: relY,
          });
        }
      } else if (draggedNode.parentId) {
        // Dragged out of boundary container
        useCanvasStore.getState().updateNodeParent(draggedNode.id, undefined, {
          x: absX,
          y: absY,
        });
      }
    },
    []
  );

  const handleTriggerAutoLayout = (direction: 'LR' | 'TB') => {
    setIsArranging(true);
    autoLayout(direction);
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.18, duration: 250 });
      setIsArranging(false);
    }, 220);
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
      {/* Dual-Mode Left Sidebar: AWS Catalog & Diagram Stencils */}
      <CanvasSidebar />

      {/* Main Canvas Viewport Area */}
      <div className="flex-1 h-full relative flex flex-col min-w-0">
        {/* Slim Top Context Header */}
        <div
          style={{
            backgroundColor: 'var(--aws-card-bg)',
            borderBottomColor: 'var(--aws-border)',
          }}
          className="h-11 border-b px-4 flex items-center justify-between gap-3 shrink-0 relative z-40 bg-[var(--aws-card-bg)] select-none"
        >
          {/* Left Cluster: Sidebar Expand (if collapsed), Blueprint Switcher, Single Save-As Action, and Auto-Save Status */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0">
            {!isCanvasSidebarOpen && (
              <button
                type="button"
                onClick={() => setIsCanvasSidebarOpen(true)}
                className="h-8 px-2.5 rounded-[6px] border border-[#D5DBDB] dark:border-[#354150] bg-[var(--aws-card-bg)] hover:bg-[var(--aws-page-bg)] hover:border-[#FF9900] text-[var(--aws-text-muted)] hover:text-[#FF9900] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0 group"
                title="Open Stencils & Catalog Sidebar"
                aria-label="Open Stencils & Catalog Sidebar"
              >
                <ChevronRight className="w-3.5 h-3.5 text-[var(--aws-text-muted)] group-hover:text-[#FF9900] transition-colors" />
                <span className="text-[11px] font-semibold text-[var(--aws-text-primary)] group-hover:text-[#FF9900]">Stencils</span>
              </button>
            )}

            <BlueprintManagerDropdown />

            {/* Save As Custom Blueprint Button */}
            <div className="relative">
              <button
                ref={saveAsTriggerRef}
                type="button"
                onClick={() => togglePopover('canvas-save-as')}
                className="h-8 px-2.5 text-[11px] font-medium rounded-[6px] border border-[var(--aws-border)] hover:border-[var(--aws-interactive)] hover:text-[var(--aws-interactive)] text-[var(--aws-text-muted)] bg-[var(--aws-card-bg)] hover:bg-[var(--aws-page-bg)] flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                title="Save current architecture graph as a Custom Blueprint"
              >
                <Save className="w-3.5 h-3.5 text-[#1D8102]" />
                <span className="hidden sm:inline">Save as...</span>
              </button>

              <AnimatedPopover
                isOpen={isSaveAsOpen}
                onClose={() => closePopover('canvas-save-as')}
                triggerRef={saveAsTriggerRef}
                align="left"
                className="w-72 p-2.5 space-y-2"
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

            {/* Canvas Auto-Save Indicator */}
            <div
              className="flex items-center text-[11px] font-mono px-2 py-0.5 rounded select-none"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <div
                className={`inline-flex items-center gap-1.5 transition-opacity duration-200 ${saveStatus === 'idle' ? 'opacity-0' : 'opacity-100'
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

          {/* Right Cluster: Undo/Redo, Zoom/Fit View, Export Menu, Fullscreen */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Undo / Redo Actions */}
            <div className="flex items-center border border-[var(--aws-input-border)] rounded-[6px] overflow-hidden h-8 bg-[var(--aws-card-bg)] shadow-2xs">
              <button
                type="button"
                onClick={undo}
                disabled={!canUndo}
                className="size-8 flex items-center justify-center text-[var(--aws-text-primary)] disabled:text-[var(--aws-text-muted)]/35 hover:bg-[var(--aws-page-bg)] disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-colors"
                title="Undo (Ctrl+Z)"
                aria-label="Undo"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={!canRedo}
                className="size-8 flex items-center justify-center text-[var(--aws-text-primary)] disabled:text-[var(--aws-text-muted)]/35 hover:bg-[var(--aws-page-bg)] disabled:hover:bg-transparent border-l border-[var(--aws-border)] cursor-pointer disabled:cursor-not-allowed transition-colors"
                title="Redo (Ctrl+Y)"
                aria-label="Redo"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Canvas Zoom & View Controls */}
            <div className="flex items-center border border-[var(--aws-input-border)] rounded-[6px] overflow-hidden h-8 bg-[var(--aws-card-bg)] shadow-2xs">
              <button
                type="button"
                onClick={() => reactFlowInstance.zoomOut({ duration: 250 })}
                className="size-8 flex items-center justify-center text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] cursor-pointer transition-colors"
                title="Zoom out"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => reactFlowInstance.zoomTo(1, { duration: 250 })}
                className="px-2 h-full text-[11px] font-mono tabular-nums text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] border-x border-[var(--aws-border)] cursor-pointer transition-colors"
                title="Click to reset zoom to 100%"
              >
                {zoomPercent}%
              </button>
              <button
                type="button"
                onClick={() => reactFlowInstance.zoomIn({ duration: 250 })}
                className="size-8 flex items-center justify-center text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] cursor-pointer transition-colors"
                title="Zoom in"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => reactFlowInstance.fitView({ padding: 0.18, duration: 250 })}
                className="size-8 flex items-center justify-center text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] border-l border-[var(--aws-border)] cursor-pointer transition-colors"
                title="Fit diagram to view"
                aria-label="Fit diagram to view"
              >
                <Maximize className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Architecture Bill of Materials (BOM) Popover */}
            <div className="relative">
              <button
                ref={bomTriggerRef}
                type="button"
                onClick={() => togglePopover('canvas-bom')}
                data-open={isBomOpen ? 'true' : 'false'}
                className={`h-8 px-2.5 rounded-[6px] border text-[12px] font-medium text-[var(--aws-text-primary)] bg-[var(--aws-card-bg)] hover:bg-[var(--aws-page-bg)] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${isBomOpen
                  ? 'border-[var(--aws-interactive)] ring-1 ring-[var(--aws-interactive)]/20'
                  : 'border-[var(--aws-border)] hover:border-[var(--aws-interactive)]'
                  }`}
                title="Open Architecture Bill of Materials (BOM)"
                aria-label="Open Bill of Materials"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#FF9900]" />
                <span className="hidden sm:inline">BOM</span>
                <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-[var(--aws-page-bg)] border border-[var(--aws-border)] text-[var(--aws-text-muted)]">
                  {nodes.length}
                </span>
              </button>

              <CanvasBomPopover
                isOpen={isBomOpen}
                onClose={() => closePopover('canvas-bom')}
                triggerRef={bomTriggerRef}
              />
            </div>

            {/* Export Menu */}
            <div className="relative">
              <button
                ref={exportTriggerRef}
                type="button"
                onClick={() => togglePopover('canvas-export')}
                data-open={isExportOpen ? 'true' : 'false'}
                className={`h-8 px-2.5 rounded-[6px] border text-[12px] font-medium text-[var(--aws-text-primary)] bg-[var(--aws-card-bg)] hover:bg-[var(--aws-page-bg)] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${isExportOpen
                  ? 'border-[var(--aws-interactive)] ring-1 ring-[var(--aws-interactive)]/20'
                  : 'border-[var(--aws-border)] hover:border-[var(--aws-interactive)]'
                  }`}
                title="Export diagram (PNG, SVG, JSON)"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
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
                className="p-0 overflow-hidden shadow-xl"
              >
                <DiagramExportPopover
                  reactFlowWrapperRef={reactFlowWrapper}
                  markdownSpec={markdownSpec}
                  onClose={() => closePopover('canvas-export')}
                />
              </AnimatedPopover>
            </div>

            {/* Fullscreen / Zen Mode Toggle */}
            {isCanvasFullscreen ? (
              <button
                type="button"
                onClick={toggleCanvasFullscreen}
                className="h-8 px-2.5 rounded-[6px] bg-[#FF9900]/15 border border-[#FF9900]/40 text-[#FF9900] hover:bg-[#FF9900]/25 flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer shadow-xs transition-colors shrink-0"
                title="Exit Zen / Fullscreen Mode (Shift+F)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Zen (Shift+F)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={toggleCanvasFullscreen}
                className="size-8 rounded-[6px] border border-[var(--aws-input-border)] bg-[var(--aws-card-bg)] text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] flex items-center justify-center cursor-pointer shadow-2xs transition-colors shrink-0"
                title="Zen Mode / Fullscreen (Shift+F)"
                aria-label="Toggle fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* React Flow Core Canvas Viewport (Stacking Isolated) */}
        <div className="flex-1 h-full relative z-0 isolate">
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
            className={`w-full h-full transition-opacity duration-200 ${isArranging ? 'opacity-75' : 'opacity-100'
              } ${isCanvasPanning ? 'is-canvas-panning' : ''}`}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            colorMode={theme}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onConnectEnd={handleConnectEnd}
            onDragOver={onDragOver}
            onDrop={onDrop}
            selectionOnDrag={true}
            panOnDrag={[1, 2]}
            selectionMode={SelectionMode.Partial}
            multiSelectionKeyCode={['Shift', 'Meta', 'Control']}
            onNodeDragStop={handleNodeDragStop}
              onMoveStart = {(event) => {
                if (event && ('button' in event || 'buttons' in event)) {
                  const me = event as MouseEvent;
          if (me.button === 2 || me.button === 1 || (me.buttons && ((me.buttons & 2) !== 0 || (me.buttons & 4) !== 0))) {
            setIsCanvasPanning(true);
                  }
                }
              }}
          onMove={(event, vp) => {
            setZoomPercent(Math.round(vp.zoom * 100));
            if (event && 'buttons' in event) {
              const me = event as MouseEvent;
              if ((me.buttons & 2) !== 0 || (me.buttons & 4) !== 0) {
                setIsCanvasPanning(true);
              }
            }
          }}
          onMoveEnd={() => {
            panStartRef.current = null;
            setIsCanvasPanning(false);
          }}
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
            panStartRef.current = null;
            setIsCanvasPanning(false);
            openContextMenu({
              x: e.clientX,
              y: e.clientY,
              type: 'node',
              targetId: node.id,
            });
          }}
          onEdgeContextMenu={(e, edge) => {
            e.preventDefault();
            panStartRef.current = null;
            setIsCanvasPanning(false);
            openContextMenu({
              x: e.clientX,
              y: e.clientY,
              type: 'edge',
              targetId: edge.id,
            });
          }}
          onPaneContextMenu={(e) => {
            e.preventDefault();
            panStartRef.current = null;
            setIsCanvasPanning(false);
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

      {/* Unified Floating Studio Dock (Context-Sensitive & Responsive) */}
      <CanvasFormatBar
        onFitView={() => reactFlowInstance.fitView({ padding: 0.18, duration: 250 })}
        onAutoLayout={(dir) => handleTriggerAutoLayout(dir)}
        layoutDirection={layoutDirection}
        onChangeLayoutDirection={setLayoutDirection}
        isArranging={isArranging}
      />
    </div>
      </div >

  {/* Right Context Menu Floating Popover */ }
  < CanvasContextMenu />

  {/* Docked Resizable Dual-Tab Split Panel */ }
  < NodeInspectorDrawer />

  {/* Drop Wire on Empty Canvas - Quick Connect Node Spawner */ }
  < QuickConnectPopover
isOpen = { quickConnectState.isOpen }
onClose = {() => setQuickConnectState((s) => ({ ...s, isOpen: false }))}
sourceNodeId = { quickConnectState.sourceNodeId }
sourceNodeLabel = { quickConnectState.sourceNodeLabel }
sourceServiceId = { quickConnectState.sourceServiceId }
sourceCategory = { quickConnectState.sourceCategory }
sourceHandleId = { quickConnectState.sourceHandleId }
screenPosition = { quickConnectState.screenPosition }
flowPosition = { quickConnectState.flowPosition }
onSelectTarget = { handleQuickConnectSelectTarget }
  />
    </div >
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
