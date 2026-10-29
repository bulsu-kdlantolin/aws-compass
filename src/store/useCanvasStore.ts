import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react';
import type {
  AWSService,
  CanvasEdgeItem,
  CanvasNodeItem,
  CanvasNodeData,
  CanvasEdgeData,
  Diagram,
  EdgeProtocol,
  GroupBoundaryType,
  StudyStatus,
  ExternalActorType,
} from '../types/aws';
import {
  deleteDiagram as dbDeleteDiagram,
  getAllDiagrams as dbGetAllDiagrams,
  getDiagramById as dbGetDiagramById,
  saveDiagram as dbSaveDiagram,
} from '../db/compassDb';
import { ARCHITECTURE_TEMPLATES } from '../components/canvas/canvasTemplates';
import { SEED_BLUEPRINTS } from '../db/seedBlueprints';
import { getLayoutedElements, resolveOptimalHandles } from '../utils/canvasAutoLayout';

let debounceSaveTimer: ReturnType<typeof setTimeout> | null = null;
let resetSavedStatusTimer: ReturnType<typeof setTimeout> | null = null;

export type CanvasSaveStatus = 'idle' | 'saving' | 'saved';

export interface CanvasHistorySnapshot {
  nodes: CanvasNodeItem[];
  edges: CanvasEdgeItem[];
  activeDiagramId: string;
  activeDiagramName: string;
}

const MAX_HISTORY = 30;

function takeSnapshot(nodes: CanvasNodeItem[], edges: CanvasEdgeItem[], activeDiagramId: string, activeDiagramName: string): CanvasHistorySnapshot {
  return {
    nodes: JSON.parse(JSON.stringify(nodes)),
    edges: JSON.parse(JSON.stringify(edges)),
    activeDiagramId,
    activeDiagramName,
  };
}

/**
 * Debounced background sync to the Dexie.js diagrams table.
 * Avoids disk I/O on every drag frame per aws-compass-core specification.
 */
