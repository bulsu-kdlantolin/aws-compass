import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react';
import type {
  AWSCategory,
  AWSService,
  CanvasEdgeItem,
  CanvasNodeItem,
  EdgeProtocol,
  ServiceFilterState,
  ServiceTier,
  StudyStatus,
  ThemeMode,
  WorkspaceMode,
} from '../types/aws';
import {
  getAllServices,
  getDiagramById,
  initializeDatabase,
  resetDatabaseToDefaults,
  saveDiagram,
  updateServiceDoc as dbUpdateServiceDoc,
  updateServiceStatus as dbUpdateServiceStatus,
} from '../db/compassDb';
import { ARCHITECTURE_TEMPLATES } from '../components/canvas/canvasTemplates';

let debounceSaveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleDebouncedDiagramSave(nodes: CanvasNodeItem[], edges: CanvasEdgeItem[]) {
  if (debounceSaveTimer) {
    clearTimeout(debounceSaveTimer);
  }
  debounceSaveTimer = setTimeout(async () => {
    try {
      await saveDiagram({
        id: 'active-canvas-diagram',
        name: 'Active Canvas',
        description: 'Auto-saved workspace diagram snapshot',
        nodes,
        edges,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch {
      // Ignore background persistence errors
    }
  }, 1000);
}

interface CompassState {
  // Catalog State
  services: AWSService[];
  selectedServiceId: string | null;
  isDbLoaded: boolean;
  filter: ServiceFilterState;

  // Workspace Mode & Theme State
  workspaceMode: WorkspaceMode;
  isSidebarOpen: boolean;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;

  // Canvas State (@xyflow/react)
  nodes: CanvasNodeItem[];
  edges: CanvasEdgeItem[];
  activeDiagramId: string | null;
  selectedNodeId: string | null;
  isInspectorOpen: boolean;

  // Actions
  initialize: () => Promise<void>;
  setSelectedServiceId: (id: string | null) => void;
  setSearch: (search: string) => void;
  setCategoryFilter: (category: AWSCategory | 'All') => void;
  setTierFilter: (tier: ServiceTier | 'All') => void;
  setStudyStatusFilter: (status: StudyStatus | 'All') => void;
  setWorkspaceMode: (mode: WorkspaceMode) => void;
  toggleSidebar: () => void;
  updateServiceStatus: (id: string, status: StudyStatus) => Promise<void>;
  updateServiceDoc: (id: string, markdownDoc: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  refreshServices: () => Promise<void>;

  // Canvas Actions
  setNodes: (nodes: CanvasNodeItem[]) => void;
  setEdges: (edges: CanvasEdgeItem[]) => void;
  onNodesChange: (changes: NodeChange<CanvasNodeItem>[]) => void;
  onEdgesChange: (changes: EdgeChange<CanvasEdgeItem>[]) => void;
  onConnect: (connection: Connection) => void;
  addServiceNode: (service: AWSService, position: { x: number; y: number }) => void;
  updateNodeNotes: (nodeId: string, customNotes: string) => void;
  updateEdgeProtocol: (edgeId: string, protocol: EdgeProtocol) => void;
  removeNode: (nodeId: string) => void;
  removeEdge: (edgeId: string) => void;
  clearCanvas: () => void;
  loadTemplate: (templateId: string) => void;
  openInspector: (nodeId: string) => void;
  closeInspector: () => void;
}

export const useCompassStore = create<CompassState>((set, get) => ({
  services: [],
  selectedServiceId: 's3',
  isDbLoaded: false,
  filter: {
    search: '',
    category: 'All',
    tier: 'All',
    studyStatus: 'All',
  },
  workspaceMode: 'vault',
  isSidebarOpen: true,
  theme:
    (typeof window !== 'undefined'
      ? (localStorage.getItem('aws-compass-theme') as ThemeMode)
      : null) || 'dark',

  setTheme: (theme: ThemeMode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aws-compass-theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    }
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  // Initial nodes/edges initialized with Serverless API template
  nodes: ARCHITECTURE_TEMPLATES['serverless-api'].nodes,
  edges: ARCHITECTURE_TEMPLATES['serverless-api'].edges,
  activeDiagramId: 'active-canvas-diagram',
  selectedNodeId: null,
  isInspectorOpen: false,

  initialize: async () => {
    // Apply saved theme to document element
    const initialTheme = get().theme;
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', initialTheme);
      if (initialTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    }

    await initializeDatabase();
    const services = await getAllServices();

    // Check if there is an active saved diagram in Dexie
    let initialNodes = ARCHITECTURE_TEMPLATES['serverless-api'].nodes;
    let initialEdges = ARCHITECTURE_TEMPLATES['serverless-api'].edges;
    try {
      const saved = await getDiagramById('active-canvas-diagram');
      if (saved && saved.nodes && saved.nodes.length > 0) {
        initialNodes = saved.nodes;
        initialEdges = saved.edges;
      }
    } catch {
      // Use fallback template
    }

    set({
      services,
      isDbLoaded: true,
      selectedServiceId: get().selectedServiceId || services[0]?.id || null,
      nodes: initialNodes,
      edges: initialEdges,
    });
  },

  setSelectedServiceId: (id: string | null) => {
    set({ selectedServiceId: id });
  },

  setSearch: (search: string) => {
    set((state) => ({ filter: { ...state.filter, search } }));
  },

  setCategoryFilter: (category: AWSCategory | 'All') => {
    set((state) => ({ filter: { ...state.filter, category } }));
  },

  setTierFilter: (tier: ServiceTier | 'All') => {
    set((state) => ({ filter: { ...state.filter, tier } }));
  },

  setStudyStatusFilter: (studyStatus: StudyStatus | 'All') => {
    set((state) => ({ filter: { ...state.filter, studyStatus } }));
  },

  setWorkspaceMode: (workspaceMode: WorkspaceMode) => {
    set({ workspaceMode });
  },

  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  updateServiceStatus: async (id: string, status: StudyStatus) => {
    await dbUpdateServiceStatus(id, status);
    set((state) => {
      const updatedServices = state.services.map((svc) =>
        svc.id === id ? { ...svc, studyStatus: status, updatedAt: Date.now() } : svc
      );
      // Synchronize any matching canvas nodes
      const updatedNodes = state.nodes.map((n) =>
        n.data.serviceId === id ? { ...n, data: { ...n.data, status } } : n
      );
      scheduleDebouncedDiagramSave(updatedNodes, state.edges);
      return {
        services: updatedServices,
        nodes: updatedNodes,
      };
    });
  },

  updateServiceDoc: async (id: string, markdownDoc: string) => {
    await dbUpdateServiceDoc(id, markdownDoc);
    set((state) => ({
      services: state.services.map((svc) =>
        svc.id === id ? { ...svc, markdownDoc, updatedAt: Date.now() } : svc
      ),
    }));
  },

  resetToDefaults: async () => {
    await resetDatabaseToDefaults();
    const services = await getAllServices();
    const defaultTemplate = ARCHITECTURE_TEMPLATES['serverless-api'];
    set({
      services,
      selectedServiceId: 's3',
      nodes: defaultTemplate.nodes,
      edges: defaultTemplate.edges,
      isInspectorOpen: false,
      selectedNodeId: null,
    });
    scheduleDebouncedDiagramSave(defaultTemplate.nodes, defaultTemplate.edges);
  },

  refreshServices: async () => {
    const services = await getAllServices();
    set({ services });
  },

  // Canvas Actions
  setNodes: (nodes: CanvasNodeItem[]) => {
    set({ nodes });
    scheduleDebouncedDiagramSave(nodes, get().edges);
  },

  setEdges: (edges: CanvasEdgeItem[]) => {
    set({ edges });
    scheduleDebouncedDiagramSave(get().nodes, edges);
  },

  onNodesChange: (changes: NodeChange<CanvasNodeItem>[]) => {
    set((state) => {
      const updatedNodes = applyNodeChanges(changes, state.nodes);
      scheduleDebouncedDiagramSave(updatedNodes, state.edges);
      return { nodes: updatedNodes };
    });
  },

  onEdgesChange: (changes: EdgeChange<CanvasEdgeItem>[]) => {
    set((state) => {
      const updatedEdges = applyEdgeChanges(changes, state.edges);
      scheduleDebouncedDiagramSave(state.nodes, updatedEdges);
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
      scheduleDebouncedDiagramSave(state.nodes, updatedEdges);
      return { edges: updatedEdges };
    });
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
      scheduleDebouncedDiagramSave(updatedNodes, state.edges);
      return {
        nodes: updatedNodes,
        selectedNodeId: newNode.id,
        isInspectorOpen: true,
        selectedServiceId: service.id,
      };
    });
  },

  updateNodeNotes: (nodeId: string, customNotes: string) => {
    set((state) => {
      const updatedNodes = state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, customNotes } } : n
      );
      scheduleDebouncedDiagramSave(updatedNodes, state.edges);
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
      scheduleDebouncedDiagramSave(state.nodes, updatedEdges);
      return { edges: updatedEdges };
    });
  },

  removeNode: (nodeId: string) => {
    set((state) => {
      const updatedNodes = state.nodes.filter((n) => n.id !== nodeId);
      const updatedEdges = state.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      );
      scheduleDebouncedDiagramSave(updatedNodes, updatedEdges);
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
      scheduleDebouncedDiagramSave(state.nodes, updatedEdges);
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
    scheduleDebouncedDiagramSave([], []);
  },

  loadTemplate: (templateId: string) => {
    const template = ARCHITECTURE_TEMPLATES[templateId];
    if (template) {
      set({
        nodes: template.nodes,
        edges: template.edges,
        selectedNodeId: null,
        isInspectorOpen: false,
      });
      scheduleDebouncedDiagramSave(template.nodes, template.edges);
    }
  },

  openInspector: (nodeId: string) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    set({
      selectedNodeId: nodeId,
      isInspectorOpen: true,
      selectedServiceId: node?.data.serviceId || get().selectedServiceId,
    });
  },

  closeInspector: () => {
    set({ isInspectorOpen: false });
  },
}));
