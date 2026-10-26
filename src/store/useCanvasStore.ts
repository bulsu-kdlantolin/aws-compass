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
  Diagram,
  EdgeProtocol,
  GroupBoundaryType,
  StudyStatus,
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

export interface CanvasState {
  // Active Canvas State
  nodes: CanvasNodeItem[];
  edges: CanvasEdgeItem[];
  activeDiagramId: string;
  activeDiagramName: string;
  savedDiagrams: Diagram[];
  saveStatus: CanvasSaveStatus;

  // Inspector & Selection State
  selectedNodeId: string | null;
  isInspectorOpen: boolean;

  // React Flow Handlers
  onNodesChange: (changes: NodeChange<CanvasNodeItem>[]) => void;
  onEdgesChange: (changes: EdgeChange<CanvasEdgeItem>[]) => void;
  onConnect: (connection: Connection) => void;

  // Canvas Node/Edge Operations
  setNodes: (nodes: CanvasNodeItem[]) => void;
  setEdges: (edges: CanvasEdgeItem[]) => void;
  addServiceNode: (service: AWSService, position: { x: number; y: number }) => void;
  addBoundaryNode: (type: GroupBoundaryType, label?: string, position?: { x: number; y: number }) => void;
  updateNodeNotes: (nodeId: string, customNotes: string) => void;
  updateNodeStatus: (serviceId: string, status: StudyStatus) => void;
  updateEdgeProtocol: (edgeId: string, protocol: EdgeProtocol) => void;
  removeNode: (nodeId: string) => void;
  removeEdge: (edgeId: string) => void;
  clearCanvas: () => void;

  // Template & Snapshot Management
  loadTemplate: (templateId: string) => void;
  saveSnapshot: (customName?: string) => Promise<void>;
  loadSnapshot: (diagramId: string) => Promise<void>;
  deleteSnapshot: (diagramId: string) => Promise<void>;
  refreshSavedDiagrams: () => Promise<void>;
  initializeCanvas: () => Promise<void>;

  // Auto Layout
  autoLayout: (direction?: 'LR' | 'TB') => void;

  // Inspector Controls
  openInspector: (nodeId: string) => void;
  closeInspector: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: SEED_BLUEPRINTS['serverless-microservice'].nodes,
  edges: SEED_BLUEPRINTS['serverless-microservice'].edges,
  activeDiagramId: 'serverless-microservice',
  activeDiagramName: 'Serverless Microservice',
  savedDiagrams: [],
  saveStatus: 'idle',

  selectedNodeId: null,
  isInspectorOpen: false,

  autoLayout: (direction: 'LR' | 'TB' = 'LR') => {
    const currentNodes = get().nodes;
    const currentEdges = get().edges;
    const result = getLayoutedElements(currentNodes, currentEdges, direction);
    set({ nodes: result.nodes, edges: result.edges });
    scheduleDebouncedAutoSave(result.nodes, result.edges, set);
  },

  initializeCanvas: async () => {
    try {
      const saved = await dbGetAllDiagrams();
      set({ savedDiagrams: saved });

      // Check if there is an active auto-saved diagram in Dexie
      const activeAutoSave = await dbGetDiagramById('active-canvas-diagram');
      if (activeAutoSave && activeAutoSave.nodes && activeAutoSave.nodes.length > 0) {
        // If saved nodes are missing parentId for known reference blueprints, re-sync with seed blueprints
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
      sourceHandle: (sourceHandle as any) || 'right',
      targetHandle: (targetHandle as any) || 'left',
      protocol: defaultProtocol,
      label: defaultProtocol,
      animated: true,
      data: { protocol: defaultProtocol, label: defaultProtocol },
    };

    set((state) => {
      const updatedEdges = [...state.edges, newEdge];
      scheduleDebouncedAutoSave(state.nodes, updatedEdges, set);
      return { edges: updatedEdges };
    });
  },

  setNodes: (nodes: CanvasNodeItem[]) => {
    set({ nodes });
    scheduleDebouncedAutoSave(nodes, get().edges, set);
  },

  setEdges: (edges: CanvasEdgeItem[]) => {
    set({ edges });
    scheduleDebouncedAutoSave(get().nodes, edges, set);
  },

  addServiceNode: (service: AWSService, position: { x: number; y: number }) => {
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
      },
    };

