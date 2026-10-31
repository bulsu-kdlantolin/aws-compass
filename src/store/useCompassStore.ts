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
  ThemeMode,
  WorkspaceMode,
} from '../types/aws';
import {
  db,
  getAllServices,
  getDiagramById,
  initializeDatabase,
  resetDatabaseToDefaults,
  saveDiagram,
  updateServiceDoc as dbUpdateServiceDoc,
  toggleServiceFavorite as dbToggleServiceFavorite,
  clearAllFavorites as dbClearAllFavorites,
} from '../db/compassDb';
import { ARCHITECTURE_TEMPLATES } from '../components/canvas/canvasTemplates';
import { SEED_SERVICES } from '../db/seedServices';
import { disableTransitionsTemporarily } from '../utils/themeTransitions';

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

export const DEFAULT_CATEGORIES: AWSCategory[] = [
  'Compute',
  'Storage',
  'Database',
  'Networking',
  'Security/IAM',
  'Serverless',
];

interface CompassState {
  // Catalog State
  services: AWSService[];
  selectedServiceId: string | null;
  isDbLoaded: boolean;
  filter: ServiceFilterState;
  categoryOrder: AWSCategory[];

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
  setFavoritesFilter: (favoritesOnly: boolean) => void;
  toggleFavoritesFilter: () => void;
  setWorkspaceMode: (mode: WorkspaceMode) => void;
  toggleSidebar: () => void;
  toggleFavorite: (id: string) => Promise<void>;
  clearAllFavorites: () => Promise<void>;
  updateServiceDoc: (id: string, markdownDoc: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  refreshServices: () => Promise<void>;
  reorderService: (
    sourceId: string,
    targetId: string,
    position: 'before' | 'after',
    targetCategory?: AWSCategory
  ) => Promise<void>;
  moveServiceToCategory: (
    serviceId: string,
    targetCategory: AWSCategory,
    insertAt?: 'start' | 'end'
  ) => Promise<void>;
  reorderCategories: (
    sourceCat: AWSCategory,
    targetCat: AWSCategory,
    position: 'before' | 'after'
  ) => void;
  resetServiceOrder: () => Promise<void>;

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
  categoryOrder: DEFAULT_CATEGORIES,
  filter: {
    search: '',
    category: 'All',
    tier: 'All',
    favoritesOnly: false,
  },
  workspaceMode: 'vault',
  isSidebarOpen: true,
  theme:
    (typeof window !== 'undefined'
      ? (localStorage.getItem('aws-compass-theme') as ThemeMode)
      : null) || 'dark',

  setTheme: (theme: ThemeMode) => {
    if (typeof window !== 'undefined') {
      disableTransitionsTemporarily();
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
    let services = await getAllServices();

    // Hydrate custom service ordering and categories from localStorage if present
    if (typeof window !== 'undefined') {
      try {
        const savedOrderRaw = localStorage.getItem('aws-compass-service-order');
        if (savedOrderRaw) {
          const savedOrder: { id: string; cat?: AWSCategory }[] = JSON.parse(savedOrderRaw);
          const map = new Map(services.map((s) => [s.id, s]));
          const orderedServices: AWSService[] = [];

          savedOrder.forEach((item) => {
            const svc = map.get(item.id);
            if (svc) {
              if (item.cat) svc.category = item.cat;
              orderedServices.push(svc);
              map.delete(item.id);
            }
          });

          map.forEach((svc) => orderedServices.push(svc));
          services = orderedServices;
        }
      } catch { }
    }

    let categoryOrder = DEFAULT_CATEGORIES;
    if (typeof window !== 'undefined') {
      try {
        const savedCatOrder = localStorage.getItem('aws-compass-category-order');
        if (savedCatOrder) {
          const parsed = JSON.parse(savedCatOrder) as AWSCategory[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            categoryOrder = parsed;
          }
        }
      } catch { }
    }

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
      categoryOrder,
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

    setFavoritesFilter: (favoritesOnly: boolean) => {
      set((state) => ({ filter: { ...state.filter, favoritesOnly } }));
    },

      toggleFavoritesFilter: () => {
        set((state) => ({ filter: { ...state.filter, favoritesOnly: !state.filter.favoritesOnly } }));
      },

        setWorkspaceMode: (workspaceMode: WorkspaceMode) => {
          set({ workspaceMode });
        },

          toggleSidebar: () => {
            set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
          },

              toggleFavorite: async (id: string) => {
                const updatedFav = await dbToggleServiceFavorite(id);
                set((state) => {
                  const updatedServices = state.services.map((svc) =>
        svc.id === id ? { ...svc, isFavorite: updatedFav, updatedAt: Date.now() } : svc
                  );
                  // Synchronize any matching canvas nodes
                  const updatedNodes = state.nodes.map((n) =>
        n.data.serviceId === id ? { ...n, data: { ...n.data, isFavorite: updatedFav } } : n
                  );
                  scheduleDebouncedDiagramSave(updatedNodes, state.edges);
                  return {
                    services: updatedServices,
                    nodes: updatedNodes,
                  };
                });
              },

                clearAllFavorites: async () => {
                  await dbClearAllFavorites();
                  set((state) => {
                    const updatedServices = state.services.map((svc) =>
                      svc.isFavorite ? { ...svc, isFavorite: false, updatedAt: Date.now() } : svc
                    );
                    const updatedNodes = state.nodes.map((n) =>
                      n.data.isFavorite ? { ...n, data: { ...n.data, isFavorite: false } } : n
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
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('aws-compass-service-order');
                        localStorage.removeItem('aws-compass-category-order');
                      }
                      await resetDatabaseToDefaults();
                      const services = await getAllServices();
                      const defaultTemplate = ARCHITECTURE_TEMPLATES['serverless-api'];
                      set({
                        services,
                        categoryOrder: DEFAULT_CATEGORIES,
                        selectedServiceId: 's3',
                        nodes: defaultTemplate.nodes,
                        edges: defaultTemplate.edges,
                        isInspectorOpen: false,
                        selectedNodeId: null,
                      });
                      scheduleDebouncedDiagramSave(defaultTemplate.nodes, defaultTemplate.edges);
                    },

                      resetServiceOrder: async () => {
                        if (typeof window !== 'undefined') {
                          localStorage.removeItem('aws-compass-service-order');
                          localStorage.removeItem('aws-compass-category-order');
                        }
                        const seedCategoryMap = new Map(SEED_SERVICES.map((s) => [s.id, s.category]));
                        const currentServices = await getAllServices();

                        const restoredServices = currentServices
                          .map((svc) => ({
                            ...svc,
                            category: seedCategoryMap.get(svc.id) || svc.category,
                            order: undefined,
                          }))
                          .sort((a, b) => a.name.localeCompare(b.name));

                        try {
                          await Promise.all(
                            restoredServices.map((s) =>
                              db.services.update(s.id, { category: s.category, order: undefined })
                            )
                          );
                        } catch (err) {
                          console.warn('Failed to reset categories in Dexie:', err);
                        }

                        set({
                          services: restoredServices,
                          categoryOrder: DEFAULT_CATEGORIES,
                        });
                      },

                        reorderService: async (
                          sourceId: string,
                          targetId: string,
                          position: 'before' | 'after',
                          targetCategory?: AWSCategory
                        ) => {
                          const currentServices = [...get().services];
                          const sourceIndex = currentServices.findIndex((s) => s.id === sourceId);
                          if (sourceIndex === -1) return;

                          const sourceService = { ...currentServices[sourceIndex] };
                          const targetIndex = currentServices.findIndex((s) => s.id === targetId);
                          if (targetIndex === -1) return;

                          const targetService = currentServices[targetIndex];
                          const effectiveCategory = targetCategory || targetService.category;

                          // Remove source service
                          currentServices.splice(sourceIndex, 1);

                          // Update category if changed
                          sourceService.category = effectiveCategory;
                          sourceService.updatedAt = Date.now();

                          // Re-find target index after removal
                          const newTargetIndex = currentServices.findIndex((s) => s.id === targetId);
                          const insertIndex = position === 'before' ? newTargetIndex : newTargetIndex + 1;

                          currentServices.splice(insertIndex, 0, sourceService);

                          // Re-assign order indices
                          const updatedServices = currentServices.map((svc, idx) => ({
                            ...svc,
                            order: idx,
                          }));

                          set({ services: updatedServices });

                          if (typeof window !== 'undefined') {
                            try {
                              localStorage.setItem(
                                'aws-compass-service-order',
                                JSON.stringify(updatedServices.map((s) => ({ id: s.id, cat: s.category })))
                              );
                            } catch { }
                          }

                          try {
                            await db.services.update(sourceService.id, {
                              category: effectiveCategory,
                              order: insertIndex,
                              updatedAt: Date.now(),
                            });
                            await Promise.all(
                              updatedServices.map((s) =>
                                db.services.update(s.id, { order: s.order, category: s.category })
                              )
                            );
                          } catch (err) {
                            console.warn('Failed to persist reordered services to Dexie:', err);
                          }
                        },

                          moveServiceToCategory: async (
                            serviceId: string,
                            targetCategory: AWSCategory,
                            insertAt: 'start' | 'end' = 'start'
                          ) => {
                            const currentServices = [...get().services];
                            const sourceIndex = currentServices.findIndex((s) => s.id === serviceId);
                            if (sourceIndex === -1) return;

                            const sourceService = { ...currentServices[sourceIndex] };
                            currentServices.splice(sourceIndex, 1);

                            sourceService.category = targetCategory;
                            sourceService.updatedAt = Date.now();

                            const categoryIndices: number[] = [];
                            currentServices.forEach((s, idx) => {
                              if (s.category === targetCategory) categoryIndices.push(idx);
                            });

                            let insertIndex = currentServices.length;
                            if (categoryIndices.length > 0) {
                              if (insertAt === 'start') {
                                insertIndex = categoryIndices[0];
                              } else {
                                insertIndex = categoryIndices[categoryIndices.length - 1] + 1;
                              }
                            }

                            currentServices.splice(insertIndex, 0, sourceService);

                            const updatedServices = currentServices.map((svc, idx) => ({
                              ...svc,
                              order: idx,
                            }));

                            set({ services: updatedServices });

                            if (typeof window !== 'undefined') {
                              try {
                                localStorage.setItem(
                                  'aws-compass-service-order',
                                  JSON.stringify(updatedServices.map((s) => ({ id: s.id, cat: s.category })))
                                );
                              } catch { }
                            }

                            try {
                              await db.services.update(sourceService.id, {
                                category: targetCategory,
                                order: insertIndex,
                                updatedAt: Date.now(),
                              });
                              await Promise.all(
                                updatedServices.map((s) =>
                                  db.services.update(s.id, { order: s.order, category: s.category })
                                )
                              );
                            } catch (err) {
                              console.warn('Failed to persist category move to Dexie:', err);
                            }
                          },

                            reorderCategories: (
                              sourceCat: AWSCategory,
                              targetCat: AWSCategory,
                              position: 'before' | 'after'
                            ) => {
                              const order = [...get().categoryOrder];
                              const sourceIdx = order.indexOf(sourceCat);
                              const targetIdx = order.indexOf(targetCat);
                              if (sourceIdx === -1 || targetIdx === -1 || sourceIdx === targetIdx) return;

                              order.splice(sourceIdx, 1);
                              const newTargetIdx = order.indexOf(targetCat);
                              const insertIdx = position === 'before' ? newTargetIdx : newTargetIdx + 1;
                              order.splice(insertIdx, 0, sourceCat);

                              set({ categoryOrder: order });
                              if (typeof window !== 'undefined') {
                                try {
                                  localStorage.setItem('aws-compass-category-order', JSON.stringify(order));
                                } catch { }
                              }
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
                                                isFavorite: service.isFavorite,
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