function scheduleDebouncedAutoSave(
  nodes: CanvasNodeItem[],
  edges: CanvasEdgeItem[],
  set: (state: Partial<CanvasState> | ((prev: CanvasState) => Partial<CanvasState>)) => void
) {
  set({ saveStatus: 'saving' });

  if (debounceSaveTimer) {
    clearTimeout(debounceSaveTimer);
  }
  if (resetSavedStatusTimer) {
    clearTimeout(resetSavedStatusTimer);
  }

  debounceSaveTimer = setTimeout(async () => {
    try {
      await dbSaveDiagram({
        id: 'active-canvas-diagram',
        name: 'Active Canvas (Auto-Save)',
        description: 'Automatic snapshot of active workspace canvas',
        nodes,
        edges,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      set({ saveStatus: 'saved' });
      resetSavedStatusTimer = setTimeout(() => {
        set({ saveStatus: 'idle' });
      }, 2500);
    } catch {
      set({ saveStatus: 'idle' });
    }
  }, 800);
}

export interface CanvasContextMenuState {
  x: number;
  y: number;
  type: 'node' | 'edge' | 'canvas';
  targetId?: string;
}

export interface CanvasState {
  // Active Canvas State
  nodes: CanvasNodeItem[];
  edges: CanvasEdgeItem[];
  activeDiagramId: string;
  activeDiagramName: string;
  savedDiagrams: Diagram[];
  saveStatus: CanvasSaveStatus;

  // History & Undo/Redo Stacks
  past: CanvasHistorySnapshot[];
  future: CanvasHistorySnapshot[];
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  recordSnapshot: () => void;

  // Selection & Inspector State
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isInspectorOpen: boolean;
  inspectorActiveTab: 'properties' | 'dossier';

  // Context Menu State
  contextMenu: CanvasContextMenuState | null;
  openContextMenu: (menu: CanvasContextMenuState) => void;
  closeContextMenu: () => void;

  // React Flow Handlers
  onNodesChange: (changes: NodeChange<CanvasNodeItem>[]) => void;
  onEdgesChange: (changes: EdgeChange<CanvasEdgeItem>[]) => void;
  onConnect: (connection: Connection) => void;

  // Canvas Node/Edge Operations
  setNodes: (nodes: CanvasNodeItem[]) => void;
  setEdges: (edges: CanvasEdgeItem[]) => void;
  addServiceNode: (service: AWSService, position: { x: number; y: number }) => void;
  addBoundaryNode: (type: GroupBoundaryType, label?: string, position?: { x: number; y: number }) => void;
  addExternalActor: (type: ExternalActorType, label?: string, position?: { x: number; y: number }) => void;
  addAnnotationNode: (title?: string, content?: string, position?: { x: number; y: number }) => void;

  updateNodeProperties: (nodeId: string, updates: Partial<CanvasNodeData>) => void;
  updateNodeParent: (nodeId: string, parentId?: string) => void;
  updateNodeNotes: (nodeId: string, customNotes: string) => void;
  updateNodeStatus: (serviceId: string, status: StudyStatus) => void;

  updateEdgeProtocol: (edgeId: string, protocol: EdgeProtocol) => void;
  updateEdgeProperties: (
    edgeId: string,
    updates: Partial<CanvasEdgeData> & { label?: string; animated?: boolean; style?: Record<string, string | number> }
  ) => void;
  reverseEdgeDirection: (edgeId: string) => void;

  duplicateNode: (nodeId: string) => void;
  reorderNodeZ: (nodeId: string, direction: 'front' | 'back') => void;
  removeNode: (nodeId: string) => void;
  removeEdge: (edgeId: string) => void;
  clearCanvas: () => void;

  // Full Blueprint CRUD & Snapshots
  loadTemplate: (templateId: string) => void;
  createBlankBlueprint: () => void;
  forkCurrentBlueprint: (customName?: string) => Promise<string>;
  renameBlueprint: (id: string, newName: string) => Promise<void>;
  duplicateBlueprint: (id: string) => Promise<void>;
  deleteBlueprint: (id: string) => Promise<void>;
  saveCurrentAsBlueprint: (name: string) => Promise<void>;
  saveSnapshot: (customName?: string) => Promise<void>;
  loadSnapshot: (diagramId: string) => Promise<void>;
  deleteSnapshot: (diagramId: string) => Promise<void>;
  refreshSavedDiagrams: () => Promise<void>;
  initializeCanvas: () => Promise<void>;

  // Auto Layout
  autoLayout: (direction?: 'LR' | 'TB') => void;

  // Inspector Controls
  openInspector: (nodeId: string) => void;
  openNodeInspector: (nodeId: string, tab?: 'properties' | 'dossier') => void;
  openEdgeInspector: (edgeId: string) => void;
  closeInspector: () => void;
  setInspectorActiveTab: (tab: 'properties' | 'dossier') => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: SEED_BLUEPRINTS['serverless-microservice'].nodes,
  edges: SEED_BLUEPRINTS['serverless-microservice'].edges,
  activeDiagramId: 'serverless-microservice',
  activeDiagramName: 'Serverless Microservice',
  savedDiagrams: [],
  saveStatus: 'idle',

  // History Stacks
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  recordSnapshot: () => {
    const { nodes, edges, activeDiagramId, activeDiagramName, past } = get();
    const snapshot = takeSnapshot(nodes, edges, activeDiagramId, activeDiagramName);
    const newPast = [...past.slice(-(MAX_HISTORY - 1)), snapshot];
    set({
      past: newPast,
      future: [],
      canUndo: true,
      canRedo: false,
    });
  },

  undo: () => {
    const { past, future, nodes, edges, activeDiagramId, activeDiagramName } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    const currentSnapshot = takeSnapshot(nodes, edges, activeDiagramId, activeDiagramName);

    set({
      nodes: previous.nodes,
      edges: previous.edges,
      activeDiagramId: previous.activeDiagramId,
      activeDiagramName: previous.activeDiagramName,
      past: newPast,
      future: [currentSnapshot, ...future].slice(0, MAX_HISTORY),
      canUndo: newPast.length > 0,
      canRedo: true,
      selectedNodeId: null,
      selectedEdgeId: null,
    });
    scheduleDebouncedAutoSave(previous.nodes, previous.edges, set);
  },

  redo: () => {
    const { past, future, nodes, edges, activeDiagramId, activeDiagramName } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);
    const currentSnapshot = takeSnapshot(nodes, edges, activeDiagramId, activeDiagramName);

    set({
      nodes: next.nodes,
      edges: next.edges,
      activeDiagramId: next.activeDiagramId,
      activeDiagramName: next.activeDiagramName,
      past: [...past, currentSnapshot].slice(-MAX_HISTORY),
      future: newFuture,
      canUndo: true,
      canRedo: newFuture.length > 0,
      selectedNodeId: null,
      selectedEdgeId: null,
    });
    scheduleDebouncedAutoSave(next.nodes, next.edges, set);
  },

  selectedNodeId: null,
  selectedEdgeId: null,
  isInspectorOpen: false,
  inspectorActiveTab: 'properties',

  contextMenu: null,
  openContextMenu: (menu: CanvasContextMenuState) => {
    set({ contextMenu: menu });
  },
  closeContextMenu: () => {
    set({ contextMenu: null });
  },

  autoLayout: (direction: 'LR' | 'TB' = 'LR') => {
    get().recordSnapshot();
    const currentNodes = get().nodes;
    const currentEdges = get().edges;
    const result = getLayoutedElements(currentNodes, currentEdges, direction);
    set({ nodes: result.nodes, edges: result.edges });
    scheduleDebouncedAutoSave(result.nodes, result.edges, set);
  },

  initializeCanvas: async () => {
    try {
      const allSaved = await dbGetAllDiagrams();
      const userSaved = allSaved.filter((d) => d.id !== 'active-canvas-diagram');
      set({ savedDiagrams: userSaved });

      // Check if there is an active auto-saved diagram in Dexie
      const activeAutoSave = await dbGetDiagramById('active-canvas-diagram');
      if (activeAutoSave && activeAutoSave.nodes && activeAutoSave.nodes.length > 0) {
        const isKnownBlueprint = Object.values(SEED_BLUEPRINTS).find(
          (bp) => bp.name === activeAutoSave.name || bp.id === activeAutoSave.id
        );
        const hasMissingParents = activeAutoSave.nodes.some(
          (n) => !n.data?.isBoundary && !n.parentId && (n.id.startsWith('node-igw') || n.id.startsWith('node-cf') || n.id.startsWith('node-s3'))
        );

        if (isKnownBlueprint && hasMissingParents) {
          set({
            nodes: isKnownBlueprint.nodes,
            edges: isKnownBlueprint.edges,
            activeDiagramId: isKnownBlueprint.id,
            activeDiagramName: isKnownBlueprint.name,
          });
          scheduleDebouncedAutoSave(isKnownBlueprint.nodes, isKnownBlueprint.edges, set);
          return;
        }

        set({
          nodes: activeAutoSave.nodes,
          edges: activeAutoSave.edges,
          activeDiagramId: 'active-canvas-diagram',
          activeDiagramName: activeAutoSave.name || 'Active Canvas',
        });
      }
    } catch {
      // Fallback to default template
    }
  },

  onNodesChange: (changes: NodeChange<CanvasNodeItem>[]) => {
    set((state) => {
      const updatedNodes = applyNodeChanges(changes, state.nodes);
      const hasPositionChange = changes.some((c) => c.type === 'position');
      let updatedEdges = state.edges;

      if (hasPositionChange) {
        const nodeMap = new Map(updatedNodes.map((n) => [n.id, n]));
        updatedEdges = state.edges.map((e) => {
          const src = nodeMap.get(e.source);
          const tgt = nodeMap.get(e.target);
          if (src && tgt && !src.data?.isBoundary && !tgt.data?.isBoundary) {
            const optimal = resolveOptimalHandles(src, tgt);
            return {
              ...e,
              sourceHandle: optimal.sourceHandle,
              targetHandle: optimal.targetHandle,
            };
          }
          return e;
        });
      }

      scheduleDebouncedAutoSave(updatedNodes, updatedEdges, set);
      return { nodes: updatedNodes, edges: updatedEdges };
    });
  },

  onEdgesChange: (changes: EdgeChange<CanvasEdgeItem>[]) => {
    set((state) => {
      const updatedEdges = applyEdgeChanges(changes, state.edges);
      scheduleDebouncedAutoSave(state.nodes, updatedEdges, set);
      return { edges: updatedEdges };
    });
  },

  onConnect: (connection: Connection) => {
    if (!connection.source || !connection.target) return;
    get().recordSnapshot();
    const sourceNode = get().nodes.find((n) => n.id === connection.source);
    const targetNode = get().nodes.find((n) => n.id === connection.target);
    let sourceHandle = connection.sourceHandle;
    let targetHandle = connection.targetHandle;

    if ((!sourceHandle || !targetHandle) && sourceNode && targetNode) {
      const optimal = resolveOptimalHandles(sourceNode, targetNode);
      sourceHandle = sourceHandle || optimal.sourceHandle;
      targetHandle = targetHandle || optimal.targetHandle;
    }

    const defaultProtocol: EdgeProtocol = 'HTTPS/REST';
    const newEdge: CanvasEdgeItem = {
      id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: sourceHandle || 'right',
      targetHandle: targetHandle || 'left',
      protocol: defaultProtocol,
      label: defaultProtocol,
      animated: true,
      data: {
        protocol: defaultProtocol,
        label: defaultProtocol,
        lineStyle: 'solid',
        directionality: 'one-way',
        animated: true,
      },
    };

    set((state) => {
      const updatedEdges = [...state.edges, newEdge];
      scheduleDebouncedAutoSave(state.nodes, updatedEdges, set);
      return {
        edges: updatedEdges,
        selectedEdgeId: newEdge.id,
        selectedNodeId: null,
      };
    });
  },

  setNodes: (nodes: CanvasNodeItem[]) => {
    get().recordSnapshot();
    set({ nodes });
    scheduleDebouncedAutoSave(nodes, get().edges, set);
  },

  setEdges: (edges: CanvasEdgeItem[]) => {
    get().recordSnapshot();
    set({ edges });
    scheduleDebouncedAutoSave(get().nodes, edges, set);
  },

  addServiceNode: (service: AWSService, position: { x: number; y: number }) => {
    get().recordSnapshot();
    const newNode: CanvasNodeItem = {
      id: `node-${service.id}-${Date.now()}`,
      type: 'awsService',
      position,
      data: {
        serviceId: service.id,
        label: service.name,
        category: service.category,
        tier: service.tier,
        status: service.studyStatus,
        customNotes: service.summary,
        arnPattern: service.arnExample,
        customTitle: service.name,
        roleSubtitle: service.summary,
        env: 'None',
      },
    };

    set((state) => {
      const updatedNodes = [...state.nodes, newNode];
      scheduleDebouncedAutoSave(updatedNodes, state.edges, set);
      return {
        nodes: updatedNodes,
        selectedNodeId: newNode.id,
        selectedEdgeId: null,
        isInspectorOpen: true,
        inspectorActiveTab: 'properties',
      };
    });
  },

  addBoundaryNode: (type: GroupBoundaryType, label?: string, position?: { x: number; y: number }) => {
    get().recordSnapshot();
    const defaultLabels: Record<GroupBoundaryType, string> = {
      'aws-cloud': 'AWS Cloud Region (us-east-1)',
      region: 'Region Boundary (us-east-1)',
      vpc: 'VPC (10.0.0.0/16)',
      'public-subnet': 'Public Subnet (10.0.1.0/24)',
      'private-subnet': 'Application Private Subnet (10.0.2.0/24)',
      'data-subnet': 'Database Isolated Subnet (10.0.3.0/24)',
      'security-group': 'Security Group (sg-app-tier)',
      'auto-scaling-group': 'Auto Scaling Group Cluster',
      serverless: 'Managed Serverless Boundary',
      'corporate-datacenter': 'Corporate On-Premises Data Center',
    };

    const newGroupNode: CanvasNodeItem = {
      id: `group-${type}-${Date.now()}`,
      type: 'awsGroup',
      position: position || { x: 120, y: 120 },
      zIndex: -1,
      data: {
        serviceId: `group-${type}`,
        label: label || defaultLabels[type] || 'Boundary Group',
        category: 'Networking',
        tier: 1,
        status: 'not-started',
        isBoundary: true,
        boundaryType: type,
        boundaryLabel: label || defaultLabels[type] || 'Boundary Group',
        cidr: type === 'vpc' ? '10.0.0.0/16' : type.includes('subnet') ? '10.0.1.0/24' : undefined,
        width: type === 'aws-cloud' ? 900 : 540,
        height: type === 'aws-cloud' ? 520 : 340,
      },
    };

    set((state) => {
      const updatedNodes = [newGroupNode, ...state.nodes];
      scheduleDebouncedAutoSave(updatedNodes, state.edges, set);
      return {
        nodes: updatedNodes,
        selectedNodeId: newGroupNode.id,
        selectedEdgeId: null,
        isInspectorOpen: true,
        inspectorActiveTab: 'properties',
      };
    });
  },

  addExternalActor: (type: ExternalActorType, label?: string, position?: { x: number; y: number }) => {
    get().recordSnapshot();
    const actorLabels: Record<ExternalActorType, { label: string; role: string }> = {
      'user-browser': { label: 'User / Client Browser', role: 'HTTPS / Web Traffic Ingress' },
      'mobile-client': { label: 'Mobile / IoT Client', role: 'REST / WebSocket Device Client' },
      'corporate-datacenter': { label: 'Corporate Data Center', role: 'Direct Connect / Site-to-Site VPN' },
      'external-webhook': { label: 'External Webhook / API', role: '3rd-Party Partner Payload Ingress' },
    };

    const meta = actorLabels[type] || { label: 'External Actor', role: 'External Traffic Source' };

    const newActorNode: CanvasNodeItem = {
      id: `actor-${type}-${Date.now()}`,
      type: 'awsService',
      position: position || { x: 100, y: 160 },
      data: {
        serviceId: `actor-${type}`,
        label: label || meta.label,
        category: 'Networking',
        tier: 1,
        status: 'not-started',
        isActor: true,
        actorType: type,
        customTitle: label || meta.label,
        roleSubtitle: meta.role,
        customNotes: meta.role,
        env: 'None',
      },
    };

    set((state) => {
      const updatedNodes = [...state.nodes, newActorNode];
      scheduleDebouncedAutoSave(updatedNodes, state.edges, set);
      return {
        nodes: updatedNodes,
        selectedNodeId: newActorNode.id,
        selectedEdgeId: null,
        isInspectorOpen: true,
        inspectorActiveTab: 'properties',
      };
    });
  },

  addAnnotationNode: (title?: string, content?: string, position?: { x: number; y: number }) => {
    get().recordSnapshot();
    const newNoteNode: CanvasNodeItem = {
      id: `note-${Date.now()}`,
      type: 'annotationNode',
      position: position || { x: 160, y: 160 },
      data: {
        serviceId: 'architecture-note',
        label: title || 'Architecture Note',
        category: 'Serverless',
        tier: 1,
        status: 'not-started',
        isAnnotation: true,
        annotationTitle: title || 'Architecture Note',
        annotationContent: content || 'Add infrastructure decisions, security rules, or SLA targets here.',
        annotationColor: 'amber',
        width: 220,
        height: 140,
      },
    };

    set((state) => {
      const updatedNodes = [...state.nodes, newNoteNode];
      scheduleDebouncedAutoSave(updatedNodes, state.edges, set);
      return {
        nodes: updatedNodes,
        selectedNodeId: newNoteNode.id,
        selectedEdgeId: null,
        isInspectorOpen: true,
        inspectorActiveTab: 'properties',
      };
    });
  },

  updateNodeProperties: (nodeId: string, updates: Partial<CanvasNodeData>) => {
    get().recordSnapshot();
    set((state) => {
      const updatedNodes = state.nodes.map((n) => {
        if (n.id !== nodeId) return n;
        const mergedData: CanvasNodeData = {
          ...n.data,
          ...updates,
          label: updates.customTitle || updates.boundaryLabel || updates.label || n.data.label,
          customNotes: updates.roleSubtitle || updates.customNotes || n.data.customNotes,
        };
        return {
          ...n,
          data: mergedData,
        };
      });
      scheduleDebouncedAutoSave(updatedNodes, state.edges, set);
      return { nodes: updatedNodes };
    });
  },

  updateNodeParent: (nodeId: string, parentId?: string) => {
    get().recordSnapshot();
    set((state) => {
      const updatedNodes = state.nodes.map((n) => {
        if (n.id !== nodeId) return n;
        if (!parentId || parentId === 'none') {
          const { parentId: _, ...rest } = n;
          return rest as CanvasNodeItem;
        }
        return { ...n, parentId };
      });
      scheduleDebouncedAutoSave(updatedNodes, state.edges, set);
      return { nodes: updatedNodes };
    });
  },

  updateNodeNotes: (nodeId: string, customNotes: string) => {
    get().recordSnapshot();
    set((state) => {
      const updatedNodes = state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, customNotes, roleSubtitle: customNotes } } : n
      );
      scheduleDebouncedAutoSave(updatedNodes, state.edges, set);
      return { nodes: updatedNodes };
    });
  },

  updateNodeStatus: (serviceId: string, status: StudyStatus) => {
    get().recordSnapshot();
    set((state) => {
      const updatedNodes = state.nodes.map((n) =>
        n.data.serviceId === serviceId ? { ...n, data: { ...n.data, status } } : n
      );
      scheduleDebouncedAutoSave(updatedNodes, state.edges, set);
      return { nodes: updatedNodes };
    });
  },

  updateEdgeProtocol: (edgeId: string, protocol: EdgeProtocol) => {
    get().recordSnapshot();
    set((state) => {
      const updatedEdges = state.edges.map((e) =>
        e.id === edgeId
          ? {
            ...e,
            protocol,
            label: e.data?.customLabel || protocol,
            animated: e.data?.animated ?? (protocol === 'Event Trigger' || protocol === 'HTTPS/REST'),
            data: { ...e.data, protocol, label: e.data?.customLabel || protocol },
          }
          : e
      );
      scheduleDebouncedAutoSave(state.nodes, updatedEdges, set);
      return { edges: updatedEdges };
    });
  },

  updateEdgeProperties: (
    edgeId: string,
    updates: Partial<CanvasEdgeData> & { label?: string; animated?: boolean; style?: Record<string, string | number> }
  ) => {
    get().recordSnapshot();
    set((state) => {
      const updatedEdges = state.edges.map((e) => {
        if (e.id !== edgeId) return e;
        const newProtocol = updates.protocol || e.protocol;
        const resolvedLabel = updates.customLabel || updates.label || e.data?.customLabel || e.label || newProtocol;
        const isAnimated = updates.animated !== undefined ? updates.animated : e.animated;
        return {
          ...e,
          protocol: newProtocol,
          label: resolvedLabel,
          animated: isAnimated,
          style: { ...e.style, ...updates.style },
          data: {
            ...e.data,
            ...updates,
            protocol: newProtocol,
            label: resolvedLabel,
            customLabel: updates.customLabel !== undefined ? updates.customLabel : e.data?.customLabel,
            animated: isAnimated,
          },
        };
      });
      scheduleDebouncedAutoSave(state.nodes, updatedEdges, set);
      return { edges: updatedEdges };
    });
  },

  reverseEdgeDirection: (edgeId: string) => {
    get().recordSnapshot();
    set((state) => {
      const updatedEdges = state.edges.map((e) => {
        if (e.id !== edgeId) return e;
        return {
          ...e,
          source: e.target,
          target: e.source,
          sourceHandle: e.targetHandle,
          targetHandle: e.sourceHandle,
        };
      });
      scheduleDebouncedAutoSave(state.nodes, updatedEdges, set);
      return { edges: updatedEdges };
    });
  },

  duplicateNode: (nodeId: string) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    if (!node) return;
    get().recordSnapshot();

    const timestamp = Date.now();
    const clonedNode: CanvasNodeItem = {
      ...node,
      id: `${node.id}-copy-${timestamp}`,
      position: {
        x: node.position.x + 36,
        y: node.position.y + 36,
      },
      data: {
        ...node.data,
        label: `${node.data.label} (Copy)`,
        customTitle: node.data.customTitle ? `${node.data.customTitle} (Copy)` : undefined,
      },
    };

    set((state) => {
      const updatedNodes = [...state.nodes, clonedNode];
      scheduleDebouncedAutoSave(updatedNodes, state.edges, set);
      return {
        nodes: updatedNodes,
        selectedNodeId: clonedNode.id,
        selectedEdgeId: null,
      };
    });
  },

  reorderNodeZ: (nodeId: string, direction: 'front' | 'back') => {
    get().recordSnapshot();
    set((state) => {
      const nodeIndex = state.nodes.findIndex((n) => n.id === nodeId);
      if (nodeIndex === -1) return state;
      const targetNode = state.nodes[nodeIndex];
      const remainingNodes = state.nodes.filter((n) => n.id !== nodeId);

      const updatedNodes =
        direction === 'front'
          ? [...remainingNodes, targetNode]
          : [targetNode, ...remainingNodes];

      scheduleDebouncedAutoSave(updatedNodes, state.edges, set);
      return { nodes: updatedNodes };
    });
  },

  removeNode: (nodeId: string) => {
    get().recordSnapshot();
    set((state) => {
      const updatedNodes = state.nodes.filter((n) => n.id !== nodeId);
      const updatedEdges = state.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      );
      scheduleDebouncedAutoSave(updatedNodes, updatedEdges, set);
      return {
        nodes: updatedNodes,
        edges: updatedEdges,
        selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        isInspectorOpen: state.selectedNodeId === nodeId ? false : state.isInspectorOpen,
      };
    });
  },

  removeEdge: (edgeId: string) => {
    get().recordSnapshot();
    set((state) => {
      const updatedEdges = state.edges.filter((e) => e.id !== edgeId);
      scheduleDebouncedAutoSave(state.nodes, updatedEdges, set);
      return {
        edges: updatedEdges,
        selectedEdgeId: state.selectedEdgeId === edgeId ? null : state.selectedEdgeId,
        isInspectorOpen: state.selectedEdgeId === edgeId ? false : state.isInspectorOpen,
      };
    });
  },

  clearCanvas: () => {
    get().recordSnapshot();
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      isInspectorOpen: false,
    });
    scheduleDebouncedAutoSave([], [], set);
  },

  createBlankBlueprint: () => {
    get().recordSnapshot();
    const id = `custom-blueprint-${Date.now()}`;
    const name = 'Untitled Blueprint';
    set({
      nodes: [],
      edges: [],
      activeDiagramId: id,
      activeDiagramName: name,
      selectedNodeId: null,
      selectedEdgeId: null,
      isInspectorOpen: false,
    });
    scheduleDebouncedAutoSave([], [], set);
  },

  forkCurrentBlueprint: async (customName?: string) => {
    const currentNodes = get().nodes;
    const currentEdges = get().edges;
    const timestamp = Date.now();
    const name = customName?.trim() || `${get().activeDiagramName} (Custom)`;
    const id = `custom-blueprint-${timestamp}`;

    const newDiagram: Diagram = {
      id,
      name,
      description: `Custom architecture blueprint created by user.`,
      nodes: currentNodes,
      edges: currentEdges,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await dbSaveDiagram(newDiagram);
    const all = await dbGetAllDiagrams();
    const userSaved = all.filter((d) => d.id !== 'active-canvas-diagram');

    set({
      savedDiagrams: userSaved,
      activeDiagramId: id,
      activeDiagramName: name,
    });

    return id;
  },

  renameBlueprint: async (id: string, newName: string) => {
    const target = await dbGetDiagramById(id);
    if (target) {
      target.name = newName;
      target.updatedAt = Date.now();
      await dbSaveDiagram(target);
    }
    const all = await dbGetAllDiagrams();
    const userSaved = all.filter((d) => d.id !== 'active-canvas-diagram');

    set((state) => ({
      savedDiagrams: userSaved,
      activeDiagramName: state.activeDiagramId === id ? newName : state.activeDiagramName,
    }));
  },

  duplicateBlueprint: async (id: string) => {
    let sourceDiagram: Diagram | undefined = await dbGetDiagramById(id);
    if (!sourceDiagram) {
      // Check seed blueprints
      const seed = Object.values(SEED_BLUEPRINTS).find((b) => b.id === id);
      if (seed) {
        sourceDiagram = {
          id: seed.id,
          name: seed.name,
          description: seed.description,
          nodes: seed.nodes,
          edges: seed.edges,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      }
    }

    if (!sourceDiagram) return;

    const timestamp = Date.now();
    const duplicatedId = `custom-blueprint-${timestamp}`;
    const duplicatedName = `${sourceDiagram.name} (Copy)`;

    const newDiagram: Diagram = {
      id: duplicatedId,
      name: duplicatedName,
      description: sourceDiagram.description,
      nodes: JSON.parse(JSON.stringify(sourceDiagram.nodes)),
      edges: JSON.parse(JSON.stringify(sourceDiagram.edges)),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await dbSaveDiagram(newDiagram);
    const all = await dbGetAllDiagrams();
    const userSaved = all.filter((d) => d.id !== 'active-canvas-diagram');

    set({
      savedDiagrams: userSaved,
      nodes: newDiagram.nodes,
      edges: newDiagram.edges,
      activeDiagramId: duplicatedId,
      activeDiagramName: duplicatedName,
      selectedNodeId: null,
      selectedEdgeId: null,
      isInspectorOpen: false,
    });
    scheduleDebouncedAutoSave(newDiagram.nodes, newDiagram.edges, set);
  },

  deleteBlueprint: async (id: string) => {
    await dbDeleteDiagram(id);
    const all = await dbGetAllDiagrams();
    const userSaved = all.filter((d) => d.id !== 'active-canvas-diagram');

    // If currently active diagram was deleted, switch back to reference default
    if (get().activeDiagramId === id) {
      const defaultBp = SEED_BLUEPRINTS['serverless-microservice'];
      set({
        savedDiagrams: userSaved,
        nodes: defaultBp.nodes,
        edges: defaultBp.edges,
        activeDiagramId: defaultBp.id,
        activeDiagramName: defaultBp.name,
        selectedNodeId: null,
        selectedEdgeId: null,
        isInspectorOpen: false,
      });
      scheduleDebouncedAutoSave(defaultBp.nodes, defaultBp.edges, set);
    } else {
      set({ savedDiagrams: userSaved });
    }
  },

  saveCurrentAsBlueprint: async (name: string) => {
    const currentNodes = get().nodes;
    const currentEdges = get().edges;
    const timestamp = Date.now();
    const id = get().activeDiagramId.startsWith('custom-blueprint-')
      ? get().activeDiagramId
      : `custom-blueprint-${timestamp}`;

    const newDiagram: Diagram = {
      id,
      name: name.trim() || 'Untitled Blueprint',
      description: `Custom architecture blueprint with ${currentNodes.length} nodes and ${currentEdges.length} connections.`,
      nodes: currentNodes,
      edges: currentEdges,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await dbSaveDiagram(newDiagram);
    const all = await dbGetAllDiagrams();
    const userSaved = all.filter((d) => d.id !== 'active-canvas-diagram');

    set({
      savedDiagrams: userSaved,
      activeDiagramId: id,
      activeDiagramName: newDiagram.name,
    });
  },

  loadTemplate: (templateId: string) => {
    get().recordSnapshot();
    const canonicalMap: Record<string, string> = {
      'serverless-api': 'serverless-microservice',
      'three-tier-web': '3-tier-vpc',
      'event-pipeline': 'event-driven-pipeline',
      'container-fargate': 'containerized-fargate',
    };
    const resolvedId = canonicalMap[templateId] || templateId;
    const blueprint =
      SEED_BLUEPRINTS[resolvedId] ||
      SEED_BLUEPRINTS[templateId] ||
      ARCHITECTURE_TEMPLATES[templateId];

    if (blueprint) {
      set({
        nodes: blueprint.nodes,
        edges: blueprint.edges,
        activeDiagramId: blueprint.id,
        activeDiagramName: blueprint.name,
        selectedNodeId: null,
        selectedEdgeId: null,
        isInspectorOpen: false,
      });
      scheduleDebouncedAutoSave(blueprint.nodes, blueprint.edges, set);
    }
  },

  saveSnapshot: async (customName?: string) => {
    await get().saveCurrentAsBlueprint(customName || `Snapshot ${new Date().toLocaleTimeString()}`);
  },

  loadSnapshot: async (diagramId: string) => {
    const diagram = await dbGetDiagramById(diagramId);
    if (diagram) {
      get().recordSnapshot();
      set({
        nodes: diagram.nodes,
        edges: diagram.edges,
        activeDiagramId: diagram.id,
        activeDiagramName: diagram.name,
        selectedNodeId: null,
        selectedEdgeId: null,
        isInspectorOpen: false,
      });
      scheduleDebouncedAutoSave(diagram.nodes, diagram.edges, set);
    }
  },

  deleteSnapshot: async (diagramId: string) => {
    await get().deleteBlueprint(diagramId);
  },

  refreshSavedDiagrams: async () => {
    const all = await dbGetAllDiagrams();
    const userSaved = all.filter((d) => d.id !== 'active-canvas-diagram');
    set({ savedDiagrams: userSaved });
  },

  openInspector: (nodeId: string) => {
    set({
      selectedNodeId: nodeId,
      selectedEdgeId: null,
      isInspectorOpen: true,
      inspectorActiveTab: 'properties',
    });
  },

  openNodeInspector: (nodeId: string, tab: 'properties' | 'dossier' = 'properties') => {
    set({
      selectedNodeId: nodeId,
      selectedEdgeId: null,
      isInspectorOpen: true,
      inspectorActiveTab: tab,
    });
  },

  openEdgeInspector: (edgeId: string) => {
    set({
      selectedEdgeId: edgeId,
      selectedNodeId: null,
      isInspectorOpen: true,
      inspectorActiveTab: 'properties',
    });
  },

  closeInspector: () => {
    set({ isInspectorOpen: false });
  },

  setInspectorActiveTab: (tab: 'properties' | 'dossier') => {
    set({ inspectorActiveTab: tab });
  },
}));