    set((state) => {
      const updatedNodes = [...state.nodes, newNode];
      scheduleDebouncedAutoSave(updatedNodes, state.edges, set);
      return {
        nodes: updatedNodes,
        selectedNodeId: newNode.id,
        isInspectorOpen: true,
      };
    });
  },

  addBoundaryNode: (type: GroupBoundaryType, label?: string, position?: { x: number; y: number }) => {
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
        width: 500,
        height: 320,
      },
    };

    set((state) => {
      // Prepend group node so it renders beneath child service nodes
      const updatedNodes = [newGroupNode, ...state.nodes];
      scheduleDebouncedAutoSave(updatedNodes, state.edges, set);
      return {
        nodes: updatedNodes,
        selectedNodeId: newGroupNode.id,
      };
    });
  },

  updateNodeNotes: (nodeId: string, customNotes: string) => {
    set((state) => {
      const updatedNodes = state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, customNotes } } : n
      );
      scheduleDebouncedAutoSave(updatedNodes, state.edges, set);
      return { nodes: updatedNodes };
    });
  },

  updateNodeStatus: (serviceId: string, status: StudyStatus) => {
    set((state) => {
      const updatedNodes = state.nodes.map((n) =>
        n.data.serviceId === serviceId ? { ...n, data: { ...n.data, status } } : n
      );
      scheduleDebouncedAutoSave(updatedNodes, state.edges, set);
      return { nodes: updatedNodes };
    });
  },

  updateEdgeProtocol: (edgeId: string, protocol: EdgeProtocol) => {
    set((state) => {
      const updatedEdges = state.edges.map((e) =>
        e.id === edgeId
          ? {
              ...e,
              protocol,
              label: protocol,
              animated: protocol === 'Event Trigger' || protocol === 'HTTPS/REST',
              data: { ...e.data, protocol, label: protocol },
            }
          : e
      );
      scheduleDebouncedAutoSave(state.nodes, updatedEdges, set);
      return { edges: updatedEdges };
    });
  },

  removeNode: (nodeId: string) => {
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
    set((state) => {
      const updatedEdges = state.edges.filter((e) => e.id !== edgeId);
      scheduleDebouncedAutoSave(state.nodes, updatedEdges, set);
      return { edges: updatedEdges };
    });
  },

  clearCanvas: () => {
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      isInspectorOpen: false,
    });
    scheduleDebouncedAutoSave([], [], set);
  },

  loadTemplate: (templateId: string) => {
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
        isInspectorOpen: false,
      });
      scheduleDebouncedAutoSave(blueprint.nodes, blueprint.edges, set);
    }
  },

  saveSnapshot: async (customName?: string) => {
    const currentNodes = get().nodes;
    const currentEdges = get().edges;
    const timestamp = Date.now();
    const name = customName?.trim() || `Snapshot ${new Date().toLocaleTimeString()}`;
    const id = `snapshot-${timestamp}`;

    const newDiagram: Diagram = {
      id,
      name,
      description: `User-saved architecture snapshot with ${currentNodes.length} nodes and ${currentEdges.length} connections.`,
      nodes: currentNodes,
      edges: currentEdges,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await dbSaveDiagram(newDiagram);
    const saved = await dbGetAllDiagrams();
    set({
      savedDiagrams: saved,
      activeDiagramId: id,
      activeDiagramName: name,
    });
  },

  loadSnapshot: async (diagramId: string) => {
    const diagram = await dbGetDiagramById(diagramId);
    if (diagram) {
      set({
        nodes: diagram.nodes,
        edges: diagram.edges,
        activeDiagramId: diagram.id,
        activeDiagramName: diagram.name,
        selectedNodeId: null,
        isInspectorOpen: false,
      });
      scheduleDebouncedAutoSave(diagram.nodes, diagram.edges, set);
    }
  },

  deleteSnapshot: async (diagramId: string) => {
    await dbDeleteDiagram(diagramId);
    const saved = await dbGetAllDiagrams();
    set({ savedDiagrams: saved });
  },

  refreshSavedDiagrams: async () => {
    const saved = await dbGetAllDiagrams();
    set({ savedDiagrams: saved });
  },

  openInspector: (nodeId: string) => {
    set({
      selectedNodeId: nodeId,
      isInspectorOpen: true,
    });
  },

  closeInspector: () => {
    set({ isInspectorOpen: false });
  },
}));
