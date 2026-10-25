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

let debounceSaveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Debounced background sync to the Dexie.js diagrams table.
 * Avoids disk I/O on every drag frame per aws-compass-core specification.
 */
function scheduleDebouncedAutoSave(nodes: CanvasNodeItem[], edges: CanvasEdgeItem[]) {
  if (debounceSaveTimer) {
    clearTimeout(debounceSaveTimer);
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
    } catch {
      // Ignore background persistence errors
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

  // Inspector Controls
  openInspector: (nodeId: string) => void;
  closeInspector: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: ARCHITECTURE_TEMPLATES['serverless-api'].nodes,
  edges: ARCHITECTURE_TEMPLATES['serverless-api'].edges,
  activeDiagramId: 'serverless-api',
  activeDiagramName: 'Serverless Event-Driven API',
  savedDiagrams: [],

  selectedNodeId: null,
  isInspectorOpen: false,

  initializeCanvas: async () => {
    try {
      const saved = await dbGetAllDiagrams();
      set({ savedDiagrams: saved });

      // Check if there is an active auto-saved diagram in Dexie
      const activeAutoSave = await dbGetDiagramById('active-canvas-diagram');
      if (activeAutoSave && activeAutoSave.nodes && activeAutoSave.nodes.length > 0) {
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
      scheduleDebouncedAutoSave(updatedNodes, state.edges);
      return { nodes: updatedNodes };
    });
  },

  onEdgesChange: (changes: EdgeChange<CanvasEdgeItem>[]) => {
    set((state) => {
      const updatedEdges = applyEdgeChanges(changes, state.edges);
      scheduleDebouncedAutoSave(state.nodes, updatedEdges);
      return { edges: updatedEdges };
    });
  },

  onConnect: (connection: Connection) => {
    if (!connection.source || !connection.target) return;
    const defaultProtocol: EdgeProtocol = 'HTTPS/REST';
    const newEdge: CanvasEdgeItem = {
      id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      protocol: defaultProtocol,
      label: defaultProtocol,
      animated: true,
      data: { protocol: defaultProtocol, label: defaultProtocol },
    };

    set((state) => {
      const updatedEdges = [...state.edges, newEdge];
      scheduleDebouncedAutoSave(state.nodes, updatedEdges);
      return { edges: updatedEdges };
    });
  },

  setNodes: (nodes: CanvasNodeItem[]) => {
    set({ nodes });
    scheduleDebouncedAutoSave(nodes, get().edges);
  },

  setEdges: (edges: CanvasEdgeItem[]) => {
    set({ edges });
    scheduleDebouncedAutoSave(get().nodes, edges);
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
      scheduleDebouncedAutoSave(updatedNodes, state.edges);
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
      vpc: 'VPC (10.0.0.0/16)',
      'public-subnet': 'Public Subnet (10.0.1.0/24)',
      'private-subnet': 'Application Private Subnet (10.0.2.0/24)',
      'data-subnet': 'Database Isolated Subnet (10.0.3.0/24)',
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
      scheduleDebouncedAutoSave(updatedNodes, state.edges);
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
      scheduleDebouncedAutoSave(updatedNodes, state.edges);
      return { nodes: updatedNodes };
    });
  },

  updateNodeStatus: (serviceId: string, status: StudyStatus) => {
    set((state) => {
      const updatedNodes = state.nodes.map((n) =>
        n.data.serviceId === serviceId ? { ...n, data: { ...n.data, status } } : n
      );
      scheduleDebouncedAutoSave(updatedNodes, state.edges);
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
      scheduleDebouncedAutoSave(state.nodes, updatedEdges);
      return { edges: updatedEdges };
    });
  },

  removeNode: (nodeId: string) => {
    set((state) => {
      const updatedNodes = state.nodes.filter((n) => n.id !== nodeId);
      const updatedEdges = state.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      );
      scheduleDebouncedAutoSave(updatedNodes, updatedEdges);
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
      scheduleDebouncedAutoSave(state.nodes, updatedEdges);
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
    scheduleDebouncedAutoSave([], []);
  },

  loadTemplate: (templateId: string) => {
    // Check SEED_BLUEPRINTS first (Phase 3 reference architectures)
    const blueprint = SEED_BLUEPRINTS[templateId];
    if (blueprint) {
      set({
        nodes: blueprint.nodes,
        edges: blueprint.edges,
        activeDiagramId: blueprint.id,
        activeDiagramName: blueprint.name,
        selectedNodeId: null,
        isInspectorOpen: false,
      });
      scheduleDebouncedAutoSave(blueprint.nodes, blueprint.edges);
      return;
    }

    // Fall back to ARCHITECTURE_TEMPLATES
    const template = ARCHITECTURE_TEMPLATES[templateId];
    if (template) {
      set({
        nodes: template.nodes,
        edges: template.edges,
        activeDiagramId: template.id,
        activeDiagramName: template.name,
        selectedNodeId: null,
        isInspectorOpen: false,
      });
      scheduleDebouncedAutoSave(template.nodes, template.edges);
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
      scheduleDebouncedAutoSave(diagram.nodes, diagram.edges);
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
